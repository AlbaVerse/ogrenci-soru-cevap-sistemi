from collections import Counter
from collections.abc import Sequence
from typing import TypedDict

from django.db.models import Avg, Count, Q

from mevzuat_app.models import Cevap, Mevzuat, Soru

UNCATEGORIZED_LABEL = "Genel / Belirtilmemiş"


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

    mevzuats = (
        Mevzuat.objects.filter(id__in=mevzuat_ids)
        .order_by("id")
        .values("id", "title", "source_file", "content")
    )

    citations: list[MevzuatCitation] = []
    for m in mevzuats:
        content_text = m.get("content") or ""
        snippet_text = content_text[:200] + ("..." if len(content_text) > 200 else "")
        citations.append({
            "id": m["id"],
            "title": m["title"],
            "source_file": m["source_file"],
            "snippet": snippet_text,
        })
    return citations


def compute_question_stats(cevaplar) -> AnalyticsDashboardMetrics:
    """Tek kaynaktan tutarlı sayılar üreten istatistik çekirdeği."""
    agg = cevaplar.aggregate(
        solved=Count("id", filter=Q(status=Cevap.Status.ANSWERED)),
        unsolved=Count("id", filter=~Q(status=Cevap.Status.ANSWERED)),
        avg_ms=Avg("response_time_ms", filter=Q(status=Cevap.Status.ANSWERED)),
    )
    solved = agg["solved"] or 0
    unsolved = agg["unsolved"] or 0
    total = solved + unsolved
    avg_ms = round(float(agg["avg_ms"] or 0.0), 2)

    solved_pct = round((solved / total) * 100, 2) if total > 0 else 0.0
    unsolved_pct = round((unsolved / total) * 100, 2) if total > 0 else 0.0

    distribution_counter: Counter = Counter()
    answered_cevaplar = (
        cevaplar.filter(status=Cevap.Status.ANSWERED)
        .prefetch_related("referenced_mevzuats__category")
    )

    for c in answered_cevaplar:
        cats = [m.category.name for m in c.referenced_mevzuats.all() if m.category]
        label = Counter(cats).most_common(1)[0][0] if cats else UNCATEGORIZED_LABEL
        distribution_counter[label] += 1

    if unsolved > 0:
        distribution_counter[UNCATEGORIZED_LABEL] += unsolved

    distribution_list: list[CategoryDistributionEntry] = [
        {"category_name": name, "question_count": count}
        for name, count in distribution_counter.most_common()
    ]

    return {
        "total_questions": total,
        "solved_count": solved,
        "unsolved_count": unsolved,
        "avg_response_time_ms": avg_ms,
        "category_distribution": distribution_list,
        "status_breakdown": {
            "solved_percentage": solved_pct,
            "unsolved_percentage": unsolved_pct,
        },
    }


def get_analytics_dashboard_metrics() -> AnalyticsDashboardMetrics:
    return compute_question_stats(Cevap.objects.all())


def get_user_stats(user) -> AnalyticsDashboardMetrics:
    return compute_question_stats(Cevap.objects.filter(question__user=user))