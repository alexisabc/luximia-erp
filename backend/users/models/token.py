from django.conf import settings
from django.db import models
from django.utils import timezone
from core.models import BaseModel, register_audit

class EnrollmentToken(BaseModel):
    """
    Token de activación de cuenta (one-time).
    Utilizado para que nuevos usuarios configuren su seguridad al primer acceso.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="enrollment_tokens"
    )
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def __str__(self) -> str:
        return f"Token de activación para {self.user.username}"

register_audit(EnrollmentToken)
