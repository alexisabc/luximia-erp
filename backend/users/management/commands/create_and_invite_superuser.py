from datetime import timedelta
import hashlib
import os
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from users.models import EnrollmentToken


class Command(BaseCommand):
    """Create the initial superuser and send an enrollment link."""

    help = "Create the initial superuser and send an enrollment link"

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        if not email:
            return

        User = get_user_model()
        if User.objects.filter(email=email).exists():
            self.stdout.write(f"Superuser with email {email} already exists")
            return

        user = User(
            username=email,
            email=email,
            is_active=False,
            is_staff=True,
            is_superuser=True,
        )
        user.set_unusable_password()
        user.save()

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(hours=24)
        EnrollmentToken.objects.create(
            user=user, token_hash=token_hash, expires_at=expires_at
        )

        domain = getattr(settings, "FRONTEND_DOMAIN", "localhost:3000")
        enroll_url = f"https://{domain}/enroll/{token}"

        send_mail(
            "Superuser enrollment",
            (
                "You have been invited to become the superuser.\n"
                f"Use the following link to complete setup: {enroll_url}\n"
                "This link expires in 24 hours."
            ),
            None,
            [email],
            fail_silently=False,
        )

        self.stdout.write(f"Invitación de superusuario enviada a {email}")
