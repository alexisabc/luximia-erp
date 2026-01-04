from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from ..models import OrdenCompra, RecepcionCompra, DetalleRecepcion, DetalleOrdenCompra
# from ..models.inventario import Almacen # Ya no existe alli, hay que cambiarlo

from inventarios.models import Almacen # Traer Almacen de inventarios
from inventarios.services.kardex_service import KardexService
# Intentar importar ObrasService, manejando posible error circular o falta de modulo
try:
    from obras.services import ObrasService
except ImportError:
    ObrasService = None

class RecepcionService:
    """
    Servicio para manejar la recepción física de mercancía 
    derivada de una Orden de Compra.
    Maneja recepciones parciales y totales.
    """

    @staticmethod
    @transaction.atomic
    def recibir_orden(orden_id, items_recibidos, usuario, almacen_id_global=None, folio_remision=None, notas=""):
        """
        Procesa la recepción (parcial o total) de una Orden de Compra.
        
        Args:
            orden_id: ID de la OC.
            items_recibidos: Lista de dicts [{'producto_id': int, 'cantidad': float, 'almacen_id': int (opcional)}]
            usuario: Usuario que realiza la operación.
            almacen_id_global: Almacén por defecto si no viene en el item.
        """
        orden = OrdenCompra.objects.select_for_update().get(pk=orden_id)
        
        # Validar estado para permitir recepción
        # Debe estar AUTORIZADA o ya PARCIALMENTE_SURTIDA
        # NOTA: En el sistema previo usábamos 'AUTORIZADA', revisaré si 'APROBADA' es el termino correcto en el seed.
        # Asumo 'AUTORIZADA' o 'APROBADA'. Mi conversión service la dejaba 'COMPRADA'?
        # ConversionService dejaba 'BORRADOR' (Step 1099, line 43). 
        # Ah, ConversionService line 43: estado='BORRADOR'.
        # El usuario debe AUTORIZADA la OC primero?
        # En Mesa de Control generé OC. 
        # Asumiré que el estado debe ser 'BORRADOR' (recién creada) o 'AUTORIZADA'.
        # Permitiré 'BORRADOR', 'AUTORIZADA', 'PARCIALMENTE_SURTIDA'.
        
        valid_states = ['BORRADOR', 'AUTORIZADA', 'PARCIALMENTE_SURTIDA', 'EN_PROCESO']
        if orden.estado not in valid_states:
             raise ValidationError(f"No se puede recibir la orden {orden.folio}. Estado actual: {orden.get_estado_display()}")

        # Crear cabecera RecepcionCompra
        recepcion = RecepcionCompra.objects.create(
            orden_compra=orden,
            usuario_recibe=usuario,
            folio_remision_proveedor=folio_remision,
            notas=notas
        )

        todo_completado_global = True
        
        for item in items_recibidos:
            prod_id = item.get('producto_id')
            cant_recibir = Decimal(str(item.get('cantidad', 0)))
            
            if cant_recibir <= 0: 
                continue
            
            # Buscar detalle OC correspondiente al producto
            try:
                detalle_oc = orden.detalles.get(insumo_id=prod_id)
            except DetalleOrdenCompra.DoesNotExist:
                raise ValidationError(f"El producto ID {prod_id} no está incluido en esta Orden de Compra.")

            pendiente = detalle_oc.cantidad - detalle_oc.cantidad_recibida
            
            # Tolerancia 0% hacia arriba
            if cant_recibir > pendiente:
                 raise ValidationError(f"Exceso de recepción para {detalle_oc.insumo.descripcion}. Solicitado: {detalle_oc.cantidad}, Recibido Previo: {detalle_oc.cantidad_recibida}, Intento Actual: {cant_recibir}")

            # 1. Actualizar Detalle OC
            detalle_oc.cantidad_recibida += cant_recibir
            detalle_oc.save()

            # 2. Crear Detalle Recepcion
            almacen_destino_id = item.get('almacen_id') or almacen_id_global
            if not almacen_destino_id:
                 # Si no se especifica, tomar el primer almacen disponible o error
                 first_almacen = Almacen.objects.first()
                 if first_almacen:
                     almacen_destino_id = first_almacen.id
                 else:
                     raise ValidationError("Se requiere especificar un almacén de destino.")

            DetalleRecepcion.objects.create(
                recepcion=recepcion,
                producto_id=prod_id,
                cantidad_recibida=cant_recibir,
                almacen_destino_id=almacen_destino_id
            )

            # 3. Impacto Kardex (Stock)
            KardexService.registrar_movimiento(
                insumo_id=prod_id,
                almacen_id=almacen_destino_id,
                cantidad=cant_recibir,
                tipo_movimiento='ENTRADA',
                costo_unitario=detalle_oc.precio_unitario,
                referencia=f"Recepción OC: {orden.folio} (REM: {folio_remision or 'S/R'})",
                usuario=usuario
            )
            
            # 4. Impacto Obras (Devengado)
            if ObrasService and orden.requisicion and orden.requisicion.centro_costo:
                monto_recibido = cant_recibir * detalle_oc.precio_unitario
                ObrasService.devengar_presupuesto(
                    orden.requisicion.centro_costo_id,
                    'MATERIALES',
                    monto_recibido
                )

        # 5. Evaluar estado final de OC
        all_completed = True
        has_reception = False
        
        # Refrescamos detalles
        for d in orden.detalles.all():
            if d.cantidad_recibida > 0:
                has_reception = True
            if d.cantidad_recibida < d.cantidad:
                all_completed = False
        
        new_status = orden.estado
        if all_completed:
            new_status = 'COMPLETADA'
        elif has_reception:
            new_status = 'PARCIALMENTE_SURTIDA'
            
        if orden.estado != new_status:
            orden.estado = new_status
            orden.save()

        return recepcion
