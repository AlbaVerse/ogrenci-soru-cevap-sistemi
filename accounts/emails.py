import logging
import requests
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, code: str) -> None:
    subject = "AlbaVerse e-posta dogrulama kodu"
    text = (
        f"AlbaVerse dogrulama kodunuz: {code}\n\n"
        "Bu kod 10 dakika gecerlidir. Bu islemi siz yapmadiysaniz bu e-postayi yok sayin."
    )
    api_key = getattr(settings, "RESEND_API_KEY", "")
    if api_key:
        try:
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
            if not resp.ok:
                logger.error("Resend API hatasi [%s]: %s", resp.status_code, resp.text)
                if getattr(settings, "DEBUG", False):
                    logger.info("DEBUG: Test dogrulama kodu: %s", code)
            resp.raise_for_status()
            return
        except Exception as exc:
            logger.warning("E-posta servisi cagrılamadı (%s): %s", to_email, exc)
            return

    send_mail(subject, text, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=True)
