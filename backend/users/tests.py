from datetime import timedelta
import hashlib
import json
import os
from unittest.mock import patch

from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from users.models import CustomUser, EnrollmentToken


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_DOMAIN="testdomain.com",
    # --- CORRECCIÓN 1: Usar el motor de SQLite para pruebas en memoria ---
    DATABASES={"default": {
        "ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
)
class CreateAndInviteSuperuserTests(TestCase):
    def test_creates_superuser_and_sends_invite(self):
        """Prueba que el comando cree un superusuario y envíe una invitación."""
        email = "admin@example.com"
        with patch.dict(os.environ, {"DJANGO_SUPERUSER_EMAIL": email}):
            call_command("create_and_invite_superuser")

        # Verificar que el usuario se creó correctamente
        user = CustomUser.objects.get(email=email)
        self.assertFalse(user.is_active)
        self.assertTrue(user.is_superuser)

        # Verificar que se creó un token
        token = EnrollmentToken.objects.get(user=user)
        expires_in = token.expires_at - timezone.now()
        self.assertTrue(timedelta(hours=23) < expires_in < timedelta(hours=25))

        # Verificar que se envió un correo con el enlace correcto
        self.assertEqual(len(mail.outbox), 1)
        # --- CORRECCIÓN: Se ajusta a http ya que no es un entorno de producción ---
        self.assertIn("http://testdomain.com/enroll/", mail.outbox[0].body)

    def test_existing_superuser_gets_new_invite(self):
        """
        --- PRUEBA ACTUALIZADA ---
        Prueba que si un superusuario ya existe, se le genera un nuevo token y
        se le envía una nueva invitación.
        """
        email = "admin@example.com"
        # Creamos el usuario y un token antiguo primero
        user = CustomUser.objects.create_superuser(
            username=email, email=email, password="password")
        EnrollmentToken.objects.create(
            user=user,
            token_hash="old_hash",
            expires_at=timezone.now() + timedelta(hours=1)
        )

        with patch.dict(os.environ, {"DJANGO_SUPERUSER_EMAIL": email}):
            call_command("create_and_invite_superuser")

        # Verificar que no se creó un usuario duplicado
        self.assertEqual(CustomUser.objects.filter(email=email).count(), 1)

        # Verificar que ahora solo existe UN token (el nuevo) y no es el antiguo
        self.assertEqual(EnrollmentToken.objects.count(), 1)
        self.assertNotEqual(
            EnrollmentToken.objects.get().token_hash, "old_hash")

        # Verificar que se envió un nuevo correo
        self.assertEqual(len(mail.outbox), 1)

    def test_no_email_env_var(self):
        """Prueba que el comando no haga nada si la variable de entorno no está definida."""
        # --- CORRECCIÓN: Aseguramos que la variable no exista durante la prueba ---
        with patch.dict(os.environ, {}, clear=True):
            call_command("create_and_invite_superuser")

        self.assertEqual(CustomUser.objects.count(), 0)
        self.assertEqual(EnrollmentToken.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)


@override_settings(
    # --- CORRECCIÓN 2: Usar el motor de SQLite para pruebas en memoria ---
    DATABASES={"default": {
        "ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
)
class EnrollmentValidationViewTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create(
            username="testuser", email="test@example.com", is_active=False
        )

    def test_enrollment_token_validation_flow(self):
        """Prueba el flujo completo de validación de un token."""
        token = "validtoken"
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        EnrollmentToken.objects.create(
            user=self.user,
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(hours=1),
        )

        url = "/api/users/enrollment/validate/"

        # Primer intento: debe ser exitoso y borrar el token
        response = self.client.post(
            url, data=json.dumps({"token": token}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("detail"), "Token válido")
        self.assertFalse(EnrollmentToken.objects.filter(
            token_hash=token_hash).exists())

        # Segundo intento con el mismo token: debe fallar
        response2 = self.client.post(
            url, data=json.dumps({"token": token}), content_type="application/json"
        )
        self.assertEqual(response2.status_code, 400)
        self.assertEqual(response2.json().get("detail"), "Token inválido")
