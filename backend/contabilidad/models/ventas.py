from django.db import models
from core.models import SoftDeleteModel, register_audit
from .catalogos import Cliente, Moneda, FormaPago, EsquemaComision, Vendedor, TipoCambio, MetodoPago, Banco
from .proyectos import UPE

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

register_audit(PlanPago)
register_audit(Presupuesto)
register_audit(Contrato)
register_audit(Pago)
