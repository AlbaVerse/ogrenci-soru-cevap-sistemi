import logging
import os
import re
import time
import uuid
from dataclasses import dataclass

from django.conf import settings
from django.db import DatabaseError
from django.db import transaction
from django.db.models import Q
from groq import Groq

from mevzuat_app.models import Cevap, Mevzuat, Soru

logger = logging.getLogger(__name__)

NO_INFO_MESSAGE = "Belirtilen mevzuatta bu konuya ilişkin bilgi bulunmamaktadır."
MIN_RELEVANCE_SCORE = 20
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"


def get_groq_model() -> str:
    return os.getenv("GROQ_MODEL") or getattr(settings, "GROQ_MODEL", "") or DEFAULT_GROQ_MODEL


class RAGServiceError(Exception):
    pass


class LLMUnavailableError(RAGServiceError):
    pass

class ChatPersistenceError(Exception):
    pass

@dataclass(frozen=True)
class RAGResponse:
    answer: str
    confidence_score: float
    mevzuat_ids: list[int]
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
    mapping = {
        "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç"
    }
    for upper_ch, lower_ch in mapping.items():
        text = text.replace(upper_ch, lower_ch)
    return text.lower()


def extract_relevant_window(content: str, keywords: list[str], max_len: int = 3000) -> str:
    if not content or len(content) <= max_len:
        return content

    content_lower = clean_turkish(content)
    first_idx = -1

    for kw in keywords:
        idx = content_lower.find(clean_turkish(kw))
        if idx != -1:
            if first_idx == -1 or idx < first_idx:
                first_idx = idx

    if first_idx == -1:
        return content[:max_len]

    start = max(0, first_idx - 300)
    end = min(len(content), start + max_len)
    return content[start:end]


class OllamaClient:
    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or getattr(settings, "GROQ_API_KEY", "") or os.getenv("GROQ_API_KEY", "")
        self._client: Groq | None = None

    @property
    def client(self) -> Groq:
        if self._client is None:
            if not self.api_key:
                raise RAGServiceError("GROQ_API_KEY tanımlı değil.")
            self._client = Groq(api_key=self.api_key, timeout=30.0, max_retries=1)
        return self._client

    def generate(self, model: str, system_prompt: str, user_prompt: str) -> str:
        try:
            completion = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=1500,
            )
        except RAGServiceError:
            raise
        except Exception as exc:
            raise LLMUnavailableError(f"Groq çağrısı başarısız (model={model}): {exc}") from exc
        return completion.choices[0].message.content or ""


class OllamaRAGService:
    SYSTEM_PROMPT = """Sen OSTİM Teknik Üniversitesi öğrenci işleri ve mevzuat danışmanısın.
Görevin, sana verilen MEVZUAT METİNLERİ'ne dayanarak öğrencinin sorusunu açıklayıcı, yardımsever ve net bir şekilde cevaplamaktır.

Kurallar:
1. Verilen mevzuat metinlerinde geçen ilgili tüm bilgileri (dilekçe süreci, yönetim kurulu onayı, ücret durumu, süreler vb.) öğrenciye özetle.
2. Öğrencinin sorduğu soruyla ilişkili herhangi bir bilgi, usul veya madde parçası varsa kesinlikle "bilgi bulunmamaktadır" DEME; metindeki mevcut bilgileri aktar.
3. Yalnızca verilen metinlerde sorulan konuyla uzaktan yakından hiçbir alaka veya anahtar kelime yoksa "Belirtilen mevzuatta bu konuya ilişkin bilgi bulunmamaktadır." yaz.
4. Yanıtın her zaman nazik, düzenli maddeler içeren ve Türkçe olsun."""

    def __init__(self, client: OllamaClient | None = None) -> None:
        self.client = client or OllamaClient()

    def _extract_keywords(self, question: str) -> list[str]:
        words = re.findall(r"\w+", clean_turkish(question))
        stopwords = {
            "ve", "veya", "ile", "bir", "bu", "şu", "o", "da", "de", "mi", "mı",
            "mu", "mü", "nasıl", "ne", "nedir", "nelerdir", "için", "olan", "olarak", "su", "var",
            "göre", "kadar", "hakkında", "şartları", "yönetmeliği", "yönergesi"
        }
        return [w for w in words if len(w) > 2 and w not in stopwords]

    def _retrieve_relevant_chunks(
        self, question: str, limit: int = 8
    ) -> tuple[list[Mevzuat], list[str], int]:
        keywords = self._extract_keywords(question)
        if not keywords:
            return [], [], 0

        query_filter = Q()
        for kw in keywords:
            query_filter |= Q(content__icontains=kw) | Q(title__icontains=kw)

        candidate_chunks = list(Mevzuat.objects.filter(query_filter).distinct()[:60])
        if not candidate_chunks:
            return [], keywords, 0

        cleaned_q = clean_turkish(question)

        def score_chunk(chunk: Mevzuat) -> int:
            content_lower = clean_turkish(chunk.content or "")
            title_lower = clean_turkish(chunk.title or "")
            score = 0
            if "mazeret" in cleaned_q and "mazeret" in content_lower:
                score += 50
            for i in range(len(keywords) - 1):
                if f"{keywords[i]} {keywords[i + 1]}" in content_lower:
                    score += 35
            for kw in keywords:
                if kw in title_lower:
                    score += 20
                score += content_lower.count(kw) * 3
            return score

        scored = [(score_chunk(c), c) for c in candidate_chunks]
        scored = [(s, c) for s, c in scored if s >= MIN_RELEVANCE_SCORE]
        scored.sort(key=lambda item: item[0], reverse=True)
        top = scored[:limit]
        if not top:
            return [], keywords, 0
        return [c for _, c in top], keywords, top[0][0]

    @staticmethod
    def _compute_confidence(top_score: int) -> float:
        return round(0.4 + 0.5 * min(top_score / 120, 1.0), 2)

    def generate_answer(self, question: str) -> RAGResponse:
        start_time = time.perf_counter()

        def elapsed_ms() -> int:
            return int((time.perf_counter() - start_time) * 1000)

        relevant_mevzuats, keywords, top_score = self._retrieve_relevant_chunks(question, limit=8)

        if not relevant_mevzuats:
            return RAGResponse(
                answer=NO_INFO_MESSAGE,
                confidence_score=0.0,
                mevzuat_ids=[],
                response_time_ms=elapsed_ms(),
                out_of_scope=True,
            )

        mevzuat_ids = [m.id for m in relevant_mevzuats]
        context_texts = []
        for m in relevant_mevzuats:
            doc_title = m.title or (m.category.name if m.category else "Mevzuat")
            snippet = (m.content or "").strip()
            context_texts.append(f"[KAYNAK: {doc_title} - Dosya: {m.source_file or 'Bilinmiyor'}]\n{snippet}")

        joined_contexts = "\n\n".join(context_texts)
        user_prompt = f"MEVZUAT METİNLERİ:\n\n{joined_contexts}\n\nÖĞRENCİNİN SORUSU:\n{question}\n"

        answer = self.client.generate(
            model=get_groq_model(),
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=user_prompt,
        ).strip()

        if not answer:
            raise RAGServiceError("LLM boş yanıt döndürdü.")

        if NO_INFO_MESSAGE in answer and len(answer) < len(NO_INFO_MESSAGE) + 80:
            return RAGResponse(
                answer=NO_INFO_MESSAGE,
                confidence_score=0.0,
                mevzuat_ids=[],
                response_time_ms=elapsed_ms(),
                out_of_scope=True,
            )

        return RAGResponse(
            answer=answer,
            confidence_score=self._compute_confidence(top_score),
            mevzuat_ids=mevzuat_ids,
            response_time_ms=elapsed_ms(),
        )


class ChatService:
    def __init__(self, rag_service: OllamaRAGService | None = None) -> None:
        self.rag_service = rag_service or OllamaRAGService()

    def _record_failure(self, *, question_text: str, session_id, user, started: float) -> None:
        """LLM hatasını unsolved istatistiği için kaydeder."""
        try:
            with transaction.atomic():
                soru = Soru.objects.create(session_id=str(session_id), query_text=question_text, user=user)
                Cevap.objects.create(
                    question=soru,
                    answer_text="",
                    confidence_score=0.0,
                    response_time_ms=int((time.perf_counter() - started) * 1000),
                    status=Cevap.Status.FAILED,
                )
        except Exception:
            logger.exception("Başarısız soru kaydı yazılamadı.")

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
        except RAGServiceError:
            self._record_failure(
                question_text=question_text, session_id=active_session, user=user, started=started
            )
            raise

        status_value = Cevap.Status.OUT_OF_SCOPE if rag_output.out_of_scope else Cevap.Status.ANSWERED
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
            raise ChatPersistenceError("Soru ve cevap veritabanına kaydedilemedi.") from exc

        return ChatInteractionResult(
            question=soru,
            answer=cevap,
            rag_response=rag_output,
        )

    process_and_persist_interaction = process_user_query