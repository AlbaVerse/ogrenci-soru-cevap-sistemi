from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class OptionalTokenAuthentication(TokenAuthentication):
    """Geçerli token varsa kullanıcıyı bağlar, yoksa veya geçersizse anonim devam eder."""

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None