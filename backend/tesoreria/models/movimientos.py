from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, BaseModel, register_audit
from .bancos import CuentaBancaria

class MovimientoBancario(BaseModel):
    """
    Registro de todos los movimientos bancarios (ingresos y egresos).
    Sirve como fuente de verdad para conciliación y flujo de efectivo.
    """
    TIPO_CHOICES = [
        ('INGRESO', 'Ingreso'),
        ('EGRESO', 'Egreso'),
    ]
    
    ORIGEN_TIPO_CHOICES = [
        ('POS_TURNO', 'Cierre de Turno POS'),
        ('CXC_PAGO', 'Pago de Cliente (CxC)'),
        ('CXP_PAGO', 'Pago a Proveedor (CxP)'),
        ('NOMINA', 'Dispersión de Nómina'),
        ('MANUAL', 'Movimiento Manual'),
        ('CONCILIACION', 'Ajuste de Conciliación'),
        ('OTRO', 'Otro'),
    ]
    
    cuenta = models.ForeignKey(
        CuentaBancaria, 
        on_delete=models.PROTECT, 
        related_name='movimientos'
    )
    fecha = models.DateField(help_text="Fecha del movimiento")
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    
    referencia = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Referencia bancaria, número de cheque, etc."
    )
    beneficiario = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Nombre del beneficiario o pagador"
    )
    concepto = models.CharField(max_length=300, help_text="Descripción del movimiento")
    
    # Trazabilidad polimórfica (referencia al origen del movimiento)
    origen_tipo = models.CharField(
        max_length=20, 
        choices=ORIGEN_TIPO_CHOICES,
        default='MANUAL'
    )
    origen_id = models.IntegerField(
        null=True, 
        blank=True,
        help_text="ID del registro origen (ej: ID de Turno, ID de Pago)"
    )
    
    # Conciliación
    conciliado = models.BooleanField(
        default=False,
        help_text="Indica si el movimiento ya fue conciliado con el estado de cuenta"
    )
    fecha_conciliacion = models.DateTimeField(null=True, blank=True)
    conciliado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos_conciliados'
    )
    
    # Auditoría
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='movimientos_registrados'
    )
    
    class Meta:
        verbose_name = "Movimiento Bancario"
        verbose_name_plural = "Movimientos Bancarios"
        ordering = ['-fecha', '-created_at']
        indexes = [
            models.Index(fields=['cuenta', 'fecha']),
            models.Index(fields=['conciliado']),
            models.Index(fields=['origen_tipo', 'origen_id']),
        ]
    
    def __str__(self):
        signo = '+' if self.tipo == 'INGRESO' else '-'
        return f"{self.fecha} | {signo}${self.monto} | {self.concepto}"


class Egreso(SoftDeleteModel):
    """
    Registro de egresos/pagos realizados desde cuentas bancarias.
    Genera automáticamente un MovimientoBancario al ser pagado.
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('AUTORIZADO', 'Autorizado'),
        ('PAGADO', 'Pagado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    TIPO_CHOICES = [
        ('TRANSFERENCIA', 'Transferencia'),
        ('CHEQUE', 'Cheque'),
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
    ]
    
    folio = models.CharField(max_length=20, unique=True, editable=False)
    cuenta_bancaria = models.ForeignKey(
        CuentaBancaria, 
        on_delete=models.PROTECT, 
        related_name='egresos'
    )
    
    fecha = models.DateField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='TRANSFERENCIA')
    
    beneficiario = models.CharField(max_length=200)
    concepto = models.CharField(max_length=300)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    
    referencia = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        help_text="Número de cheque o referencia bancaria"
    )
    comprobante = models.FileField(
        upload_to='egresos/comprobantes/', 
        blank=True, 
        null=True
    )
    
    # Relación con ContraRecibo (si aplica)
    contra_recibo = models.ForeignKey(
        'tesoreria.ContraRecibo', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='egresos'
    )
    
    # Relación con MovimientoBancario (se crea al pagar)
    movimiento_bancario = models.OneToOneField(
        MovimientoBancario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='egreso'
    )
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    
    solicitado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='egresos_solicitados'
    )
    autorizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='egresos_autorizados'
    )
    fecha_autorizacion = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Egreso"
        verbose_name_plural = "Egresos"
        ordering = ['-fecha', '-id']
    
    def save(self, *args, **kwargs):
        if not self.folio:
            import datetime
            year = datetime.date.today().year
            last_id = Egreso.objects.all().order_by('id').last()
            new_id = (last_id.id + 1) if last_id else 1
            self.folio = f"EG-{year}-{new_id:05d}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.folio} - {self.beneficiario} (${self.monto})"


register_audit(MovimientoBancario)
register_audit(Egreso)
