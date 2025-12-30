from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit

class ContraRecibo(SoftDeleteModel):
    """
    Documento que valida la obligación de pago.
    Representa una Factura Validada o una Solicitud de Pago sin Factura (Anticipo).
    """
    TIPO_CHOICES = [
        ('FACTURA', 'Factura (CR Normal)'),
        ('ANTICIPO', 'Anticipo (Sin Factura)'),
        ('GASTO_VIAJE', 'Gasto de Viaje'),
        ('REEMBOLSO', 'Reembolso'),
    ]
    
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('VALIDADO', 'Validado (Listo para Pago)'),
        ('PROGRAMADO', 'Programado'),
        ('PAGADO_PARCIAL', 'Pagado Parcialmente'),
        ('PAGADO', 'Pagado Totalmente'),
        ('CANCELADO', 'Cancelado'),
    ]

    folio = models.CharField(max_length=20, unique=True, editable=False)
    proveedor = models.ForeignKey(
        'compras.Proveedor', 
        on_delete=models.PROTECT, 
        related_name='contrarecibos'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='FACTURA')
    
    # Vinculación Fiscal (Solo si es Factura)
    xml_archivo = models.FileField(upload_to='facturas/xml/', blank=True, null=True)
    pdf_archivo = models.FileField(upload_to='facturas/pdf/', blank=True, null=True)
    uuid = models.CharField(
        max_length=36, 
        blank=True, 
        null=True, 
        unique=True, 
        help_text="Folio Fiscal del XML"
    )
    
    # Vinculación Operativa
    orden_compra = models.ForeignKey(
        'compras.OrdenCompra', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='contrarecibos'
    )
    
    # Importes
    fecha_recepcion = models.DateField(auto_now_add=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    
    moneda = models.ForeignKey('contabilidad.Moneda', on_delete=models.PROTECT)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    retenciones = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    saldo_pendiente = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    comentarios = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    
    # Auditoría
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def save(self, *args, **kwargs):
        if not self.folio:
            import datetime
            year = datetime.date.today().year
            last_id = ContraRecibo.objects.all().order_by('id').last()
            new_id = (last_id.id + 1) if last_id else 1
            self.folio = f"CR-{year}-{new_id:05d}"
            
        if not self.pk:  # Only on create
            self.saldo_pendiente = self.total
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio} - {self.proveedor} ({self.total})"


class ProgramacionPago(SoftDeleteModel):
    """
    Lote de ContraRecibos autorizados para pago en una fecha específica.
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('AUTORIZADA', 'Autorizada'),
        ('PROCESADA', 'Procesada (Layout Generado)'),
        ('PAGADA', 'Pagada (Confirmada)'),
    ]
    
    fecha_programada = models.DateField()
    descripcion = models.CharField(max_length=200)
    banco_emisor = models.ForeignKey('contabilidad.Banco', on_delete=models.PROTECT)
    cuenta_emisora = models.CharField(max_length=50)  # Cuenta de la empresa
    
    total_mxn = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_usd = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    autorizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='programaciones_autorizadas'
    )
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    
    def __str__(self):
        return f"Prog {self.id} - {self.fecha_programada}"


class DetalleProgramacion(SoftDeleteModel):
    programacion = models.ForeignKey(
        ProgramacionPago, 
        on_delete=models.CASCADE, 
        related_name='detalles'
    )
    contra_recibo = models.ForeignKey(ContraRecibo, on_delete=models.PROTECT)
    monto_a_pagar = models.DecimalField(max_digits=14, decimal_places=2)
    
    def __str__(self):
        return f"{self.contra_recibo} : {self.monto_a_pagar}"


register_audit(ContraRecibo)
register_audit(ProgramacionPago)
register_audit(DetalleProgramacion)
