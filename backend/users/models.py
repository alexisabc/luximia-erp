#users/models.py
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from core.models import BaseModel, register_audit
import uuid


class CustomUser(AbstractUser, BaseModel):
    """Base custom user model for passwordless authentication."""
    # Permitir auth sin password tradicional
    # No es necesario redefinir password como nullable. Django maneja auth sin password
    # usando set_unusable_password(). Dejarlo estándar evita problemas de compatibilidad.
    # Explicitly default password to unusable for existing NULL rows during migration
    password = models.CharField(max_length=128, default='!')

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

    # Control de Sesión Única
    token_version = models.UUIDField(default=uuid.uuid4, editable=False)
    current_session_device = models.CharField(max_length=255, blank=True, null=True, help_text="Dispositivo de la sesión actual")

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
            # Dashboard y Vistas Generales
            ("view_dashboard", "Ver Dashboard"),
            ("view_inactive_records", "Ver registros inactivos globalmente"),
            ("hard_delete_records", "Eliminar permanentemente registros"),
            ("view_consolidado", "Ver reportes consolidados entre empresas"),
            
            # IA y Funciones Avanzadas
            ("use_ai", "Usar funciones de IA"),
            
            # Gestión de Usuarios
            ("view_inactive_users", "Ver usuarios inactivos"),
            ("hard_delete_customuser", "Eliminar permanentemente usuarios"),
        ]
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"


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
