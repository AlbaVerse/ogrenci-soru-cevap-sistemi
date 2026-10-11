from __future__ import annotations

from typing import Sequence, TypedDict
from django.db import models
from django.db.models import Count, Q

from mevzuat_app.models import Cevap, Mevzuat, Soru

SOLVED_CONFIDENCE_THRESHOLD = 0.65


class MevzuatCitation(TypedDict):
    id: int
    title: str
    source_file: str | None
    snippet: str


class CategoryDistributionEntry(TypedDict):
    category_name: str
    question_count: int


class AnalyticsDashboardMetrics(TypedDict):
    total_questions: int
    solved_count: int
    unsolved_count: int
    category_distribution: list[CategoryDistributionEntry]


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
    )

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
        "total_questions": aggregations["total_questions"] or 0,
        "solved_count": aggregations["solved_count"] or 0,
        "unsolved_count": aggregations["unsolved_count"] or 0,
        "category_distribution": distribution,
    }

