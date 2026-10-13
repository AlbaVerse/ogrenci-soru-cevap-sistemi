from django.urls import path
from mevzuat_app.views import AnalyticsDashboardView, ChatQueryView, MyStatsView

urlpatterns = [
    path("chat/query/", ChatQueryView.as_view(), name="chat-query"),
    path("analytics/dashboard/", AnalyticsDashboardView.as_view(), name="analytics-dashboard"),
    path("stats/me/", MyStatsView.as_view(), name="stats-me"),
]