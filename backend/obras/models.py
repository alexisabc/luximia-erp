from django.db import models
from core.models import SoftDeleteModel

class Obra(SoftDeleteModel):
    nombre = models.CharField(max_length=200, verbose_name="Nombre de la Obra")
    codigo = models.SlugField(max_length=50, unique=True, verbose_name="Código")
    fecha_inicio = models.DateField(verbose_name="Fecha de Inicio")
    fecha_fin = models.DateField(null=True, blank=True, verbose_name="Fecha de Fin")
    presupuesto_total = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name="Presupuesto Total")
    direccion = models.TextField(blank=True, verbose_name="Dirección")
    cliente = models.CharField(max_length=200, blank=True, null=True, verbose_name="Cliente")

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
    monto_comprometido = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    monto_ejecutado = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    @property
    def disponible(self):
        return self.monto_estimado - (self.monto_comprometido + self.monto_ejecutado)

    class Meta:
        verbose_name = "Partida Presupuestal"
        verbose_name_plural = "Partidas Presupuestales"

    def __str__(self):
        return f"{self.centro_costo.codigo} - {self.categoria}"
