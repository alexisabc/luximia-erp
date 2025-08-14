# users/management/commands/create_and_invite_superuser.py

from datetime import timedelta
import hashlib
import os
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction


class Command(BaseCommand):
    help = "Asegura que el superusuario exista y genera un nuevo enlace de inscripción."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        if not email:
            self.stdout.write(self.style.WARNING(
                "La variable de entorno DJANGO_SUPERUSER_EMAIL no está definida. Omitiendo."))
            return

        User = get_user_model()

        try:
            with transaction.atomic():
                # --- PASO 1: Asegurar que el superusuario existe ---
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'is_staff': True,
                        'is_superuser': True,
                    }
                )

                if created:
                    user.set_unusable_password()
                    user.save()
                    self.stdout.write(self.style.SUCCESS(
                        f"Superusuario {email} creado."))
                else:
                    self.stdout.write(self.style.SUCCESS(
                        f"El superusuario {email} ya existe."))

                # --- PASO 2: Asegurar que el rol de Administrador exista y tenga todos los permisos ---
                admin_group, created_group = Group.objects.get_or_create(name='Administradores')

                if created_group:
                    self.stdout.write(self.style.SUCCESS("Rol 'Administradores' creado."))
                    all_permissions = Permission.objects.all()
                    admin_group.permissions.set(all_permissions)
                    self.stdout.write(self.style.SUCCESS("Todos los permisos asignados al rol 'Administradores'."))
                
                # --- PASO 3: Asignar el rol al superusuario ---
                if not user.groups.filter(name='Administradores').exists():
                    user.groups.add(admin_group)
                    self.stdout.write(self.style.SUCCESS(
                        f"Rol 'Administradores' asignado al superusuario {email}."))

                # --- PASO 4: Generar un nuevo token si el usuario aún no está activo ---
                if not user.is_active:
                    from users.models import EnrollmentToken
                    EnrollmentToken.objects.filter(user=user).delete()
                    token = secrets.token_urlsafe(32)
                    token_hash = hashlib.sha256(token.encode()).hexdigest()
                    expires_at = timezone.now() + timedelta(hours=24)
                    EnrollmentToken.objects.create(
                        user=user, token_hash=token_hash, expires_at=expires_at)
                    
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

        except Exception as e:
            raise CommandError(f"Ocurrió una excepción: {e}")