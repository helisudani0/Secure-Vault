from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import CustomUser


def encrypted_key_bundle():
    return {
        "version": 1,
        "kdf": "PBKDF2",
        "hash": "SHA-256",
        "iterations": 390000,
        "salt": "c2FsdC1zYWx0LXNhbHQ=",
        "iv": "aXYtaXYtaXYtaXY=",
        "ciphertext": "Y2lwaGVydGV4dA==",
    }


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_stores_client_side_key_bundle_and_returns_tokens(self):
        response = self.client.post(
            reverse("signup"),
            {
                "username": "launch_user",
                "password": "StrongPass123!",
                "public_key": "A" * 512,
                "encrypted_private_key": encrypted_key_bundle(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        user = CustomUser.objects.get(username="launch_user")
        self.assertEqual(user.public_key, "A" * 512)
        self.assertEqual(user.encrypted_private_key["kdf"], "PBKDF2")

    def test_login_returns_profile_and_key_bundle(self):
        CustomUser.objects.create_user(
            username="daily_user",
            password="StrongPass123!",
            public_key="B" * 512,
            encrypted_private_key=encrypted_key_bundle(),
        )

        response = self.client.post(
            reverse("login"),
            {"username": "daily_user", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["username"], "daily_user")
        self.assertEqual(response.data["user"]["public_key"], "B" * 512)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        FRONTEND_URL="http://localhost:5173",
    )
    def test_email_verification_request_and_verify(self):
        user = CustomUser.objects.create_user(
            username="verify_user",
            password="StrongPass123!",
            email="verify@example.com",
            public_key="C" * 512,
            encrypted_private_key=encrypted_key_bundle(),
        )
        self.client.force_authenticate(user)

        request_response = self.client.post(reverse("request_email_verification"))
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertIn("verification_url", request_response.data)
        self.assertEqual(len(mail.outbox), 1)

        user.refresh_from_db()
        verify_response = self.client.post(
            reverse("verify_email"),
            {"token": user.email_verification_token},
            format="json",
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        FRONTEND_URL="http://localhost:5173",
    )
    def test_password_reset_requires_verified_email(self):
        user = CustomUser.objects.create_user(
            username="reset_user",
            password="StrongPass123!",
            email="reset@example.com",
            email_verified=True,
            public_key="D" * 512,
            encrypted_private_key=encrypted_key_bundle(),
        )

        request_response = self.client.post(
            reverse("request_password_reset"),
            {"email": "reset@example.com"},
            format="json",
        )
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertIn("reset_url", request_response.data)
        self.assertEqual(len(mail.outbox), 1)

        user.refresh_from_db()
        reset_response = self.client.post(
            reverse("reset_password"),
            {"token": user.password_reset_token, "new_password": "NewStrongPass123!"},
            format="json",
        )

        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("NewStrongPass123!"))
