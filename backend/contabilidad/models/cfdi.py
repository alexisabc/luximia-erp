from django.db import models
from django.conf import settings
from django.utils import timezone
from core.models import SoftDeleteModel, EmpresaOwnedModel, MultiTenantManager, register_audit

class Factura(SoftDeleteModel, EmpresaOwnedModel):
    """
    Comprobante Fiscal Digital por Internet (CFDI 4.0)
    Representa una factura electrónica según normativa SAT
    """
    objects = MultiTenantManager()
    
    TIPO_COMPROBANTE = [
        ('I', 'Ingreso'),
        ('E', 'Egreso'),
        ('T', 'Traslado'),
        ('N', 'Nómina'),
        ('P', 'Pago'),
    ]
    
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('TIMBRADA', 'Timbrada'),
        ('CANCELADA', 'Cancelada'),
        ('ERROR', 'Error de Timbrado'),
    ]
    
    # Identificadores
    folio = models.CharField(max_length=20, db_index=True)
    serie = models.CharField(max_length=10, blank=True, default='A')
    uuid = models.UUIDField(null=True, blank=True, unique=True, db_index=True, 
                           verbose_name="Folio Fiscal (UUID)")
    
    # Relaciones
    cliente = models.ForeignKey('contabilidad.Cliente', on_delete=models.PROTECT, 
                               related_name='facturas')
    estimacion = models.ForeignKey('obras.Estimacion', on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='facturas')
    
    # Datos Fiscales
    tipo_comprobante = models.CharField(max_length=1, choices=TIPO_COMPROBANTE, default='I')
    fecha = models.DateTimeField(default=timezone.now)
    fecha_timbrado = models.DateTimeField(null=True, blank=True)
    lugar_expedicion = models.CharField(max_length=5, help_text="Código Postal de expedición", 
                                       null=True, blank=True)
    
    # Método y Forma de Pago
    forma_pago = models.ForeignKey('CFDIFormaPago', on_delete=models.PROTECT, 
                                   help_text="Ej: 03-Transferencia")
    metodo_pago = models.ForeignKey('CFDIMetodoPago', on_delete=models.PROTECT,
                                    help_text="PUE o PPD")
    condiciones_pago = models.CharField(max_length=200, blank=True,
                                       help_text="Ej: Pago a 30 días")
    
    # Montos
    moneda = models.CharField(max_length=3, default='MXN')
    tipo_cambio = models.DecimalField(max_digits=12, decimal_places=6, default=1.0)
    subtotal = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    descuento = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    
    # Archivos y Datos XML
    xml_original = models.TextField(blank=True, help_text="XML antes de timbrar")
    xml_timbrado = models.TextField(blank=True, help_text="XML con UUID del PAC")
    cadena_original = models.TextField(blank=True)
    sello_digital = models.TextField(blank=True)
    sello_sat = models.TextField(blank=True)
    numero_certificado_sat = models.CharField(max_length=20, blank=True)
    fecha_certificacion_sat = models.DateTimeField(null=True, blank=True)
    
    pdf_archivo = models.FileField(upload_to='facturas/pdf/', null=True, blank=True)
    
    # Control y Estado
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR',
                             db_index=True)
    motivo_cancelacion = models.TextField(blank=True)
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)
    uuid_sustitucion = models.UUIDField(null=True, blank=True,
                                       help_text="UUID de factura que sustituye a esta")
    
    # Auditoría
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                   related_name='facturas_creadas', null=True, blank=True)
    
    # Envío
    correo_enviado = models.BooleanField(default=False)
    fecha_envio_correo = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Factura Electrónica (CFDI)"
        verbose_name_plural = "Facturas Electrónicas"
        ordering = ['-fecha']
        unique_together = [('empresa', 'serie', 'folio')]
        indexes = [
            models.Index(fields=['uuid']),
            models.Index(fields=['estado', 'fecha']),
            models.Index(fields=['cliente', 'fecha']),
        ]
    
    def __str__(self):
        return f"{self.serie}-{self.folio} - {self.cliente.nombre_completo}"
    
    def save(self, *args, **kwargs):
        if not self.folio:
            # Generar folio automático
            ultimo = Factura.objects.filter(
                empresa=self.empresa,
                serie=self.serie
            ).order_by('-folio').first()
            
            if ultimo and ultimo.folio.isdigit():
                self.folio = str(int(ultimo.folio) + 1).zfill(6)
            else:
                self.folio = '000001'
        
        super().save(*args, **kwargs)


class ConceptoFactura(models.Model):
    """
    Línea de detalle de la factura (productos/servicios)
    """
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='conceptos')
    numero_linea = models.IntegerField()
    
    # Catálogos SAT
    clave_prod_serv = models.ForeignKey('CFDIClaveProdServ', on_delete=models.PROTECT,
                                       verbose_name="Clave Producto/Servicio SAT")
    clave_unidad = models.ForeignKey('CFDIUnidad', on_delete=models.PROTECT,
                                     verbose_name="Unidad de Medida SAT")
    
    # Descripción y Cantidades
    no_identificacion = models.CharField(max_length=100, blank=True,
                                        help_text="SKU o código interno")
    descripcion = models.TextField()
    cantidad = models.DecimalField(max_digits=12, decimal_places=2)
    valor_unitario = models.DecimalField(max_digits=16, decimal_places=6)
    importe = models.DecimalField(max_digits=16, decimal_places=2)
    descuento = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    
    # Impuestos
    objeto_imp = models.CharField(max_length=2, default='02',
                                  help_text="01=No objeto, 02=Sí objeto, 03=Sí objeto no obligado")
    
    class Meta:
        ordering = ['numero_linea']
        verbose_name = "Concepto de Factura"
        verbose_name_plural = "Conceptos de Factura"
    
    def __str__(self):
        return f"{self.numero_linea}. {self.descripcion[:50]}"
    
    def save(self, *args, **kwargs):
        # Calcular importe automáticamente
        if not self.importe:
            self.importe = self.cantidad * self.valor_unitario - self.descuento
        super().save(*args, **kwargs)


class ImpuestoConcepto(models.Model):
    """
    Impuestos trasladados o retenidos por concepto
    """
    TIPO_CHOICES = [
        ('TRASLADO', 'Traslado'),
        ('RETENCION', 'Retención'),
    ]
    
    TIPO_FACTOR_CHOICES = [
        ('Tasa', 'Tasa'),
        ('Cuota', 'Cuota'),
        ('Exento', 'Exento'),
    ]
    
    concepto = models.ForeignKey(ConceptoFactura, on_delete=models.CASCADE, 
                                related_name='impuestos')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    impuesto = models.CharField(max_length=3, help_text="002=IVA, 001=ISR, 003=IEPS")
    tipo_factor = models.CharField(max_length=10, choices=TIPO_FACTOR_CHOICES, default='Tasa')
    tasa_o_cuota = models.DecimalField(max_digits=8, decimal_places=6,
                                       help_text="Ej: 0.160000 para IVA 16%")
    base = models.DecimalField(max_digits=16, decimal_places=2)
    importe = models.DecimalField(max_digits=16, decimal_places=2)
    
    class Meta:
        verbose_name = "Impuesto de Concepto"
        verbose_name_plural = "Impuestos de Conceptos"
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.impuesto} ({self.tasa_o_cuota})"


class CertificadoDigital(SoftDeleteModel, EmpresaOwnedModel):
    """
    Certificado de Sello Digital (CSD) de la empresa
    Emitido por el SAT para firmar CFDIs
    """
    objects = MultiTenantManager()
    
    numero_certificado = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    # Archivos (almacenar en FileField para seguridad)
    archivo_cer = models.FileField(upload_to='certificados/cer/',
                                   help_text="Archivo .cer del SAT")
    archivo_key = models.FileField(upload_to='certificados/key/',
                                   help_text="Archivo .key del SAT")
    password_key = models.CharField(max_length=255,
                                   help_text="Contraseña encriptada con Fernet")
    
    # Vigencia
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    
    # Datos del certificado
    rfc_titular = models.CharField(max_length=13, null=True, blank=True)
    razon_social_titular = models.CharField(max_length=200, null=True, blank=True)
    
    class Meta:
        verbose_name = "Certificado Digital (CSD)"
        verbose_name_plural = "Certificados Digitales"
        ordering = ['-fecha_fin']
    
    def __str__(self):
        return f"CSD {self.numero_certificado} - {self.rfc_titular}"
    
    def esta_vigente(self):
        """Verifica si el certificado está vigente"""
        hoy = timezone.now().date()
        return self.fecha_inicio <= hoy <= self.fecha_fin and self.activo
    
    def dias_para_vencer(self):
        """Retorna días restantes de vigencia"""
        hoy = timezone.now().date()
        if hoy > self.fecha_fin:
            return 0
        return (self.fecha_fin - hoy).days


# Registrar modelos para auditoría
register_audit(Factura)
register_audit(CertificadoDigital)
