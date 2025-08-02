from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from django.utils import timezone


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
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    fecha = models.DateField(auto_now_add=True)
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='pagos', null=True, blank=True)
    banco = models.ForeignKey(Banco, on_delete=models.SET_NULL, null=True, blank=True, related_name='pagos')

    def __str__(self):
        return f"{self.concepto} - {self.monto}"


class Presupuesto(ModeloBaseActivo):
    """Presupuesto generado para una posible venta."""
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='presupuestos')
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='presupuestos')
    monto_total = models.DecimalField(max_digits=12, decimal_places=2)
    fecha = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Presupuesto {self.id} - {self.cliente}"


class Contrato(ModeloBaseActivo):
    """Contrato firmado a partir de un presupuesto."""
    presupuesto = models.ForeignKey(Presupuesto, on_delete=models.CASCADE, related_name='contratos')
    fecha_firma = models.DateField(auto_now_add=True)
    abonos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    saldo_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_ultimo_abono = models.DateField(null=True, blank=True)

    def registrar_abono(self, monto: Decimal):
        monto = Decimal(monto)
        if monto < 0:
            raise ValueError("El monto no puede ser negativo")
        if monto > self.saldo_pendiente:
            raise ValueError("El abono excede el saldo pendiente")
        self.abonos += monto
        self.fecha_ultimo_abono = timezone.now().date()
        self.save()

    def save(self, *args, **kwargs):
        if self._state.adding and not self.saldo_total:
            self.saldo_total = self.presupuesto.monto_total
        self.saldo_pendiente = self.saldo_total - self.abonos
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Contrato {self.id} - {self.presupuesto}" 
