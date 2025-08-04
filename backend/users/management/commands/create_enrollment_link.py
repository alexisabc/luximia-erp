from datetime import timedelta
import hashlib
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from users.models import EnrollmentToken


class Command(BaseCommand):
    help = "Create an enrollment link for a new user"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Email of the user to create")
        parser.add_argument(
            "--is-superuser",
            action="store_true",
            help="Create the user as a superuser",
        )

    def handle(self, *args, **options):
        email = options["email"]
        is_superuser = options["is_superuser"]

        User = get_user_model()
        if User.objects.filter(email=email).exists():
            raise CommandError("User with this email already exists")

        user = User(
            username=email,
            email=email,
            is_active=False,
            is_staff=is_superuser,
            is_superuser=is_superuser,
        )
        user.set_unusable_password()
        user.save()

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = timezone.now() + timedelta(hours=1)
        EnrollmentToken.objects.create(
            user=user, token_hash=token_hash, expires_at=expires_at
        )

        domain = getattr(settings, "FRONTEND_DOMAIN", "your-domain.com")
        self.stdout.write(f"https://{domain}/enroll/{token}")
