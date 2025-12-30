from django.db import models
from core.models import SoftDeleteModel, register_audit
from .catalogos import Moneda, MetodoPago, FormaPago, Cliente
from .proyectos import Proyecto

class Factura(SoftDeleteModel):
    """Repositorio de Facturas (CFDIs) Emitidas y Recibidas."""
    TIPO_COMPROBANTE_CHOICES = [
        ('I', 'Ingreso'),
        ('E', 'Egreso'),
        ('P', 'Pago'),
        ('N', 'Nómina'),
        ('T', 'Traslado'),
    ]
    ESTADO_CHOICES = [
        ('VIGENTE', 'Vigente'), 
        ('CANCELADO', 'Cancelado'),
        ('PENDIENTE', 'Pendiente de Timbrado') # Para facturación interna antes de timbrar
    ]

    version = models.CharField(max_length=5, default='4.0')
    uuid = models.CharField(max_length=36, unique=True, null=True, blank=True, help_text="Folio Fiscal (UUID) del SAT")
    serie = models.CharField(max_length=20, blank=True, null=True)
    folio = models.CharField(max_length=20, blank=True, null=True)
    fecha_emision = models.DateTimeField()
    fecha_timbrado = models.DateTimeField(null=True, blank=True)
    
    # Emisor
    emisor_rfc = models.CharField(max_length=13)
    emisor_nombre = models.CharField(max_length=255)
    emisor_regimen = models.CharField(max_length=10, blank=True, null=True)
    
    # Receptor
    receptor_rfc = models.CharField(max_length=13)
    receptor_nombre = models.CharField(max_length=255)
    receptor_regimen = models.CharField(max_length=10, blank=True, null=True)
    uso_cfdi = models.CharField(max_length=10, blank=True, null=True)
    
    # Totales
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    descuento = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    impuestos_trasladados = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    impuestos_retenidos = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2)
    
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT, null=True, blank=True)
    tipo_cambio = models.DecimalField(max_digits=12, decimal_places=4, default=1)
    
    tipo_comprobante = models.CharField(max_length=1, choices=TIPO_COMPROBANTE_CHOICES, default='I')
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, null=True, blank=True)
    forma_pago = models.ForeignKey(FormaPago, on_delete=models.SET_NULL, null=True, blank=True) # Podría requerir ajuste si FormaPago actual no es compatible con SAT c_FormaPago
    
    estado_sat = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='VIGENTE')
    
    # Archivos
    xml_archivo = models.FileField(upload_to='facturas/xml/%Y/%m/', blank=True, null=True)
    pdf_archivo = models.FileField(upload_to='facturas/pdf/%Y/%m/', blank=True, null=True)
    
    # Relaciones internas (opcionales para vincular con operación)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')
    proyecto = models.ForeignKey(Proyecto, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')
    
    def __str__(self):
        return f"{self.serie or ''}{self.folio or ''} - {self.receptor_nombre} - ${self.total}"

class CertificadoDigital(SoftDeleteModel):
    """Almacén de Certificados (FIEL, CSD) encriptados."""
    TIPO_CERT_CHOICES = [
        ('FIEL', 'Firma Electrónica (FIEL)'),
        ('CSD', 'Certificado de Sello Digital (CSD)'),
    ]
    
    nombre = models.CharField(max_length=100, help_text="Ej. CSD Principal 2024")
    rfc = models.CharField(max_length=13, help_text="RFC al que pertenece el certificado")
    tipo = models.CharField(max_length=10, choices=TIPO_CERT_CHOICES, default='CSD')
    
    # Archivos
    archivo_cer = models.FileField(upload_to='sat/certs/', help_text="Archivo .cer (Público)")
    archivo_key = models.FileField(upload_to='sat/keys/', help_text="Archivo .key (Privado) - Proteger acceso")
    password = models.CharField(max_length=255, help_text="Contraseña de la clave privada (Encriptada)")
    
    # Metadatos
    fecha_inicio_validez = models.DateTimeField(null=True, blank=True)
    fecha_fin_validez = models.DateTimeField(null=True, blank=True)
    numero_serie = models.CharField(max_length=50, blank=True, null=True)
    
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.tipo} - {self.rfc} - {self.nombre}"

class BuzonMensaje(SoftDeleteModel):
    """Mensajes simulados o scrapeados del Buzón Tributario."""
    rfc = models.CharField(max_length=13)
    asunto = models.CharField(max_length=200)
    cuerpo = models.TextField()
    fecha_recibido = models.DateTimeField()
    leido = models.BooleanField(default=False)
    # Importancia: Normal, Alta (Requerimiento)
    es_requerimiento = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.rfc} - {self.asunto}"

class OpinionCumplimiento(SoftDeleteModel):
    """Historial de Opiniones de Cumplimiento (32-D)."""
    ESTADO_CHOICES = [
        ('POSITIVA', 'Positiva'),
        ('NEGATIVA', 'Negativa'),
        ('SIN_OBLIGACIONES', 'Sin Obligaciones'),
    ]
    
    rfc = models.CharField(max_length=13)
    fecha_consulta = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES)
    folio = models.CharField(max_length=50, blank=True, null=True)
    archivo_pdf = models.FileField(upload_to='sat/opiniones/', blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.rfc} - {self.estado} ({self.fecha_consulta.date()})"

register_audit(Factura)
register_audit(CertificadoDigital)
register_audit(BuzonMensaje)
register_audit(OpinionCumplimiento)
