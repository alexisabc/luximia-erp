from django.db import models
from django.contrib.auth.models import User  # Para el login de usuarios del CRM

# Modelo para los Proyectos Inmobiliarios


class Proyecto(models.Model):
    nombre = models.CharField(
        max_length=100, unique=True, help_text="Ej: Shark Tower")
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

# Modelo para los Clientes


class Cliente(models.Model):
    nombre_completo = models.CharField(max_length=200)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre_completo

# Modelo para las Unidades de Propiedad Exclusiva (Departamentos, Lotes)


class UPE(models.Model):
    ESTADO_CHOICES = [
        ('Disponible', 'Disponible'),
        ('Vendida', 'Vendida'),
        ('Pagada', 'Pagada y Entregada'),
        ('Bloqueada', 'Bloqueada'),
    ]

    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='upes')
    identificador = models.CharField(
        max_length=50, help_text="Ej: Departamento 501, Lote 23")
    valor_total = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Valor total de la unidad")
    moneda = models.CharField(max_length=3, choices=[(
        'MXN', 'MXN'), ('USD', 'USD')], default='USD')
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default='Disponible')

    class Meta:
        unique_together = ('proyecto', 'identificador')

    def __str__(self):
        return f"{self.proyecto.nombre} - {self.identificador}"

# Modelo para el Contrato de Venta


class Contrato(models.Model):
    upe = models.OneToOneField(
        UPE, on_delete=models.PROTECT, related_name='contrato')
    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name='contratos')
    fecha_venta = models.DateField()
    precio_final_pactado = models.DecimalField(max_digits=12, decimal_places=2)
    moneda_pactada = models.CharField(
        max_length=3, choices=[('MXN', 'MXN'), ('USD', 'USD')])

    def __str__(self):
        return f"Contrato {self.id} - {self.upe}"

# Modelo para registrar cada pago (abono) del cliente


class Pago(models.Model):
    contrato = models.ForeignKey(
        Contrato, on_delete=models.CASCADE, related_name='pagos')
    fecha_pago = models.DateField()
    monto_pagado = models.DecimalField(max_digits=12, decimal_places=2)
    moneda_pagada = models.CharField(
        max_length=3, choices=[('MXN', 'MXN'), ('USD', 'USD')])
    tipo_cambio = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        help_text="Si el pago es en USD, registrar el tipo de cambio a MXN de ese día. Si es en MXN, poner 1.",
        default=1.0
    )
    notas = models.TextField(blank=True, null=True)

    @property
    def monto_en_mxn(self):
        if self.moneda_pagada == 'USD':
            return self.monto_pagado * self.tipo_cambio
        return self.monto_pagado

    def __str__(self):
        return f"Pago de {self.monto_pagado} {self.moneda_pagada} para {self.contrato}"
