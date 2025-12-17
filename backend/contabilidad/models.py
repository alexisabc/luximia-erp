from django.db import models
from django.conf import settings

from core.models import BaseModel, SoftDeleteModel, register_audit


# Eliminamos ModeloBaseActivo local y usamos SoftDeleteModel
# Nota: SoftDeleteModel usa 'is_active'. Si la DB ya tiene 'activo', haremos una migración para renombrarlo.

class Moneda(SoftDeleteModel):
    codigo = models.CharField(max_length=3, unique=True)
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.codigo


class Banco(SoftDeleteModel):
    clave = models.CharField(max_length=20, unique=True)
    nombre_corto = models.CharField(max_length=100)
    razon_social = models.CharField(max_length=200)

    def __str__(self):
        return self.nombre_corto


class MetodoPago(SoftDeleteModel):
    """Catálogo de métodos de pago permitidos."""
    METODO_CHOICES = [
        ("N/A", "N/A"),
        ("EFECTIVO", "EFECTIVO"),
        ("TARJETA_CREDITO", "TARJETA DE CREDITO"),
        ("TARJETA_DEBITO", "TARJETA DE DEBITO"),
        ("TARJETA_PREPAGO", "TARJETA DE PREPAGO"),
        ("CHEQUE_NOMINATIVO", "CHEQUE NOMINATIVO"),
        ("CHEQUE_CAJA", "CHEQUE DE CAJA"),
        ("CHEQUE_VIAJERO", "CHEQUE DE VIAJERO"),
        ("TRANSFERENCIA_INTERBANCARIA", "TRANSFERENCIA INTERBANCARIA"),
        ("TRANSFERENCIA_MISMA_INSTITUCION", "TRANSFERENCIA MISMA INSTITUCION"),
        ("TRANSFERENCIA_INTERNACIONAL", "TRANSFERENCIA INTERNACIONAL"),
        ("ORDEN_PAGO", "ORDEN DE PAGO"),
        ("GIRO", "GIRO"),
        ("ORO_PLATINO", "ORO O PLATINO AMONEDADOS"),
        ("PLATA", "PLATA AMONEDADA"),
        ("METALES_PRECIOSOS", "METALES PRECIOSO"),
    ]
    nombre = models.CharField(max_length=40, choices=METODO_CHOICES, unique=True)

    def __str__(self):
        return self.get_nombre_display()


class Proyecto(SoftDeleteModel):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    numero_upes = models.PositiveIntegerField(default=0)
    niveles = models.PositiveIntegerField(default=0)
    metros_cuadrados = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    numero_estacionamientos = models.PositiveIntegerField(default=0)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    estado = models.CharField(max_length=50, default="Planificado")

    def __str__(self):
        return self.nombre


class Cliente(SoftDeleteModel):
    nombre_completo = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre_completo


class TipoCambio(SoftDeleteModel):
    ESCENARIO_CHOICES = [
        ("PACTADO", "Pactado"),
        ("TOPADO", "Topado"),
        ("BANXICO", "Banxico"),
    ]
    escenario = models.CharField(max_length=20, choices=ESCENARIO_CHOICES)
    fecha = models.DateField()
    valor = models.DecimalField(max_digits=12, decimal_places=4)

    class Meta:
        unique_together = ("escenario", "fecha")

    def __str__(self):
        return f"{self.escenario} - {self.fecha}"


class Vendedor(SoftDeleteModel):
    TIPO_CHOICES = [("INTERNO", "Interno"), ("EXTERNO", "Externo")]
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    nombre_completo = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre_completo


class FormaPago(SoftDeleteModel):
    enganche = models.PositiveSmallIntegerField()
    mensualidades = models.PositiveSmallIntegerField()
    meses = models.PositiveSmallIntegerField()
    contra_entrega = models.PositiveSmallIntegerField()

    def __str__(self):
        return f"{self.enganche}% - {self.mensualidades}% - {self.contra_entrega}%"


class UPE(SoftDeleteModel):
    ESTADO_CHOICES = [
        ("DISPONIBLE", "Disponible"),
        ("VENDIDA", "Vendida"),
        ("PAGADA", "Pagada"),
        ("BLOQUEADA", "Bloqueada"),
    ]
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name="upes")
    identificador = models.CharField(max_length=100, unique=True)
    nivel = models.PositiveIntegerField(default=1)
    metros_cuadrados = models.DecimalField(max_digits=12, decimal_places=2)
    estacionamientos = models.PositiveIntegerField(default=0)
    valor_total = models.DecimalField(max_digits=14, decimal_places=2)
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="DISPONIBLE")

    class Meta:
        permissions = [("can_use_ai", "Can Use AI Chat")]

    def __str__(self):
        return self.identificador


class PlanPago(SoftDeleteModel):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="planes_pago")
    upe = models.ForeignKey(UPE, on_delete=models.CASCADE, related_name="planes_pago")
    apartado_monto = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_apartado = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_apartado")
    fecha_apartado = models.DateField(blank=True, null=True)
    forma_pago_enganche = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_enganche")
    monto_enganche = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_enganche = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_enganche_moneda")
    fecha_enganche = models.DateField(blank=True, null=True)
    forma_pago_mensualidades = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_mensualidades")
    monto_mensualidades = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_mensualidades = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_mensualidades_moneda")
    forma_pago_meses = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_meses")
    meses = models.PositiveSmallIntegerField(default=0)
    monto_mensual = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_mensual = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_mensual_moneda")
    forma_pago_contra_entrega = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name="planes_contra_entrega")
    monto_contra_entrega = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda_contra_entrega = models.ForeignKey(Moneda, on_delete=models.PROTECT, related_name="planes_contra_entrega_moneda")

    def __str__(self):
        return f"Plan {self.id} - {self.cliente} - {self.upe}"


class EsquemaComision(SoftDeleteModel):
    ESQUEMA_CHOICES = [("RENTA", "Renta"), ("VENTA", "Venta")]
    esquema = models.CharField(max_length=10, choices=ESQUEMA_CHOICES)
    escenario = models.CharField(max_length=100)
    porcentaje = models.DecimalField(max_digits=6, decimal_places=3)
    iva = models.DecimalField(max_digits=5, decimal_places=2, default=16.0)

    def __str__(self):
        return f"{self.esquema} - {self.escenario}"


class Presupuesto(SoftDeleteModel):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="presupuestos")
    upe = models.ForeignKey(UPE, on_delete=models.CASCADE, related_name="upes_presupuesto", related_query_name="presupuesto") 
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    tipo_cambio = models.ForeignKey(TipoCambio, on_delete=models.PROTECT)
    forma_pago = models.ForeignKey(FormaPago, on_delete=models.PROTECT)
    precio_m2 = models.DecimalField(max_digits=14, decimal_places=2)
    precio_lista = models.DecimalField(max_digits=14, decimal_places=2)
    descuento = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    precio_con_descuento = models.DecimalField(max_digits=14, decimal_places=2)
    enganche = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    saldo = models.DecimalField(max_digits=14, decimal_places=2)
    plan_pago = models.ForeignKey(PlanPago, on_delete=models.CASCADE, related_name="presupuestos", null=True, blank=True)
    fecha_entrega_pactada = models.DateField(blank=True, null=True)
    negociaciones_especiales = models.TextField(blank=True, null=True)
    vendedor1 = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, related_name="presupuestos_vendedor1", null=True, blank=True)
    vendedor2 = models.ForeignKey(Vendedor, on_delete=models.SET_NULL, related_name="presupuestos_vendedor2", null=True, blank=True)
    esquema_comision = models.ForeignKey(EsquemaComision, on_delete=models.SET_NULL, null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.SET_NULL, null=True, blank=True)
    
    empleado1 = models.ForeignKey('rrhh.Empleado', on_delete=models.SET_NULL, related_name="presupuestos_empleado1", null=True, blank=True)
    empleado2 = models.ForeignKey('rrhh.Empleado', on_delete=models.SET_NULL, related_name="presupuestos_empleado2", null=True, blank=True)
    empleado3 = models.ForeignKey('rrhh.Empleado', on_delete=models.SET_NULL, related_name="presupuestos_empleado3", null=True, blank=True)
    
    aprobado = models.BooleanField(default=False)
    fecha = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Presupuesto {self.id}"


class Contrato(SoftDeleteModel):
    presupuesto = models.ForeignKey(Presupuesto, on_delete=models.CASCADE, related_name="contratos")
    fecha = models.DateField(auto_now_add=True)
    saldo_presupuesto = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    abonado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    fecha_ultimo_abono = models.DateField(blank=True, null=True)
    monto_ultimo_abono = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    tipo_cambio = models.DecimalField(max_digits=12, decimal_places=4, default=1)
    monto_mxn = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    saldo = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f"Contrato {self.id}"


class Pago(SoftDeleteModel):
    TIPO_PAGO_CHOICES = [
        ("APARTADO", "Apartado"),
        ("DEVOLUCION", "Devolución"),
        ("MENSUALIDAD", "Mensualidad"),
        ("PAGO", "Pago"),
        ("DESCUENTO", "Descuento"),
        ("ABONO", "Abono"),
        ("INTERES", "Interés"),
        ("COMPLETO", "Completo"),
    ]
    contrato = models.ForeignKey(Contrato, on_delete=models.CASCADE, related_name="pagos")
    tipo_pago = models.CharField(max_length=20, choices=TIPO_PAGO_CHOICES)
    fecha_pago = models.DateField()
    fecha_ingreso = models.DateField()
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.PROTECT)
    monto = models.DecimalField(max_digits=14, decimal_places=2)
    moneda = models.ForeignKey(Moneda, on_delete=models.PROTECT)
    tipo_cambio = models.ForeignKey(TipoCambio, on_delete=models.PROTECT)
    valor_mxn = models.DecimalField(max_digits=14, decimal_places=2)
    cuenta_origen = models.CharField(max_length=50, blank=True, null=True)
    banco_origen = models.ForeignKey(Banco, on_delete=models.SET_NULL, related_name="pagos_origen", null=True, blank=True)
    titular_origen = models.CharField(max_length=200, blank=True, null=True)
    cuenta_destino = models.CharField(max_length=50, blank=True, null=True)
    banco_destino = models.ForeignKey(Banco, on_delete=models.SET_NULL, related_name="pagos_destino", null=True, blank=True)
    comentarios = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.tipo_pago} - {self.monto}"


register_audit(Pago)

# Registro de Auditoría
register_audit(Moneda)
register_audit(Banco)
register_audit(MetodoPago)
register_audit(Proyecto)
register_audit(Cliente)
register_audit(TipoCambio)
register_audit(Vendedor)
register_audit(FormaPago)
register_audit(UPE)
register_audit(PlanPago)
register_audit(EsquemaComision)
register_audit(Presupuesto)
register_audit(Contrato)
register_audit(Pago)

