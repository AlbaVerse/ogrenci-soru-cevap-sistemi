import logging
import requests
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, code: str) -> None:
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
            json={
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "text": text,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return
    send_mail(subject, text, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)