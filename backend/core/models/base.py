from django.db import models
from django.conf import settings
from django.utils import timezone
from auditlog.registry import auditlog


def get_current_user():
    """Importación lazy del middleware para evitar dependencias circulares"""
    from ..middleware import get_current_user as _get_current_user
    return _get_current_user()

def get_current_company_id():
    """Importación lazy del middleware para evitar dependencias circulares"""
    from ..middleware import get_current_company_id as _get_current_company_id
    return _get_current_company_id()


class BaseModel(models.Model):
    """
    Modelo base abstracto que añade campos de trazabilidad (timestamps y usuarios)
    y configura auditoría básica.
    """
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")
    
    # Usamos string reference para evitar importaciones circulares si el modelo de usuario cambia
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='%(app_label)s_%(class)s_created',
        verbose_name="Creado por"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='%(app_label)s_%(class)s_updated',
        verbose_name="Actualizado por"
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """
        Sobreescribimos save para asignar automáticamente created_by y updated_by
        usando el usuario del request actual (vía middleware).
        """
        user = get_current_user()
        
        # Solo asignamos si hay un usuario autenticado real
        if user and user.is_authenticated:
            if not self.pk:  # Si es creación
                self.created_by = user
            self.updated_by = user
            
        super().save(*args, **kwargs)


class SoftDeleteManager(models.Manager):
    """
    Manager que por defecto solo muestra registros activos.
    """
    def get_queryset(self):
        # Por defecto filtramos los no eliminados
        return super().get_queryset().filter(activo=True)

    def all_with_deleted(self):
        # Permite acceder a todos, incluidos los eliminados
        return super().get_queryset()

    def deleted(self):
        # Solo los eliminados
        return super().get_queryset().filter(activo=False)


class MultiTenantManager(SoftDeleteManager):
    """
    Manager que combina filtrado de Soft Delete y aislamiento por Empresa.
    """
    def get_queryset(self):
        queryset = super().get_queryset() # Ya aplica el filtro 'activo=True'
        company_id = get_current_company_id()
        if company_id:
            return queryset.filter(empresa_id=company_id)
        return queryset


class EmpresaOwnedModel(models.Model):
    """
    Mixin abstracto para asociar un registro a una Empresa.
    IMPORTANTE: Si el modelo también usa SoftDeleteModel, debe redeclarar 'objects = MultiTenantManager()'.
    """
    empresa = models.ForeignKey(
        'core.Empresa',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_related',
        verbose_name="Empresa",
        null=True,
        blank=True
    )

    class Meta:
        abstract = True


class SoftDeleteModel(BaseModel):
    """
    Modelo abstracto para implementar borrado lógico (Soft Delete).
    Sustituye el borrado físico por un flag de inactivo.
    """
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    # Managers
    objects = SoftDeleteManager() # Manager por defecto (solo activos)
    all_objects = models.Manager() # Manager sin filtros (Django standard)

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """
        Realiza un borrado lógico (soft delete).
        """
        self.activo = False
        self.save(using=using)

    def hard_delete(self, using=None, keep_parents=False):
        """
        Realiza un borrado físico real de la base de datos.
        """
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        """
        Restaura un registro eliminado lógicamente.
        """
        self.activo = True
        self.save()
