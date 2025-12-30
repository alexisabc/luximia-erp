from django.db import models
from django.core.cache import cache

class ConfiguracionGlobal(models.Model):
    """
    Modelo Singleton para almacenar la configuración global del sistema ERP.
    Solo permite una instancia (ID=1) y utiliza caché para optimizar el rendimiento.
    """
    # Identidad Visual
    nombre_sistema = models.CharField(max_length=100, default="Luximia ERP")
    logo_login = models.ImageField(upload_to='config/logos/', blank=True, null=True)
    logo_ticket = models.ImageField(upload_to='config/logos/', blank=True, null=True, help_text="Logo B/N optimizado para impresión térmica")
    favicon = models.ImageField(upload_to='config/logos/', blank=True, null=True)

    # Configuración Fiscal y Financiera
    iva_default = models.DecimalField(max_digits=5, decimal_places=2, default=16.00, verbose_name="IVA por defecto (%)")
    MONEDA_CHOICES = [
        ('MXN', 'Peso Mexicano (MXN)'),
        ('USD', 'Dólar Americano (USD)'),
    ]
    moneda_base = models.CharField(max_length=3, choices=MONEDA_CHOICES, default='MXN')
    retencion_isr = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name="Retención ISR (%)")

    # Configuración Operativa
    mensaje_ticket_pie = models.TextField(blank=True, default="Gracias por su compra", help_text="Mensaje al final de los tickets")
    dias_vencimiento_cotizacion = models.IntegerField(default=15, help_text="Días de validez para cotizaciones")

    class Meta:
        verbose_name = "Configuración Global"
        verbose_name_plural = "Configuración Global"

    def __str__(self):
        return f"Configuración: {self.nombre_sistema}"

    def save(self, *args, **kwargs):
        """
        Sobrescribe el guardado para garantizar el patrón Singleton (ID fijo = 1)
        y limpiar la caché global.
        """
        self.pk = 1
        super().save(*args, **kwargs)
        # Invalidar cache
        cache.delete('GLOBAL_CONFIG')

    def delete(self, *args, **kwargs):
        """Previene la eliminación del registro de configuración."""
        pass

    @classmethod
    def get_solo(cls):
        """
        Helper para obtener la instancia única. 
        Si no existe, la crea con valores por defecto.
        """
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

# Auditoría
from core.models import register_audit
register_audit(ConfiguracionGlobal)
