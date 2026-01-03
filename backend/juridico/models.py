from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.models import SoftDeleteModel
import hashlib
import json


class PlantillaLegal(SoftDeleteModel):
    """
    Plantillas de documentos legales reutilizables.
    Ejemplos: Contratos de trabajo, NDAs, Contratos de servicios.
    """
    TIPO_CHOICES = [
        ('CONTRATO_TRABAJO', 'Contrato de Trabajo'),
        ('CONTRATO_SERVICIOS', 'Contrato de Servicios'),
        ('NDA', 'Acuerdo de Confidencialidad'),
        ('FINIQUITO', 'Finiquito'),
        ('OTRO', 'Otro'),
    ]
    
    titulo = models.CharField(max_length=200, help_text="Nombre de la plantilla")
    contenido = models.TextField(
        help_text="Contenido HTML de la plantilla. Usa {{variable}} para campos dinámicos"
    )
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES, default='OTRO')
    activo = models.BooleanField(
        default=True,
        help_text="Solo plantillas activas pueden usarse para generar documentos"
    )
    descripcion = models.TextField(blank=True, help_text="Descripción del uso de esta plantilla")
    variables_disponibles = models.JSONField(
        default=dict,
        blank=True,
        help_text="Lista de variables disponibles para esta plantilla"
    )
    
    class Meta:
        verbose_name = "Plantilla Legal"
        verbose_name_plural = "Plantillas Legales"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.titulo} ({self.get_tipo_display()})"


class DocumentoFirmado(SoftDeleteModel):
    """
    Registro de documentos legales generados y firmados.
    Usa GenericForeignKey para vincularse a cualquier modelo (Empleado, Proveedor, etc.)
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('FIRMADO', 'Firmado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    # Relación con plantilla
    plantilla = models.ForeignKey(
        PlantillaLegal,
        on_delete=models.PROTECT,
        related_name='documentos_generados',
        help_text="Plantilla usada para generar este documento"
    )
    
    # GenericForeignKey para vincular a cualquier modelo
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="Tipo de objeto vinculado (Empleado, Proveedor, etc.)"
    )
    object_id = models.PositiveIntegerField(help_text="ID del objeto vinculado")
    objeto_vinculado = GenericForeignKey('content_type', 'object_id')
    
    # Archivo y firma
    archivo_pdf = models.FileField(
        upload_to='documentos_legales/%Y/%m/',
        help_text="PDF del documento firmado"
    )
    hash_firma = models.CharField(
        max_length=64,
        unique=True,
        help_text="Hash SHA256 del documento para verificación de integridad"
    )
    
    # Metadatos de firma
    datos_firma = models.JSONField(
        default=dict,
        help_text="Metadatos de la firma: IP, UserAgent, Fecha, etc."
    )
    usuario_firmante = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='documentos_firmados',
        help_text="Usuario que firmó el documento"
    )
    fecha_firma = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora de la firma"
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='BORRADOR'
    )
    
    # Datos renderizados
    datos_renderizados = models.JSONField(
        default=dict,
        help_text="Datos usados para renderizar la plantilla"
    )
    
    class Meta:
        verbose_name = "Documento Firmado"
        verbose_name_plural = "Documentos Firmados"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['estado']),
            models.Index(fields=['hash_firma']),
        ]
    
    def __str__(self):
        return f"{self.plantilla.titulo} - {self.get_estado_display()} ({self.created_at.strftime('%Y-%m-%d')})"
    
    def generar_hash(self):
        """
        Genera el hash SHA256 del archivo PDF.
        """
        if self.archivo_pdf:
            self.archivo_pdf.seek(0)
            contenido = self.archivo_pdf.read()
            return hashlib.sha256(contenido).hexdigest()
        return None
    
    def verificar_integridad(self):
        """
        Verifica que el hash actual del archivo coincida con el hash almacenado.
        """
        hash_actual = self.generar_hash()
        return hash_actual == self.hash_firma if hash_actual else False
