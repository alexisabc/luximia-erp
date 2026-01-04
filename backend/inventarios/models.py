from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit, EmpresaOwnedModel, MultiTenantManager

class Almacen(SoftDeleteModel, EmpresaOwnedModel):
    # Manager combinando SoftDelete y Empresa
    objects = MultiTenantManager()
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)
    direccion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Existencia(SoftDeleteModel):
    insumo = models.ForeignKey('compras.Insumo', on_delete=models.CASCADE, related_name='existencias')
    almacen = models.ForeignKey(Almacen, on_delete=models.CASCADE, related_name='existencias_productos')
    cantidad = models.DecimalField(max_digits=12, decimal_places=4, default=0)

    class Meta:
        unique_together = ('insumo', 'almacen')
        verbose_name_plural = "Existencias"

    def __str__(self):
        return f"{self.insumo} en {self.almacen}: {self.cantidad}"

class MovimientoInventario(SoftDeleteModel):
    TIPO_MOVIMIENTO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
        ('TRASPASO', 'Traspaso'),
    ]

    insumo = models.ForeignKey('compras.Insumo', on_delete=models.PROTECT, related_name='movimientos')
    almacen = models.ForeignKey(Almacen, on_delete=models.PROTECT, related_name='movimientos')
    cantidad = models.DecimalField(max_digits=12, decimal_places=4, help_text="Positivo para entradas, negativo para salidas")
    costo_unitario = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    fecha = models.DateTimeField(auto_now_add=True)
    referencia = models.CharField(max_length=255, blank=True, null=True, help_text="Ej: Orden Compra #123, Venta #456")
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='movimientos_inventario')

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.insumo} ({self.cantidad})"

# New Models for Transactions
class EntradaAlmacen(SoftDeleteModel):
    orden_compra = models.ForeignKey('compras.OrdenCompra', on_delete=models.PROTECT, related_name='entradas_almacen')
    fecha_entrada = models.DateTimeField(auto_now_add=True)
    recibido_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='entradas_recibidas')
    folio_remision = models.CharField(max_length=50, blank=True, null=True)
    notas = models.TextField(blank=True)

    def __str__(self):
        folio = self.orden_compra.folio if self.orden_compra else 'S/F'
        return f"ENT-{self.id} | OC: {folio}"

class DetalleEntrada(SoftDeleteModel):
    entrada = models.ForeignKey(EntradaAlmacen, on_delete=models.CASCADE, related_name='detalles')
    insumo = models.ForeignKey('compras.Insumo', on_delete=models.PROTECT)
    cantidad = models.DecimalField(max_digits=12, decimal_places=4)
    costo_unitario = models.DecimalField(max_digits=14, decimal_places=4) # Para valuacion
    almacen_destino = models.ForeignKey(Almacen, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.cantidad} x {self.insumo}"

class SalidaAlmacen(SoftDeleteModel):
    obra = models.ForeignKey('obras.Obra', on_delete=models.PROTECT, related_name='salidas_almacen')
    solicitante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='salidas_solicitadas')
    fecha_salida = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True)

    def __str__(self):
        return f"SAL-{self.id} | Obra: {self.obra}"

class DetalleSalida(SoftDeleteModel):
    salida = models.ForeignKey(SalidaAlmacen, on_delete=models.CASCADE, related_name='detalles')
    insumo = models.ForeignKey('compras.Insumo', on_delete=models.PROTECT)
    cantidad = models.DecimalField(max_digits=12, decimal_places=4)
    almacen_origen = models.ForeignKey(Almacen, on_delete=models.PROTECT)
    
    def __str__(self):
        return f"{self.cantidad} x {self.insumo}"

register_audit(Almacen)
register_audit(MovimientoInventario)
register_audit(Existencia)
register_audit(EntradaAlmacen)
register_audit(SalidaAlmacen)
