from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.conf import settings

class AuditLog(models.Model):
    """
    Modelo genérico para auditoría de cambios en el sistema.
    Utiliza GenericForeignKey para apuntar a cualquier modelo.
    """
    ACCION_CHOICES = [
        ('CREATE', 'Creación'),
        ('UPDATE', 'Actualización'),
        ('DELETE', 'Eliminación'),
        ('LOGIN', 'Inicio de Sesión'),
        ('LOGOUT', 'Cierre de Sesión'),
        ('EXPORT', 'Exportación de Datos'),
        ('IMPORT', 'Importación de Datos'),
        ('APPROVE', 'Aprobación'),
        ('REJECT', 'Rechazo'),
        ('CANCEL', 'Cancelación'),
    ]
    
    # Quién realizó la acción
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="Usuario que realizó la acción"
    )
    
    # Qué acción se realizó
    accion = models.CharField(
        max_length=20,
        choices=ACCION_CHOICES,
        help_text="Tipo de acción realizada"
    )
    
    # Sobre qué objeto (GenericForeignKey)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Tipo de modelo afectado"
    )
    object_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="ID del objeto afectado"
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Representación del objeto (por si se elimina)
    object_repr = models.CharField(
        max_length=500,
        blank=True,
        help_text="Representación en texto del objeto"
    )
    
    # Detalles del cambio
    cambios = models.JSONField(
        null=True,
        blank=True,
        help_text="Diccionario con los cambios: {'campo': {'old': valor_anterior, 'new': valor_nuevo}}"
    )
    
    # Contexto de la petición
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Dirección IP desde donde se realizó la acción"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User-Agent del navegador/dispositivo"
    )
    
    # Información adicional
    descripcion = models.TextField(
        blank=True,
        help_text="Descripción adicional de la acción"
    )
    
    # Timestamp
    fecha = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Fecha y hora de la acción"
    )
    
    class Meta:
        verbose_name = "Registro de Auditoría"
        verbose_name_plural = "Registros de Auditoría"
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha']),
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['content_type', '-fecha']),
            models.Index(fields=['accion', '-fecha']),
            models.Index(fields=['content_type', 'object_id']),
        ]
        permissions = [
            ("view_audit_logs", "Ver registros de auditoría"),
            ("export_audit_logs", "Exportar registros de auditoría"),
            ("delete_audit_logs", "Eliminar registros de auditoría"),
        ]
    
    def __str__(self):
        usuario_str = self.usuario.username if self.usuario else "Sistema"
        objeto_str = self.object_repr or f"{self.content_type} #{self.object_id}" if self.content_type else "N/A"
        return f"{usuario_str} - {self.get_accion_display()} - {objeto_str} - {self.fecha.strftime('%Y-%m-%d %H:%M')}"
    
    def get_cambios_legibles(self):
        """Retorna los cambios en formato legible."""
        if not self.cambios:
            return "Sin cambios registrados"
        
        cambios_str = []
        for campo, valores in self.cambios.items():
            old_val = valores.get('old', 'N/A')
            new_val = valores.get('new', 'N/A')
            cambios_str.append(f"{campo}: {old_val} → {new_val}")
        
        return " | ".join(cambios_str)
