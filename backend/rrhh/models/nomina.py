from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import SoftDeleteModel, register_audit

class NominaCentralizada(SoftDeleteModel):
    """
    Modelo unificado para importar datos históricos de nómina (funnel/embudo).
    Estructura plana para facilitar reportes y visualización.
    """
    # Auditoría de carga
    archivo_origen = models.CharField(max_length=255, blank=True, null=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)
    
    # Campos base
    esquema = models.CharField(max_length=50, default="FISCAL")
    tipo = models.CharField(max_length=50, default="QUINCENAL")
    periodo = models.CharField(max_length=50, default="1")
    empresa = models.CharField(max_length=200) # Nombre de la hoja o razón social
    
    # Datos empleado
    codigo = models.CharField(max_length=50, blank=True, null=True)
    nombre = models.CharField(max_length=255)
    departamento = models.CharField(max_length=200, blank=True, null=True)
    puesto = models.CharField(max_length=200, blank=True, null=True)
    
    # Percepciones y datos base
    neto_mensual = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sueldo_diario = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="SDO")
    dias_trabajados = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="DIAS")
    sueldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Prestaciones
    vacaciones = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prima_vacacional = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    aguinaldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    retroactivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subsidio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_percepciones = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deducciones Individuales
    isr = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    imss = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prestamo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    infonavit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deducciones = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Costos Patronales
    isn = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Impuesto Sobre Nómina")
    previo_costo_social = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_carga_social = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Totales
    total_nomina = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nominas_y_costos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    comision = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_facturacion = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.empresa} - {self.nombre} ({self.periodo})"


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

register_audit(NominaCentralizada)
register_audit(PeriodoNomina)
