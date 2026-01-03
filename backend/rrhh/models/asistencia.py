from django.db import models
from django.utils import timezone
from core.models import SoftDeleteModel, register_audit, EmpresaOwnedModel, MultiTenantManager
from .empleado import Empleado

class TipoIncidencia(models.TextChoices):
    ASISTENCIA = 'ASISTENCIA', 'Asistencia'
    FALTA = 'FALTA', 'Falta'
    RETARDO = 'RETARDO', 'Retardo'
    VACACIONES = 'VACACIONES', 'Vacaciones'
    INCAPACIDAD = 'INCAPACIDAD', 'Incapacidad'

class OrigenChecada(models.TextChoices):
    MANUAL = 'MANUAL', 'Manual'
    BIOMETRICO = 'BIOMETRICO', 'Biométrico'
    WHATSAPP_BOT = 'WHATSAPP_BOT', 'WhatsApp Bot'

class Asistencia(SoftDeleteModel, EmpresaOwnedModel):
    objects = MultiTenantManager()

    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name='asistencias')
    fecha = models.DateField(default=timezone.now)
    hora_entrada = models.TimeField(null=True, blank=True)
    hora_salida = models.TimeField(null=True, blank=True)
    incidencia = models.CharField(
        max_length=20, 
        choices=TipoIncidencia.choices, 
        default=TipoIncidencia.ASISTENCIA
    )
    origen = models.CharField(
        max_length=20, 
        choices=OrigenChecada.choices, 
        default=OrigenChecada.MANUAL
    )
    ubicacion_gps = models.CharField(max_length=100, null=True, blank=True, help_text="Lat,Lon")

    class Meta:
        verbose_name = "Asistencia"
        verbose_name_plural = "Asistencias"
        unique_together = ('empleado', 'fecha')

    def __str__(self):
        return f"{self.empleado} - {self.fecha} ({self.incidencia})"

class DistribucionCosto(SoftDeleteModel, EmpresaOwnedModel):
    objects = MultiTenantManager()

    asistencia = models.ForeignKey(Asistencia, on_delete=models.CASCADE, related_name='distribuciones')
    obra = models.ForeignKey('obras.Obra', on_delete=models.SET_NULL, null=True, blank=True, related_name='costos_nomina')
    centro_costo = models.ForeignKey('obras.CentroCosto', on_delete=models.SET_NULL, null=True, blank=True)
    porcentaje = models.IntegerField(default=100, help_text="Porcentaje del costo diario asignado a esta obra/CC")

    class Meta:
        verbose_name = "Distribución de Costo"
        verbose_name_plural = "Distribuciones de Costos"

    def __str__(self):
        return f"{self.asistencia.empleado} - {self.obra or 'Oficina'} ({self.porcentaje}%)"

register_audit(Asistencia)
register_audit(DistribucionCosto)
