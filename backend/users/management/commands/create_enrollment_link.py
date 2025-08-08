# users/management/commands/create_enrollment_link.py
from datetime import timedelta
import hashlib
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction
from users.models import EnrollmentToken


class Command(BaseCommand):
    help = "Asegura que un usuario exista y genera un nuevo enlace de inscripción."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True,
                            help="Email del usuario.")
        parser.add_argument("--is-superuser", action="store_true",
                            help="Marcar al usuario como superusuario.")

    def handle(self, *args, **options):
        email = options["email"]
        is_superuser = options["is_superuser"]
        User = get_user_model()
        token = ""

        try:
            with transaction.atomic():
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'is_staff': is_superuser,
                        'is_superuser': is_superuser,
                    }
                )

                if created:
                    user.set_unusable_password()
                    user.save()
                    self.stdout.write(self.style.SUCCESS(
                        f"Usuario {email} creado."))
                else:
                    self.stdout.write(self.style.SUCCESS(
                        f"El usuario {email} ya existe. Se generará un nuevo enlace."))

                EnrollmentToken.objects.filter(user=user).delete()
                token = secrets.token_urlsafe(32)
                token_hash = hashlib.sha256(token.encode()).hexdigest()
                expires_at = timezone.now() + timedelta(hours=24)
                EnrollmentToken.objects.create(
                    user=user, token_hash=token_hash, expires_at=expires_at)
        except Exception as e:
            raise CommandError(f"Ocurrió una excepción: {e}")

        domain = settings.FRONTEND_DOMAIN
        protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
        enroll_url = f"{protocol}://{domain}/enroll/{token}"

        self.stdout.write(self.style.SUCCESS(
            "Enlace de inscripción generado con éxito:"))
        self.stdout.write(enroll_url)
