from django.db import models
from core.models import SoftDeleteModel
from django.conf import settings

class CobroCliente(SoftDeleteModel):
    """
    Pagos recibidos de Clientes (Cobranza).
    """
    cliente = models.CharField(max_length=200, help_text="Razón Social del Cliente")
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    fecha_cobro = models.DateField()
    
    # Vinculación
    estimacion = models.ForeignKey(
        'obras.Estimacion', 
        on_delete=models.PROTECT, 
        related_name='cobros',
        help_text="Estimación que se está pagando"
    )
    
    # Tesorería
    banco_destino = models.ForeignKey(
        'contabilidad.Banco', 
        on_delete=models.PROTECT, 
        help_text="Cuenta bancaria donde entró el dinero"
    )
    referencia_bancaria = models.CharField(max_length=100, blank=True)
    comprobante = models.FileField(upload_to='tesoreria/cobros/', blank=True, null=True)
    
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.fecha_cobro} - {self.cliente} - ${self.monto}"
