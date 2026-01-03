from django.db import models
from django.core.cache import cache
from django.core.validators import MinValueValidator, MaxValueValidator
from .base import SoftDeleteModel


class SystemSetting(SoftDeleteModel):
    """
    Configuración dinámica del sistema.
    Permite modificar comportamientos sin tocar código.
    Inspirado en: Contpaqi, Enkontrol, SICAR.
    """
    CATEGORY_CHOICES = [
        ('FISCAL', 'Fiscal y Contabilidad'),
        ('POS', 'Punto de Venta'),
        ('INVENTARIO', 'Inventario y Almacenes'),
        ('RRHH', 'Recursos Humanos'),
        ('SECURITY', 'Seguridad'),
        ('GENERAL', 'General'),
        ('INTEGRACIONES', 'Integraciones'),
    ]
    
    key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Clave única de configuración (ej: 'POS_ALLOW_NEGATIVE_STOCK')"
    )
    value = models.JSONField(
        help_text="Valor de la configuración (puede ser bool, string, int, dict, list)"
    )
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='GENERAL',
        db_index=True,
        help_text="Categoría para agrupar configuraciones"
    )
    description = models.TextField(
        blank=True,
        help_text="Descripción de qué hace esta configuración"
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Si True, se envía al frontend en el arranque"
    )
    
    # Metadatos para auditoría
    modified_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='settings_modified',
        help_text="Último usuario que modificó esta configuración"
    )
    
    class Meta:
        verbose_name = "Configuración del Sistema"
        verbose_name_plural = "Configuraciones del Sistema"
        ordering = ['category', 'key']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['category']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    def save(self, *args, **kwargs):
        """Invalidar cache al guardar"""
        super().save(*args, **kwargs)
        # Invalidar cache de esta configuración
        cache_key = f"system_setting:{self.key}"
        cache.delete(cache_key)
        # Invalidar cache de configuraciones públicas
        cache.delete("system_settings:public")
    
    def delete(self, *args, **kwargs):
        """Invalidar cache al eliminar"""
        cache_key = f"system_setting:{self.key}"
        cache.delete(cache_key)
        cache.delete("system_settings:public")
        super().delete(*args, **kwargs)


class FeatureFlag(SoftDeleteModel):
    """
    Feature Flags para habilitar/deshabilitar módulos o funcionalidades.
    Permite A/B testing y rollouts graduales.
    """
    code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Código único del feature (ej: 'MODULE_OBRAS')"
    )
    name = models.CharField(
        max_length=200,
        help_text="Nombre descriptivo del feature"
    )
    description = models.TextField(
        blank=True,
        help_text="Descripción de qué hace este feature"
    )
    is_active = models.BooleanField(
        default=False,
        help_text="Si el feature está activo globalmente"
    )
    rollout_percentage = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Porcentaje de usuarios que ven el feature (0-100). Para A/B testing."
    )
    
    # Restricciones opcionales
    allowed_users = models.ManyToManyField(
        'users.CustomUser',
        blank=True,
        related_name='feature_flags',
        help_text="Usuarios específicos que tienen acceso (opcional)"
    )
    allowed_roles = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de roles que tienen acceso (opcional)"
    )
    
    # Metadatos
    created_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='features_created',
        help_text="Usuario que creó este feature flag"
    )
    
    class Meta:
        verbose_name = "Feature Flag"
        verbose_name_plural = "Feature Flags"
        ordering = ['code']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        status = "✅" if self.is_active else "❌"
        return f"{status} {self.code} - {self.name}"
    
    def save(self, *args, **kwargs):
        """Invalidar cache al guardar"""
        super().save(*args, **kwargs)
        cache_key = f"feature_flag:{self.code}"
        cache.delete(cache_key)
        cache.delete("feature_flags:all")
    
    def delete(self, *args, **kwargs):
        """Invalidar cache al eliminar"""
        cache_key = f"feature_flag:{self.code}"
        cache.delete(cache_key)
        cache.delete("feature_flags:all")
        super().delete(*args, **kwargs)
    
    def is_enabled_for_user(self, user):
        """
        Verifica si el feature está habilitado para un usuario específico.
        Considera: is_active, rollout_percentage, allowed_users, allowed_roles.
        """
        if not self.is_active:
            return False
        
        # Si hay usuarios específicos permitidos
        if self.allowed_users.exists():
            return self.allowed_users.filter(id=user.id).exists()
        
        # Si hay roles específicos permitidos
        if self.allowed_roles:
            user_roles = user.roles.values_list('code', flat=True)
            if not any(role in self.allowed_roles for role in user_roles):
                return False
        
        # Rollout percentage (A/B testing)
        if self.rollout_percentage < 100:
            # Hash del user ID para determinar si está en el rollout
            user_hash = hash(f"{self.code}:{user.id}") % 100
            return user_hash < self.rollout_percentage
        
        return True
