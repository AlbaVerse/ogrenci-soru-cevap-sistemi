import logging
from collections.abc import Sequence
from typing import TypedDict
import uuid

from django.db import models
from django.db.models import Avg, Count, Q

from mevzuat_app.models import Cevap, Mevzuat, Soru

logger = logging.getLogger(__name__)

SOLVED_CONFIDENCE_THRESHOLD = 0.5


class MevzuatCitation(TypedDict):
    id: int
    title: str
    source_file: str
    snippet: str


class CategoryDistributionEntry(TypedDict):
    category_name: str
    question_count: int


class StatusBreakdownEntry(TypedDict):
    solved_percentage: float
    unsolved_percentage: float


class AnalyticsDashboardMetrics(TypedDict):
    total_questions: int
    solved_count: int
    unsolved_count: int
    avg_response_time_ms: float
    category_distribution: list[CategoryDistributionEntry]
    status_breakdown: StatusBreakdownEntry


def get_mevzuat_citations(*, mevzuat_ids: Sequence[int]) -> list[MevzuatCitation]:
    """Verilen ID lerden yalnizca veritabaninda gercekten var olanlari atif olarak getirir."""
    if not mevzuat_ids:
        return []
    return list(
        Mevzuat.objects.filter(id__in=mevzuat_ids)
        .order_by("id")
        .values("id", "title", "source_file", snippet=models.F("content"))
    )


def get_analytics_dashboard_metrics() -> AnalyticsDashboardMetrics:
    """Dashboard metriklerini tamamen veritabani motoruna hesaplatir."""
    solved_condition = Q(cevap__confidence_score__gte=SOLVED_CONFIDENCE_THRESHOLD)
    unsolved_condition = Q(cevap__isnull=True) | Q(
        cevap__confidence_score__lt=SOLVED_CONFIDENCE_THRESHOLD
    )

    aggregations = Soru.objects.aggregate(
        total_questions=Count("id"),
        solved_count=Count("id", filter=solved_condition),
        unsolved_count=Count("id", filter=unsolved_condition),
        avg_response_time_ms=Avg("cevap__response_time_ms"),
    )

    total_q = int(aggregations.get("total_questions") or 0)
    solved_q = int(aggregations.get("solved_count") or 0)
    unsolved_q = int(aggregations.get("unsolved_count") or 0)
    avg_time = float(aggregations.get("avg_response_time_ms") or 0.0)

    solved_pct = round((solved_q / total_q) * 100, 2) if total_q > 0 else 0.0
    unsolved_pct = round((unsolved_q / total_q) * 100, 2) if total_q > 0 else 0.0

    category_counts = (
        Mevzuat.objects.values("category__name")
        .annotate(question_count=Count("id"))
        .order_by("-question_count")
    )

    distribution: list[CategoryDistributionEntry] = [
        {
            "category_name": entry["category__name"] or "Belirtilmemis",
            "question_count": entry["question_count"],
        }
        for entry in category_counts
    ]

    return {
        "total_questions": total_q,
        "solved_count": solved_q,
        "unsolved_count": unsolved_q,
        "avg_response_time_ms": avg_time,
        "category_distribution": distribution,
        "status_breakdown": {
            "solved_percentage": solved_pct,
            "unsolved_percentage": unsolved_pct,
        },
    }
