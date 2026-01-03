from django.db import models
from core.models import SoftDeleteModel, register_audit

class Insumo(SoftDeleteModel):
    """
    Catálogo de bienes y servicios (Conceptos de Compra).
    Se vinculará con Contabilidad para asignar cuenta contable por defecto.
    """
    TIPO_CHOICES = [
        ('PRODUCTO', 'Producto/Material'),
        ('SERVICIO', 'Servicio'),
        ('ACTIVO_FIJO', 'Activo Fijo'),
    ]
    
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=200)
    unidad_medida = models.CharField(max_length=20, default='PZA')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='SERVICIO')
    stock_minimo = models.DecimalField(max_digits=12, decimal_places=4, default=0, help_text="Alerta si la existencia global cae debajo de este valor")
    
    # Costeo
    costo_promedio = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    ultimo_costo = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    
    # Link contable futuro (por ahora char o FK placeholder)
    # cuenta_contable = models.ForeignKey('contabilidad.CuentaContable', ...)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

register_audit(Insumo)
