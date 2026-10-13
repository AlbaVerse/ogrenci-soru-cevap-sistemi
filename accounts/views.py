import logging

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import APIException, Throttled
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.emails import send_verification_email
from accounts.models import EmailVerification
from accounts.serializers import (
    LoginSerializer, RegisterSerializer, ResendCodeSerializer,
    VerifyEmailSerializer, user_payload,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class EmailDeliveryError(APIException):
    status_code = 503
    default_detail = "Doğrulama e-postası gönderilemedi. Lütfen biraz sonra tekrar deneyin."
    default_code = "email_delivery_failed"


def _issue_and_send(user) -> None:
    existing = getattr(user, "email_verification", None)
    if existing and existing.seconds_until_resend() > 0:
        raise Throttled(wait=existing.seconds_until_resend())
    code = EmailVerification.issue(user)
    try:
        send_verification_email(user.email, code)
    except Exception:
        logger.exception("Doğrulama maili gönderilemedi: %s", user.email)
        raise EmailDeliveryError()


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

        user = User.objects.filter(username=d["email"]).first()
        if user and user.is_active:
            return Response({"email": ["Bu e-posta adresi zaten kayıtlı."]}, status=400)
        if user is None:
            user = User(username=d["email"], email=d["email"])
        user.first_name = d["full_name"]
        user.set_password(d["password"])
        user.is_active = False
        user.save()

        _issue_and_send(user)
        return Response(
            {"detail": "Doğrulama kodu e-posta adresinize gönderildi.", "email": user.email},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(_PublicAuthView):
    def post(self, request):
        s = VerifyEmailSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"].strip().lower()

        user = User.objects.filter(username=email).first()
        ev = getattr(user, "email_verification", None) if user else None
        if not ev or not ev.verify(s.validated_data["code"]):
            return Response({"detail": "Kod geçersiz veya süresi dolmuş."}, status=400)

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
        if user and hasattr(user, "email_verification"):
            _issue_and_send(user)
        return Response({"detail": "Kayıtlı ve doğrulanmamış bir hesap varsa yeni kod gönderildi."})


class LoginView(_PublicAuthView):
    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"].strip().lower()

        user = User.objects.filter(username=email).first()
        if not user or not user.check_password(s.validated_data["password"]):
            return Response({"detail": "E-posta veya şifre hatalı."}, status=400)
        if not user.is_active:
            if hasattr(user, "email_verification"):
                return Response(
                    {"detail": "E-posta adresiniz henüz doğrulanmadı.", "code": "email_not_verified"},
                    status=403,
                )
            return Response({"detail": "Hesap devre dışı."}, status=403)

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