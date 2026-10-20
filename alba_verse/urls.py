import os
from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse, FileResponse, Http404
from django.conf import settings

def home_view(request):
    return JsonResponse({"status": "active", "message": "AlbaVerse Backend API is running successfully!"})

ALLOWED_MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
# Yalnızca mevzuat klasörleri (kök dizindeki .py/.sqlite3/.env gibi dosyalar ASLA sunulmaz).
MEDIA_FOLDERS = ("YÖNETMELİKLER", "YÖNERGELER", "USUL ESASLAR", "POLİTİKALAR VE REHBERLİK", "YÖK MEVZUAT",
                 "data", os.path.join("mevzuat_app", "data"))


def serve_mevzuat_file(request, filename):
    """Mevzuat PDF/DOCX dosyalarını sunar; yalnızca izinli uzantı ve klasörlerden."""
    filename = os.path.basename(filename)  # path traversal'a karşı
    ext = os.path.splitext(filename)[1].lower()
    content_type = ALLOWED_MEDIA_TYPES.get(ext)
    if not content_type:
        raise Http404("Dosya bulunamadi")

    base = str(settings.BASE_DIR)
    candidates = [os.path.join(base, filename)]  # kök dizindeki PDF'ler (ör. BAP Yönerge_2023.pdf)
    for folder in MEDIA_FOLDERS:
        for root, _, files in os.walk(os.path.join(base, folder)):
            if filename in files:
                candidates.append(os.path.join(root, filename))
    for path in candidates:
        if os.path.isfile(path):
            return FileResponse(open(path, "rb"), content_type=content_type)
    raise Http404("Dosya bulunamadi")


urlpatterns = [
    path("", home_view),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("mevzuat_app.urls")),
    path("media/<str:filename>/", serve_mevzuat_file, name="serve_mevzuat_file"),
    path("media/mevzuat/<str:filename>/", serve_mevzuat_file, name="serve_mevzuat_subfile"),
]