from django.db import models
from django.contrib.auth.models import Permission
from core.models import SoftDeleteModel, register_audit

class Role(SoftDeleteModel):
    """
    Role-Based Access Control (RBAC).
    Permite agrupar permisos en roles (Ej: Tesorero, Administrador POS, RH).
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    
    # Permisos asignados a este rol
    permissions = models.ManyToManyField(
        Permission,
        related_name='roles',
        blank=True,
        help_text="Permisos que otorga este rol"
    )
    
    es_sistema = models.BooleanField(
        default=False, 
        help_text="Indica si es un rol protegido del sistema (no editable)"
    )

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

register_audit(Role)
