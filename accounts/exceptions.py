"""Frontend'in beklediği tek biçimli hata gövdesi:
{ "error": { "code": str, "message": str | None, "fields": {alan: [mesaj]} | None }, "detail": str }
(`detail` yalnızca eski istemciler/curl testleri için tutulur.)"""
from rest_framework import status
from rest_framework.exceptions import APIException, Throttled, ValidationError
from rest_framework.views import exception_handler as drf_exception_handler


class ApiError(APIException):
    """Kod + mesaj taşıyan, frontend'in `error.code` ile ayırt edebildiği hata."""

    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        super().__init__(detail=message, code=code)
        self.api_code = code
        self.api_message = message


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None  # beklenmeyen hata: Django 500 üretir

    code, message, fields = f"http_{response.status_code}", None, None

    if isinstance(exc, ApiError):
        code, message = exc.api_code, exc.api_message
    elif isinstance(exc, ValidationError):
        code, message = "validation_error", "Girdiğin bilgileri kontrol et."
        data = response.data
        if isinstance(data, dict):
            fields = {k: (v if isinstance(v, list) else [v]) for k, v in data.items()}
            general = fields.pop("non_field_errors", None) or fields.pop("detail", None)
            if general:
                message = str(general[0])
            fields = {k: [str(m) for m in v] for k, v in fields.items()} or None
        elif isinstance(data, list) and data:
            message = str(data[0])
    elif isinstance(exc, Throttled):
        code = "throttled"
        message = f"Çok fazla deneme yapıldı. {exc.wait or 60} saniye sonra tekrar dene."
    elif response.status_code == status.HTTP_401_UNAUTHORIZED:
        code = "unauthorized"

    response.data = {
        "error": {"code": code, "message": message, "fields": fields},
        "detail": message or "",
    }
    return response
