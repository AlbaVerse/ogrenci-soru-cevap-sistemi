from collections import Counter
from collections.abc import Sequence
from typing import TypedDict

from django.db.models import Avg

from mevzuat_app.models import Cevap, Mevzuat, Soru


class MevzuatCitation(TypedDict):
    id: int
    title: str
    source_file: str | None
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
    if not mevzuat_ids:
        return []
    return list(
        Mevzuat.objects.filter(id__in=mevzuat_ids)
        .order_by("id")
        .values("id", "title", "source_file", "snippet")
    )


def get_analytics_dashboard_metrics() -> AnalyticsDashboardMetrics:
    total_q = Soru.objects.count()

    solved_q = Cevap.objects.filter(confidence_score__gte=0.7).count()
    unsolved_q = total_q - solved_q
    if unsolved_q < 0:
        unsolved_q = 0

    avg_time_val = Cevap.objects.aggregate(avg=Avg("response_time_ms"))["avg"]
    avg_time = round(float(avg_time_val), 2) if avg_time_val is not None else 0.0

    if total_q > 0:
        solved_pct = round((solved_q / total_q) * 100, 2)
        unsolved_pct = round((unsolved_q / total_q) * 100, 2)
    else:
        solved_pct = 0.0
        unsolved_pct = 0.0

    category_counts = Counter()
    cevaplar = (
        Cevap.objects.select_related("question")
        .prefetch_related("referenced_mevzuats__category")
        .all()
    )

    counted_question_ids = set()
    for cevap in cevaplar:
        q_id = cevap.question_id
        if q_id in counted_question_ids:
            continue
        counted_question_ids.add(q_id)

        first_mevzuat = cevap.referenced_mevzuats.first()
        if first_mevzuat and first_mevzuat.category:
            cat_name = first_mevzuat.category.name
        else:
            cat_name = "Genel / Belirtilmemiş"
        category_counts[cat_name] += 1

    unlinked_count = total_q - len(counted_question_ids)
    if unlinked_count > 0:
        category_counts["Genel / Belirtilmemiş"] += unlinked_count

    distribution: list[CategoryDistributionEntry] = [
        {
            "category_name": cat_name,
            "question_count": count,
        }
        for cat_name, count in category_counts.most_common()
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
