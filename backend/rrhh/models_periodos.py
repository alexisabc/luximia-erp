from django.db import models
from django.utils.translation import gettext_lazy as _

class PeriodoNomina(models.Model):
    TIPO_CHOICES = [
        ('SEMANAL', 'Semanal'),
        ('QUINCENAL', 'Quincenal'),
    ]

    anio = models.IntegerField(verbose_name=_("Año"))
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name=_("Tipo de Nómina"))
    numero = models.IntegerField(verbose_name=_("Número de Periodo"))
    fecha_inicio = models.DateField(verbose_name=_("Fecha Inicio"))
    fecha_fin = models.DateField(verbose_name=_("Fecha Fin"))
    activo = models.BooleanField(default=True, verbose_name=_("Activo"))

    class Meta:
        verbose_name = _("Periodo de Nómina")
        verbose_name_plural = _("Periodos de Nómina")
        ordering = ['anio', 'tipo', 'numero']
        unique_together = ['anio', 'tipo', 'numero']

    def __str__(self):
        return f"{self.get_tipo_display()} {self.anio} - Periodo {self.numero} ({self.fecha_inicio} al {self.fecha_fin})"
