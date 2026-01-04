import pytest
from decimal import Decimal
from compras.models.productos import Insumo
from inventarios.models import Almacen, Existencia, MovimientoInventario
from inventarios.services.kardex_service import KardexService

@pytest.mark.django_db
class TestKardexMovimientos:
    def setup_method(self):
        # 1. Estado Inicial: Insumo "Clavos" con Stock 0 y Costo $0
        self.insumo = Insumo.objects.create(
            codigo="CLAVOS", 
            descripcion="Clavos 2 pulgadas",
            tipo="PRODUCTO",
            costo_promedio=0
        )
        self.almacen = Almacen.objects.create(nombre="Almacen Central", codigo="ALM-01")

    def test_flujo_costeo_ponderado(self):
        # 2. Movimiento 1 (Compra Inicial): Entrada de 10 unidades a $10.00
        KardexService.registrar_movimiento(
            self.insumo.id, self.almacen.id, 10, 'ENTRADA', costo_unitario=10
        )
        self.insumo.refresh_from_db()
        existencia = Existencia.objects.get(insumo=self.insumo, almacen=self.almacen)
        
        assert existencia.cantidad == 10
        assert self.insumo.costo_promedio == Decimal('10.0000')

        # 3. Movimiento 2 (Compra a Nuevo Precio): Entrada de 10 unidades a $20.00
        # Cálculo: ((10 * $10) + (10 * $20)) / 20 = $15.00
        KardexService.registrar_movimiento(
            self.insumo.id, self.almacen.id, 10, 'ENTRADA', costo_unitario=20
        )
        self.insumo.refresh_from_db()
        existencia.refresh_from_db()
        
        assert existencia.cantidad == 20
        assert self.insumo.costo_promedio == Decimal('15.0000')

        # 4. Movimiento 3 (Salida/Venta): Salida de 5 unidades.
        # En nuestra implementación, las salidas se registran con cantidad negativa o tipo SALIDA.
        # El requerimiento dice "Salida de 5 unidades". 
        # Usaremos cantidad=5 y tipo_movimiento='SALIDA' (el service restará internamente si es SALIDA o aceptará negativa)
        # Mi implementación previa sumaba la cantidad directamente: existencia.cantidad += cantidad_dec
        # Por lo tanto, para una salida de 5, debo pasar -5.
        KardexService.registrar_movimiento(
            self.insumo.id, self.almacen.id, -5, 'SALIDA'
        )
        self.insumo.refresh_from_db()
        existencia.refresh_from_db()

        assert existencia.cantidad == 15
        assert self.insumo.costo_promedio == Decimal('15.0000') # El costo no cambia en salidas

    def test_validacion_stock_negativo(self):
        # Preparación: Tener 15 unidades
        KardexService.registrar_movimiento(self.insumo.id, self.almacen.id, 15, 'ENTRADA', 10)
        
        # 5. Validación de Stock Negativo: Intenta sacar 20 unidades (cuando hay 15)
        # Debe lanzar ValueError
        with pytest.raises(ValueError, match="Stock insuficiente"):
             KardexService.registrar_movimiento(
                 self.insumo.id, self.almacen.id, -20, 'SALIDA'
             )
