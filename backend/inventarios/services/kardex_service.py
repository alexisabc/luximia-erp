from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from inventarios.models import MovimientoInventario, Existencia, Almacen
from compras.models import Insumo

class KardexService:
    """
    Servicio encargado de orquestar los movimientos de inventario y 
    mantener la integridad del Costeo Promedio.
    """

    @staticmethod
    def registrar_movimiento(insumo_id, almacen_id, cantidad, tipo_movimiento, costo_unitario=0, referencia="", usuario=None):
        """
        Registra un movimiento en el Kárdex, actualiza la tabla de existencias
        y recalcula el costo promedio si es una entrada.
        """
        cantidad_dec = Decimal(str(cantidad))
        costo_dec = Decimal(str(costo_unitario))

        with transaction.atomic():
            # Bloquear insumo para evitar race conditions en el cálculo del costo
            insumo = Insumo.objects.select_for_update().get(pk=insumo_id)
            almacen = Almacen.objects.get(pk=almacen_id)

            # 1. Registrar el movimiento histórico
            movimiento = MovimientoInventario.objects.create(
                insumo=insumo,
                almacen=almacen,
                cantidad=cantidad_dec,
                costo_unitario=costo_dec,
                tipo_movimiento=tipo_movimiento,
                referencia=referencia,
                usuario=usuario
            )

            # 2. Actualizar/Crear el resumen de existencia en ese almacén
            existencia, _ = Existencia.objects.get_or_create(
                insumo=insumo,
                almacen=almacen,
                defaults={'cantidad': 0}
            )
            
            # Validación de Stock Negativo (No permitir salidas que superen la existencia)
            if (tipo_movimiento == 'SALIDA' or cantidad_dec < 0) and (existencia.cantidad + cantidad_dec < 0):
                raise ValueError(f"Stock insuficiente: se intentó retirar {-cantidad_dec} pero solo hay {existencia.cantidad} en el almacén.")

            existencia.cantidad += cantidad_dec
            existencia.save()

            # 3. Lógica de Costeo Promedio
            # El costo promedio se actualiza típicamente solo en ENTRADAS (Compras, devoluciones, etc.)
            # En SALIDAS, el costo del movimiento debería ser el costo_promedio actual.
            if tipo_movimiento == 'ENTRADA' or (tipo_movimiento == 'AJUSTE' and cantidad_dec > 0):
                KardexService._recalcular_costo_promedio(insumo, cantidad_dec, costo_dec)
            elif tipo_movimiento == 'SALIDA':
                # En salidas, registramos el costo al que salió (el promedio actual)
                movimiento.costo_unitario = insumo.costo_promedio
                movimiento.save()

            return movimiento

    @staticmethod
    def _recalcular_costo_promedio(insumo, cant_entrada, costo_entrada):
        """
        Fórmula de Costo Promedio Ponderado:
        CPP = (Valor Stock Anterior + Valor Entrada Nueva) / (Cantidad Stock Total)
        """
        # Calcular stock total en todos los almacenes
        # Usamos filter(insumo=insumo) sobre Existencia (importada de inventarios.models)
        totales = Existencia.objects.filter(insumo=insumo).aggregate(total_stock=Sum('cantidad'))
        stock_actual = totales['total_stock'] or Decimal(0)
        
        # Necesitamos el stock antes de esta entrada
        stock_anterior = stock_actual - cant_entrada
        
        valor_anterior = stock_anterior * insumo.costo_promedio
        valor_entrada = cant_entrada * costo_entrada
        
        if stock_actual > 0:
            nuevo_promedio = (valor_anterior + valor_entrada) / stock_actual
            insumo.costo_promedio = nuevo_promedio.quantize(Decimal('0.0001'))
            insumo.ultimo_costo = costo_entrada
            insumo.save()
        elif stock_actual == 0:
            # Si el stock era negativo y ahora es 0, o simplemente es 0
            insumo.ultimo_costo = costo_entrada
            insumo.save()
