[1mdiff --git a/accounts/views.py b/accounts/views.py[m
[1mindex 64f8635..e2b09f3 100644[m
[1m--- a/accounts/views.py[m
[1m+++ b/accounts/views.py[m
[36m@@ -1,4 +1,4 @@[m
[31m-import logging[m
[32m+[m[32m﻿import logging[m
 [m
 from django.contrib.auth import get_user_model[m
 from rest_framework import status[m
[36m@@ -23,7 +23,7 @@[m [mUser = get_user_model()[m
 [m
 class EmailDeliveryError(APIException):[m
     status_code = 503[m
[31m-    default_detail = "Doğrulama e-postası gönderilemedi. Lütfen biraz sonra tekrar deneyin."[m
[32m+[m[32m    default_detail = "DoÄŸrulama e-postasÄ± gÃ¶nderilemedi. LÃ¼tfen biraz sonra tekrar deneyin."[m
     default_code = "email_delivery_failed"[m
 [m
 [m
[36m@@ -35,7 +35,7 @@[m [mdef _issue_and_send(user) -> None:[m
     try:[m
         send_verification_email(user.email, code)[m
     except Exception:[m
[31m-        logger.exception("Doğrulama maili gönderilemedi: %s", user.email)[m
[32m+[m[32m        logger.exception("DoÄŸrulama maili gÃ¶nderilemedi: %s", user.email)[m
         raise EmailDeliveryError()[m
 [m
 [m
[36m@@ -54,7 +54,7 @@[m [mclass RegisterView(_PublicAuthView):[m
 [m
         user = User.objects.filter(username=d["email"]).first()[m
         if user and user.is_active:[m
[31m-            return Response({"email": ["Bu e-posta adresi zaten kayıtlı."]}, status=400)[m
[32m+[m[32m            return Response({"email": ["Bu e-posta adresi zaten kayÄ±tlÄ±."]}, status=400)[m
         if user is None:[m
             user = User(username=d["email"], email=d["email"])[m
         user.first_name = d["full_name"][m
[36m@@ -64,7 +64,7 @@[m [mclass RegisterView(_PublicAuthView):[m
 [m
         _issue_and_send(user)[m
         return Response([m
[31m-            {"detail": "Doğrulama kodu e-posta adresinize gönderildi.", "email": user.email},[m
[32m+[m[32m            {"detail": "DoÄŸrulama kodu e-posta adresinize gÃ¶nderildi.", "email": user.email},[m
             status=status.HTTP_201_CREATED,[m
         )[m
 [m
[36m@@ -78,7 +78,7 @@[m [mclass VerifyEmailView(_PublicAuthView):[m
         user = User.objects.filter(username=email).first()[m
         ev = getattr(user, "email_verification", None) if user else None[m
         if not ev or not ev.verify(s.validated_data["code"]):[m
[31m-            return Response({"detail": "Kod geçersiz veya süresi dolmuş."}, status=400)[m
[32m+[m[32m            return Response({"detail": "Kod geÃ§ersiz veya sÃ¼resi dolmuÅŸ."}, status=400)[m
 [m
         user.is_active = True[m
         user.save(update_fields=["is_active"])[m
[36m@@ -95,7 +95,7 @@[m [mclass ResendCodeView(_PublicAuthView):[m
         user = User.objects.filter(username=email, is_active=False).first()[m
         if user and hasattr(user, "email_verification"):[m
             _issue_and_send(user)[m
[31m-        return Response({"detail": "Kayıtlı ve doğrulanmamış bir hesap varsa yeni kod gönderildi."})[m
[32m+[m[32m        return Response({"detail": "KayÄ±tlÄ± ve doÄŸrulanmamÄ±ÅŸ bir hesap varsa yeni kod gÃ¶nderildi."})[m
 [m
 [m
 class LoginView(_PublicAuthView):[m
[36m@@ -106,14 +106,14 @@[m [mclass LoginView(_PublicAuthView):[m
 [m
         user = User.objects.filter(username=email).first()[m
         if not user or not user.check_password(s.validated_data["password"]):[m
[31m-            return Response({"detail": "E-posta veya şifre hatalı."}, status=400)[m
[32m+[m[32m            return Response({"detail": "E-posta veya ÅŸifre hatalÄ±."}, status=400)[m
         if not user.is_active:[m
             if hasattr(user, "email_verification"):[m
                 return Response([m
[31m-                    {"detail": "E-posta adresiniz henüz doğrulanmadı.", "code": "email_not_verified"},[m
[32m+[m[32m                    {"detail": "E-posta adresiniz henÃ¼z doÄŸrulanmadÄ±.", "code": "email_not_verified"},[m
                     status=403,[m
                 )[m
[31m-            return Response({"detail": "Hesap devre dışı."}, status=403)[m
[32m+[m[32m            return Response({"detail": "Hesap devre dÄ±ÅŸÄ±."}, status=403)[m
 [m
         token, _ = Token.objects.get_or_create(user=user)[m
         return Response({"token": token.key, "user": user_payload(user)})[m
