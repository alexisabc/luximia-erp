import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from pos.models import Caja, Turno, Venta, DetalleVenta
from pos.services.caja_service import CajaService
from pos.services.venta_service import VentaService
from compras.models import Insumo, Almacen, Existencia
from compras.services.kardex_service import KardexService

User = get_user_model()

@pytest.mark.django_db
class TestFlujoVenta:
    def setup_method(self):
        # 1. Setup: Usuario, Caja, Insumo con Stock
        self.usuario = User.objects.create_user(username="cajero1", password="password")
        self.caja = Caja.objects.create(nombre="Caja 1", saldo_inicial_default=500)
        self.almacen = Almacen.objects.create(nombre="Almacén Principal", codigo="ALM-01")
        
        # Crear insumo y darle stock inicial
        self.insumo = Insumo.objects.create(
            codigo="COCA-COLA",
            descripcion="Coca Cola 600ml",
            tipo="PRODUCTO",
            costo_promedio=0
        )
        
        # Inicializar stock: 10 unidades a $15 c/u
        KardexService.registrar_movimiento(
            insumo_id=self.insumo.id,
            almacen_id=self.almacen.id,
            cantidad=10,
            tipo_movimiento='ENTRADA',
            costo_unitario=15,
            referencia="Stock Inicial Test",
            usuario=self.usuario
        )

    def test_escenario_1_apertura_turno(self):
        # Escenario 1: Apertura de Turno
        turno = CajaService.abrir_turno(
            caja_id=self.caja.id,
            usuario=self.usuario,
            saldo_inicial=500
        )
        
        assert turno is not None
        assert turno.estado == 'ABIERTA'
        assert turno.saldo_inicial == 500
        assert turno.caja == self.caja
        assert turno.usuario == self.usuario

    def test_escenario_2_venta_exitosa(self):
        # Primero abrir turno
        turno = CajaService.abrir_turno(self.caja.id, self.usuario, 500)
        
        # Escenario 2: Venta Exitosa
        items = [
            {
                'tipo': 'insumo',
                'insumo_id': self.insumo.id,
                'cantidad': 2,
                'precio_unitario': 20  # Precio de venta
            }
        ]
        
        venta = VentaService.crear_venta(
            turno_id=turno.id,
            items=items,
            metodo_pago='EFECTIVO',
            almacen_id=self.almacen.id,
            usuario=self.usuario
        )
        
        # Asserts: Venta guardada
        assert venta is not None
        assert venta.estado == 'PAGADA'
        # Total = subtotal (40) + IVA 16% (6.40) = 46.40
        assert venta.total == Decimal('46.40')
        
        # Assert: Stock bajó a 8
        existencia = Existencia.objects.get(insumo=self.insumo, almacen=self.almacen)
        assert existencia.cantidad == 8
        
        # Assert: Se creó MovimientoInventario tipo SALIDA
        from compras.models import MovimientoInventario
        movimiento = MovimientoInventario.objects.filter(
            insumo=self.insumo,
            tipo_movimiento='SALIDA'
        ).first()
        assert movimiento is not None
        assert movimiento.cantidad == -2

    def test_escenario_3_cierre_turno(self):
        # Abrir turno
        turno = CajaService.abrir_turno(self.caja.id, self.usuario, 500)
        
        # Realizar una venta
        items = [
            {
                'tipo': 'insumo',
                'insumo_id': self.insumo.id,
                'cantidad': 2,
                'precio_unitario': 20
            }
        ]
        VentaService.crear_venta(
            turno_id=turno.id,
            items=items,
            metodo_pago='EFECTIVO',
            almacen_id=self.almacen.id,
            usuario=self.usuario
        )
        
        # Escenario 3: Cierre de Turno
        # Saldo esperado: 500 (inicial) + 46.40 (venta con IVA) = 546.40
        # Declaramos 546.40 (sin diferencia)
        turno_cerrado = CajaService.cerrar_turno(
            turno_id=turno.id,
            saldo_declarado=Decimal('546.40')
        )
        
        assert turno_cerrado.estado == 'CERRADA'
        assert turno_cerrado.saldo_final_calculado == Decimal('546.40')
        assert turno_cerrado.saldo_final_declarado == Decimal('546.40')
        assert turno_cerrado.diferencia == 0
        assert turno_cerrado.fecha_cierre is not None

    def test_error_venta_sin_turno_abierto(self):
        # Intentar vender sin turno abierto debe fallar
        items = [
            {
                'tipo': 'insumo',
                'insumo_id': self.insumo.id,
                'cantidad': 1,
                'precio_unitario': 20
            }
        ]
        
        with pytest.raises(ValueError, match="No existe un turno con ese ID o no está abierto"):
            VentaService.crear_venta(
                turno_id=99999,  # ID inexistente
                items=items,
                metodo_pago='EFECTIVO',
                almacen_id=self.almacen.id,
                usuario=self.usuario
            )

    def test_error_caja_ya_tiene_turno_abierto(self):
        # Abrir primer turno
        CajaService.abrir_turno(self.caja.id, self.usuario, 500)
        
        # Intentar abrir otro turno en la misma caja debe fallar
        with pytest.raises(ValueError, match="Ya existe un turno abierto en esta caja"):
            CajaService.abrir_turno(self.caja.id, self.usuario, 500)
