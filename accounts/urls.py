from django.urls import path
from accounts import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("verify-email/", views.VerifyEmailView.as_view(), name="verify-email"),
    path("resend-code/", views.ResendCodeView.as_view(), name="resend-code"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("me/", views.MeView.as_view(), name="me"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
]