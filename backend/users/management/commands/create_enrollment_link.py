# users/management/commands/create_enrollment_link.py
from datetime import timedelta
import hashlib
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from users.models import EnrollmentToken


class Command(BaseCommand):
    """Crea manualmente un enlace de inscripción para un nuevo usuario."""
    help = "Crea un enlace de inscripción para un nuevo usuario"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True,
                            help="Email del usuario a crear")
        parser.add_argument(
            "--is-superuser",
            action="store_true",
            help="Crear al usuario como superusuario",
        )

    def handle(self, *args, **options):
        email = options["email"]
        is_superuser = options["is_superuser"]
        User = get_user_model()

        if User.objects.filter(email=email).exists():
            raise CommandError(f"Un usuario con el correo {email} ya existe.")

        try:
            # La transacción es manejada automáticamente por Django para los comandos.
            # No es necesario el bloque 'with transaction.atomic()'.
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
            expires_at = timezone.now() + timedelta(hours=24)
            EnrollmentToken.objects.create(
                user=user, token_hash=token_hash, expires_at=expires_at
            )
        except Exception as e:
            # Si algo falla, la transacción automática de Django se deshará (rollback).
            raise CommandError(f"No se pudo crear el usuario y el token: {e}")

        domain = settings.FRONTEND_DOMAIN
        protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
        enroll_url = f"{protocol}://{domain}/enroll/{token}"

        self.stdout.write(self.style.SUCCESS(
            "Enlace de inscripción creado con éxito:"))
        self.stdout.write(enroll_url)
