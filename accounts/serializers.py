from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    requested_role = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate(self, attrs):
        first = (attrs.get("first_name") or "").strip()
        last = (attrs.get("last_name") or "").strip()
        if not first and not last:
            parts = (attrs.get("full_name") or "").strip().split(None, 1)
            first, last = (parts + ["", ""])[:2] if parts else ("Kullanıcı", "")
        attrs["first_name"], attrs["last_name"] = first, last
        return attrs

    def validate_email(self, value):
        value = value.strip().lower()
        allowed = getattr(settings, "ALLOWED_EMAIL_DOMAINS", [])
        if allowed and value.rsplit("@", 1)[-1] not in allowed:
            raise serializers.ValidationError(
                f"Yalnızca okul e-postası ile kayıt olunabilir ({', '.join('@' + d for d in allowed)})."
            )
        return value

    def validate_password(self, value):
        validate_password(value)
        return value


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=150)
    code = serializers.CharField(min_length=6, max_length=6)


class ResendCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=150)


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(max_length=150, required=False)
    username = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        ident = attrs.get("email") or attrs.get("username")
        if not ident:
            raise serializers.ValidationError({"email": ["E-posta gereklidir."]})
        attrs["email"] = ident.strip().lower()
        return attrs


def user_payload(user) -> dict:
    """Frontend `mapUser` (snake_case) ile birebir uyumlu kullanıcı nesnesi."""
    role = "admin" if user.is_superuser else "staff" if user.is_staff else "student"
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}".strip(),
        "role": role,
        "email_verified": user.is_active,
        "staff_approval_status": None,
        "created_at": user.date_joined.isoformat() if user.date_joined else None,
    }
