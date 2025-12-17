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
        unique_together = ('source_app', 'source_model', 'source_id') # Evitar duplicados

    def __str__(self):
        return f"{self.source_app}.{self.source_model} #{self.source_id}"
