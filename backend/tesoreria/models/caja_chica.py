from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit

class CajaChica(SoftDeleteModel):
    """
    Fondos de caja chica para gastos menores.
    """
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('CERRADA', 'Cerrada'),
        ('REEMBOLSADA', 'Reembolsada'),
    ]
    
    nombre = models.CharField(
        max_length=100, 
        help_text="Nombre de la caja (ej: Caja Oficina Central)"
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='cajas_responsable'
    )
    empresa = models.ForeignKey(
        'core.Empresa', 
        on_delete=models.PROTECT, 
        related_name='cajas_chicas'
    )
    
    monto_fondo = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Monto del fondo fijo"
    )
    saldo_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    fecha_apertura = models.DateField(auto_now_add=True)
    fecha_cierre = models.DateField(null=True, blank=True)
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')
    
    class Meta:
        verbose_name = "Caja Chica"
        verbose_name_plural = "Cajas Chicas"
        permissions = [
            ("manage_petty_cash", "Gestionar caja chica"),
            ("close_petty_cash", "Cerrar y reembolsar caja chica"),
            ("approve_petty_cash_expense", "Aprobar gastos de caja chica"),
        ]
    
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
    
    comprobante = models.FileField(
        upload_to='cajas_chicas/comprobantes/', 
        blank=True, 
        null=True
    )
    beneficiario = models.CharField(max_length=200, blank=True, null=True)
    
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    
    class Meta:
        verbose_name = "Movimiento de Caja"
        verbose_name_plural = "Movimientos de Caja"
        ordering = ['-fecha', '-id']
    
    def __str__(self):
        return f"{self.tipo} - {self.concepto} (${self.monto})"


register_audit(CajaChica)
register_audit(MovimientoCaja)
