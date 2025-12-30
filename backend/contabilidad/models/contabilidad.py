from django.db import models
from core.models import SoftDeleteModel, register_audit
from .proyectos import Proyecto

class CuentaContable(SoftDeleteModel):
    """Catálogo de Cuentas (SAT / Interno)."""
    TIPO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('PASIVO', 'Pasivo'),
        ('CAPITAL', 'Capital'),
        ('INGRESOS', 'Ingresos'),
        ('COSTOS', 'Costos'),
        ('GASTOS', 'Gastos'),
        ('ORDEN', 'Cuentas de Orden'),
    ]
    NATURALEZA_CHOICES = [('DEUDORA', 'Deudora'), ('ACREEDORA', 'Acreedora')]
    
    codigo = models.CharField(max_length=50, unique=True, help_text="Ej. 100-01-000")
    nombre = models.CharField(max_length=200)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    naturaleza = models.CharField(max_length=15, choices=NATURALEZA_CHOICES)
    codigo_agrupador_sat = models.CharField(max_length=20, blank=True, null=True)
    cuenta_padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcuentas')
    afectable = models.BooleanField(default=True, help_text="Si es false, es cuenta de acumulación")
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class CentroCostos(SoftDeleteModel):
    """Segmentación de gastos."""
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    proyecto_relacionado = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Poliza(SoftDeleteModel):
    """Header de Asiento Contable."""
    TIPO_POLIZA_CHOICES = [
        ('DIARIO', 'Diario'),
        ('INGRESO', 'Ingreso'),
        ('EGRESO', 'Egreso'),
        ('CHEQUE', 'Cheque'),
        ('ORDEN', 'Orden'),
    ]
    
    fecha = models.DateField()
    tipo = models.CharField(max_length=20, choices=TIPO_POLIZA_CHOICES)
    numero = models.IntegerField() # Consecutivo por tipo/mes
    concepto = models.CharField(max_length=255)
    
    # Claves foraneas opcionales para trazabilidad
    origen_modulo = models.CharField(max_length=50, blank=True, null=True, help_text="Ej. COMPRAS, NOMINA")
    origen_id = models.CharField(max_length=50, blank=True, null=True, help_text="ID del documento origen")
    
    # Totales para integridad
    total_debe = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_haber = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cuadrada = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.tipo} {self.numero} - {self.concepto}"

class DetallePoliza(SoftDeleteModel):
    poliza = models.ForeignKey(Poliza, on_delete=models.CASCADE, related_name='detalles')
    cuenta = models.ForeignKey(CuentaContable, on_delete=models.PROTECT)
    concepto = models.CharField(max_length=200, blank=True, null=True) # Concepto por linea
    debe = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    haber = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    referencia = models.CharField(max_length=50, blank=True, null=True) # Factura, Cheque
    centro_costos = models.ForeignKey(CentroCostos, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.cuenta} | D:{self.debe} H:{self.haber}"

register_audit(CentroCostos)
register_audit(Poliza)
register_audit(DetallePoliza)
