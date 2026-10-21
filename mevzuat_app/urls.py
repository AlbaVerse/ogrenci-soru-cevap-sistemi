from django.urls import path
from mevzuat_app.views import (
    AnalyticsDashboardView,
    ChatQueryView,
    ChatSessionListView,
    MyStatsView,
)

app_name = "mevzuat_app"

urlpatterns = [
    path("chat/query/", ChatQueryView.as_view(), name="chat-query"),
    path("chat/sessions/", ChatSessionListView.as_view(), name="chat-sessions"),
    path("analytics/dashboard/", AnalyticsDashboardView.as_view(), name="analytics-dashboard"),
    path("stats/me/", MyStatsView.as_view(), name="stats-me"),
]