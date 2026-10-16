from collections import Counter
from collections.abc import Sequence
from datetime import timedelta
from typing import TypedDict

from django.db.models import Avg, Count, F, Max, Min, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from mevzuat_app.models import Cevap, Mevzuat, Soru

UNCATEGORIZED_LABEL = "Genel / Belirtilmemiş"
DEFAULT_SERIES_DAYS = 30
UNSOLVED_STATUSES = (Cevap.Status.OUT_OF_SCOPE, Cevap.Status.FAILED)


class MevzuatCitation(TypedDict):
    id: int
    title: str
    source_file: str | None
    snippet: str


class CategoryDistributionEntry(TypedDict):
    category_name: str
    question_count: int


def _pct(part: int, total: int) -> float:
    return round(part * 100 / total, 1) if total else 0.0


def build_time_series(cevap_qs, start, end) -> list[dict]:
    """[start, end] aralığındaki her gün için bir nokta döner (boş günler 0)."""
    rows = (
        cevap_qs.filter(created_at__date__gte=start, created_at__date__lte=end)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(
            total=Count("id"),
            solved=Count("id", filter=Q(status=Cevap.Status.ANSWERED)),
            unsolved=Count("id", filter=Q(status__in=UNSOLVED_STATUSES)),
        )
        .order_by("day")
    )
    by_day = {r["day"]: r for r in rows}
    series, day = [], start
    while day <= end:
        r = by_day.get(day)
        series.append({
            "date": day.isoformat(),
            "total": r["total"] if r else 0,
            "solved": r["solved"] if r else 0,
            "unsolved": r["unsolved"] if r else 0,
        })
        day += timedelta(days=1)
    return series


def compute_question_stats(cevap_qs, start=None, end=None) -> dict:
    ranged = start is not None or end is not None
    end = end or timezone.localdate()
    start = start or end - timedelta(days=DEFAULT_SERIES_DAYS - 1)

    scoped = (
        cevap_qs.filter(created_at__date__gte=start, created_at__date__lte=end)
        if ranged else cevap_qs
    )

    agg = scoped.aggregate(
        total=Count("id"),
        solved=Count("id", filter=Q(status=Cevap.Status.ANSWERED)),
        out_of_scope=Count("id", filter=Q(status=Cevap.Status.OUT_OF_SCOPE)),
        failed=Count("id", filter=Q(status=Cevap.Status.FAILED)),
        avg_ms=Avg("response_time_ms", filter=Q(status=Cevap.Status.ANSWERED)),
    )
    total = agg["total"] or 0
    solved = agg["solved"] or 0
    out_of_scope = agg["out_of_scope"] or 0
    failed = agg["failed"] or 0
    unsolved = out_of_scope + failed
    avg_ms = round(float(agg["avg_ms"] or 0.0), 2) if agg["avg_ms"] is not None else 0.0

    # Kategori dağılımını hesapla
    distribution_counter: Counter = Counter()
    answered_cevaplar = (
        scoped.filter(status=Cevap.Status.ANSWERED)
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
        "answered_count": solved,
        "unanswered_count": unsolved,
        "avg_response_time_ms": avg_ms,
        "category_distribution": distribution_list,
        "status_breakdown": {
            "solved": solved,
            "unsolved": unsolved,
            "out_of_scope": out_of_scope,
            "failed": failed,
            "solved_percentage": _pct(solved, total),
            "unsolved_percentage": _pct(unsolved, total),
        },
        "time_series": build_time_series(cevap_qs, start, end),
    }


def get_analytics_dashboard_metrics(start=None, end=None) -> dict:
    return compute_question_stats(Cevap.objects.all(), start, end)


def get_user_stats(user, start=None, end=None) -> dict:
    return compute_question_stats(
        Cevap.objects.filter(question__user=user), start, end
    )


def get_user_chat_sessions(user, limit: int = 100) -> list[dict]:
    """Kullanıcının oturumları; başlık ilk sorudan türetilir."""
    sessions = list(
        Soru.objects.filter(user=user)
        .values("session_id")
        .annotate(
            started_at=Min("created_at"),
            last_activity=Max("created_at"),
            message_count=Count("id"),
        )
        .order_by("-last_activity")[:limit]
    )
    ids = [s["session_id"] for s in sessions]

    first_text: dict = {}
    for sid, text in (
        Soru.objects.filter(user=user, session_id__in=ids)
        .order_by("created_at", "id")
        .values_list("session_id", "query_text")
    ):
        first_text.setdefault(sid, text)

    for s in sessions:
        raw = " ".join((first_text.get(s["session_id"]) or "").split())
        s["title"] = (raw[:57] + "…") if len(raw) > 60 else (raw or "Yeni sohbet")
    return sessions


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
