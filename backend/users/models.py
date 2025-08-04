from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    """Base custom user model for passwordless authentication."""

    # Disable password-based authentication by allowing blank values
    password = models.CharField(max_length=128, blank=True, null=True)

    # Passkey credentials stored as JSON
    passkey_credentials = models.JSONField(default=list, blank=True)

    # Time-based one-time password secret
    totp_secret = models.CharField(max_length=255, blank=True, null=True)

    # Users remain inactive until security setup is complete
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

    def __str__(self) -> str:  # pragma: no cover - simple representation
        return f"Enrollment token for {self.user_id}"

