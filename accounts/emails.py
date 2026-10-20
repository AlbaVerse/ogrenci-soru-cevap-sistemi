import logging

import requests
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


class EmailConfigError(RuntimeError):
    pass


def send_verification_email(to_email: str, code: str) -> None:
    """Doğrulama kodunu gönderir. Gönderilemezse İSTİSNA FIRLATIR (sessizce yutmaz):
    kullanıcıya 'kod gitti' denip hiç gitmemesi en kötü senaryodur."""
    subject = "AlbaVerse e-posta doğrulama kodu"
    text = (
        f"AlbaVerse doğrulama kodunuz: {code}\n\n"
        "Bu kod 10 dakika geçerlidir. Bu işlemi siz yapmadıysanız bu e-postayı yok sayın."
    )

    api_key = getattr(settings, "RESEND_API_KEY", "")
    if api_key:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"from": settings.DEFAULT_FROM_EMAIL, "to": [to_email], "subject": subject, "text": text},
            timeout=10,
        )
        if not resp.ok:
            # Sık nedenler: 403 = gönderen alan adı Resend'de doğrulanmamış (onboarding@resend.dev
            # yalnızca hesap sahibinin kendi adresine gönderir); 422 = geçersiz from.
            logger.error("Resend API hatası [%s]: %s", resp.status_code, resp.text)
            resp.raise_for_status()
        return

    if settings.DEBUG:
        # Yerel geliştirme: kod terminale (console backend) yazılır; ekip arkadaşları da test edebilir.
        send_mail(subject, text, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
        return

    raise EmailConfigError("RESEND_API_KEY tanımlı değil; doğrulama e-postası gönderilemez.")
