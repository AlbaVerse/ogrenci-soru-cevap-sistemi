import logging
import re
import time
from dataclasses import dataclass
from typing import Any
import uuid

from django.conf import settings
from django.db import DatabaseError, transaction
from django.db.models import Q
from groq import Groq

from mevzuat_app.models import Cevap, Mevzuat, Soru
from mevzuat_app.selectors import get_mevzuat_citations

logger = logging.getLogger(__name__)


class ServiceError(Exception):
    """Mevzuat servisleri icin temel hata sinifi."""


class RAGServiceError(ServiceError):
    """RAG pipeline veya LLM uretimi basarisiz oldugunda firlatilir."""


class ChatPersistenceError(ServiceError):
    """Soru/Cevap oturumu veritabanina kaydedilemediginde firlatilir."""


def clean_turkish(text: str) -> str:
    if not text:
        return ""
    mapping = {
        "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç",
    }
    for tr_char, target_char in mapping.items():
        text = text.replace(tr_char, target_char)
    return text.lower()


def extract_relevant_window(text: str, keywords: list[str], max_len: int = 3000) -> str:
    """Metin icinde anahtar kelimelerin en yogun oldugu bolumu yakalar."""
    if not text or len(text) <= max_len:
        return text.strip()

    text_lower = clean_turkish(text)
    positions = []
    for kw in keywords:
        pos = 0
        while True:
            idx = text_lower.find(kw, pos)
            if idx == -1:
                break
            positions.append(idx)
            pos = idx + len(kw)

    if not positions:
        return text[:max_len].strip()

    positions.sort()
    first_hit = positions[0]
    start = max(0, first_hit - 300)
    end = min(len(text), start + max_len)

    extracted = text[start:end].strip()
    prefix = "... " if start > 0 else ""
    suffix = " ..." if end < len(text) else ""
    return f"{prefix}{extracted}{suffix}"


@dataclass(frozen=True)
class RAGResponse:
    answer: str
    confidence_score: float
    mevzuat_ids: list[int]
    response_time_ms: int


class OllamaClient:
    def __init__(self, api_key: str | None = None) -> None:
        key = api_key or getattr(settings, "GROQ_API_KEY", "")
        self.client = Groq(api_key=key)

    def generate(self, model: str, system_prompt: str, user_prompt: str) -> str:
        completion = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=1500,
        )
        return completion.choices[0].message.content or ""


class OllamaRAGService:
    def __init__(self, client: OllamaClient | None = None) -> None:
        self.client = client or OllamaClient()

    def _extract_keywords(self, question: str) -> list[str]:
        stop_words = {
            "ve", "veya", "ile", "bir", "bu", "şu", "o", "ne", "nedir", "nelerdir",
            "nasıl", "için", "mı", "mi", "mu", "mü", "var", "yok", "hakkında", "şartları",
            "neler", "hangi", "hangisi", "kaç", "bana", "göre"
        }
        cleaned = re.sub(r"[^\w\s]", " ", question)
        tokens = clean_turkish(cleaned).split()
        return [t for t in tokens if t not in stop_words and len(t) > 2]

    def _retrieve_relevant_chunks(self, question: str, limit: int = 5) -> tuple[list[Mevzuat], list[str]]:
        keywords = self._extract_keywords(question)
        if not keywords:
            return list(Mevzuat.objects.all()[:limit]), []

        query_filter = Q()
        for kw in keywords:
            query_filter |= Q(content__icontains=kw) | Q(title__icontains=kw)

        candidate_chunks = list(Mevzuat.objects.filter(query_filter).distinct()[:60])
        if not candidate_chunks:
            return list(Mevzuat.objects.all()[:limit]), keywords

        def score_chunk(chunk: Mevzuat) -> int:
            content_lower = clean_turkish(chunk.content or "")
            title_lower = clean_turkish(chunk.title or "")
            score = 0
            for kw in keywords:
                if kw in title_lower:
                    score += 15
                score += content_lower.count(kw) * 2
            return score

        candidate_chunks.sort(key=score_chunk, reverse=True)
        return candidate_chunks[:limit], keywords

    def generate_answer(self, question: str) -> RAGResponse:
        start_time = time.perf_counter()

        relevant_mevzuats, keywords = self._retrieve_relevant_chunks(question, limit=5)
        mevzuat_ids = [m.id for m in relevant_mevzuats]

        context_texts = []
        for m in relevant_mevzuats:
            doc_title = m.title or (m.category.name if m.category else "Mevzuat")
            relevant_snippet = extract_relevant_window(m.content or "", keywords, max_len=3000)
            context_texts.append(f"[KAYNAK: {doc_title} - Dosya: {m.source_file or 'Bilinmiyor'}]\n{relevant_snippet}")

        context_block = "\n\n".join(context_texts)

        system_prompt = (
            "Sen üniversite öğrencilerine mevzuat konusunda rehberlik eden resmî bir yapay zekâ asistanısın. "
            "SANA VERİLEN MEVZUAT METİNLERİNDEKİ MADDELERİ, ŞARTLARI VE KURALLARI DİKKATLE İNCELE. "
            "Öğrencinin sorusunu metinlerde geçen ilgili maddelere doğrudan atıfta bulunarak net, düzenli ve maddeler halinde açıkla. "
            "Metinlerde mazeret, sınav, süre, yüzde veya şartlar geçiyorsa bu bilgileri doğrudan yanıtına yansıt. "
            "Verilen metinlerde aranan bilgi hiç yoksa, bilgilerin bu metinlerde bulunmadığını belirtip ilgili olabilecek yönetmelik adını öner."
        )

        user_prompt = f"""AŞAĞIDAKİ ÜNİVERSİTE MEVZUAT METİNLERİNİ İNCELE:

{context_block}

ÖĞRENCİNİN SORUSU:
{question}
"""

        try:
            answer = self.client.generate(
                model=getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile"),
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )
            confidence = 0.95
        except Exception as e:
            logger.error("LLM uretim hatasi: %s", e)
            answer = "Sorunuz yanıtlanırken bir hata oluştu. Lütfen tekrar deneyiniz."
            confidence = 0.0

        response_time = int((time.perf_counter() - start_time) * 1000)

        return RAGResponse(
            answer=answer,
            confidence_score=confidence,
            mevzuat_ids=mevzuat_ids,
            response_time_ms=response_time,
        )


@dataclass(frozen=True)
class ChatInteractionResult:
    question_id: int
    session_id: uuid.UUID
    answer: str
    confidence_score: float
    sources: list[dict[str, Any]]
    response_time_ms: int


class ChatService:
    def __init__(self, rag_service: OllamaRAGService | None = None) -> None:
        self.rag_service = rag_service or OllamaRAGService()

    def process_and_persist_interaction(
        self,
        *,
        question_text: str,
        session_id: uuid.UUID | None = None,
    ) -> ChatInteractionResult:
        active_session = session_id or uuid.uuid4()
        rag_output = self.rag_service.generate_answer(question_text)

        try:
            with transaction.atomic():
                soru = Soru.objects.create(
                    session_id=active_session,
                    text=question_text,
                )
                cevap = Cevap.objects.create(
                    soru=soru,
                    answer_text=rag_output.answer,
                    confidence_score=rag_output.confidence_score,
                    response_time_ms=rag_output.response_time_ms,
                )
                if rag_output.mevzuat_ids:
                    cevap.referenced_mevzuats.set(rag_output.mevzuat_ids)
        except DatabaseError as exc:
            logger.exception("Veritabani yazma hatasi: %s", exc)
            raise ChatPersistenceError("Soru ve cevap veritabanina kaydedilemedi.") from exc

        sources = get_mevzuat_citations(mevzuat_ids=rag_output.mevzuat_ids)

        return ChatInteractionResult(
            question_id=soru.id,
            session_id=active_session,
            answer=rag_output.answer,
            confidence_score=rag_output.confidence_score,
            sources=sources,
            response_time_ms=rag_output.response_time_ms,
        )
