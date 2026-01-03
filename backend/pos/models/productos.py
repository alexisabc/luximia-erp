from django.db import models
from core.models import SoftDeleteModel, register_audit

class Producto(SoftDeleteModel):
    """
    Productos para venta en POS (Catálogo legacy).
    Para nuevos productos, usar compras.Insumo.
    """
    UNIDAD_CHOICES = [
        ('M3', 'Metro Cúbico'),
        ('TON', 'Tonelada'),
        ('KG', 'Kilogramo'),
        ('PZA', 'Pieza'),
        ('VIAJE', 'Viaje'),
    ]
    
    codigo = models.CharField(max_length=50, unique=True, help_text="SKU o Código Interno")
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    unidad_medida = models.CharField(max_length=20, choices=UNIDAD_CHOICES, default='M3')

    # SAT - CFDI 4.0
    clave_sat_producto = models.CharField(max_length=20, blank=True, null=True, help_text="Clave ProdServ SAT")
    clave_sat_unidad = models.CharField(max_length=20, blank=True, null=True, help_text="Clave Unidad SAT")

    precio_lista = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        help_text="Precio Base antes de impuestos"
    )
    impuestos_porcentaje = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=16.00, 
        help_text="IVA %"
    )
    
    # UI customization
    color_ui = models.CharField(
        max_length=20, 
        default="#3b82f6", 
        help_text="Color para el botón en POS"
    )

    def __str__(self):
        return f"{self.nombre} (${self.precio_lista})"

    @property
    def precio_final(self):
        return self.precio_lista * (1 + (self.impuestos_porcentaje / 100))


register_audit(Producto)
