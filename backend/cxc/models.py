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
    # Lista de opciones para el campo instrumento_de_pago
    INSTRUMENTO_PAGO_CHOICES = [
        ('EFECTIVO', 'EFECTIVO'),
        ('TARJETA DE CRÉDITO', 'TARJETA DE CRÉDITO'),
        ('TARJETA DE DÉBITO', 'TARJETA DE DÉBITO'),
        ('TARJETA DE PREPAGO', 'TARJETA DE PREPAGO'),
        ('CHEQUE NOMINATIVO', 'CHEQUE NOMINATIVO'),
        ('CHEQUE DE CAJA', 'CHEQUE DE CAJA'),
        ('CHEQUE DE VIAJERO', 'CHEQUE DE VIAJERO'),
        ('TRANSFERENCIA INTERBANCARIA', 'TRANSFERENCIA INTERBANCARIA'),
        ('TRANSFERENCIA MISMA INSTITUCION', 'TRANSFERENCIA MISMA INSTITUCION'),
        ('TRANSFERENCIA INTERNACIONAL', 'TRANSFERENCIA INTERNACIONAL'),
        ('ORDEN DE PAGO', 'ORDEN DE PAGO'),
        ('GIRO', 'GIRO'),
        ('ORO O PLATINO AMONEDADOS', 'ORO O PLATINO AMONEDADOS'),
        ('PLATA AMONEDADA', 'PLATA AMONEDADA'),
        ('METALES PRECIOSO', 'METALES PRECIOSO'),
    ]

    TIPO_PAGO_CHOICES = [
        ('MENSUALIDAD', 'Mensualidad'),
        ('ENGANCHE', 'Enganche'),
        ('PAGO FINAL', 'Pago Final'),
        ('OTRO', 'Otro'),
    ]

    # --- CAMPOS PRINCIPALES ---
    contrato = models.ForeignKey(
        Contrato, on_delete=models.CASCADE, related_name='pagos')
    tipo = models.CharField(max_length=50, choices=TIPO_PAGO_CHOICES,
                            default='MENSUALIDAD', help_text="Tipo de pago (ej. Mensualidad, Enganche)")

    # Mapea a 'PAGO'
    monto_pagado = models.DecimalField(max_digits=12, decimal_places=2)
    # Mapea a 'DIVISA'
    moneda_pagada = models.CharField(
        max_length=3, choices=[('MXN', 'MXN'), ('USD', 'USD')])
    # Mapea a 'TIPO_CAMBIO'
    tipo_cambio = models.DecimalField(
        max_digits=10, decimal_places=4, default=1.0)

    # --- FECHAS ---
    # Mapea a 'FECHA_PAGO_MENSUALIDAD'
    fecha_pago_mensualidad = models.DateField(
        help_text="Fecha de pago real o programada de la mensualidad")
    # Mapea a 'FECHA_PAGO_INGRESO_A_CUENTAS'
    fecha_ingreso_cuentas = models.DateField(
        null=True, blank=True, help_text="Fecha en que el dinero ingresó a cuentas")

    # --- DETALLES DE LA TRANSACCIÓN ---
    # Mapea a 'INSTRUMENTO_PAGO'
    instrumento_pago = models.CharField(
        max_length=100, choices=INSTRUMENTO_PAGO_CHOICES, null=True, blank=True)
    banco_origen = models.CharField(
        max_length=100, blank=True, null=True, db_column='BANCO_ORIGEN')
    num_cuenta_origen = models.CharField(
        max_length=50, blank=True, null=True, db_column='NUM_CUENTA_ORIGEN')
    titular_cuenta_origen = models.CharField(
        max_length=200, blank=True, null=True, db_column='TITULAR_CUENTA_ORIGEN')
    banco_destino = models.CharField(
        max_length=100, blank=True, null=True, db_column='BANCO_DESTINO')
    num_cuenta_destino = models.CharField(
        max_length=50, blank=True, null=True, db_column='NUM_CUENTA_DESTINO')

    # Mapea a 'COMENTARIOS'
    comentarios = models.TextField(blank=True, null=True)

    # --- CAMPO CALCULADO (NO SE GUARDA EN LA BD) ---
    # Este campo corresponde a 'VALOR_MXN'. No necesita una columna en la BD.
    @property
    def valor_mxn(self):
        if self.moneda_pagada == 'USD':
            return self.monto_pagado * self.tipo_cambio
        return self.monto_pagado

    def __str__(self):
        return f"Pago de {self.monto_pagado} {self.moneda_pagada} para {self.contrato}"
