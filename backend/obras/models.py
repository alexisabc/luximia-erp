from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.conf import settings
from django.utils import timezone
from core.models import SoftDeleteModel, EmpresaOwnedModel, MultiTenantManager

class Obra(SoftDeleteModel, EmpresaOwnedModel):
    # Manager combinando SoftDelete y Empresa
    ESTADO_CHOICES = [
        ('PLANEACION', 'En Planeación'),
        ('EJECUCION', 'En Ejecución'),
        ('SUSPENDIDA', 'Suspendida'),
        ('LIQUIDACION', 'En Liquidación'),
        ('CERRADA', 'Cerrada'),
    ]

    objects = MultiTenantManager()
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la Obra")
    codigo = models.SlugField(max_length=50, unique=True, verbose_name="Código")
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PLANEACION')
    fecha_inicio = models.DateField(verbose_name="Fecha de Inicio")
    fecha_fin = models.DateField(null=True, blank=True, verbose_name="Fecha de Fin")
    presupuesto_total = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name="Presupuesto Total")
    direccion = models.TextField(blank=True, verbose_name="Dirección")
    cliente = models.CharField(max_length=200, blank=True, null=True, verbose_name="Cliente")
    
    # Configuración de Contrato
    porcentaje_anticipo = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="% de Amortización por estimación")
    porcentaje_fondo_garantia = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="% de Retención por garantía")

    class Meta:
        verbose_name = "Obra"
        verbose_name_plural = "Obras"

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class CentroCosto(SoftDeleteModel):
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name='centros_costo')
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=50)
    padre = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subcentros')
    nivel = models.IntegerField(default=0)
    es_hoja = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Centro de Costo"
        verbose_name_plural = "Centros de Costos"
        unique_together = ('obra', 'codigo')

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def save(self, *args, **kwargs):
        if self.padre:
            self.nivel = self.padre.nivel + 1
        else:
            self.nivel = 0
        super().save(*args, **kwargs)

class PartidaPresupuestal(SoftDeleteModel):
    CATEGORIAS = (
        ('MATERIALES', 'Materiales'),
        ('MANO_OBRA', 'Mano de Obra'),
        ('MAQUINARIA', 'Maquinaria'),
        ('INDIRECTOS', 'Indirectos'),
        ('SUBCONTRATOS', 'Subcontratos'),
    )

    centro_costo = models.ForeignKey(CentroCosto, on_delete=models.CASCADE, related_name='partidas')
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    monto_estimado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    monto_aditivas = models.DecimalField(max_digits=14, decimal_places=2, default=0, help_text="Aumentos autorizados al presupuesto")
    monto_comprometido = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    monto_ejecutado = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    @property
    def disponible(self):
        return (self.monto_estimado + self.monto_aditivas) - (self.monto_comprometido + self.monto_ejecutado)

    class Meta:
        verbose_name = "Partida Presupuestal"
        verbose_name_plural = "Partidas Presupuestales"

    def __str__(self):
        return f"{self.centro_costo.codigo} - {self.categoria}"

class Estimacion(SoftDeleteModel):
    """
    Cobro de Avance de Obra al Cliente.
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('AUTORIZADA', 'Autorizada'),
        ('FACTURADA', 'Facturada'),
        ('PAGADA', 'Pagada'),
    ]
    
    obra = models.ForeignKey(Obra, on_delete=models.PROTECT, related_name='estimaciones')
    folio = models.CharField(max_length=20, unique=True, editable=False)
    fecha_corte = models.DateField()
    
    # Montos
    monto_avance = models.DecimalField(max_digits=14, decimal_places=2, help_text="Monto bruto de trabajos ejecutados")
    amortizacion_anticipo = models.DecimalField(max_digits=14, decimal_places=2, default=0, help_text="Deducción por anticipo")
    fondo_garantia = models.DecimalField(max_digits=14, decimal_places=2, default=0, help_text="Deducción por garantía")
    
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, help_text="Avance - Deducciones")
    iva = models.DecimalField(max_digits=14, decimal_places=2)
    total = models.DecimalField(max_digits=14, decimal_places=2, help_text="Neto a cobrar")
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    observaciones = models.TextField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.folio:
            count = Estimacion.objects.filter(obra=self.obra).count() + 1
            self.folio = f"{self.obra.codigo}-EST-{count:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio} - {self.total}"


class ActividadProyecto(SoftDeleteModel):
    """
    Actividad o tarea dentro de un proyecto.
    Permite planificación con método de ruta crítica (CPM).
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name='actividades')
    codigo = models.CharField(max_length=20, help_text="Código WBS o identificador único")
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    
    # Planificación
    fecha_inicio_planeada = models.DateField()
    fecha_fin_planeada = models.DateField()
    duracion_dias = models.IntegerField(help_text="Duración estimada en días")
    
    # Ejecución Real
    fecha_inicio_real = models.DateField(null=True, blank=True)
    fecha_fin_real = models.DateField(null=True, blank=True)
    porcentaje_avance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # CPM Calculations (Calculated fields)
    early_start = models.IntegerField(null=True, blank=True, help_text="Inicio más temprano (día)")
    early_finish = models.IntegerField(null=True, blank=True, help_text="Fin más temprano (día)")
    late_start = models.IntegerField(null=True, blank=True, help_text="Inicio más tardío (día)")
    late_finish = models.IntegerField(null=True, blank=True, help_text="Fin más tardío (día)")
    holgura = models.IntegerField(null=True, blank=True, help_text="Slack/Float en días")
    es_critica = models.BooleanField(default=False, help_text="Actividad en ruta crítica")
    
    # Responsabilidad
    responsable = models.ForeignKey(
        'rrhh.Empleado',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actividades_asignadas'
    )
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')

    class Meta:
        verbose_name = "Actividad de Proyecto"
        verbose_name_plural = "Actividades de Proyecto"
        unique_together = ('obra', 'codigo')
        ordering = ['obra', 'fecha_inicio_planeada']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class DependenciaActividad(SoftDeleteModel):
    """
    Define relaciones de precedencia entre actividades.
    """
    TIPO_CHOICES = [
        ('FS', 'Finish-to-Start'),  # La más común: B empieza cuando A termina
        ('SS', 'Start-to-Start'),    # B empieza cuando A empieza
        ('FF', 'Finish-to-Finish'),  # B termina cuando A termina
        ('SF', 'Start-to-Finish'),   # B termina cuando A empieza (raro)
    ]
    
    actividad_predecesora = models.ForeignKey(
        ActividadProyecto,
        on_delete=models.CASCADE,
        related_name='sucesoras'
    )
    actividad_sucesora = models.ForeignKey(
        ActividadProyecto,
        on_delete=models.CASCADE,
        related_name='predecesoras'
    )
    tipo = models.CharField(max_length=2, choices=TIPO_CHOICES, default='FS')
    lag_dias = models.IntegerField(default=0, help_text="Retraso o adelanto en días (+ o -)")

    class Meta:
        verbose_name = "Dependencia de Actividad"
        verbose_name_plural = "Dependencias de Actividades"
        unique_together = ('actividad_predecesora', 'actividad_sucesora')

    def __str__(self):
        return f"{self.actividad_predecesora.codigo} -> {self.actividad_sucesora.codigo} ({self.tipo})"


class AsignacionRecurso(SoftDeleteModel):
    TIPO_RECURSO_CHOICES = [
        ('LABOR', 'Mano de Obra'),
        ('EQUIPO', 'Maquinaria y Equipo'),
        ('MATERIAL', 'Insumos/Materiales'),
    ]
    
    actividad = models.ForeignKey(ActividadProyecto, on_delete=models.CASCADE, related_name='recursos')
    tipo_recurso = models.CharField(max_length=20, choices=TIPO_RECURSO_CHOICES)
    
    # Generic Relation
    content_type = models.ForeignKey('contenttypes.ContentType', on_delete=models.CASCADE, null=True)
    object_id = models.PositiveIntegerField(null=True)
    recurso = GenericForeignKey('content_type', 'object_id')
    
    cantidad_asignada = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    porcentaje_dedicacion = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)

    class Meta:
        verbose_name = "Asignación de Recurso"
        verbose_name_plural = "Asignaciones de Recursos"

class OrdenCambio(SoftDeleteModel):
    TIPO_CHOICES = [
        ('ADITIVA', 'Aditiva (+ Presupuesto)'),
        ('DEDUCTIVA', 'Deductiva (- Presupuesto)'),
        ('REPROGRAMACION', 'Reprogramación (+/- Tiempo)'),
    ]
    ESTADO_CHOICES = [
        ('SOLICITADA', 'Solicitada'),
        ('REVISADA', 'Revisada'),
        ('AUTORIZADA', 'Autorizada'),
        ('RECHAZADA', 'Rechazada'),
    ]
    
    obra = models.ForeignKey(Obra, on_delete=models.CASCADE, related_name='ordenes_cambio')
    folio = models.CharField(max_length=20, unique=True, editable=False)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    justificacion = models.TextField()
    
    # Impacto Presupuestal
    partida = models.ForeignKey(PartidaPresupuestal, on_delete=models.SET_NULL, null=True, blank=True)
    monto_impacto = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    # Impacto Cronograma
    actividad = models.ForeignKey(ActividadProyecto, on_delete=models.SET_NULL, null=True, blank=True)
    dias_impacto = models.IntegerField(default=0)
    
    # Auditoría
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='SOLICITADA')
    solicitado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='ordenes_cambio_solicitadas')
    autorizado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_cambio_autorizadas')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_autorizacion = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.folio:
            count = OrdenCambio.objects.filter(obra=self.obra).count() + 1
            self.folio = f"{self.obra.codigo}-OC-{count:03d}"
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Orden de Cambio"
        verbose_name_plural = "Ordenes de Cambio"

from core.models import register_audit
register_audit(Obra)
register_audit(PartidaPresupuestal)
register_audit(ActividadProyecto)
register_audit(OrdenCambio)
