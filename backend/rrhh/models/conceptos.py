from django.db import models
from core.models import SoftDeleteModel, register_audit, EmpresaOwnedModel, MultiTenantManager

class TipoConcepto(models.TextChoices):
    PERCEPCION = 'PERCEPCION', 'Percepción'
    DEDUCCION = 'DEDUCCION', 'Deducción'
    OTRO_PAGO = 'OTRO_PAGO', 'Otros Pagos'

class ConceptoNomina(SoftDeleteModel, EmpresaOwnedModel):
    objects = MultiTenantManager()
    
    codigo = models.CharField(max_length=10, unique=True, help_text="Ej: P001, D001")
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TipoConcepto.choices)
    clave_sat = models.CharField(max_length=10, blank=True, null=True, help_text="Código del catálogo SAT")
    es_fijo = models.BooleanField(default=False, help_text="Si se aplica automáticamente en cada periodo")
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

register_audit(ConceptoNomina)
