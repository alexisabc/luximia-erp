# users/management/commands/create_and_invite_superuser.py
from datetime import timedelta
import hashlib
import os
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from luximia_erp.emails import send_mail
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction
from django.template.loader import render_to_string
from users.models import EnrollmentToken

class Command(BaseCommand):
    help = "Asegura que el superusuario exista y genera un nuevo enlace de inscripción."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        if not email:
            self.stdout.write(self.style.WARNING(
                "La variable de entorno DJANGO_SUPERUSER_EMAIL no está definida. Omitiendo."))
            return

        User = get_user_model()
        
        with transaction.atomic():
            # --- Paso 1: Crear o recuperar el superusuario ---
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': False
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

            # --- Paso 2: Crear o recuperar el rol de Administradores y asignarle todos los permisos ---
            admin_group, created_group = Group.objects.get_or_create(name='Administradores')

            if created_group:
                self.stdout.write(self.style.SUCCESS("Rol 'Administradores' creado."))
                all_permissions = Permission.objects.all()
                admin_group.permissions.set(all_permissions)
                self.stdout.write(self.style.SUCCESS("Todos los permisos asignados al rol 'Administradores'."))
            else:
                self.stdout.write(self.style.SUCCESS("El rol 'Administradores' ya existe."))
            
            # --- Paso 3: Asegurar que el superusuario pertenece a este rol ---
            if admin_group not in user.groups.all():
                user.groups.add(admin_group)
                self.stdout.write(self.style.SUCCESS(
                    f"Rol 'Administradores' asignado al superusuario {email}."))
            else:
                self.stdout.write(self.style.SUCCESS(
                    f"El superusuario {email} ya pertenece al rol 'Administradores'."))

            # --- Paso 4: Generar y enviar el token si el usuario no está activo ---
            if not user.is_active:
                EnrollmentToken.objects.filter(user=user).delete()
                token = secrets.token_urlsafe(32)
                token_hash = hashlib.sha256(token.encode()).hexdigest()
                expires_at = timezone.now() + timedelta(hours=24)
                EnrollmentToken.objects.create(
                    user=user, token_hash=token_hash, expires_at=expires_at)
                
                domain = settings.FRONTEND_DOMAIN
                protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
                enroll_url = f"{protocol}://{domain}/enroll/{token}"

                context = {"enroll_url": enroll_url}
                plain_message = render_to_string(
                    "users/welcome_invitation.txt", context
                )
                html_message = render_to_string(
                    "users/welcome_invitation.html", context
                )
                send_mail(
                    "Invitación para Administrador de Luximia ERP",
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                    html_message=html_message,
                )
                self.stdout.write(self.style.SUCCESS(
                    f"Invitación de superusuario enviada a {email}."))
            else:
                self.stdout.write(self.style.SUCCESS(
                    "El superusuario ya está activo. No se requiere enviar invitación."))
