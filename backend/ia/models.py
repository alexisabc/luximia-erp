from django.db import models
from pgvector.django import VectorField
from core.models import BaseModel

class KnowledgeBase(BaseModel):
    """
    Base de conocimientos para la IA.
    Almacena fragmentos de información (embeddings) de los modelos del sistema.
    """
    source_app = models.CharField(max_length=100)
    source_model = models.CharField(max_length=100)
    source_id = models.CharField(max_length=100) # ID como string para flexibilidad
    
    content = models.TextField() # Texto plano indexado
    
    # Soporte Multi-Empresa para RAG
    empresa = models.ForeignKey(
        'core.Empresa', 
        on_delete=models.CASCADE, 
        related_name='knowledge_base',
        null=True, # Nullable para datos globales si fuera necesario, pero usualmente tendrá ID
        blank=True
    )
    
    # Metadatos para filtrado de permisos y contexto
    # Guardamos los permisos requeridos como lista separada por comas: "rrhh.view_empleado,core.view_algo"
    required_permissions = models.TextField(blank=True, default="") 
    
    embedding = VectorField(dimensions=1536) # Ada-002 / Text-3-Small dimension

    class Meta:
        indexes = [
            # Índice HNSW para búsqueda rápida vectorial
            # Nota: Requiere crear la extensión 'vector' en PostgreSQL
            # index=models.Index(fields=['embedding'], opclasses=['vector_cosine_ops'], name='embedding_idx')
            # Se omite en definición de modelo Django < 5.0 nativo de pgvector a veces, pero pgvector.django lo maneja.
            # Dejamos que pgvector lo maneje si se agrega explicitamente en migraciones.
        ]
        unique_together = ('source_app', 'source_model', 'source_id', 'empresa') # Evitar duplicados

    def __str__(self):
        return f"{self.source_app}.{self.source_model} #{self.source_id}"

class AuditAlert(BaseModel):
    """Alertas generadas por el Auditor Nocturno."""
    TIPO_CHOICES = [
        ('OBRA', 'Riesgo en Obra (Presupuesto)'),
        ('STOCK', 'Stock Crítico'),
        ('FISCAL', 'Vencimiento Fiscal'),
        ('FINANCIERO', 'Anomalía Financiera'),
    ]
    NIVEL_CHOICES = [
        ('INFO', 'Información'),
        ('WARNING', 'Advertencia'),
        ('CRITICAL', 'Crítico'),
    ]

    empresa = models.ForeignKey('core.Empresa', on_delete=models.CASCADE, related_name='alertas_auditoria')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    nivel = models.CharField(max_length=10, choices=NIVEL_CHOICES, default='WARNING')
    mensaje = models.TextField()
    data = models.JSONField(null=True, blank=True, help_text="Datos crudos detectados (ej: {ejecutado: 95%})")
    resuelta = models.BooleanField(default=False)
    fecha_resolucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.nivel}] {self.tipo}: {self.mensaje[:50]}"

class DailyBriefing(BaseModel):
    """Resumen narrativo generado por IA para el Dashboard."""
    empresa = models.ForeignKey('core.Empresa', on_delete=models.CASCADE, related_name='briefings_dia')
    fecha = models.DateField(default=models.functions.Now())
    contenido = models.TextField() # Narrativa de la IA
    analisis_ia_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID del run/prompt para trazabilidad")

    class Meta:
        ordering = ['-fecha', '-created_at']
        unique_together = ('empresa', 'fecha')

    def __str__(self):
        return f"Briefing {self.empresa} - {self.fecha}"
