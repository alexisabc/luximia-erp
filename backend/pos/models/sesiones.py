from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit

class Caja(SoftDeleteModel):
    """
    Registro físico de puntos de venta (Cajas).
    """
    nombre = models.CharField(max_length=100, unique=True)
    sucursal = models.CharField(max_length=100, blank=True, null=True, default="Matriz")
    saldo_inicial_default = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Saldo inicial sugerido para nuevos turnos"
    )
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class Turno(SoftDeleteModel):
    """
    Sesión de un cajero (Corte de Caja).
    """
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('CERRADA', 'Cerrada'),
        ('ARQUEADA', 'Arqueada'),
    ]

    caja = models.ForeignKey(Caja, on_delete=models.PROTECT, related_name='turnos')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='turnos_pos')
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(blank=True, null=True)
    
    saldo_inicial = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    saldo_final_calculado = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Lo que el sistema calcula"
    )
    saldo_final_declarado = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        help_text="Lo que el cajero contó físicamente"
    )
    diferencia = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')

    class Meta:
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"Turno {self.id} - {self.usuario} ({self.fecha_inicio.date()})"


register_audit(Caja)
register_audit(Turno)
