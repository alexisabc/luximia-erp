from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit, EmpresaOwnedModel, MultiTenantManager
from .sesiones import Turno

class Venta(SoftDeleteModel, EmpresaOwnedModel):
    # Manager combinando SoftDelete y Empresa
    objects = MultiTenantManager()
    """
    Ticket de Venta (Cabecera).
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('CREDITO', 'Crédito (Cuenta Corriente)'),
        ('ANTICIPO', 'Uso de Anticipo'),
        ('MIXTO', 'Mixto')
    ]

    folio = models.CharField(max_length=20, unique=True, blank=True)
    turno = models.ForeignKey(Turno, on_delete=models.PROTECT, related_name='ventas')
    cliente = models.ForeignKey(
        'contabilidad.Cliente', 
        on_delete=models.PROTECT, 
        blank=True, 
        null=True,
        help_text="Cliente opcional, null para venta general"
    )
    
    fecha = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PAGADA')
    metodo_pago = models.CharField(
        max_length=20, 
        choices=METODO_PAGO_CHOICES, 
        default='EFECTIVO',
        help_text="Método de pago principal"
    )
    
    # Campos para pago mixto
    metodo_pago_secundario = models.CharField(
        max_length=20, 
        choices=METODO_PAGO_CHOICES, 
        blank=True, 
        null=True
    )
    monto_metodo_principal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monto_metodo_secundario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Auditoría de Cancelación
    cancelado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='ventas_canceladas_pos'
    )
    motivo_cancelacion = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-fecha']

    def save(self, *args, **kwargs):
        if not self.folio:
            # Generador simple de folio
            from pos.models import Venta as VentaModel
            last_id = VentaModel.objects.count() + 1
            self.folio = f"T-{last_id:06d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio} - ${self.total}"


class DetalleVenta(models.Model):
    """
    Línea de detalle de una venta.
    Puede referenciar tanto a Producto (legacy POS) como a Insumo (inventario).
    """
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    
    # Soporte dual: Producto legacy o Insumo del inventario
    producto = models.ForeignKey(
        'pos.Producto', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        help_text="Producto del catálogo POS (legacy)"
    )
    insumo = models.ForeignKey(
        'compras.Insumo', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        help_text="Insumo del módulo de inventarios"
    )
    
    descripcion = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Descripción snapshot del producto/insumo"
    )
    cantidad = models.DecimalField(max_digits=10, decimal_places=4)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=4)
    subtotal = models.DecimalField(max_digits=12, decimal_places=4)

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        
        # Auto-capturar descripción si no se proporciona
        if not self.descripcion:
            if self.producto:
                self.descripcion = self.producto.nombre
            elif self.insumo:
                self.descripcion = self.insumo.descripcion
                
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.venta.folio} - {self.descripcion}"


register_audit(Venta)
