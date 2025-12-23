#users/models.py
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from core.models import BaseModel, register_audit


class CustomUser(AbstractUser, BaseModel):
    """Base custom user model for passwordless authentication."""
    # Permitir auth sin password tradicional
    password = models.CharField(max_length=128, blank=True, null=True)

    # Passkeys guardadas como JSON
    passkey_credentials = models.JSONField(default=list, blank=True)
    # Proveedor de la passkey (ej. Nordpass)
    passkey_provider = models.CharField(max_length=100, blank=True, null=True)

    # Secreto TOTP
    totp_secret = models.CharField(max_length=255, blank=True, null=True)
    # Proveedor del generador de códigos TOTP (Authy, Google Authenticator, etc.)
    totp_provider = models.CharField(max_length=100, blank=True, null=True)

    # Usuario inactivo hasta completar seguridad
    is_active = models.BooleanField(default=False)

    # Multi-empresa
    empresa_principal = models.ForeignKey(
        'core.Empresa',
        on_delete=models.PROTECT,
        related_name='usuarios_principales',
        null=True,
        blank=True,
        help_text="Empresa por defecto al iniciar sesión"
    )
    empresas_acceso = models.ManyToManyField(
        'core.Empresa',
        related_name='usuarios_con_acceso',
        blank=True,
        help_text="Empresas a las que tiene acceso este usuario"
    )
    
    ultima_empresa_activa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.SET_NULL,
        related_name='usuarios_activos',
        null=True,
        blank=True,
        help_text="Última empresa seleccionada por el usuario"
    )

    class Meta:
        permissions = [
            ("view_dashboard", "Can view dashboard"),
            ("view_inactive_records", "Can view inactive records globally"),
            ("hard_delete_records", "Can hard delete records globally"),
            ("view_consolidado", "Can view consolidated reports across companies"),
            ("use_ai", "Can use AI features"),
        ]


class EnrollmentToken(BaseModel):
    """One-time enrollment token for activating new accounts."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollment_tokens"
    )
    token_hash = models.CharField(max_length=64, unique=True)
    # created_at inherited from BaseModel
    expires_at = models.DateTimeField()

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def __str__(self) -> str:
        return f"Enrollment token for {self.user_id}"

# Auditoría
register_audit(CustomUser)
register_audit(EnrollmentToken)
