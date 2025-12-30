from django.db import models
from core.models import SoftDeleteModel, register_audit

class Proveedor(SoftDeleteModel):
    """
    Catálogo de Proveedores.
    """
    TIPO_PERSONA_CHOICES = [
        ('FISICA', 'Persona Física'),
        ('MORAL', 'Persona Moral'),
    ]
    
    razon_social = models.CharField(max_length=200, unique=True)
    nombre_comercial = models.CharField(max_length=200, blank=True, null=True)
    rfc = models.CharField(max_length=13, unique=True)
    tipo_persona = models.CharField(max_length=10, choices=TIPO_PERSONA_CHOICES, default='MORAL')
    
    # Datos de Contacto
    email_contacto = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    
    # Datos Bancarios Default (puede tener N cuentas, pero esta es la principal)
    banco_nombre = models.CharField(max_length=100, blank=True, null=True)
    cuenta = models.CharField(max_length=50, blank=True, null=True)
    clabe = models.CharField(max_length=18, blank=True, null=True)
    
    dias_credito = models.IntegerField(default=0, help_text="Días de crédito otorgados para cálculo de vencimiento")

    def __str__(self):
        return self.razon_social

register_audit(Proveedor)
