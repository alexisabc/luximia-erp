# users/management/commands/create_and_invite_superuser.py
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
    """Crea el superusuario inicial desde variables de entorno y envía un enlace de inscripción."""
    help = "Crea el superusuario inicial y envía un enlace de inscripción por correo."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        if not email:
            self.stdout.write(self.style.WARNING("La variable de entorno DJANGO_SUPERUSER_EMAIL no está definida. Omitiendo."))
            return

        User = get_user_model()
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(f"El superusuario con el correo {email} ya existe."))
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

        domain = settings.FRONTEND_DOMAIN
        # Asegúrate de usar http para desarrollo local
        protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
        enroll_url = f"{protocol}://{domain}/enroll/{token}"

        send_mail(
            "Invitación para Administrador de Luximia ERP",
            (
                "Has sido invitado para ser el superusuario de la plataforma Luximia ERP.\n\n"
                f"Usa el siguiente enlace para completar tu registro: {enroll_url}\n\n"
                "Este enlace expira en 24 horas."
            ),
            settings.DEFAULT_FROM_EMAIL, # Usa el remitente por defecto
            [email],
            fail_silently=False,
        )

        self.stdout.write(self.style.SUCCESS(f"Invitación de superusuario enviada a {email}."))