from django.db import transaction
from ..models import OrdenCompra, Almacen
from .kardex_service import KardexService

class RecepcionService:
    """
    Servicio para manejar la recepción física de mercancía 
    derivada de una Orden de Compra.
    """

    @staticmethod
    @transaction.atomic
    def recibir_orden(orden_id, almacen_id, usuario=None):
        """
        Procesa la recepción total de una Orden de Compra.
        Crea los movimientos de entrada en el almacén especificado y
        actualiza el estado de la OC.
        """
        # 1. Obtener y validar la orden
        orden = OrdenCompra.objects.select_for_update().get(pk=orden_id)
        almacen = Almacen.objects.get(pk=almacen_id)

        if orden.estado != 'AUTORIZADA':
            raise ValueError(f"No se puede recibir la orden {orden.folio}. Solo se pueden recibir órdenes en estado AUTORIZADA (Estado actual: {orden.get_estado_display()}).")

        # 2. Iterar sobre los detalles de la orden
        # Usamos select_related para optimizar la carga del insumo
        detalles = orden.detalles.select_related('insumo').all()
        
        if not detalles.exists():
            raise ValueError(f"La orden {orden.folio} no tiene conceptos para recibir.")

        for detalle in detalles:
            # 3. Registrar entrada en Kardex por cada item
            # El KardexService se encarga de:
            # - Crear el MovimientoInventario
            # - Actualizar la Existencia por almacén
            # - Recalcular el Costo Promedio del Insumo
            KardexService.registrar_movimiento(
                insumo_id=detalle.insumo.id,
                almacen_id=almacen.id,
                cantidad=detalle.cantidad,
                tipo_movimiento='ENTRADA',
                costo_unitario=detalle.precio_unitario,
                referencia=f"Recepción Total OC: {orden.folio}",
                usuario=usuario
            )

        # 4. Actualizar estado de la Orden
        orden.estado = 'COMPLETADA'
        orden.save()

        return True
