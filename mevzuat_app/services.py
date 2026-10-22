import logging
import os
import re
import time
import uuid
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from groq import Groq

from mevzuat_app.models import Cevap, Kaynak, Mevzuat, Soru

logger = logging.getLogger(__name__)

NO_INFO_MESSAGE = "Belirtilen mevzuatta bu konuya ilişkin bilgi bulunmamaktadır."
DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"


def get_groq_model() -> str:
    return os.getenv("GROQ_MODEL") or getattr(settings, "GROQ_MODEL", DEFAULT_GROQ_MODEL) or DEFAULT_GROQ_MODEL


class RAGServiceError(Exception):
    pass


class LLMUnavailableError(RAGServiceError):
    pass


@dataclass(frozen=True)
class RAGResponse:
    answer: str
    confidence_score: float
    mevzuat_ids: List[int]
    response_time_ms: int
    out_of_scope: bool = False


@dataclass(frozen=True)
class ChatInteractionResult:
    question: Soru
    answer: Cevap
    rag_response: RAGResponse


def clean_turkish(text: str) -> str:
    if not text:
        return ""
    rep = {
        "çn": "çin",
        "dl": "dil",
        "tarthn": "tarihini",
        "brmler": "birimler",
        "İ": "İ",
        "I": "I",
    }
    for k, v in rep.items():
        text = text.replace(k, v)
    return text


class OllamaClient:
    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "") or getattr(settings, "GROQ_API_KEY", "")
        self._client: Optional[Groq] = None

    @property
    def client(self) -> Groq:
        if self._client is None:
            if not self.api_key:
                raise RAGServiceError("GROQ_API_KEY ortam değişkeni tanımlı değil.")
            self._client = Groq(api_key=self.api_key, timeout=60.0, max_retries=2)
        return self._client

    def generate(self, model: str, system_prompt: str, user_prompt: str) -> str:
        try:
            active_model = model or DEFAULT_GROQ_MODEL
            completion = self.client.chat.completions.create(
                model=active_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=1000,
            )
            return completion.choices[0].message.content or ""
        except Exception as exc:
            logger.exception("Groq API çağrısı başarısız oldu: %s", str(exc))
            raise LLMUnavailableError(f"Groq çağrısı başarısız (model={model}): {exc}") from exc


class OllamaRAGService:
    SYSTEM_PROMPT = """Sen OSTİM Teknik Üniversitesi öğrenci işleri ve mevzuat danışmanısın.
Görevin, sana verilen MEVZUAT METİNLERİ'ne dayanarak öğrencinin sorusunu açıklayıcı, yardımsever ve net bir şekilde cevaplamaktır.

Kurallar:
1. Verilen mevzuat metinlerinde geçen ilgili tüm bilgileri özetle.
2. Öğrencinin sorduğu soruyla ilişkili herhangi bir bilgi veya madde parçası varsa kesinlikle "bilgi bulunmamaktadır" DEME.
3. Yalnızca verilen metinlerde sorulan konuyla hiçbir alaka yoksa "Belirtilen mevzuatta bu konuya ilişkin bilgi bulunmamaktadır." yaz.
4. Yanıtın her zaman nazik, düzenli maddeler içeren ve Türkçe olsun."""

    def __init__(self, client: Optional[OllamaClient] = None) -> None:
        self.client = client or OllamaClient()

    def _extract_keywords(self, question: str) -> List[str]:
        words = re.findall(r"\w+", clean_turkish(question))
        stopwords = {
            "ve", "veya", "ile", "bir", "bu", "şu", "o", "da", "de", "mi", "mı",
            "mu", "mü", "nasıl", "ne", "nedir", "nelerdir", "için", "olan", "olarak",
            "göre", "kadar", "hakkında", "şartları", "yönetmeliği", "yönergesi"
        }
        return [w for w in words if len(w) > 2 and w not in stopwords]

    def _retrieve_relevant_chunks(
        self, question: str, limit: int = 4
    ) -> Tuple[List[Mevzuat], List[str], int]:
        keywords = self._extract_keywords(question)
        if not keywords:
            candidates = list(Mevzuat.objects.all()[:limit])
            return candidates, [], 10

        query_filter = Q()
        for kw in keywords:
            query_filter |= Q(content__icontains=kw) | Q(title__icontains=kw)

        candidate_chunks = list(Mevzuat.objects.filter(query_filter).distinct()[:60])
        if not candidate_chunks:
            candidate_chunks = list(Mevzuat.objects.all()[:limit])
            if not candidate_chunks:
                return [], keywords, 0

        cleaned_q = clean_turkish(question)
        cleaned_keywords = [clean_turkish(kw) for kw in keywords]

        def score_chunk(chunk: Mevzuat) -> int:
            content_lower = clean_turkish(chunk.content or "")
            title_lower = clean_turkish(chunk.title or "")
            score = 10
            if "mazeret" in cleaned_q and "mazeret" in content_lower:
                score += 50
            for i in range(len(cleaned_keywords) - 1):
                if f"{cleaned_keywords[i]} {cleaned_keywords[i + 1]}" in content_lower:
                    score += 35
            for kw in cleaned_keywords:
                if kw in title_lower:
                    score += 25
                score += content_lower.count(kw) * 4
            return score

        scored = [(score_chunk(c), c) for c in candidate_chunks]
        scored.sort(key=lambda item: item[0], reverse=True)
        top = scored[:limit]

        return [c for _, c in top], keywords, top[0][0] if top else 0

    @staticmethod
    def _compute_confidence(top_score: int) -> float:
        return round(0.4 + 0.5 * min(top_score / 120, 1.0), 2)

    def generate_answer(self, question: str) -> RAGResponse:
        start_time = time.perf_counter()

        def elapsed_ms() -> int:
            return int((time.perf_counter() - start_time) * 1000)

        relevant_mevzuats, keywords, top_score = self._retrieve_relevant_chunks(question, limit=4)

        if not relevant_mevzuats:
            return RAGResponse(
                answer=NO_INFO_MESSAGE,
                confidence_score=0.0,
                mevzuat_ids=[],
                response_time_ms=elapsed_ms(),
                out_of_scope=True,
            )

        mevzuat_ids = [m.id for m in relevant_mevzuats if hasattr(m, 'id')]
        context_texts = []
        MAX_CHARS_PER_CHUNK = 1500
        for m in relevant_mevzuats:
            doc_title = getattr(m, 'title', 'Mevzuat')
            snippet = (getattr(m, 'content', '') or "").strip()[:MAX_CHARS_PER_CHUNK]
            context_texts.append(f"[KAYNAK: {doc_title}]\n{snippet}")

        joined_contexts = "\n\n".join(context_texts)
        user_prompt = f"MEVZUAT METİNLERİ:\n\n{joined_contexts}\n\nÖĞRENCİNİN SORUSU:\n{question}\n"

        # Scope hatalarını önlemek için değişkenler başında güvenli şekilde tanımlanıyor
        first_doc = relevant_mevzuats[0] if relevant_mevzuats else None
        doc_title = getattr(first_doc, 'title', 'Mevzuat') if first_doc else "Mevzuat"
        summary_snippet = clean_turkish(getattr(first_doc, 'content', '')[:400]) if (first_doc and getattr(first_doc, 'content', None)) else "Metin özetlenemedi."

        try:
            answer = self.client.generate(
                model=get_groq_model(),
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=user_prompt,
            ).strip()
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.exception("LLM cevap üretemedi: %s", str(e))

            first_doc = relevant_mevzuats[0] if relevant_mevzuats else None
            doc_title = getattr(first_doc, 'title', 'Mevzuat') if first_doc else "Mevzuat"
            raw_content = getattr(first_doc, 'content', '') if first_doc else ""
            summary_snippet = clean_turkish(raw_content[:400]) if raw_content else "İlgili mevzuat metni özetlenemedi."

            answer = (
                f"**İlgili Mevzuat:** {doc_title}\n\n"
                f"**Mevzuat Metin Özeti:**\n{summary_snippet}...\n\n"
                f"*(Sistem Notu: {type(e).__name__} - {str(e)})*"
            )

        if not answer:
            answer = NO_INFO_MESSAGE

        out_of_scope = NO_INFO_MESSAGE in answer and len(answer) < len(NO_INFO_MESSAGE) + 80

        return RAGResponse(
            answer=answer,
            confidence_score=self._compute_confidence(top_score),
            mevzuat_ids=mevzuat_ids,
            response_time_ms=elapsed_ms(),
            out_of_scope=out_of_scope,
        )


class ChatService:
    def __init__(self, rag_service: Optional[OllamaRAGService] = None) -> None:
        self.rag_service = rag_service or OllamaRAGService()

    def process_user_query(
        self,
        question_text: str,
        session_id=None,
        user=None,
    ) -> ChatInteractionResult:
        active_session = session_id or uuid.uuid4()
        started = time.perf_counter()

        try:
            rag_output = self.rag_service.generate_answer(question_text)
        except Exception as exc:
            logger.exception("RAG servis hatası: %s", exc)
            rag_output = RAGResponse(
                answer=f"AI Bağlantı Hatası ({type(exc).__name__}): {str(exc)}",
                confidence_score=0.0,
                mevzuat_ids=[],
                response_time_ms=int((time.perf_counter() - started) * 1000),
                out_of_scope=True
            )

        status_value = getattr(Cevap.Status, 'OUT_OF_SCOPE', 'out_of_scope') if rag_output.out_of_scope else getattr(Cevap.Status, 'ANSWERED', 'answered')

        try:
            with transaction.atomic():
                soru = Soru.objects.create(
                    session_id=str(active_session), query_text=question_text, user=user
                )
                cevap = Cevap.objects.create(
                    question=soru,
                    answer_text=rag_output.answer,
                    confidence_score=rag_output.confidence_score,
                    response_time_ms=rag_output.response_time_ms,
                    status=status_value,
                )
                if rag_output.mevzuat_ids:
                    cevap.referenced_mevzuats.set(rag_output.mevzuat_ids)
        except Exception as exc:
            logger.exception("Veritabanı yazma hatası: %s", exc)
            soru = Soru(session_id=str(active_session), query_text=question_text, user=user)
            cevap = Cevap(
                question=soru,
                answer_text=rag_output.answer,
                confidence_score=rag_output.confidence_score,
                response_time_ms=rag_output.response_time_ms
            )

        return ChatInteractionResult(
            question=soru,
            answer=cevap,
            rag_response=rag_output,
        )

    process_and_persist_interaction = process_user_query