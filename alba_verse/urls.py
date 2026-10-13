import os
from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse, FileResponse, Http404
from django.conf import settings

def home_view(request):
    return JsonResponse({"status": "active", "message": "AlbaVerse Backend API is running successfully!"})

def serve_mevzuat_file(request, filename):
    """Mevzuat klasorlerindeki PDF/DOCX dosyalarini guvenli sekilde sunar."""
    base_dir = settings.BASE_DIR
    search_dirs = [
        os.path.join(base_dir, "mevzuat_app", "data"),
        os.path.join(base_dir, "mevzuat"),
        os.path.join(base_dir, "data"),
        base_dir,
    ]

    for d in search_dirs:
        for root, _, files in os.walk(d):
            if filename in files:
                target_path = os.path.join(root, filename)
                return FileResponse(open(target_path, "rb"), content_type="application/pdf")

    raise Http404("Dosya bulunamadi")

urlpatterns = [
    path("", home_view),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("mevzuat_app.urls")),
    path("media/<str:filename>/", serve_mevzuat_file, name="serve_mevzuat_file"),
    path("media/mevzuat/<str:filename>/", serve_mevzuat_file, name="serve_mevzuat_subfile"),
]