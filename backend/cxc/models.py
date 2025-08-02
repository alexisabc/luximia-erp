from django.db import models
from django.contrib.auth.models import User


class ModeloBaseActivo(models.Model):
    """Modelo base con bandera de activo."""
    activo = models.BooleanField(default=True)

    class Meta:
        abstract = True


class Moneda(ModeloBaseActivo):
    codigo = models.CharField(max_length=3, unique=True)
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.codigo


class Banco(ModeloBaseActivo):
    """Catálogo de bancos."""
    clave = models.CharField(max_length=20, unique=True)
    nombre_corto = models.CharField(max_length=100)
    razon_social = models.CharField(max_length=200)

    def __str__(self):
        return self.nombre_corto


class Proyecto(ModeloBaseActivo):
    nombre = models.CharField(max_length=100, unique=True, help_text="Ej: Shark Tower")
    descripcion = models.TextField(blank=True, null=True)
    numero_upes = models.PositiveIntegerField(default=0)
    niveles = models.PositiveIntegerField(default=0)
    metros_cuadrados = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    numero_estacionamientos = models.PositiveIntegerField(default=0)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estado = models.CharField(max_length=50, default="Planificado")

    def __str__(self):
        return self.nombre


class Cliente(ModeloBaseActivo):
    nombre_completo = models.CharField(max_length=200)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True, unique=True)

    def __str__(self):
        return self.nombre_completo


class Departamento(ModeloBaseActivo):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class Puesto(ModeloBaseActivo):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name='puestos')

    def __str__(self):
        return self.nombre


class Empleado(ModeloBaseActivo):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='empleado')
    puesto = models.ForeignKey(Puesto, on_delete=models.PROTECT, related_name='empleados')
    departamento = models.ForeignKey(Departamento, on_delete=models.PROTECT, related_name='empleados')

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class UPE(ModeloBaseActivo):
    ESTADO_CHOICES = [
        ('Disponible', 'Disponible'),
        ('Vendida', 'Vendida'),
        ('Pagada', 'Pagada y Entregada'),
        ('Bloqueada', 'Bloqueada'),
    ]
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='upes')
    identificador = models.CharField(max_length=100, unique=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Disponible')

    def __str__(self):
        return self.identificador


class MetodoPago(ModeloBaseActivo):
    """Métodos aceptados para registrar un pago."""
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class Contrato(ModeloBaseActivo):
    """Contrato asociado a un cliente para la compra de una UPE."""
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='contratos')
    fecha_contrato = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Contrato {self.id}"


class Pago(ModeloBaseActivo):
    """Registro de pagos con tipo de concepto."""
    TIPO_PAGO_CHOICES = [
        ('APARTADO', 'APARTADO'),
        ('DEVOLUCIÓN', 'DEVOLUCIÓN'),
        ('DESCUENTO', 'DESCUENTO'),
        ('PAGO', 'PAGO'),
        ('MENSUALIDAD', 'MENSUALIDAD'),
    ]
    concepto = models.CharField(max_length=20, choices=TIPO_PAGO_CHOICES, default='PAGO')
    monto_pagado = models.DecimalField(max_digits=12, decimal_places=2)
    moneda_pagada = models.CharField(max_length=3, default='MXN')
    tipo_cambio = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    fecha_pago = models.DateField(auto_now_add=True)
    valor_mxn = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ordenante = models.CharField(max_length=200, blank=True, null=True)
    banco_origen = models.CharField(max_length=100, blank=True, null=True)
    num_cuenta_origen = models.CharField(max_length=50, blank=True, null=True)
    banco_destino = models.CharField(max_length=100, blank=True, null=True)
    cuenta_beneficiaria = models.CharField(max_length=100, blank=True, null=True)
    comentarios = models.TextField(blank=True, null=True)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='pagos', null=True, blank=True)
    banco = models.ForeignKey(Banco, on_delete=models.SET_NULL, null=True, blank=True, related_name='pagos')
    contrato = models.ForeignKey(Contrato, on_delete=models.CASCADE, related_name='pagos', null=True, blank=True)
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, related_name='pagos', null=True, blank=True)

    def __str__(self):
        return f"{self.concepto} - {self.monto_pagado}"

    def save(self, *args, **kwargs):
        if self.moneda_pagada == 'USD':
            self.valor_mxn = self.monto_pagado * self.tipo_cambio
        else:
            self.valor_mxn = self.monto_pagado
        super().save(*args, **kwargs)
