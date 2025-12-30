import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import BaseModel, register_audit
from .role import Role

class CustomUser(AbstractUser, BaseModel):
    """
    Modelo de Usuario personalizado con soporte para:
    1. Autenticación Passwordless (Passkeys)
    2. Multi-factor (TOTP)
    3. Multi-empresa
    4. RBAC (Roles)
    5. Sesión única (Token Version)
    """
    # Explicitly default password to unusable for passwordless
    password = models.CharField(max_length=128, default='!')

    # Seguridad: Passkeys
    passkey_credentials = models.JSONField(default=list, blank=True)
    passkey_provider = models.CharField(max_length=100, blank=True, null=True)

    # Seguridad: 2FA / TOTP
    totp_secret = models.CharField(max_length=255, blank=True, null=True)
    totp_provider = models.CharField(max_length=100, blank=True, null=True)
    
    # TOTP de Autorización (para operaciones críticas)
    totp_authorization_secret = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Secreto TOTP para autorización de operaciones sensibles"
    )
    totp_authorization_configured = models.BooleanField(
        default=False,
        help_text="Indica si el usuario ha configurado su TOTP de autorización"
    )

    # Estado del usuario
    is_active = models.BooleanField(default=False)

    # Control de Sesión Única
    token_version = models.UUIDField(default=uuid.uuid4, editable=False)
    current_session_device = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        help_text="Dispositivo de la sesión actual"
    )

    # RBAC: Roles
    roles = models.ManyToManyField(
        Role,
        related_name='users',
        blank=True,
        help_text="Roles asignados a este usuario"
    )

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
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        permissions = [
            # Dashboard
            ("view_dashboard", "Ver Panel Principal (Dashboard)"),
            ("view_inactive_records", "Ver registros inactivos"),
            ("hard_delete_records", "Eliminar permanentemente registros"),
            ("view_consolidado", "Ver reportes consolidados multi-empresa"),
            
            # IA
            ("use_ai", "Usar asistente de IA"),
            ("manage_ai_settings", "Configurar parámetros de IA"),
            
            # User Management
            ("view_inactive_users", "Ver usuarios inactivos o suspendidos"),
            ("hard_delete_customuser", "Eliminar permanentemente usuarios"),
            ("impersonate_users", "Impersonar usuarios"),
            ("manage_user_permissions", "Gestionar permisos de usuarios"),
            ("reset_user_credentials", "Restablecer credenciales de acceso"),
            
            # Multi-empresa
            ("access_all_companies", "Acceder a todas las empresas"),
            ("switch_company_context", "Cambiar contexto de empresa activa"),
        ]

    def __str__(self):
        return self.username

    def update_token_version(self):
        """Invalida todas las sesiones activas."""
        self.token_version = uuid.uuid4()
        self.save()

register_audit(CustomUser)
