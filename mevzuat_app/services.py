"""İş mantığı katmanı: RAG servisi ve sohbet akışı."""
from __future__ import annotations

import logging
import re
import time
import uuid
from dataclasses import dataclass
from typing import Protocol

from django.db import DatabaseError, transaction
from django.db.models import Q

from mevzuat_app import selectors
from mevzuat_app.ai.ollama_client import OllamaClient, OllamaClientError
from mevzuat_app.models import Cevap, Mevzuat, Soru
from mevzuat_app.selectors import MevzuatCitation

logger = logging.getLogger(__name__)


def clean_turkish(text: str) -> str:
    """Türkçe karakter duyarlı küçük harfe dönüştürme."""
    table = str.maketrans({"İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç"})
    return text.translate(table).lower()


class RAGServiceError(Exception):
    """RAG/LLM servisinden yanıt alınamadığında fırlatılır."""


class ChatPersistenceError(Exception):
    """Soru-cevap çifti veritabanına yazılamadığında fırlatılır."""


@dataclass(frozen=True)
class RAGResponse:
    answer_text: str
    mevzuat_ids: list[int]
    confidence_score: float
    response_time_ms: int


@dataclass(frozen=True)
class ChatResult:
    question_id: int
    session_id: str
    answer: str
    confidence_score: float
    sources: list[MevzuatCitation]
    response_time_ms: int


class RAGServiceProtocol(Protocol):
    def generate_answer(self, question: str) -> RAGResponse:
        ...


class OllamaRAGService:
    """Gerçek mevzuat verilerini tarayıp Ollama Qwen modeline bağlam sağlayan RAG servisi."""

    def __init__(self, client: OllamaClient | None = None) -> None:
        self.client = client or OllamaClient()

    def _retrieve_relevant_chunks(self, question: str, limit: int = 5) -> list[Mevzuat]:
        stop_words = {
            "ve", "veya", "ile", "bir", "bu", "şu", "o", "ne", "nedir", "nelerdir",
            "nasıl", "için", "mı", "mi", "mu", "mü", "var", "yok", "hakkında", "şartları", "neler"
        }
        
        normalized = clean_turkish(question)
        raw_words = re.findall(r"\b\w+\b", normalized)
        
        # Anlamlı kök / anahtar kelimeleri belirle
        keywords = []
        for word in raw_words:
            if len(word) >= 3 and word not in stop_words:
                keywords.append(word)

        if not keywords:
            keywords = [w for w in raw_words if len(w) >= 3]

        if not keywords:
            return list(Mevzuat.objects.all()[:limit])

        # Arama: Sorudaki anahtar kelimelerden herhangi birini içeren parçaları topla
        query_filter = Q()
        for kw in keywords:
            query_filter |= Q(content__icontains=kw) | Q(title__icontains=kw)

        candidate_chunks = list(Mevzuat.objects.filter(query_filter).distinct()[:60])

        if not candidate_chunks:
            return list(Mevzuat.objects.all()[:limit])

        # Parçaları sorudaki kelimelerin geçme sıklığına göre puanla
        def score_chunk(chunk: Mevzuat) -> int:
            content_lower = clean_turkish(chunk.content or "")
            title_lower = clean_turkish(chunk.title or "")
            score = 0
            for kw in keywords:
                if kw in title_lower:
                    score += 5
                score += content_lower.count(kw)
            return score

        candidate_chunks.sort(key=score_chunk, reverse=True)
        return candidate_chunks[:limit]

    def generate_answer(self, question: str) -> RAGResponse:
        start_time = time.perf_counter()

        # 1. Retrieval
        relevant_mevzuats = self._retrieve_relevant_chunks(question, limit=5)
        mevzuat_ids = [m.id for m in relevant_mevzuats]

        context_texts = []
        for m in relevant_mevzuats:
            doc_title = m.title or (m.category.name if m.category else "Yönetmelik")
            context_texts.append(f"[KAYNAK: {doc_title} - Dosya: {m.source_file or 'Bilinmiyor'}]\n{m.content.strip()[:1800]}")

        context_block = "\n\n".join(context_texts)

        # 2. Augmented Generation
        system_prompt = (
            "Sen üniversitenin resmî mevzuat ve akademik danışmanısın. "
            "Sana verilen mevzuat metinlerindeki somut maddeleri, yüzdeleri, şartları ve kuralları kullanarak "
            "öğrencinin sorusuna açık, doğrudan ve maddeler halinde net bir yanıt ver."
        )

        user_prompt = f"""AŞAĞIDAKİ ÜNİVERSİTE MEVZUAT METİNLERİNİ İNCELE:

{context_block}

ÖĞRENCİNİN SORUSU:
{question}

Yukarıda verilen yönetmelik maddelerine göre soruyu somut verilerle ve maddeler halinde açıkla:"""

        try:
            raw_answer = self.client.generate(prompt=user_prompt, system=system_prompt)
        except OllamaClientError as exc:
            logger.error(f"Ollama yanıt veremedi: {exc}")
            raise RAGServiceError(str(exc)) from exc

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)

        return RAGResponse(
            answer_text=raw_answer,
            mevzuat_ids=mevzuat_ids,
            confidence_score=0.95,
            response_time_ms=elapsed_ms,
        )


class MockRAGService:
    """Test amaçlı mock servis."""

    def generate_answer(self, question: str) -> RAGResponse:
        return RAGResponse(
            answer_text=f'"{question}" sorunuz ilgili üniversite mevzuatı çerçevesinde değerlendirilmiştir.',
            mevzuat_ids=[162, 163],
            confidence_score=0.90,
            response_time_ms=150,
        )


class ChatService:
    """Kullanıcı sorusunu RAG'a iletir ve soru-cevap çiftini tek işlemde kaydeder."""

    def __init__(self, rag_service: RAGServiceProtocol | None = None) -> None:
        self._rag_service: RAGServiceProtocol = rag_service or OllamaRAGService()

    def process_user_query(self, *, question_text: str, session_id: uuid.UUID) -> ChatResult:
        try:
            rag_response = self._rag_service.generate_answer(question_text)
        except Exception as failure:
            raise RAGServiceError(f"RAG servisine ulaşılamadı: {failure}") from failure

        mevzuat_citations = selectors.get_mevzuat_citations(mevzuat_ids=rag_response.mevzuat_ids)
        verified_mevzuat_ids = [citation["id"] for citation in mevzuat_citations]

        try:
            with transaction.atomic():
                recorded_question = Soru.objects.create(
                    session_id=session_id,
                    query_text=question_text,
                )
                recorded_answer = Cevap.objects.create(
                    question=recorded_question,
                    answer_text=rag_response.answer_text,
                    confidence_score=rag_response.confidence_score,
                    response_time_ms=rag_response.response_time_ms,
                )
                if verified_mevzuat_ids:
                    recorded_answer.referenced_mevzuats.set(verified_mevzuat_ids)
        except DatabaseError as database_failure:
            raise ChatPersistenceError("Soru ve cevap kaydedilemedi.") from database_failure

        return ChatResult(
            question_id=recorded_question.id,
            session_id=str(session_id),
            answer=recorded_answer.answer_text,
            confidence_score=recorded_answer.confidence_score,
            sources=mevzuat_citations,
            response_time_ms=recorded_answer.response_time_ms,
        )