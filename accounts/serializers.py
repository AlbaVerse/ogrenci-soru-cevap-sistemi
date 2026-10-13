from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_email(self, value):
        value = value.strip().lower()
        allowed = getattr(settings, "ALLOWED_EMAIL_DOMAINS", [])
        if allowed and value.split("@")[-1] not in allowed:
            raise serializers.ValidationError("Bu e-posta alan adı ile kayıt yapılamaz.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Kod 6 haneli olmalıdır."})


class ResendCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


def user_payload(user) -> dict:
    return {"id": user.id, "email": user.email, "full_name": user.first_name}