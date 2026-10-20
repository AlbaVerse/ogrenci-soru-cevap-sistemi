from django.urls import path
from accounts import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.RegisterView.as_view()),
    path("verify-email/", views.VerifyEmailView.as_view()),
    path("resend-verification/", views.ResendCodeView.as_view()),  # frontend'in çağırdığı yol
    path("resend-code/", views.ResendCodeView.as_view()),  # geriye dönük uyumluluk
    path("login/", views.LoginView.as_view()),
    path("me/", views.MeView.as_view()),
    path("logout/", views.LogoutView.as_view()),
]
