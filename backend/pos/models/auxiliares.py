from django.db import models
from django.conf import settings
from core.models import BaseModel, SoftDeleteModel, register_audit
from .sesiones import Turno
from .ventas import Venta

class CuentaCliente(SoftDeleteModel):
    """
    Maneja el saldo a favor (Anticipos) y la deuda (Crédito) del cliente.
    Saldo Positivo = Anticipo (Favor del cliente)
    Saldo Negativo = Deuda (Crédito usado)
    """
    cliente = models.OneToOneField(
        'contabilidad.Cliente', 
        on_delete=models.PROTECT, 
        related_name='cuenta_pos'
    )
    limite_credito = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0, 
        help_text="Monto máximo de deuda permitida (positivo)"
    )
    saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Cuenta {self.cliente} - Saldo: {self.saldo}"

    @property
    def credito_disponible(self):
        """
        Si saldo es -500 (deuda) y límite es 1000, disponible es 500.
        Si saldo es +200 (anticipo), disponible es 1200.
        """
        return self.limite_credito + self.saldo


class MovimientoSaldoCliente(BaseModel):
    """
    Bitácora de todos los cambios en el saldo del cliente.
    (Venta a crédito, Pago de deuda, Depósito de anticipo).
    """
    TIPO_MOVIMIENTO_CHOICES = [
        ('CARGO_VENTA', 'Cargo por Venta (Crédito)'),
        ('ABONO_PAGO', 'Abono (Pago de Deuda)'),
        ('DEPOSITO_ANTICIPO', 'Depósito de Anticipo'),
        ('CARGO_USO_ANTICIPO', 'Uso de Anticipo en Venta'),
        ('CANCELACION', 'Corrección por Cancelación'),
    ]
    
    cuenta = models.ForeignKey(CuentaCliente, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=30, choices=TIPO_MOVIMIENTO_CHOICES)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    referencia_venta = models.ForeignKey(Venta, on_delete=models.SET_NULL, null=True, blank=True)
    comentarios = models.TextField(blank=True, null=True)
    saldo_anterior = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_nuevo = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tipo} - ${self.monto}"


class MovimientoCaja(BaseModel):
    """
    Entradas y salidas de efectivo NO relacionadas con venta directa instantánea
    (ej. Retiro de efectivo, Ingreso inicial, Pago de crédito en efectivo).
    """
    TIPO_CHOICES = [
        ('INGRESO', 'Ingreso'),
        ('RETIRO', 'Retiro'),
    ]
    
    turno = models.ForeignKey(Turno, on_delete=models.CASCADE, related_name='movimientos_caja')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    concepto = models.CharField(max_length=200)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tipo} - ${self.monto}"


class SolicitudCancelacion(BaseModel):
    """
    Solicitud de cancelación de ticket que requiere autorización de supervisor.
    Implementa flujo de aprobación con auditoría completa.
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('EXPIRADA', 'Expirada'),
    ]
    
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='solicitudes_cancelacion')
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='cancelaciones_solicitadas_pos',
        help_text="Usuario que solicita la cancelación"
    )
    motivo = models.TextField(help_text="Motivo de la cancelación (requerido)")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    
    # Autorización
    autorizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='cancelaciones_autorizadas_pos',
        help_text="Supervisor que autorizó la cancelación"
    )
    fecha_autorizacion = models.DateTimeField(null=True, blank=True)
    comentarios_autorizacion = models.TextField(
        blank=True, 
        null=True,
        help_text="Comentarios del supervisor al aprobar/rechazar"
    )
    
    # Auditoría
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    ip_solicitante = models.GenericIPAddressField(null=True, blank=True)
    ip_autorizador = models.GenericIPAddressField(null=True, blank=True)
    turno = models.ForeignKey(
        Turno, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='solicitudes_cancelacion'
    )
    
    class Meta:
        ordering = ['-fecha_solicitud']
        permissions = [
            # OPERACIONES DE CAJA
            ("open_cash_register", "Abrir turno de caja"),
            ("close_cash_register", "Cerrar turno de caja"),
            ("view_other_shifts", "Ver turnos de otros cajeros"),
            ("modify_closed_shift", "Modificar turnos cerrados"),
            
            # VENTAS
            ("view_all_sales", "Ver ventas de todos los cajeros"),
            ("apply_discount", "Aplicar descuentos a ventas"),
            ("apply_special_discount", "Aplicar descuentos especiales (sin límite)"),
            ("sell_on_credit", "Vender a crédito (cuenta corriente)"),
            ("sell_below_cost", "Vender por debajo del precio de costo"),
            
            # CANCELACIONES Y DEVOLUCIONES
            ("request_cancellation", "Solicitar cancelación de ventas"),
            ("authorize_cancellation", "Autorizar cancelaciones de ventas"),
            ("request_refund", "Solicitar devoluciones de productos"),
            ("authorize_refund", "Autorizar devoluciones de productos"),
            ("void_transaction", "Anular transacciones del día"),
            
            # CUENTAS DE CLIENTES
            ("manage_customer_credit", "Gestionar crédito de clientes"),
            ("receive_payments", "Recibir abonos de clientes"),
            ("adjust_customer_balance", "Ajustar saldos de clientes manualmente"),
            
            # MOVIMIENTOS DE CAJA
            ("register_cash_income", "Registrar ingresos de efectivo"),
            ("register_cash_withdrawal", "Registrar retiros de efectivo"),
            ("view_cash_movements", "Ver movimientos de caja"),
            
            # REPORTES POS
            ("view_pos_reports", "Ver reportes del punto de venta"),
            ("export_pos_reports", "Exportar reportes del punto de venta"),
            ("view_sales_statistics", "Ver estadísticas de ventas"),
        ]
        verbose_name = "Solicitud de Cancelación"
        verbose_name_plural = "Solicitudes de Cancelación"
    
    def __str__(self):
        return f"Cancelación {self.venta.folio} - {self.estado}"
    
    def aprobar(self, autorizador, ip=None, comentarios=None):
        """Aprueba la solicitud y ejecuta la cancelación."""
        from django.utils import timezone
        
        self.estado = 'APROBADA'
        self.autorizado_por = autorizador
        self.fecha_autorizacion = timezone.now()
        self.ip_autorizador = ip
        self.comentarios_autorizacion = comentarios
        self.save()
        
        # Ejecutar la cancelación en la venta
        self.venta.estado = 'CANCELADA'
        self.venta.cancelado_por = autorizador
        self.venta.motivo_cancelacion = self.motivo
        self.venta.save()
        
        return True
    
    def rechazar(self, autorizador, ip=None, comentarios=None):
        """Rechaza la solicitud."""
        from django.utils import timezone
        
        self.estado = 'RECHAZADA'
        self.autorizado_por = autorizador
        self.fecha_autorizacion = timezone.now()
        self.ip_autorizador = ip
        self.comentarios_autorizacion = comentarios
        self.save()
        
        return True


register_audit(CuentaCliente)
register_audit(SolicitudCancelacion)
