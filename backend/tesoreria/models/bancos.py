from django.db import models
from core.models import SoftDeleteModel, register_audit

class Banco(SoftDeleteModel):
    """
    Catálogo de bancos (puede estar en contabilidad o aquí).
    Si ya existe en contabilidad, usar FK a ese modelo.
    """
    nombre = models.CharField(max_length=100)
    nombre_corto = models.CharField(max_length=50)
    rfc = models.CharField(max_length=13, blank=True, null=True)
    codigo_sat = models.CharField(max_length=10, blank=True, null=True, help_text="Código SAT del banco")
    
    class Meta:
        verbose_name = "Banco"
        verbose_name_plural = "Bancos"
    
    def __str__(self):
        return self.nombre_corto


class CuentaBancaria(SoftDeleteModel):
    """
    Cuentas bancarias de la empresa para gestión de tesorería.
    Integrada con el catálogo contable.
    """
    TIPO_CUENTA_CHOICES = [
        ('CHEQUES', 'Cuenta de Cheques'),
        ('INVERSION', 'Cuenta de Inversión'),
        ('NOMINA', 'Cuenta de Nómina'),
        ('AHORRO', 'Cuenta de Ahorro'),
    ]
    
    MONEDA_CHOICES = [
        ('MXN', 'Peso Mexicano'),
        ('USD', 'Dólar Estadounidense'),
        ('EUR', 'Euro'),
    ]
    
    # Relación con banco (usar contabilidad.Banco si existe, sino usar el local)
    banco = models.ForeignKey(
        'contabilidad.Banco', 
        on_delete=models.PROTECT, 
        related_name='cuentas_tesoreria'
    )
    empresa = models.ForeignKey(
        'core.Empresa', 
        on_delete=models.PROTECT, 
        related_name='cuentas_bancarias'
    )
    
    numero_cuenta = models.CharField(max_length=20, help_text="Número de cuenta")
    clabe = models.CharField(max_length=18, blank=True, null=True, help_text="CLABE interbancaria")
    tipo_cuenta = models.CharField(max_length=20, choices=TIPO_CUENTA_CHOICES, default='CHEQUES')
    
    moneda = models.CharField(max_length=3, choices=MONEDA_CHOICES, default='MXN')
    saldo_actual = models.DecimalField(
        max_digits=16, 
        decimal_places=2, 
        default=0, 
        help_text="Saldo según sistema (se recalcula con movimientos)"
    )
    saldo_bancario = models.DecimalField(
        max_digits=16, 
        decimal_places=2, 
        default=0, 
        help_text="Saldo según estado de cuenta (para conciliación)"
    )
    
    # Integración con Contabilidad
    cuenta_contable = models.ForeignKey(
        'contabilidad.CuentaContable', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Cuenta contable asociada (ej: 1020-001 Bancos BBVA)"
    )
    
    es_principal = models.BooleanField(default=False, help_text="Cuenta principal para operaciones")
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Cuenta Bancaria"
        verbose_name_plural = "Cuentas Bancarias"
        unique_together = ['banco', 'numero_cuenta']
        permissions = [
            ("view_bank_balances", "Ver saldos bancarios"),
            ("conciliate_bank", "Conciliar cuentas bancarias"),
            ("register_bank_movement", "Registrar movimientos bancarios"),
            ("create_payment_request", "Solicitar pagos"),
            ("authorize_payment", "Autorizar pagos y egresos"),
            ("execute_payment", "Ejecutar pagos (emitir cheques/transferencias)"),
            ("void_payment", "Anular pagos emitidos"),
            ("view_treasury_reports", "Ver reportes de tesorería"),
            ("export_treasury_reports", "Exportar reportes de tesorería"),
        ]
    
    def __str__(self):
        return f"{self.banco.nombre_corto} - {self.numero_cuenta} ({self.moneda})"


register_audit(CuentaBancaria)
