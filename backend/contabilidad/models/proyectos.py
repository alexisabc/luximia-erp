from django.db import models
from core.models import SoftDeleteModel, register_audit
from .catalogos import Moneda

class Proyecto(SoftDeleteModel):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    numero_upes = models.PositiveIntegerField(default=0)
    niveles = models.PositiveIntegerField(default=0)
    metros_cuadrados = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    numero_estacionamientos = models.PositiveIntegerField(default=0)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estado = models.CharField(max_length=50, default="Planificado")

    def __str__(self):
        return self.nombre

class UPE(SoftDeleteModel):
    ESTADO_CHOICES = [
        ("DISPONIBLE", "Disponible"),
        ("VENDIDA", "Vendida"),
        ("PAGADA", "Pagada"),
        ("BLOQUEADA", "Bloqueada"),
    ]
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="upes")
    identificador = models.CharField(max_length=100, unique=True)
    nivel = models.PositiveIntegerField(default=1)
    metros_cuadrados = models.DecimalField(max_digits=12, decimal_places=2)
    estacionamientos = models.PositiveIntegerField(default=0)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2)
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="DISPONIBLE")

    class Meta:
        permissions = [
            # ===== CATÁLOGO DE CUENTAS =====
            ("manage_chart_of_accounts", "Gestionar catálogo de cuentas contables"),
            ("close_accounting_period", "Cerrar períodos contables"),
            
            # ===== PÓLIZAS =====
            ("create_journal_entry", "Crear pólizas contables"),
            ("post_journal_entry", "Aplicar/Mayorizar pólizas"),
            ("reverse_journal_entry", "Revertir pólizas aplicadas"),
            ("delete_journal_entry", "Eliminar pólizas contables"),
            
            # ===== FACTURACIÓN =====
            ("issue_invoice", "Emitir facturas (CFDI)"),
            ("cancel_invoice", "Cancelar facturas (CFDI)"),
            ("view_fiscal_documents", "Ver documentos fiscales"),
            
            # ===== TIPOS DE CAMBIO =====
            ("manage_exchange_rates", "Gestionar tipos de cambio"),
            
            # ===== REPORTES CONTABLES =====
            ("view_financial_statements", "Ver estados financieros"),
            ("export_financial_reports", "Exportar reportes financieros"),
            ("view_diot", "Ver DIOT"),
            ("generate_diot", "Generar DIOT"),
            
            # ===== IA CONTABLE =====
            ("use_ai_accounting", "Usar IA para contabilidad"),
        ]

    def __str__(self):
        return self.identificador

register_audit(Proyecto)
register_audit(UPE)
