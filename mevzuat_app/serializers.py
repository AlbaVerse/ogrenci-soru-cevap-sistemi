from __future__ import annotations

import uuid
from typing import Optional

from rest_framework import serializers

MAX_QUESTION_LENGTH = 2000


class ChatQueryRequestSerializer(serializers.Serializer):
    question = serializers.CharField(
        max_length=MAX_QUESTION_LENGTH,
        allow_blank=False,
        trim_whitespace=True,
    )
    session_id = serializers.UUIDField(
        required=False,
        default=uuid.uuid4,
    )

    def validate_session_id(self, session_identifier: Optional[uuid.UUID]) -> uuid.UUID:
        if session_identifier is None:
            return uuid.uuid4()
        if session_identifier.version != 4:
            raise serializers.ValidationError("session_id UUID v4 formatında olmalıdır.")
        return session_identifier


class MevzuatCitationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    source_file = serializers.CharField(allow_blank=True, allow_null=True)
    snippet = serializers.CharField(allow_blank=True, allow_null=True, required=False)


class ChatQueryResponseSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(source="question.id")
    session_id = serializers.UUIDField(source="question.session_id")
    answer = serializers.CharField(source="rag_response.answer")
    confidence_score = serializers.FloatField(source="rag_response.confidence_score")
    sources = serializers.SerializerMethodField()
    response_time_ms = serializers.IntegerField(source="rag_response.response_time_ms")

    def get_sources(self, obj):
        try:
            return MevzuatCitationSerializer(obj.answer.kaynak_mevzuatlar.all(), many=True).data
        except Exception:
            return []


class ChatSessionSerializer(serializers.Serializer):
    id = serializers.CharField()
    session_id = serializers.UUIDField()
    title = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    message_count = serializers.IntegerField()


class AnalyticsDashboardSerializer(serializers.Serializer):
    total_questions = serializers.IntegerField()
    totalQuestions = serializers.IntegerField(required=False)
    solved_count = serializers.IntegerField()
    unsolved_count = serializers.IntegerField()
    answered_count = serializers.IntegerField(required=False)
    answeredCount = serializers.IntegerField(required=False)
    unanswered_count = serializers.IntegerField(required=False)
    unansweredCount = serializers.IntegerField(required=False)
    insufficient_count = serializers.IntegerField(required=False)
    insufficientCount = serializers.IntegerField(required=False)
    avg_response_time_ms = serializers.FloatField(allow_null=True)
    average_response_time_ms = serializers.FloatField(allow_null=True, required=False)
    averageResponseTimeMs = serializers.FloatField(allow_null=True, required=False)
    category_distribution = serializers.ListField(child=serializers.DictField(), required=False)
    category_breakdown = serializers.ListField(child=serializers.DictField(), required=False)
    categories = serializers.ListField(child=serializers.DictField(), required=False)
    daily_trend = serializers.ListField(child=serializers.DictField(), required=False)
    dailyTrend = serializers.ListField(child=serializers.DictField(), required=False)
    time_series = serializers.ListField(child=serializers.DictField(), required=False)
    status_breakdown = serializers.DictField(required=False)
