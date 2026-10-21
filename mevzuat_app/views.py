import logging
from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from mevzuat_app.selectors import (
    get_analytics_dashboard_metrics,
    get_user_chat_sessions,
    get_user_stats,
)
from mevzuat_app.serializers import (
    ChatQueryRequestSerializer,
    ChatQueryResponseSerializer,
    ChatSessionSerializer,
)
from mevzuat_app.services import ChatService

logger = logging.getLogger(__name__)


def _parse_range(request):
    """?days=N veya ?start=YYYY-MM-DD&end=YYYY-MM-DD. Parametre yoksa (None, None)."""
    qp = request.query_params
    if not any(k in qp for k in ("days", "start", "end")):
        return None, None
    today = timezone.localdate()
    end = parse_date(qp.get("end") or "") or today
    start = parse_date(qp.get("start") or "")
    if start is None:
        try:
            days = max(1, min(int(qp.get("days", 30)), 365))
        except ValueError:
            days = 30
        start = end - timedelta(days=days - 1)
    return start, end


class ChatQueryView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        # Frontend hem 'question', hem 'query', hem 'message' gönderebilmesi için esneklik sağlandı
        raw_data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "question" not in raw_data:
            raw_data["question"] = raw_data.get("message") or raw_data.get("query") or ""

        serializer = ChatQueryRequestSerializer(data=raw_data)
        if not serializer.is_valid():
            return Response(
                {"error": "Soru metni geçersiz.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user if request.user and request.user.is_authenticated else None

        try:
            # AI & Mevzuat Servisi Çağrısı
            result = ChatService().process_user_query(
                question_text=serializer.validated_data["question"],
                session_id=serializer.validated_data.get("session_id"),
                user=user,
            )
            return Response(
                ChatQueryResponseSerializer(result).data,
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            # 500 çökmesini engeller, hatanın ne olduğunu terminale ve yanıt olarak basar
            logger.exception("Chat query işlenirken hata oluştu: %s", str(e))
            return Response(
                {
                    "error": "Sorgu işlenirken sunucuda bir hata oluştu.",
                    "detail": str(e),
                },
                status=status.HTTP_200_OK,  # Frontend tarafının tamamen çökmesini engeller
            )


class AnalyticsDashboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        try:
            start, end = _parse_range(request)
            summary = get_analytics_dashboard_metrics(start, end)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Analytics dashboard hatası: %s", str(e))
            return Response({"total_queries": 0, "active_users": 0}, status=status.HTTP_200_OK)


class MyStatsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        try:
            start, end = _parse_range(request)
            summary = get_user_stats(request.user, start, end)
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Kullanıcı istatistik hatası: %s", str(e))
            return Response({"my_queries": 0}, status=status.HTTP_200_OK)


class ChatSessionListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        try:
            sessions = get_user_chat_sessions(request.user)
            return Response(ChatSessionSerializer(sessions, many=True).data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Sohbet geçmişi çekme hatası: %s", str(e))
            return Response([], status=status.HTTP_200_OK)