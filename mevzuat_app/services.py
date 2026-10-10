"""İş mantığı katmanı: RAG servisi (geçici mock) ve sohbet akışı."""
from __future__ import annotations

import random
import uuid
from dataclasses import dataclass
from typing import Protocol

from django.db import DatabaseError, transaction

from mevzuat_app import selectors
from mevzuat_app.models import Cevap, Soru
from mevzuat_app.selectors import MevzuatCitation
from mevzuat_app.ai.rag_service import RAGService as OllamaRAGService


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
    """Fatma Sude'nin Ollama tabanlı gerçek servisi de bu sözleşmeye uymalıdır."""

    def generate_answer(self, question_text: str) -> RAGResponse: ...


class MockRAGService:
    """Gerçek RAG servisi hazır olana kadar frontend'in çalışabilmesi için sahte yanıt üretir."""

    MIN_LATENCY_MS: int = 120
    MAX_LATENCY_MS: int = 300
    FIXED_CONFIDENCE: float = 0.95
    MAX_MOCK_CITATIONS: int = 2

    def generate_answer(self, question_text: str) -> RAGResponse:
        referenced_mevzuat_ids = selectors.get_default_mevzuat_ids(limit=self.MAX_MOCK_CITATIONS)
        simulated_latency_ms = random.randint(self.MIN_LATENCY_MS, self.MAX_LATENCY_MS)
        mock_answer_text = (
            f"\"{question_text}\" sorunuz ilgili üniversite mevzuatı çerçevesinde değerlendirilmiştir. "
            "Önlisans ve Lisans Eğitim-Öğretim Yönetmeliği uyarınca başvuru koşulları, "
            "akademik not ortalaması ve kontenjan şartları ilgili birimin kurul kararıyla belirlenir. "
            "Ayrıntılı bilgi için ilgili yönetmelik maddelerine ve öğrenci işleri birimine başvurunuz. "
            "(Bu yanıt geçici test servisi tarafından üretilmiştir.)"
        )
        return RAGResponse(
            answer_text=mock_answer_text,
            mevzuat_ids=referenced_mevzuat_ids,
            confidence_score=self.FIXED_CONFIDENCE,
            response_time_ms=simulated_latency_ms,
        )


class ChatService:
    """Kullanıcı sorusunu RAG'a iletir ve soru-cevap çiftini tek işlemde kaydeder."""

    def __init__(self, rag_service: RAGServiceProtocol | None = None) -> None:
        self._rag_service: RAGServiceProtocol = rag_service or OllamaRAGService()

    def process_user_query(self, *, question_text: str, session_id: uuid.UUID) -> ChatResult:
        # Yavaş LLM çağrısı transaction dışında yapılır; veritabanı kilitlenmez.
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
