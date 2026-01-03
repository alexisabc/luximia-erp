from django.db import models
from django.conf import settings

class Notificacion(models.Model):
    """
    Modelo para gestionar las notificaciones internas del sistema (Campanita).
    """
    TIPO_CHOICES = [
        ('INFO', 'Información'),
        ('SUCCESS', 'Éxito'),
        ('WARNING', 'Advertencia'),
        ('ERROR', 'Error'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificaciones',
        verbose_name="Destinatario"
    )
    titulo = models.CharField(max_length=150)
    mensaje = models.TextField()
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='INFO')
    link = models.CharField(max_length=255, blank=True, null=True, help_text="URL interna para redirección (ej: /compras/ordenes/5)")
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'leida']),
            models.Index(fields=['-fecha_creacion']),
        ]

    def __str__(self):
        return f"{self.tipo} para {self.usuario.username}: {self.titulo}"

class WebhookConfig(models.Model):
    """Configuración de integraciones externas (ej: n8n, Zapier)."""
    empresa = models.ForeignKey('core.Empresa', on_delete=models.CASCADE, related_name='webhooks')
    url = models.URLField(help_text="URL donde se enviará el POST")
    activo = models.BooleanField(default=True)
    eventos = models.JSONField(default=list, help_text="Lista de eventos: ['ALERT_OBRA', 'DAILY_BRIEFING', 'STOCK_CRITICAL']")
    secret_token = models.CharField(max_length=100, blank=True, help_text="Token para validar autenticidad en el destino")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Webhook {self.empresa.nombre_comercial} -> {self.url[:30]}"
