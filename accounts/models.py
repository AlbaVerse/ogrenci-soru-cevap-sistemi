import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

CODE_TTL = timedelta(minutes=10)
MAX_ATTEMPTS = 5
RESEND_COOLDOWN = timedelta(seconds=60)


def hash_code(code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), code.encode(), hashlib.sha256).hexdigest()


class EmailVerification(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_verification"
    )
    code_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    last_sent_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "email_verification"

    @classmethod
    def issue(cls, user) -> str:
        code = f"{secrets.randbelow(10**6):06d}"
        now = timezone.now()
        cls.objects.update_or_create(
            user=user,
            defaults={
                "code_hash": hash_code(code),
                "expires_at": now + CODE_TTL,
                "attempts": 0,
                "last_sent_at": now,
            },
        )
        return code

    def seconds_until_resend(self) -> int:
        remaining = (self.last_sent_at + RESEND_COOLDOWN) - timezone.now()
        return max(0, int(remaining.total_seconds()))

    def verify(self, code: str) -> bool:
        if timezone.now() > self.expires_at or self.attempts >= MAX_ATTEMPTS:
            return False
        self.attempts += 1
        self.save(update_fields=["attempts"])
        return hmac.compare_digest(self.code_hash, hash_code(code))