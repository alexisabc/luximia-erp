# users/management/commands/create_and_invite_superuser.py
from datetime import timedelta
import hashlib
import os
import secrets

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import connections, transaction
from django.db.migrations.executor import MigrationExecutor
from django.db.utils import OperationalError, ProgrammingError
from django.template.loader import render_to_string

class Command(BaseCommand):
    help = "Asegura que el superusuario exista y genera un nuevo enlace de inscripción."

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from django.contrib.auth.models import Group, Permission
        from config.emails import send_mail
        from users.models import EnrollmentToken
        from users.utils import build_enrollment_email_context

        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        first_name = os.getenv("DJANGO_SUPERUSER_FIRST_NAME", "").strip()
        last_name = os.getenv("DJANGO_SUPERUSER_LAST_NAME", "").strip()
        if not email:
            self.stdout.write(self.style.WARNING(
                "La variable de entorno DJANGO_SUPERUSER_EMAIL no está definida. Omitiendo."))
            return

        if not first_name:
            self.stdout.write(self.style.WARNING(
                "La variable de entorno DJANGO_SUPERUSER_FIRST_NAME no está definida. Se utilizará un valor vacío."))

        if not last_name:
            self.stdout.write(self.style.WARNING(
                "La variable de entorno DJANGO_SUPERUSER_LAST_NAME no está definida. Se utilizará un valor vacío."))

        User = get_user_model()
        self._ensure_migrations()

        with transaction.atomic():
            # --- Paso 1: Crear o recuperar el superusuario ---
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': first_name,
                    'last_name': last_name,
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

            updated_fields = []
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                updated_fields.append('first_name')
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                updated_fields.append('last_name')

            if updated_fields:
                user.save(update_fields=updated_fields)
                self.stdout.write(self.style.SUCCESS(
                    f"Información del superusuario actualizada: {', '.join(updated_fields)}."))

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
                token = secrets.token_hex(32)
                token_hash = hashlib.sha256(token.encode()).hexdigest()
                expires_at = timezone.now() + timedelta(hours=24)
                EnrollmentToken.objects.create(
                    user=user, token_hash=token_hash, expires_at=expires_at)
                
                domain = settings.FRONTEND_DOMAIN
                protocol = "https" if not settings.DEVELOPMENT_MODE else "http"
                enroll_url = f"{protocol}://{domain}/enroll/{token}"

                context = build_enrollment_email_context(
                    enroll_url,
                    user=user,
                    extra_context={
                        "first_name": user.first_name or first_name,
                        "last_name": user.last_name or last_name,
                    },
                )
                plain_message = render_to_string(
                    "users/welcome_invitation.txt", context
                )
                html_message = render_to_string(
                    "users/enrollment_email.html", context
                )
                try:
                    emails_sent = send_mail(
                        "Invitación para Administrador de Luximia ERP",
                        plain_message,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                        html_message=html_message,
                    )
                    if emails_sent > 0:
                         self.stdout.write(self.style.SUCCESS(
                            f"Invitación de superusuario enviada a {email}."))
                    else:
                        raise Exception("SendGrid reportó 0 correos enviados")

                except Exception as e:
                    # SEGURIDAD: No imprimir el token en logs.
                    error_str = str(e)
                    if "Unauthorized" in error_str:
                         self.stdout.write(self.style.WARNING("⚠️  Resend API Key inválida o no configurada (401 Unauthorized). El correo no se envió."))
                    else:
                        self.stdout.write(self.style.ERROR(f"❌ FALLÓ EL ENVÍO DE CORREO: {error_str}"))
                    self.stdout.write(self.style.WARNING(
                        "⚠️  El superusuario existe pero el correo falló. "
                        "Usa 'python manage.py get_enrollment_link' via SSH/Consola para obtener el link seguro."
                    ))
                    # No lanzamos raise para no romper el boot del contenedor, pero avisamos.
                    pass
            else:
                self.stdout.write(self.style.SUCCESS(
                    "El superusuario ya está activo. No se requiere enviar invitación."))

    def _ensure_migrations(self):
        """Aplica migraciones pendientes antes de acceder a la base de datos."""
        connection = connections["default"]
        try:
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        except (OperationalError, ProgrammingError):
            plan = True

        if plan:
            self.stdout.write("Aplicando migraciones pendientes antes de crear el superusuario...")
            call_command("migrate", interactive=False)
