from django.db import transaction
from decimal import Decimal
from ..models import Turno, Venta, DetalleVenta
from compras.models import Insumo
from compras.services.kardex_service import KardexService

class VentaService:
    """
    Servicio para gestionar la creación de ventas con integración al inventario.
    """

    @staticmethod
    @transaction.atomic
    def crear_venta(turno_id, items, metodo_pago, almacen_id, usuario, cliente_id=None):
        """
        Crea una venta y descuenta el inventario automáticamente.
        
        Args:
            turno_id: ID del turno activo
            items: Lista de dicts con estructura:
                {
                    'tipo': 'insumo' o 'producto',
                    'insumo_id': ID del insumo (si tipo='insumo'),
                    'producto_id': ID del producto (si tipo='producto'),
                    'cantidad': Decimal,
                    'precio_unitario': Decimal
                }
            metodo_pago: Método de pago (EFECTIVO, TARJETA, etc.)
            almacen_id: ID del almacén desde donde se descuenta
            usuario: Usuario que realiza la venta
            cliente_id: ID del cliente (opcional)
        
        Returns:
            Venta creada
        """
        # Validar que el turno existe y está abierto
        try:
            turno = Turno.objects.select_for_update().get(pk=turno_id, estado='ABIERTA')
        except Turno.DoesNotExist:
            raise ValueError("No existe un turno con ese ID o no está abierto")
        
        # Crear la venta (cabecera)
        venta = Venta.objects.create(
            turno=turno,
            cliente_id=cliente_id,
            metodo_pago=metodo_pago,
            estado='PAGADA'  # En POS típicamente nace pagada
        )
        
        subtotal = Decimal(0)
        
        # Procesar cada item
        for item in items:
            cantidad = Decimal(str(item['cantidad']))
            precio_unitario = Decimal(str(item['precio_unitario']))
            subtotal_item = cantidad * precio_unitario
            
            # Crear detalle de venta
            detalle = DetalleVenta(
                venta=venta,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                subtotal=subtotal_item
            )
            
            # Determinar si es insumo o producto
            if item.get('tipo') == 'insumo':
                insumo_id = item['insumo_id']
                detalle.insumo_id = insumo_id
                
                # INTEGRACIÓN CON INVENTARIO: Registrar salida
                KardexService.registrar_movimiento(
                    insumo_id=insumo_id,
                    almacen_id=almacen_id,
                    cantidad=-cantidad,  # Negativo para salida
                    tipo_movimiento='SALIDA',
                    costo_unitario=0,  # En salidas se usa el costo promedio actual
                    referencia=f"Venta POS: {venta.folio}",
                    usuario=usuario
                )
            elif item.get('tipo') == 'producto':
                detalle.producto_id = item['producto_id']
            
            detalle.save()
            subtotal += subtotal_item
        
        # Actualizar totales de la venta
        # Simplificación: IVA 16% sobre el subtotal
        impuestos = subtotal * Decimal('0.16')
        total = subtotal + impuestos
        
        venta.subtotal = subtotal
        venta.impuestos = impuestos
        venta.total = total
        venta.monto_metodo_principal = total
        venta.save()
        
        return venta
