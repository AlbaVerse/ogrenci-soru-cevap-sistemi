"""Ã„Â°nce view katmanÃ„Â±: istek al, servis/selector ÃƒÂ§aÃ„Å¸Ã„Â±r, HTTP durumuyla dÃƒÂ¶n."""
from __future__ import annotations

import logging
import os

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from mevzuat_app.models import Mevzuat
from mevzuat_app.services import OllamaRAGService, get_groq_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from accounts.authentication import OptionalTokenAuthentication

from mevzuat_app.selectors import get_analytics_dashboard_metrics, get_user_stats
from mevzuat_app.serializers import (
    AnalyticsDashboardSerializer,
    ChatQueryRequestSerializer,
    ChatQueryResponseSerializer,
)
from mevzuat_app.services import ChatPersistenceError, ChatService, RAGServiceError

logger = logging.getLogger(__name__)

authentication_classes = [OptionalTokenAuthentication]
class ChatQueryView(APIView):
    """POST /api/v1/chat/query/"""

    authentication_classes = [OptionalTokenAuthentication]
    permission_classes = [AllowAny]
    chat_service_class = ChatService

    def post(self, request: Request) -> Response:
        query_serializer = ChatQueryRequestSerializer(data=request.data)
        query_serializer.is_valid(raise_exception=True)
        validated_query = query_serializer.validated_data

        try:
            chat_result = self.chat_service_class().process_user_query(
                question_text=validated_query["question"],
                session_id=validated_query["session_id"],
                user=request.user if request.user.is_authenticated else None,
            )
        except RAGServiceError:
            logger.exception("RAG servisi yanıt veremedi.")
            return Response(
                {"detail": "Yanıt servisi şu anda kullanılamıyor."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ChatPersistenceError:
            logger.exception("Soru-cevap kaydı başarısız oldu.")
            return Response(
                {"detail": "Sorunuz kaydedilirken bir hata oluştu."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            logger.exception("chat/query beklenmeyen hata")
            return Response(
                {"detail": "Beklenmeyen bir hata oluştu."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            ChatQueryResponseSerializer(chat_result).data,
            status=status.HTTP_201_CREATED,
        )
class AnalyticsDashboardView(APIView):
    """GET /api/v1/analytics/dashboard/"""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        analytics_summary = get_analytics_dashboard_metrics()
        return Response(
            AnalyticsDashboardSerializer(analytics_summary).data,
            status=status.HTTP_200_OK,
        )

class MyStatsView(APIView):
    """GET /api/v1/stats/me/"""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_user_stats(request.user), status=status.HTTP_200_OK)

class RAGDebugView(APIView):
    """GEÇİCİ: Render ortamını teşhis eder. Teşhis bitince SİLİN."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        q = request.query_params.get("q", "Kayıt dondurma şartları nelerdir?")
        rag = OllamaRAGService()
        chunks, keywords, top_score = rag._retrieve_relevant_chunks(q, limit=8)

        db = settings.DATABASES["default"]
        return Response({
            "db_engine": db.get("ENGINE"),
            "db_name": str(db.get("NAME")),
            "db_host": db.get("HOST"),
            "mevzuat_count": Mevzuat.objects.count(),
            "groq_key_set": bool(os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", "")),
            "groq_model": get_groq_model(),
            "keywords": keywords,
            "chunk_count": len(chunks),
            "top_score": top_score,
            "chunk_titles": [c.title for c in chunks],
            "git_commit": os.getenv("RENDER_GIT_COMMIT"),
        })    