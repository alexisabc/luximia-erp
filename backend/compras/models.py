from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit
from django.core.validators import MinValueValidator

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

class Insumo(SoftDeleteModel):
    """
    Catálogo de bienes y servicios (Conceptos de Compra).
    Se vinculará con Contabilidad para asignar cuenta contable por defecto.
    """
    TIPO_CHOICES = [
        ('PRODUCTO', 'Producto/Material'),
        ('SERVICIO', 'Servicio'),
        ('ACTIVO_FIJO', 'Activo Fijo'),
    ]
    
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=200)
    unidad_medida = models.CharField(max_length=20, default='PZA')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='SERVICIO')
    
    # Link contable futuro (por ahora char o FK placeholder)
    # cuenta_contable = models.ForeignKey('contabilidad.CuentaContable', ...)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

class OrdenCompra(SoftDeleteModel):
    """
    Header de la Orden de Compra.
    Maneja el flujo de autorización de 2 niveles.
    """
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('PENDIENTE_VOBO', 'Pendiente VoBo'),
        ('PENDIENTE_AUTORIZACION', 'Pendiente de Autorización'),
        ('AUTORIZADA', 'Autorizada'),
        ('RECHAZADA', 'Rechazada'),
        ('CANCELADA', 'Cancelada'),
        ('COMPLETADA', 'Completada'), # Ya tiene CRs/Facturas por el total
    ]
    
    folio = models.CharField(max_length=20, unique=True, editable=False) # Se generará auto
    fecha_solicitud = models.DateField(auto_now_add=True)
    fecha_requerida = models.DateField(blank=True, null=True)
    
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='ordenes_compra')
    solicitante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='ordenes_solicitadas')
    
    departamento = models.CharField(max_length=100, blank=True, null=True) # O FK a rrhh.Departamento
    proyecto = models.ForeignKey('contabilidad.Proyecto', on_delete=models.SET_NULL, null=True, blank=True)
    
    motivo_compra = models.TextField()
    notas = models.TextField(blank=True, null=True)
    
    # Totales
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda = models.ForeignKey('contabilidad.Moneda', on_delete=models.PROTECT)
    
    # Autorizaciones
    vobo_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='vobos_dados')
    vobo_fecha = models.DateTimeField(blank=True, null=True)
    
    autorizado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='autorizaciones_dadas')
    autorizado_fecha = models.DateTimeField(blank=True, null=True)
    
    rechazado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='ordenes_rechazadas')
    motivo_rechazo = models.TextField(blank=True, null=True)
    
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default='BORRADOR')
    
    def save(self, *args, **kwargs):
        if not self.folio:
            # Generar folio simple: OC-YYYY-ID
            import datetime
            year = datetime.date.today().year
            last_id = OrdenCompra.objects.all().order_by('id').last()
            new_id = (last_id.id + 1) if last_id else 1
            self.folio = f"OC-{year}-{new_id:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.folio} - {self.proveedor}"

class DetalleOrdenCompra(SoftDeleteModel):
    orden = models.ForeignKey(OrdenCompra, on_delete=models.CASCADE, related_name='detalles')
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT)
    descripcion_personalizada = models.CharField(max_length=255, blank=True, null=True) # Por si la descripción del insumo no basta
    
    cantidad = models.DecimalField(max_digits=12, decimal_places=4, validators=[MinValueValidator(0.0001)])
    precio_unitario = models.DecimalField(max_digits=14, decimal_places=4)
    descuento = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    impuesto_tasa = models.DecimalField(max_digits=5, decimal_places=2, default=0.16) # 0.16
    
    importe = models.DecimalField(max_digits=14, decimal_places=2, editable=False) # Cantidad * Precio - Descuento
    
    def save(self, *args, **kwargs):
        self.importe = (self.cantidad * self.precio_unitario) - self.descuento
        super().save(*args, **kwargs)
        # TODO: Trigger update of parent totals

    def __str__(self):
        return f"{self.orden.folio} - {self.insumo}"

register_audit(Proveedor)
register_audit(Insumo)
register_audit(OrdenCompra)
register_audit(DetalleOrdenCompra)
