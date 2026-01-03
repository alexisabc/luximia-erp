from django.db import models
from django.conf import settings
from core.models import SoftDeleteModel, register_audit, EmpresaOwnedModel, MultiTenantManager
from .compras import OrdenCompra
from .productos import Insumo
from .inventario import Almacen

class RecepcionCompra(SoftDeleteModel, EmpresaOwnedModel):
    # Manager combinando SoftDelete y Empresa
    objects = MultiTenantManager()
    orden_compra = models.ForeignKey(OrdenCompra, on_delete=models.PROTECT, related_name='recepciones')
    fecha_recepcion = models.DateTimeField(auto_now_add=True)
    usuario_recibe = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    folio_remision_proveedor = models.CharField(max_length=50, blank=True, null=True)
    notas = models.TextField(blank=True)

    def __str__(self):
        folio_oc = self.orden_compra.folio if self.orden_compra else 'S/F'
        return f"REC-{self.id} | OC: {folio_oc}"

class DetalleRecepcion(SoftDeleteModel):
    recepcion = models.ForeignKey(RecepcionCompra, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Insumo, on_delete=models.PROTECT)
    cantidad_recibida = models.DecimalField(max_digits=12, decimal_places=4)
    almacen_destino = models.ForeignKey(Almacen, on_delete=models.PROTECT)
    
    def __str__(self):
        desc = self.producto.descripcion if self.producto else 'Desconocido'
        return f"{self.cantidad_recibida} x {desc}"

register_audit(RecepcionCompra)
register_audit(DetalleRecepcion)
