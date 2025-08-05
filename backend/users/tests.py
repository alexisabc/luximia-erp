from datetime import timedelta
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
