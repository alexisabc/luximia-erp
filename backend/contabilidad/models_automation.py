from django.db import models
from core.models import SoftDeleteModel, register_audit

class PlantillaAsiento(SoftDeleteModel):
    """
    Define una plantilla para generar pólizas automáticas.
    Ej: "Provisión de Gastos", "Provisión de Ventas", "Pago a Proveedores".
    """
    TIPO_CHOICES = [
        ('PROVISION', 'Provisión (Diario)'),
        ('INGRESO', 'Ingreso'),
        ('EGRESO', 'Egreso (Pago)'),
    ]
    nombre = models.CharField(max_length=100)
    tipo_poliza = models.CharField(max_length=20, choices=TIPO_CHOICES)
    concepto_patron = models.CharField(max_length=255, help_text="Ej: Provisión Fac. {serie}-{folio} {receptor}")
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class ReglaAsiento(SoftDeleteModel):
    """
    Una línea de la plantilla. Define cómo calcular el Cargo o Abono.
    """
    MOVIMIENTO_CHOICES = [('CARGO', 'Cargo'), ('ABONO', 'Abono')]
    ORIGEN_DATO_CHOICES = [
        ('SUBTOTAL', 'Subtotal'),
        ('TOTAL', 'Total (Neto)'),
        ('IVA_16', 'IVA 16%'),
        ('IVA_RET', 'IVA Retenido'),
        ('ISR_RET', 'ISR Retenido'),
        ('IEPS', 'IEPS'),
        ('FIJO', 'Monto Fijo (Manual)'),
    ]
    
    plantilla = models.ForeignKey(PlantillaAsiento, on_delete=models.CASCADE, related_name='reglas')
    cuenta_base = models.ForeignKey('contabilidad.CuentaContable', on_delete=models.PROTECT, help_text="Cuenta default")
    tipo_movimiento = models.CharField(max_length=10, choices=MOVIMIENTO_CHOICES)
    origen_dato = models.CharField(max_length=20, choices=ORIGEN_DATO_CHOICES)
    orden = models.PositiveIntegerField(default=1)
    
    # Opciones avanzadas (Phase 3 maybe)
    # usar_cuenta_cliente = models.BooleanField(default=False) # Si True, ignora cuenta_base y busca la del Cliente/Prov

    def __str__(self):
        return f"{self.plantilla} - {self.tipo_movimiento} ({self.origen_dato})"

register_audit(PlantillaAsiento)
register_audit(ReglaAsiento)
