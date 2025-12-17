from django.db import models
from django.conf import settings
from decimal import Decimal
from core.models import BaseModel, SoftDeleteModel, register_audit

class Producto(SoftDeleteModel):
    """
    Productos para venta en POS (Materiales pétreos).
    No maneja inventario.
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
    precio_lista = models.DecimalField(max_digits=12, decimal_places=2, help_text="Precio Base antes de impuestos")
    impuestos_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=16.00, help_text="IVA %")
    
    # Imagen, Color para UI
    color_ui = models.CharField(max_length=20, default="#3b82f6", help_text="Color para el botón en POS")

    def __str__(self):
        return f"{self.nombre} (${self.precio_lista})"

    @property
    def precio_final(self):
        return self.precio_lista * (1 + (self.impuestos_porcentaje / 100))


class Caja(SoftDeleteModel):
    """
    Registro físico de puntos de venta (Cajas).
    """
    nombre = models.CharField(max_length=100, unique=True)
    sucursal = models.CharField(max_length=100, blank=True, null=True, default="Matriz")

    def __str__(self):
        return self.nombre


class Turno(SoftDeleteModel):
    """
    Sesión de un cajero (Corte de Caja).
    """
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    
    saldo_inicial = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    saldo_final_calculado = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Lo que el sistema dice
    saldo_final_declarado = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Lo que el cajero contó
    diferencia = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    cerrado = models.BooleanField(default=False)

    def __str__(self):
        return f"Turno {self.id} - {self.usuario} ({self.fecha_inicio.date()})"


class CuentaCliente(SoftDeleteModel):
    """
    Maneja el saldo a favor (Anticipos) y la deuda (Crédito) del cliente.
    Saldo Positivo = Anticipo (Favor del cliente)
    Saldo Negativo = Deuda (Crédito usado)
    """
    cliente = models.OneToOneField('contabilidad.Cliente', on_delete=models.PROTECT, related_name='cuenta_pos')
    limite_credito = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Monto máximo de deuda permitida (positivo)")
    saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Datos Fiscales específicos si difieren? No, usar cliente contabilidad.

    def __str__(self):
        return f"Cuenta {self.cliente} - Saldo: {self.saldo}"

    @property
    def credito_disponible(self):
        # Si saldo es -500 (deuda) y límite es 1000, disponible es 500. 
        # Si saldo es +200 (anticipo), disponible es 1200.
        return self.limite_credito + self.saldo


class Venta(SoftDeleteModel):
    """
    Ticket de Venta (Cabecera).
    """
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('CANCELADA', 'Cancelada'),
    ]
    METODOS_PAGO_POS = [
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('CREDITO', 'Crédito (Cuenta Corriente)'), 
        ('ANTICIPO', 'Uso de Anticipo'), # Cuando se consume saldo a favor
        ('MIXTO', 'Mixto') 
    ]

    folio = models.CharField(max_length=20, unique=True, blank=True)
    turno = models.ForeignKey(Turno, on_delete=models.PROTECT, related_name='ventas')
    cliente = models.ForeignKey('contabilidad.Cliente', on_delete=models.PROTECT, blank=True, null=True)
    
    fecha = models.DateTimeField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PAGADA') # En POS suele nacer pagada
    metodo_pago_principal = models.CharField(max_length=20, choices=METODOS_PAGO_POS, default='EFECTIVO')
    monto_metodo_principal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    metodo_pago_secundario = models.CharField(max_length=20, choices=METODOS_PAGO_POS, blank=True, null=True)
    monto_metodo_secundario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Auditoría de Cancelación
    cancelado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventas_canceladas')
    motivo_cancelacion = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.folio:
            # Generador simple de folio
            last_id = Venta.all_objects.count() + 1
            self.folio = f"T-{last_id:06d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio} - ${self.total}"


class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2) # Snapshot del precio
    subtotal = models.DecimalField(max_digits=12, decimal_places=2) # cant * precio

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)


class MovimientoSaldoCliente(BaseModel):
    """
    Bitácora de todos los cambios en el saldo del cliente.
    (Venta a crédito, Pago de deuda, Depósito de anticipo).
    """
    TIPO_MOVIMIENTO = [
        ('CARGO_VENTA', 'Cargo por Venta (Crédito)'),
        ('ABONO_PAGO', 'Abono (Pago de Deuda)'),
        ('DEPOSITO_ANTICIPO', 'Depósito de Anticipo'),
        ('CARGO_USO_ANTICIPO', 'Uso de Anticipo en Venta'),
        ('CANCELACION', 'Corrección por Cancelación'),
    ]
    
    cuenta = models.ForeignKey(CuentaCliente, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=30, choices=TIPO_MOVIMIENTO)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    referencia_venta = models.ForeignKey(Venta, on_delete=models.SET_NULL, null=True, blank=True)
    comentarios = models.TextField(blank=True, null=True)
    saldo_anterior = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_nuevo = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.tipo} - ${self.monto}"


class MovimientoCaja(BaseModel):
    """
    Entradas y salidas de efectivo NO relacionadas con venta directa instantánea 
    (ej. Retiro de efectivo, Ingreso inicial, Pago de crédito en efectivo).
    """
    TIPO = [
        ('INGRESO', 'Ingreso'),
        ('RETIRO', 'Retiro'),
    ]
    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name='movimientos_caja')
    tipo = models.CharField(max_length=20, choices=TIPO)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    concepto = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.tipo} - ${self.monto}"


# Auditoría
register_audit(Producto)
register_audit(Caja)
register_audit(Turno)
register_audit(Venta)
register_audit(CuentaCliente)
