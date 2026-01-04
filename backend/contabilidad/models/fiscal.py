from django.db import models
from core.models import SoftDeleteModel, register_audit, Empresa, EmpresaOwnedModel, MultiTenantManager
from core.encryption import encrypt_text, decrypt_text, encrypt_data, decrypt_data
from .sat_catalogs import SATRegimenFiscal
from .catalogos import Moneda, MetodoPago, FormaPago, Cliente
from .proyectos import Proyecto
import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage

# Secure storage for certificates
CERT_DIR = os.path.join(settings.BASE_DIR, 'core', 'certificates')
private_storage = FileSystemStorage(location=CERT_DIR)

class EmpresaFiscal(SoftDeleteModel):
    """Configuración fiscal vinculada a la Empresa."""
    empresa = models.OneToOneField(Empresa, on_delete=models.CASCADE, related_name='configuracion_fiscal')
    regimen_fiscal = models.ForeignKey(SATRegimenFiscal, on_delete=models.PROTECT)
    codigo_postal = models.CharField(max_length=5, help_text="Lugar de expedición")
    
    # Certificado Activo (ahora apunta al modelo en cfdi.py)
    certificado_sello = models.ForeignKey('contabilidad.CertificadoDigital', on_delete=models.SET_NULL, 
                                         null=True, blank=True, related_name='empresa_asociada')
    
    def __str__(self):
        return f"Fiscal: {self.empresa.razon_social}"

register_audit(EmpresaFiscal)

# NOTA: Los modelos Factura y CertificadoDigital se movieron a cfdi.py
# para cumplir con CFDI 4.0

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

register_audit(BuzonMensaje)
register_audit(OpinionCumplimiento)
