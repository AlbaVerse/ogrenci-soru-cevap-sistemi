"""Chat ve analitik uç noktalarının giriş/çıkış sözleşmeleri."""
from __future__ import annotations

import uuid
from typing import Optional

from rest_framework import serializers

MAX_QUESTION_LENGTH = 2000


class ChatQueryRequestSerializer(serializers.Serializer):
    """POST /api/v1/chat/query/ istek gövdesi için katı doğrulama."""

    question = serializers.CharField(
        max_length=MAX_QUESTION_LENGTH,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            "blank": "Soru metni boş bırakılamaz.",
            "required": "Soru metni zorunludur.",
            "max_length": f"Soru en fazla {MAX_QUESTION_LENGTH} karakter olabilir.",
        },
    )
    session_id = serializers.UUIDField(
        required=False,
        default=uuid.uuid4,
        error_messages={
            "invalid": "session_id geçerli bir UUID olmalıdır.",
        },
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


class ChatQueryResponseSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    session_id = serializers.UUIDField()
    answer = serializers.CharField()
    confidence_score = serializers.FloatField()
    sources = MevzuatCitationSerializer(many=True)
    response_time_ms = serializers.IntegerField()


class CategoryDistributionSerializer(serializers.Serializer):
    category_name = serializers.CharField()
    question_count = serializers.IntegerField()


class StatusBreakdownSerializer(serializers.Serializer):
    solved_percentage = serializers.FloatField()
    unsolved_percentage = serializers.FloatField()


class AnalyticsDashboardSerializer(serializers.Serializer):
    total_questions = serializers.IntegerField()
    solved_count = serializers.IntegerField()
    unsolved_count = serializers.IntegerField()
    avg_response_time_ms = serializers.FloatField()
    category_distribution = CategoryDistributionSerializer(many=True)
    status_breakdown = StatusBreakdownSerializer()
