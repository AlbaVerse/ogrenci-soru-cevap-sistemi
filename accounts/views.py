import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import Throttled
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.emails import send_verification_email
from accounts.exceptions import ApiError
from accounts.models import EmailVerification
from accounts.serializers import (
    LoginSerializer, RegisterSerializer, ResendCodeSerializer,
    VerifyEmailSerializer, user_payload,
)

logger = logging.getLogger(__name__)
User = get_user_model()


def _find_user(email: str):
    return User.objects.filter(username=email).first() or User.objects.filter(email=email).first()


def _issue_and_send(user) -> None:
    existing = getattr(user, "email_verification", None)
    if existing and existing.seconds_until_resend() > 0:
        raise Throttled(wait=existing.seconds_until_resend())
    code = EmailVerification.issue(user)
    try:
        send_verification_email(user.email, code)
    except Exception as exc:
        logger.exception("Doğrulama maili gönderilemedi: %s", user.email)
        raise ApiError(503, "email_delivery_failed",
                       "Doğrulama e-postası gönderilemedi. Lütfen biraz sonra tekrar deneyin.") from exc


class _PublicAuthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RegisterView(_PublicAuthView):
    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        user = _find_user(d["email"])
        if user and user.is_active:
            raise ApiError(409, "email_taken", "Bu e-posta ile kayıtlı bir hesap var. Giriş yapabilirsin.")
        if user is None:
            user = User(username=d["email"], email=d["email"])
        else:
            # Doğrulanmamış hesaba yeniden kayıt: bekleme süresi dolmadan hiçbir alan değiştirilmez
            # (aksi halde sürekli yeniden kayıtla başkasının bekleyen hesabının şifresi ezilebilir).
            pending = getattr(user, "email_verification", None)
            if pending and pending.seconds_until_resend() > 0:
                raise Throttled(wait=pending.seconds_until_resend())

        user.first_name, user.last_name = d["first_name"], d["last_name"]
        user.set_password(d["password"])
        # E-posta doğrulaması zorunluysa hesap, kod girilene kadar pasif kalır.
        user.is_active = not settings.EMAIL_VERIFICATION_REQUIRED
        user.save()

        if settings.EMAIL_VERIFICATION_REQUIRED:
            _issue_and_send(user)
            return Response(
                {"detail": "Doğrulama kodu e-posta adresinize gönderildi.", "email": user.email,
                 "verification_required": True},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"detail": "Hesap oluşturuldu. Giriş yapabilirsiniz.", "email": user.email,
             "verification_required": False},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(_PublicAuthView):
    def post(self, request):
        s = VerifyEmailSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"].strip().lower()

        user = _find_user(email)
        ev = getattr(user, "email_verification", None) if user else None
        if not ev or not ev.verify(s.validated_data["code"]):
            raise ApiError(400, "invalid_code", "Kod geçersiz veya süresi dolmuş.")

        user.is_active = True
        user.save(update_fields=["is_active"])
        ev.delete()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": user_payload(user)})


class ResendCodeView(_PublicAuthView):
    def post(self, request):
        s = ResendCodeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"].strip().lower()
        user = User.objects.filter(username=email, is_active=False).first()
        if user:
            _issue_and_send(user)
        # Hesap varlığını sızdırmamak için her durumda aynı yanıt.
        return Response({"detail": "Kayıtlı ve doğrulanmamış bir hesap varsa yeni kod gönderildi."})


class LoginView(_PublicAuthView):
    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]

        user = _find_user(email)
        if not user or not user.check_password(s.validated_data["password"]):
            raise ApiError(401, "invalid_credentials", "E-posta veya şifre hatalı.")
        if not user.is_active:
            if hasattr(user, "email_verification"):
                raise ApiError(403, "email_not_verified", "E-posta adresiniz henüz doğrulanmadı.")
            raise ApiError(403, "account_disabled", "Hesap devre dışı.")

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": user_payload(user)})


class MeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(user_payload(request.user))


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
