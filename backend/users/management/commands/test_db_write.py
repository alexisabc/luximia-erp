# users/management/commands/test_db_write.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import EnrollmentToken  # <-- Importamos el modelo del token
from datetime import timedelta
import hashlib
import secrets
from django.utils import timezone


class Command(BaseCommand):
    help = 'A simple command to test writing both User and EnrollmentToken.'

    def handle(self, *args, **options):
        User = get_user_model()
        email_to_test = 'test@test.com'

        self.stdout.write(f"--- INICIANDO PRUEBA DE ESCRITURA COMPLETA ---")

        # Primero, borramos el usuario de prueba si existe para empezar de cero
        User.objects.filter(email=email_to_test).delete()
        self.stdout.write(
            f"Limpiando usuario de prueba '{email_to_test}' si existía.")

        try:
            with transaction.atomic():
                # 1. Creamos el usuario
                self.stdout.write(f"Creando usuario '{email_to_test}'...")
                user = User.objects.create_user(
                    username=email_to_test,
                    email=email_to_test
                )
                self.stdout.write(self.style.SUCCESS(
                    f"Usuario creado con ID: {user.id}"))

                # 2. Creamos el token para ese usuario
                self.stdout.write(
                    f"Creando token para el usuario {user.id}...")
                token = secrets.token_urlsafe(32)
                token_hash = hashlib.sha256(token.encode()).hexdigest()
                expires_at = timezone.now() + timedelta(hours=24)
                EnrollmentToken.objects.create(
                    user=user, token_hash=token_hash, expires_at=expires_at
                )
                self.stdout.write(self.style.SUCCESS(
                    "Token creado exitosamente."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"Ocurrió una excepción durante la operación: {e}"))
            return

        # Verificación final desde Django
        user_count = User.objects.filter(email=email_to_test).count()
        token_count = EnrollmentToken.objects.filter(
            user__email=email_to_test).count()

        self.stdout.write(f"\n--- Verificación Final ---")
        self.stdout.write(
            f"Conteo de usuarios '{email_to_test}': {user_count}")
        self.stdout.write(
            f"Conteo de tokens para '{email_to_test}': {token_count}")

        if user_count > 0 and token_count > 0:
            self.stdout.write(self.style.SUCCESS(
                "VERIFICACIÓN OK: ¡Ambos objetos se guardaron correctamente!"))
        else:
            self.stdout.write(self.style.ERROR(
                "VERIFICACIÓN FALLIDA: La transacción se revirtió."))
