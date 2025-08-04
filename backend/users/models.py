from django.contrib.auth.models import AbstractUser
from django.db import models


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

