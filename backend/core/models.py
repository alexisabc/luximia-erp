from django.db import models
from django.conf import settings
from auditlog.registry import auditlog
from django.utils import timezone
from .middleware import get_current_user

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

# Helper para registrar modelos en auditlog fácilmente
def register_audit(model_class):
    """
    Registra un modelo en el sistema de auditoría (django-auditlog).
    Uso: register_audit(MiModelo)
    """
    if not auditlog.contains(model_class):
        auditlog.register(model_class)

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


class Empresa(SoftDeleteModel):
    """
    Representa cada razón social del grupo empresarial.
    Permite manejar múltiples empresas en un solo ERP.
    """
    codigo = models.CharField(
        max_length=10, 
        unique=True,
        help_text="Código único de la empresa (ej: LUX01, LUX02)"
    )
    razon_social = models.CharField(
        max_length=200,
        help_text="Razón social completa según acta constitutiva"
    )
    nombre_comercial = models.CharField(
        max_length=100,
        help_text="Nombre comercial o marca"
    )
    rfc = models.CharField(
        max_length=13, 
        unique=True,
        help_text="RFC de la empresa"
    )
    
    # Datos fiscales
    regimen_fiscal = models.CharField(
        max_length=10,
        help_text="Código de régimen fiscal SAT (ej: 601, 612)"
    )
    codigo_postal = models.CharField(max_length=5)
    
    # Dirección fiscal
    calle = models.CharField(max_length=200)
    numero_exterior = models.CharField(max_length=20)
    numero_interior = models.CharField(max_length=20, blank=True, null=True)
    colonia = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    estado = models.CharField(max_length=100)
    pais = models.CharField(max_length=100, default='México')
    
    # Configuración
    logo = models.ImageField(
        upload_to='empresas/logos/', 
        blank=True, 
        null=True,
        help_text="Logo de la empresa para documentos"
    )
    color_primario = models.CharField(
        max_length=7, 
        default='#3B82F6',
        help_text="Color principal en formato hex (#RRGGBB)"
    )
    
    # Contacto
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    sitio_web = models.URLField(blank=True, null=True)
    
    # Configuración de facturación
    serie_factura = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Serie por defecto para facturas (ej: A, B, F)"
    )
    folio_inicial = models.IntegerField(
        default=1,
        help_text="Folio inicial para documentos"
    )
    
    class Meta:
        ordering = ['codigo']
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre_comercial}"
    
    @property
    def direccion_completa(self):
        """Retorna la dirección fiscal completa formateada."""
        partes = [
            f"{self.calle} {self.numero_exterior}",
            f"Int. {self.numero_interior}" if self.numero_interior else None,
            self.colonia,
            f"{self.municipio}, {self.estado}",
            f"C.P. {self.codigo_postal}",
            self.pais
        ]
        return ", ".join(filter(None, partes))


# Registrar modelo en auditoría
register_audit(Empresa)
