"""Salt-okunur veri erişim katmanı: tüm sorgu ve aggregation işleri burada."""
from __future__ import annotations

from typing import Sequence, TypedDict

from django.db.models import Avg, Case, Count, F, IntegerField, Q, Value, When

from mevzuat_app.models import Cevap, Kategori, Mevzuat, Soru

# Cevabın güven skoru bu eşiğin altındaysa (veya hiç cevap yoksa) soru "çözülmemiş" sayılır.
SOLVED_CONFIDENCE_THRESHOLD: float = 0.5


class MevzuatCitation(TypedDict):
    id: int
    title: str
    source_file: str | None


class CategoryDistributionEntry(TypedDict):
    category_name: str
    question_count: int


class StatusBreakdown(TypedDict):
    solved_percentage: float
    unsolved_percentage: float


class AnalyticsDashboardMetrics(TypedDict):
    total_questions: int
    solved_count: int
    unsolved_count: int
    avg_response_time_ms: float
    category_distribution: list[CategoryDistributionEntry]
    status_breakdown: StatusBreakdown


def get_default_mevzuat_ids(*, limit: int) -> list[int]:
    """Mock RAG için mevcut mevzuat kayıtlarından ilk `limit` ID'yi döndürür."""
    return list(Mevzuat.objects.order_by("id").values_list("id", flat=True)[:limit])


def get_mevzuat_citations(*, mevzuat_ids: Sequence[int]) -> list[MevzuatCitation]:
    """Verilen ID'lerden yalnızca veritabanında gerçekten var olanları atıf olarak getirir."""
    if not mevzuat_ids:
        return []
    return list(
        Mevzuat.objects.filter(id__in=mevzuat_ids)
        .order_by("id")
        .values("id", "title", "source_file")
    )


def get_analytics_dashboard_metrics() -> AnalyticsDashboardMetrics:
    """Dashboard metriklerini tamamen veritabanı motoruna hesaplatır (Python döngüsü yok)."""
    solved_condition = Q(cevap__confidence_score__gte=SOLVED_CONFIDENCE_THRESHOLD)
    unsolved_condition = Q(cevap__isnull=True) | Q(
        cevap__confidence_score__lt=SOLVED_CONFIDENCE_THRESHOLD
    )

    question_summary = Soru.objects.aggregate(
        total_questions=Count("id"),
        solved_count=Count(
            Case(When(solved_condition, then=Value(1)), output_field=IntegerField())
        ),
        unsolved_count=Count(
            Case(When(unsolved_condition, then=Value(1)), output_field=IntegerField())
        ),
        avg_response_time_ms=Avg("cevap__response_time_ms"),
    )

    # Bir soru birden fazla mevzuata atıf yapabildiği için distinct sayım şart.
    category_distribution = list(
        Kategori.objects.annotate(
            category_name=F("name"),
            question_count=Count("mevzuatlar__cevaplar__question", distinct=True),
        )
        .filter(question_count__gt=0)
        .order_by("-question_count", "category_name")
        .values("category_name", "question_count")
    )

    total_questions: int = question_summary["total_questions"] or 0
    solved_count: int = question_summary["solved_count"] or 0
    unsolved_count: int = question_summary["unsolved_count"] or 0
    average_latency: float = question_summary["avg_response_time_ms"] or 0.0

    solved_percentage = round(solved_count * 100 / total_questions, 1) if total_questions else 0.0
    unsolved_percentage = (
        round(unsolved_count * 100 / total_questions, 1) if total_questions else 0.0
    )

    return {
        "total_questions": total_questions,
        "solved_count": solved_count,
        "unsolved_count": unsolved_count,
        "avg_response_time_ms": round(float(average_latency), 1),
        "category_distribution": category_distribution,
        "status_breakdown": {
            "solved_percentage": solved_percentage,
            "unsolved_percentage": unsolved_percentage,
        },
    }