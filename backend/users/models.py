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
    
    # TOTP de Autorización (separado del login para operaciones sensibles)
    totp_authorization_secret = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Secreto TOTP para autorización de operaciones sensibles (cancelaciones, devoluciones, etc.)"
    )
    totp_authorization_configured = models.BooleanField(
        default=False,
        help_text="Indica si el usuario ha configurado su TOTP de autorización"
    )

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
            # ===== DASHBOARD Y VISTAS GENERALES =====
            ("view_dashboard", "Ver Panel Principal (Dashboard)"),
            ("view_inactive_records", "Ver registros inactivos en todo el sistema"),
            ("hard_delete_records", "Eliminar permanentemente registros (sin recuperación)"),
            ("view_consolidado", "Ver reportes consolidados multi-empresa"),
            
            # ===== IA Y FUNCIONES AVANZADAS =====
            ("use_ai", "Usar asistente de Inteligencia Artificial"),
            ("manage_ai_settings", "Configurar parámetros de IA"),
            
            # ===== GESTIÓN DE USUARIOS =====
            ("view_inactive_users", "Ver usuarios inactivos o suspendidos"),
            ("hard_delete_customuser", "Eliminar permanentemente usuarios"),
            ("impersonate_users", "Iniciar sesión como otro usuario (impersonar)"),
            ("manage_user_permissions", "Gestionar permisos de usuarios"),
            ("reset_user_credentials", "Restablecer credenciales de acceso"),
            
            # ===== SEGURIDAD Y AUDITORÍA =====
            ("view_audit_logs", "Ver registros de auditoría"),
            ("export_audit_logs", "Exportar registros de auditoría"),
            ("view_security_alerts", "Ver alertas de seguridad"),
            
            # ===== MULTI-EMPRESA =====
            ("access_all_companies", "Acceder a todas las empresas del sistema"),
            ("switch_company_context", "Cambiar contexto de empresa activa"),
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
