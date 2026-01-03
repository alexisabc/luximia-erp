from django.db import models
from .base import SoftDeleteModel

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
