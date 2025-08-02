# backend/cxc/models.py

from django.db import models
from django.db.models import Sum, F, Case, When, DecimalField
from django.contrib.auth.models import User
from datetime import date
from dateutil.relativedelta import relativedelta
from django.db import transaction


# --- MODELO BASE REUTILIZABLE ---
class ModeloBaseActivo(models.Model):
    """
    Un modelo base abstracto que incluye un campo 'activo' para soft deletes.
    """
    activo = models.BooleanField(default=True)

    class Meta:
        abstract = True  # Esto le dice a Django que no cree una tabla para este modelo


class Moneda(ModeloBaseActivo):
    """Representa una divisa utilizada en el sistema."""
    codigo = models.CharField(max_length=3, unique=True)
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.codigo


class Proyecto(ModeloBaseActivo):
    nombre = models.CharField(
        max_length=100, unique=True, help_text="Ej: Shark Tower")
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class Cliente(ModeloBaseActivo):
    nombre_completo = models.CharField(max_length=200)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    # Hacemos el email único
    email = models.EmailField(
        max_length=254, blank=True, null=True, unique=True)

    def __str__(self):
        return self.nombre_completo


class UPE(ModeloBaseActivo):
    ESTADO_CHOICES = [('Disponible', 'Disponible'), ('Vendida', 'Vendida'),
                      ('Pagada', 'Pagada y Entregada'), ('Bloqueada', 'Bloqueada')]
    proyecto = models.ForeignKey(
        Proyecto, on_delete=models.CASCADE, related_name='upes')
    identificador = models.CharField(
        max_length=50, help_text="Ej: Departamento 501, Lote 23")
    valor_total = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Valor total de la unidad")
    moneda = models.ForeignKey(
        Moneda, on_delete=models.PROTECT, null=True, blank=True)
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default='Disponible')

    class Meta:
        unique_together = ('proyecto', 'identificador')

    def __str__(self):
        return f"{self.proyecto.nombre} - {self.identificador}"


class Contrato(ModeloBaseActivo):
    """
    Define los términos de la venta y el financiamiento.
    Ahora incluye los datos para generar el plan de pagos.
    """
    ESTADO_CONTRATO_CHOICES = [
        ('Activo', 'Activo'), ('Liquidado', 'Liquidado'), ('Cancelado', 'Cancelado')]

    # --- Relaciones y datos básicos ---
    upe = models.OneToOneField(
        UPE, on_delete=models.PROTECT, related_name='contrato')
    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name='contratos')
    fecha_venta = models.DateField(default=date.today)
    estado = models.CharField(
        max_length=20, choices=ESTADO_CONTRATO_CHOICES, default='Activo')

    # --- Términos financieros (mapea a PRECIO_VENTA) ---
    precio_final_pactado = models.DecimalField(max_digits=12, decimal_places=2)
    moneda_pactada = models.ForeignKey(
        Moneda, on_delete=models.PROTECT, null=True, blank=True)

    # --- Términos del plan de pagos ---
    monto_enganche = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    numero_mensualidades = models.IntegerField(default=0)
    tasa_interes_mensual = models.DecimalField(
        max_digits=5, decimal_places=4, default=0.03, help_text="Ej: 0.03 para 3%")

    def __str__(self):
        return f"Contrato {self.id} - {self.upe}"

    def save(self, *args, **kwargs):
        # Guardamos primero el contrato para que tenga un ID
        is_new = self.pk is None
        super().save(*args, **kwargs)
        # Si es un contrato nuevo, generamos su plan de pagos
        if is_new:
            self.generar_plan_de_pagos()

    def generar_plan_de_pagos(self):
        """
        Crea las entradas en PlanDePagos, asegurando que la suma de las
        cuotas sea exactamente igual al precio pactado.
        """
        # 1. Borramos cualquier plan de pagos existente para este contrato
        self.plan_de_pagos.all().delete()

        # 2. Creamos el registro del enganche
        if self.monto_enganche > 0:
            PlanDePagos.objects.create(
                contrato=self,
                fecha_vencimiento=self.fecha_venta,
                monto_programado=self.monto_enganche,
                tipo='ENGANCHE'
            )

        # 3. Calculamos y creamos las mensualidades
        saldo_a_financiar = self.precio_final_pactado - self.monto_enganche
        if self.numero_mensualidades > 0 and saldo_a_financiar > 0:
            monto_mensualidad = round(
                saldo_a_financiar / self.numero_mensualidades, 2)

            # Creamos todas las mensualidades excepto la última
            total_mensualidades_creadas = 0
            for i in range(1, self.numero_mensualidades):
                fecha_vencimiento = self.fecha_venta + relativedelta(months=i)
                PlanDePagos.objects.create(
                    contrato=self,
                    fecha_vencimiento=fecha_vencimiento,
                    monto_programado=monto_mensualidad,
                    tipo='MENSUALIDAD'
                )
                total_mensualidades_creadas += monto_mensualidad

            # ### LÓGICA CLAVE ###
            # La última mensualidad es la diferencia para que el total sea exacto.
            monto_ultima_mensualidad = saldo_a_financiar - total_mensualidades_creadas
            ultima_fecha_vencimiento = self.fecha_venta + \
                relativedelta(months=self.numero_mensualidades)
            PlanDePagos.objects.create(
                contrato=self,
                fecha_vencimiento=ultima_fecha_vencimiento,
                monto_programado=monto_ultima_mensualidad,
                tipo='MENSUALIDAD'
            )
            
    def actualizar_plan_de_pagos(self):
        """
        Marca las cuotas del plan de pagos como 'pagado' si el total
        de los abonos (convertidos a la moneda del contrato) es suficiente.
        """
        with transaction.atomic():
            # ### LÓGICA DE SUMA CORREGIDA ###
            total_pagado = self.pagos.aggregate(
            total=Sum(
                Case(
                    When(moneda_pagada__codigo='USD', then=F(
                        'monto_pagado') * F('tipo_cambio')),
                    default=F('monto_pagado'),
                    output_field=DecimalField()
                )
            )
            )['total'] or 0

            cuotas = self.plan_de_pagos.order_by('fecha_vencimiento')
            saldo_acumulado = 0
            for cuota in cuotas:
                saldo_acumulado += cuota.monto_programado
                esta_pagada = total_pagado >= saldo_acumulado
                if cuota.pagado != esta_pagada:
                    cuota.pagado = esta_pagada
                    cuota.save()


class PlanDePagos(ModeloBaseActivo):
    """
    Nuevo modelo que representa el calendario de amortización.
    Cada fila es un pago esperado (PLAN_DE_PAGO).
    """
    TIPO_CHOICES = [('ENGANCHE', 'Enganche'), ('MENSUALIDAD', 'Mensualidad')]

    contrato = models.ForeignKey(
        Contrato, on_delete=models.CASCADE, related_name='plan_de_pagos')
    fecha_vencimiento = models.DateField()
    monto_programado = models.DecimalField(max_digits=12, decimal_places=2)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    pagado = models.BooleanField(default=False)
    # Aquí podrías añadir campos para registrar los intereses generados en este pago específico

    class Meta:
        ordering = ['fecha_vencimiento']

    def __str__(self):
        return f"Vencimiento {self.fecha_vencimiento} - {self.monto_programado} ({self.get_tipo_display()})"


class Pago(ModeloBaseActivo):
    """
    Registra cada transacción de dinero que entra.
    Actualizado con todos los nuevos campos de detalle.
    """
    INSTRUMENTO_PAGO_CHOICES = [
        ('EFECTIVO', 'EFECTIVO'),
        ('TARJETA DE CREDITO', 'TARJETA DE CREDITO'),
        ('TARJETA DE DEBITO', 'TARJETA DE DEBITO'),
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
        ('APARTADO', 'APARTADO'),
        ('DEVOLUCIÓN', 'DEVOLUCIÓN'),
        ('DESCUENTO', 'DESCUENTO'),
        ('PAGO', 'PAGO'),
    ]

    # --- Relaciones y Datos del Pago ---
    contrato = models.ForeignKey(Contrato, on_delete=models.CASCADE, related_name='pagos')
    concepto = models.CharField(max_length=50, choices=TIPO_PAGO_CHOICES, default='ABONO', help_text="Concepto del pago (mapea a CONCEPTO)")
    monto_pagado = models.DecimalField(max_digits=12, decimal_places=2, help_text="Monto real de la transacción (mapea a PAGOS/ABONOS)")
    moneda_pagada = models.ForeignKey(
        Moneda, on_delete=models.PROTECT, null=True, blank=True, help_text="Mapea a DIVISA")
    tipo_cambio = models.DecimalField(max_digits=10, decimal_places=4, default=1.0, help_text="Mapea a TIPO_CAMBIO")

    # --- Fechas ---
    fecha_pago = models.DateField(default=date.today, help_text="Fecha en que se realizó el pago (mapea a FECHA_PAGO)")
    fecha_ingreso_cuentas = models.DateField(null=True, blank=True, help_text="Fecha en que el dinero ingresó a cuentas")

    # --- Detalles de la Transacción ---
    instrumento_pago = models.CharField(max_length=100, choices=INSTRUMENTO_PAGO_CHOICES, null=True, blank=True, help_text="Mapea a TIPO_PAGO (METODO DE PAGO)")
    ordenante = models.CharField(max_length=200, blank=True, null=True, help_text="Persona o empresa que ordena el pago")
    banco_origen = models.CharField(max_length=100, blank=True, null=True)
    num_cuenta_origen = models.CharField(max_length=50, blank=True, null=True)
    banco_destino = models.CharField(max_length=100, blank=True, null=True)
    cuenta_beneficiaria = models.CharField(max_length=50, blank=True, null=True)
    comentarios = models.TextField(blank=True, null=True)


    def save(self, *args, **kwargs):
        # Guardamos el pago primero para que se registre la transacción
        super().save(*args, **kwargs)
        #Ahora llama al método del contrato
        self.contrato.actualizar_plan_de_pagos()


    

    @property
    def valor_mxn(self):
        # ... (tu property existente) ...
        if self.moneda_pagada and self.moneda_pagada.codigo == 'USD':
            return self.monto_pagado * self.tipo_cambio
        return self.monto_pagado

    def __str__(self):
        codigo = self.moneda_pagada.codigo if self.moneda_pagada else ''
        return f"Pago de {self.monto_pagado} {codigo} para {self.contrato}"


class TipoDeCambio(ModeloBaseActivo):
    fecha = models.DateField(unique=True, primary_key=True)
    valor = models.DecimalField(max_digits=10, decimal_places=4)

    def __str__(self):
        return f"{self.fecha}: {self.valor}"

    class Meta:
        ordering = ['-fecha']


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)
    model_name = models.CharField(max_length=50)
    object_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    changes = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action} {self.model_name} {self.object_id}"
