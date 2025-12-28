from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit

class ContraRecibo(SoftDeleteModel):
    """
    Documento que valida la obligación de pago.
    En el modelo "Híbrido", esto puede representar una Factura Validada
    O una Solicitud de Pago sin Factura (Anticipo).
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
    proveedor = models.ForeignKey('compras.Proveedor', on_delete=models.PROTECT, related_name='contrarecibos')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='FACTURA')
    
    # Vinculación Fiscal (Solo si es Factura)
    xml_archivo = models.FileField(upload_to='facturas/xml/', blank=True, null=True)
    pdf_archivo = models.FileField(upload_to='facturas/pdf/', blank=True, null=True)
    uuid = models.CharField(max_length=36, blank=True, null=True, unique=True, help_text="Folio Fiscal del XML")
    
    # Vinculación Operativa
    orden_compra = models.ForeignKey('compras.OrdenCompra', on_delete=models.SET_NULL, null=True, blank=True, related_name='contrarecibos')
    
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
    
    # Auditoria
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def save(self, *args, **kwargs):
        if not self.folio:
            import datetime
            year = datetime.date.today().year
            last_id = ContraRecibo.objects.all().order_by('id').last()
            new_id = (last_id.id + 1) if last_id else 1
            self.folio = f"CR-{year}-{new_id:05d}"
            
        if not self.pk: # Only on create
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
    cuenta_emisora = models.CharField(max_length=50) # Cuenta de la empresa
    
    total_mxn = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_usd = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    autorizado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='programaciones_autorizadas')
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    
    def __str__(self):
        return f"Prog {self.id} - {self.fecha_programada}"

class DetalleProgramacion(SoftDeleteModel):
    programacion = models.ForeignKey(ProgramacionPago, on_delete=models.CASCADE, related_name='detalles')
    contra_recibo = models.ForeignKey(ContraRecibo, on_delete=models.PROTECT)
    monto_a_pagar = models.DecimalField(max_digits=14, decimal_places=2)
    
    def __str__(self):
        return f"{self.contra_recibo} : {self.monto_a_pagar}"


class CuentaBancaria(SoftDeleteModel):
    """
    Cuentas bancarias de la empresa para gestión de tesorería.
    """
    TIPO_CUENTA_CHOICES = [
        ('CHEQUES', 'Cuenta de Cheques'),
        ('INVERSION', 'Cuenta de Inversión'),
        ('NOMINA', 'Cuenta de Nómina'),
        ('AHORRO', 'Cuenta de Ahorro'),
    ]
    
    banco = models.ForeignKey('contabilidad.Banco', on_delete=models.PROTECT, related_name='cuentas_empresa')
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='cuentas_bancarias')
    
    numero_cuenta = models.CharField(max_length=20, help_text="Número de cuenta")
    clabe = models.CharField(max_length=18, blank=True, null=True, help_text="CLABE interbancaria")
    tipo_cuenta = models.CharField(max_length=20, choices=TIPO_CUENTA_CHOICES, default='CHEQUES')
    
    moneda = models.ForeignKey('contabilidad.Moneda', on_delete=models.PROTECT, default=1)
    saldo_actual = models.DecimalField(max_digits=16, decimal_places=2, default=0, help_text="Saldo según sistema")
    saldo_bancario = models.DecimalField(max_digits=16, decimal_places=2, default=0, help_text="Saldo según estado de cuenta")
    
    cuenta_contable = models.ForeignKey('contabilidad.CuentaContable', on_delete=models.SET_NULL, null=True, blank=True, 
                                       help_text="Cuenta contable asociada")
    
    es_principal = models.BooleanField(default=False, help_text="Cuenta principal para operaciones")
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Cuenta Bancaria"
        verbose_name_plural = "Cuentas Bancarias"
        unique_together = ['banco', 'numero_cuenta']
        permissions = [
            # ===== BANCOS =====
            ("view_bank_balances", "Ver saldos bancarios"),
            ("conciliate_bank", "Conciliar cuentas bancarias"),
            ("register_bank_movement", "Registrar movimientos bancarios"),
            
            # ===== EGRESOS Y PAGOS =====
            ("create_payment_request", "Solicitar pagos"),
            ("authorize_payment", "Autorizar pagos y egresos"),
            ("execute_payment", "Ejecutar pagos (emitir cheques/transferencias)"),
            ("void_payment", "Anular pagos emitidos"),
            
            # ===== CAJA CHICA =====
            ("manage_petty_cash", "Gestionar caja chica"),
            ("close_petty_cash", "Cerrar y reembolsar caja chica"),
            ("approve_petty_cash_expense", "Aprobar gastos de caja chica"),
            
            # ===== FLUJO DE EFECTIVO =====
            ("view_cash_flow", "Ver flujo de efectivo"),
            ("create_cash_projection", "Crear proyecciones de flujo"),
            
            # ===== REPORTES =====
            ("view_treasury_reports", "Ver reportes de tesorería"),
            ("export_treasury_reports", "Exportar reportes de tesorería"),
        ]
    
    def __str__(self):
        return f"{self.banco.nombre_corto} - {self.numero_cuenta} ({self.moneda.codigo})"


class CajaChica(SoftDeleteModel):
    """
    Fondos de caja chica para gastos menores.
    """
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('CERRADA', 'Cerrada'),
        ('REEMBOLSADA', 'Reembolsada'),
    ]
    
    nombre = models.CharField(max_length=100, help_text="Nombre de la caja (ej: Caja Oficina Central)")
    responsable = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='cajas_responsable')
    empresa = models.ForeignKey('core.Empresa', on_delete=models.PROTECT, related_name='cajas_chicas')
    
    monto_fondo = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monto del fondo fijo")
    saldo_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    fecha_apertura = models.DateField(auto_now_add=True)
    fecha_cierre = models.DateField(null=True, blank=True)
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')
    
    class Meta:
        verbose_name = "Caja Chica"
        verbose_name_plural = "Cajas Chicas"
    
    def __str__(self):
        return f"{self.nombre} - {self.responsable.get_full_name()}"


class MovimientoCaja(SoftDeleteModel):
    """
    Movimientos de entrada/salida en caja chica.
    """
    TIPO_CHOICES = [
        ('GASTO', 'Gasto'),
        ('REEMBOLSO', 'Reembolso'),
    ]
    
    caja = models.ForeignKey(CajaChica, on_delete=models.PROTECT, related_name='movimientos')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    
    fecha = models.DateField(auto_now_add=True)
    concepto = models.CharField(max_length=200)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    
    comprobante = models.FileField(upload_to='cajas_chicas/comprobantes/', blank=True, null=True)
    beneficiario = models.CharField(max_length=200, blank=True, null=True)
    
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    
    class Meta:
        verbose_name = "Movimiento de Caja"
        verbose_name_plural = "Movimientos de Caja"
        ordering = ['-fecha', '-id']
    
    def __str__(self):
        return f"{self.tipo} - {self.concepto} (${self.monto})"


class Egreso(SoftDeleteModel):
    """
    Registro de egresos/pagos realizados desde cuentas bancarias.
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
    cuenta_bancaria = models.ForeignKey(CuentaBancaria, on_delete=models.PROTECT, related_name='egresos')
    
    fecha = models.DateField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='TRANSFERENCIA')
    
    beneficiario = models.CharField(max_length=200)
    concepto = models.CharField(max_length=300)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    
    referencia = models.CharField(max_length=50, blank=True, null=True, help_text="Número de cheque o referencia bancaria")
    comprobante = models.FileField(upload_to='egresos/comprobantes/', blank=True, null=True)
    
    # Relación con ContraRecibo (si aplica)
    contra_recibo = models.ForeignKey(ContraRecibo, on_delete=models.SET_NULL, null=True, blank=True, related_name='egresos')
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    
    solicitado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='egresos_solicitados')
    autorizado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='egresos_autorizados')
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


# Registro de auditoría
register_audit(ContraRecibo)
register_audit(ProgramacionPago)
register_audit(DetalleProgramacion)
register_audit(CuentaBancaria)
register_audit(CajaChica)
register_audit(MovimientoCaja)
register_audit(Egreso)

