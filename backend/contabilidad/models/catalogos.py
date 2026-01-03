from django.db import models
from core.models import SoftDeleteModel, register_audit

class Moneda(SoftDeleteModel):
    codigo = models.CharField(max_length=3, unique=True)
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.codigo

class Banco(SoftDeleteModel):
    clave = models.CharField(max_length=20, unique=True)
    nombre_corto = models.CharField(max_length=100)
    razon_social = models.CharField(max_length=200)

    def __str__(self):
        return self.nombre_corto

class MetodoPago(SoftDeleteModel):
    """Catálogo de métodos de pago permitidos."""
    METODO_CHOICES = [
        ("N/A", "N/A"),
        ("EFECTIVO", "EFECTIVO"),
        ("TARJETA_CREDITO", "TARJETA DE CREDITO"),
        ("TARJETA_DEBITO", "TARJETA DE DEBITO"),
        ("TARJETA_PREPAGO", "TARJETA DE PREPAGO"),
        ("CHEQUE_NOMINATIVO", "CHEQUE NOMINATIVO"),
        ("CHEQUE_CAJA", "CHEQUE DE CAJA"),
        ("CHEQUE_VIAJERO", "CHEQUE DE VIAJERO"),
        ("TRANSFERENCIA_INTERBANCARIA", "TRANSFERENCIA INTERBANCARIA"),
        ("TRANSFERENCIA_MISMA_INSTITUCION", "TRANSFERENCIA MISMA INSTITUCION"),
        ("TRANSFERENCIA_INTERNACIONAL", "TRANSFERENCIA INTERNACIONAL"),
        ("ORDEN_PAGO", "ORDEN DE PAGO"),
        ("GIRO", "GIRO"),
        ("ORO_PLATINO", "ORO O PLATINO AMONEDADOS"),
        ("PLATA", "PLATA AMONEDADA"),
        ("METALES_PRECIOSOS", "METALES PRECIOSO"),
    ]
    nombre = models.CharField(max_length=40, choices=METODO_CHOICES, unique=True)

    def __str__(self):
        return self.get_nombre_display()

class Cliente(SoftDeleteModel):
    nombre_completo = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    
    # Datos Fiscales
    rfc = models.CharField(max_length=13, blank=True, null=True, help_text="Para facturación")
    razon_social = models.CharField(max_length=200, blank=True, null=True)
    codigo_postal = models.CharField(max_length=5, blank=True, null=True)
    regimen_fiscal = models.ForeignKey('contabilidad.SATRegimenFiscal', on_delete=models.SET_NULL, null=True, blank=True)
    uso_cfdi = models.ForeignKey('contabilidad.SATUsoCFDI', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.nombre_completo

class TipoCambio(SoftDeleteModel):
    ESCENARIO_CHOICES = [
        ("PACTADO", "Pactado"),
        ("TOPADO", "Topado"),
        ("BANXICO", "Banxico"),
    ]
    escenario = models.CharField(max_length=20, choices=ESCENARIO_CHOICES)
    fecha = models.DateField()
    valor = models.DecimalField(max_digits=12, decimal_places=4)
    
    moneda_origen = models.ForeignKey(Moneda, on_delete=models.CASCADE, related_name='tipos_cambio_origen', null=True, blank=True)
    moneda_destino = models.ForeignKey(Moneda, on_delete=models.CASCADE, related_name='tipos_cambio_destino', null=True, blank=True)

    class Meta:
        unique_together = ("escenario", "fecha", "moneda_origen", "moneda_destino")

    def __str__(self):
        return f"{self.escenario} - {self.fecha}"

class Vendedor(SoftDeleteModel):
    TIPO_CHOICES = [("INTERNO", "Interno"), ("EXTERNO", "Externo")]
    
    # SAT DIOT Fields
    TIPO_TERCERO_CHOICES = [
        ('04', '04 - Proveedor Nacional'),
        ('05', '05 - Proveedor Extranjero'),
        ('15', '15 - Proveedor Global'),
    ]
    TIPO_OPERACION_CHOICES = [
        ('03', '03 - Prestación de Servicios Profesionales'),
        ('06', '06 - Arrendamiento de Inmuebles'),
        ('85', '85 - Otros'),
    ]
    
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='EXTERNO')
    nombre_completo = models.CharField(max_length=200)
    rfc = models.CharField(max_length=13, blank=True, null=True)
    
    tipo_tercero = models.CharField(max_length=2, choices=TIPO_TERCERO_CHOICES, default='04')
    tipo_operacion = models.CharField(max_length=2, choices=TIPO_OPERACION_CHOICES, default='85')
    
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre_completo

class FormaPago(SoftDeleteModel):
    enganche = models.PositiveSmallIntegerField()
    mensualidades = models.PositiveSmallIntegerField()
    meses = models.PositiveSmallIntegerField()
    contra_entrega = models.PositiveSmallIntegerField()

    def __str__(self):
        return f"{self.enganche}% - {self.mensualidades}% - {self.contra_entrega}%"

class EsquemaComision(SoftDeleteModel):
    ESQUEMA_CHOICES = [("RENTA", "Renta"), ("VENTA", "Venta")]
    esquema = models.CharField(max_length=10, choices=ESQUEMA_CHOICES)
    escenario = models.CharField(max_length=100)
    porcentaje = models.DecimalField(max_digits=6, decimal_places=3)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=16.0)

    def __str__(self):
        return f"{self.esquema} - {self.escenario}"

register_audit(Moneda)
register_audit(Banco)
register_audit(MetodoPago)
register_audit(Cliente)
register_audit(TipoCambio)
register_audit(Vendedor)
register_audit(FormaPago)
register_audit(EsquemaComision)
