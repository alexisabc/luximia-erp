from django.db import models
from core.models import SoftDeleteModel, EmpresaOwnedModel, MultiTenantManager

class Obra(SoftDeleteModel, EmpresaOwnedModel):
    # Manager combinando SoftDelete y Empresa
    objects = MultiTenantManager()
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la Obra")
    codigo = models.SlugField(max_length=50, unique=True, verbose_name="Código")
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
