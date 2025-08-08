from datetime import timedelta
import hashlib
import json
import os
from unittest.mock import patch

from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from users.models import CustomUser, EnrollmentToken


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_DOMAIN="testdomain.com",
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
)
class CreateAndInviteSuperuserTests(TestCase):
    def test_creates_superuser_and_sends_invite(self):
        email = "admin@example.com"
        with patch.dict(os.environ, {"DJANGO_SUPERUSER_EMAIL": email}):
            call_command("create_and_invite_superuser")

        user = CustomUser.objects.get(email=email)
        self.assertFalse(user.is_active)
        self.assertTrue(user.is_superuser)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("https://testdomain.com/enroll/", mail.outbox[0].body)

        token = EnrollmentToken.objects.get(user=user)
        expires_in = token.expires_at - timezone.now()
        self.assertTrue(timedelta(hours=23) < expires_in < timedelta(hours=25))

    def test_existing_superuser_no_duplicate(self):
        email = "admin@example.com"
        CustomUser.objects.create(
            username=email,
            email=email,
            is_superuser=True,
            is_staff=True,
        )
        with patch.dict(os.environ, {"DJANGO_SUPERUSER_EMAIL": email}):
            call_command("create_and_invite_superuser")

        self.assertEqual(CustomUser.objects.filter(email=email).count(), 1)
        self.assertEqual(EnrollmentToken.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_no_email_env_var(self):
        call_command("create_and_invite_superuser")
        self.assertEqual(CustomUser.objects.count(), 0)
        self.assertEqual(EnrollmentToken.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)


@override_settings(
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
)
class EnrollmentValidationViewTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create(
            username="testuser", email="test@example.com", is_active=False
        )

    def test_enrollment_token_validation_flow(self):
        token = "validtoken"
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        EnrollmentToken.objects.create(
            user=self.user,
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(hours=1),
        )

        url = "/api/users/enrollment/validate/"
        response = self.client.post(
            url, data=json.dumps({"token": token}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("detail"), "Token válido")
        self.assertFalse(EnrollmentToken.objects.filter(token_hash=token_hash).exists())

        response2 = self.client.post(
            url, data=json.dumps({"token": token}), content_type="application/json"
        )
        self.assertEqual(response2.status_code, 400)
        self.assertEqual(response2.json().get("detail"), "Token inválido")
