#users/models.py
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    """Base custom user model for passwordless authentication."""
    # Permitir auth sin password tradicional
    password = models.CharField(max_length=128, blank=True, null=True)

    # Passkeys guardadas como JSON
    passkey_credentials = models.JSONField(default=list, blank=True)

    # Secreto TOTP
    totp_secret = models.CharField(max_length=255, blank=True, null=True)

    # Usuario inactivo hasta completar seguridad
    is_active = models.BooleanField(default=False)


class EnrollmentToken(models.Model):
    """One-time enrollment token for activating new accounts."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollment_tokens"
    )
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def __str__(self) -> str:
        return f"Enrollment token for {self.user_id}"
