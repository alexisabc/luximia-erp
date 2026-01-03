from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel
from .productos import Insumo

class Requisicion(SoftDeleteModel):
    ESTADOS = (
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('COMPRADA', 'Comprada (OC Generada)'),
    )
    PRIORIDADES = (
        ('NORMAL', 'Normal'),
        ('URGENTE', 'Urgente'),
    )

    usuario_solicitante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='requisiciones')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    
    # Relación opcional con Obras (Loose coupling con strings)
    obra = models.ForeignKey('obras.Obra', on_delete=models.SET_NULL, null=True, blank=True, related_name='requisiciones')
    centro_costo = models.ForeignKey('obras.CentroCosto', on_delete=models.SET_NULL, null=True, blank=True, related_name='requisiciones')
    
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    prioridad = models.CharField(max_length=10, choices=PRIORIDADES, default='NORMAL')
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Requisición"
        verbose_name_plural = "Requisiciones"
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"REQ-{self.id} | {self.usuario_solicitante}"

class DetalleRequisicion(SoftDeleteModel):
    requisicion = models.ForeignKey(Requisicion, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Insumo, on_delete=models.SET_NULL, null=True, blank=True)
    producto_texto = models.CharField(max_length=200, blank=True, help_text="Descripción si no existe el producto en catálogo")
    cantidad = models.DecimalField(max_digits=12, decimal_places=2)
    costo_estimado_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    @property
    def total_estimado(self):
        return self.cantidad * self.costo_estimado_unitario

    def __str__(self):
        # Insumo tiene 'descripcion', no 'nombre'
        prod = self.producto.descripcion if self.producto else self.producto_texto
        return f"{self.cantidad} x {prod}"
