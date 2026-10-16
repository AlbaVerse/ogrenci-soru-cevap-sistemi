from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
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
        if not attrs.get("full_name"):
            first = attrs.get("first_name", "").strip()
            last = attrs.get("last_name", "").strip()
            full = f"{first} {last}".strip()
            attrs["full_name"] = full or "Kullanici"
        return attrs

    def validate_email(self, value):
        value = value.strip().lower()
        allowed = getattr(settings, "ALLOWED_EMAIL_DOMAINS", [])
        if allowed and value.split("@")[-1] not in allowed:
            raise serializers.ValidationError("Bu e-posta alan adi ile kayit yapilamaz.")
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
    email = serializers.EmailField(max_length=150)
    password = serializers.CharField(write_only=True)


def user_payload(user) -> dict:
    return {"id": user.id, "email": user.email, "full_name": user.first_name}