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
    AnalyticsDashboardSerializer,
    ChatQueryRequestSerializer,
    ChatQueryResponseSerializer,
    ChatSessionSerializer,
)
from mevzuat_app.services import ChatService


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
        serializer = ChatQueryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None
        result = ChatService.process_user_query(
            question_text=serializer.validated_data["question"],
            session_identifier=serializer.validated_data["session_id"],
            user=user,
        )
        return Response(
            ChatQueryResponseSerializer(result).data,
            status=status.HTTP_200_OK,
        )


class AnalyticsDashboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        start, end = _parse_range(request)
        summary = get_analytics_dashboard_metrics(start, end)
        return Response(AnalyticsDashboardSerializer(summary).data, status=status.HTTP_200_OK)


class MyStatsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        start, end = _parse_range(request)
        summary = get_user_stats(request.user, start, end)
        return Response(AnalyticsDashboardSerializer(summary).data, status=status.HTTP_200_OK)


class ChatSessionListView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        sessions = get_user_chat_sessions(request.user)
        return Response(ChatSessionSerializer(sessions, many=True).data, status=status.HTTP_200_OK)
