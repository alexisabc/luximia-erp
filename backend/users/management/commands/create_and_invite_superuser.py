# users/management/commands/create_and_invite_superuser.py
from datetime import timedelta
import hashlib
import os
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction  # 1. Importa transaction
from users.models import EnrollmentToken


class Command(BaseCommand):
    """Crea el superusuario inicial y envía un enlace de inscripción por correo."""
    help = "Crea el superusuario inicial y envía un enlace de inscripción por correo."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        if not email:
            self.stdout.write(self.style.WARNING(
                "La variable de entorno DJANGO_SUPERUSER_EMAIL no está definida. Omitiendo."))
            return

        User = get_user_model()
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(
                f"El superusuario con el correo {email} ya existe."))
            return

        try:
            # 2. Envuelve la lógica de creación en una transacción atómica
            with transaction.atomic():
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
        except Exception as e:
            raise CommandError(f"No se pudo crear el usuario y el token: {e}")

        domain = settings.FRONTEND_DOMAIN
        protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
        enroll_url = f"{protocol}://{domain}/enroll/{token}"

        send_mail(
            "Invitación para Administrador de Luximia ERP",
            (
                "Has sido invitado para ser el superusuario de la plataforma Luximia ERP.\n\n"
                f"Usa el siguiente enlace para completar tu registro: {enroll_url}\n\n"
                "Este enlace expira en 24 horas."
            ),
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        self.stdout.write(self.style.SUCCESS(
            f"Invitación de superusuario enviada a {email}."))
