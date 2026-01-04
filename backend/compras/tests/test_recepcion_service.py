import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from compras.models import Insumo, OrdenCompra, DetalleOrdenCompra, Proveedor
from inventarios.models import Almacen, MovimientoInventario, Existencia
from compras.services.recepcion_service import RecepcionService
from contabilidad.models.catalogos import Moneda

User = get_user_model()

@pytest.mark.django_db
class TestRecepcionOrden:
    def setup_method(self):
        # 1. Setup
        self.user = User.objects.create_user(username="testuser", password="password")
        self.moneda = Moneda.objects.create(codigo="MXN", nombre="Peso Mexicano")
        self.almacen = Almacen.objects.create(nombre="Bodega Central", codigo="BOD-01")
        self.proveedor = Proveedor.objects.create(razon_social="Proveedor Test", rfc="PROV010101AAA")
        
        self.insumo = Insumo.objects.create(
            codigo="CEMENTO", 
            descripcion="Saco de Cemento",
            tipo="PRODUCTO",
            costo_promedio=0
        )
        
        # Orden de Compra AUTORIZADA
        self.orden = OrdenCompra.objects.create(
            proveedor=self.proveedor,
            solicitante=self.user,
            moneda=self.moneda,
            motivo_compra="Stock para obra",
            estado='AUTORIZADA'
        )
        
        # Detalle: 10 sacos a $150.00
        self.detalle = DetalleOrdenCompra.objects.create(
            orden=self.orden,
            insumo=self.insumo,
            cantidad=10,
            precio_unitario=150
        )

    def test_recepcion_total_actualiza_stock_y_costos(self):
        # 2. Ejecución
        items = [{'producto_id': self.insumo.id, 'cantidad': 10}]
        RecepcionService.recibir_orden(self.orden.id, items, self.user, almacen_id_global=self.almacen.id)
        
        # 3. Verificaciones
        self.orden.refresh_from_db()
        self.insumo.refresh_from_db()
        existencia = Existencia.objects.get(insumo=self.insumo, almacen=self.almacen)
        
        # Estado de la orden
        assert self.orden.estado == 'COMPLETADA'
        
        # Stock e Inventario
        assert existencia.cantidad == 10
        
        # Costo Promedio (100% de la entrada inicial)
        assert self.insumo.costo_promedio == Decimal('150.0000')
        
        # Movimiento de Inventario
        movimiento = MovimientoInventario.objects.filter(insumo=self.insumo, almacen=self.almacen).first()
        assert movimiento is not None
        assert movimiento.tipo_movimiento == 'ENTRADA'
        assert f"OC: {self.orden.folio}" in movimiento.referencia
        assert movimiento.cantidad == 10
        assert movimiento.costo_unitario == 150

    def test_error_si_orden_no_esta_autorizada(self):
        self.orden.estado = 'BORRADOR'
        self.orden.save()
        
        with pytest.raises(ValueError):
            items = [{'producto_id': self.insumo.id, 'cantidad': 10}]
            RecepcionService.recibir_orden(self.orden.id, items, self.user, almacen_id_global=self.almacen.id)
