from django.contrib import admin
from .models import Kategori, Mevzuat, Kaynak, Soru, Cevap


@admin.register(Kategori)
class KategoriAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Mevzuat)
class MevzuatAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "chunk_index", "source_file", "created_at")
    list_filter = ("category",)
    search_fields = ("title", "content")


@admin.register(Kaynak)
class KaynakAdmin(admin.ModelAdmin):
    list_display = ("id", "mevzuat", "page_number", "url_or_path")
    search_fields = ("url_or_path",)


@admin.register(Soru)
class SoruAdmin(admin.ModelAdmin):
    list_display = ("id", "session_id", "query_text", "created_at")
    search_fields = ("query_text", "session_id")


@admin.register(Cevap)
class CevapAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "confidence_score", "response_time_ms", "created_at")
    search_fields = ("answer_text",)