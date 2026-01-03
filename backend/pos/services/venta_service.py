from django.db import transaction
from django.shortcuts import get_object_or_404
from decimal import Decimal
from ..models import (
    Turno, Venta, DetalleVenta, Producto,
    CuentaCliente, MovimientoSaldoCliente
)
from compras.models import Insumo
from compras.services.kardex_service import KardexService
from core.services.config_service import ConfigService


class VentaService:
    """
    Servicio para gestionar la creación de ventas con lógica de negocio completa.
    """

    @staticmethod
    @transaction.atomic
    def crear_venta_pos(
        turno,
        items,
        metodo_principal,
        cliente=None,
        metodo_secundario=None,
        monto_principal=None,
        monto_secundario=None
    ):
        """
        Crea una venta completa del POS con soporte para pagos mixtos y cuentas de cliente.
        
        Args:
            turno: Instancia de Turno activo
            items: Lista de dicts con {'producto_id': int, 'cantidad': Decimal}
            metodo_principal: Método de pago principal (EFECTIVO, TARJETA, CREDITO, ANTICIPO)
            cliente: Instancia de Cliente (opcional, requerido para CREDITO/ANTICIPO)
            metodo_secundario: Método de pago secundario (opcional)
            monto_principal: Monto del método principal (opcional, se calcula si no se provee)
            monto_secundario: Monto del método secundario (opcional)
        
        Returns:
            Venta creada
        
        Raises:
            ValueError: Si las validaciones de negocio fallan
        """
        if not items:
            raise ValueError("La venta no tiene productos")
        
        # 1. Calcular total de la venta
        total_venta = Decimal(0)
        productos_map = {}
        
        for item in items:
            prod = get_object_or_404(Producto, pk=item['producto_id'])
            qty = Decimal(str(item['cantidad']))
            
            # V2.0: Validar stock negativo según configuración
            allow_negative = ConfigService.get_value('POS_ALLOW_NEGATIVE_STOCK', False)
            if not allow_negative and hasattr(prod, 'stock_actual'):
                if prod.stock_actual < qty:
                    raise ValueError(
                        f"Stock insuficiente para {prod.nombre}. "
                        f"Disponible: {prod.stock_actual}, Solicitado: {qty}"
                    )
            
            line_total = prod.precio_final * qty
            total_venta += line_total
            productos_map[prod.id] = {
                'prod': prod,
                'qty': qty,
                'price': prod.precio_final
            }
        
        # 2. Validar montos de pago
        if metodo_secundario:
            if monto_principal is None or monto_secundario is None:
                raise ValueError("Debe especificar montos para pagos mixtos")
            
            monto_principal = Decimal(str(monto_principal))
            monto_secundario = Decimal(str(monto_secundario))
            
            if monto_principal + monto_secundario != total_venta:
                raise ValueError("La suma de los montos debe ser igual al total")
        else:
            monto_principal = total_venta
            monto_secundario = Decimal(0)
        
        # 3. Obtener/crear cuenta del cliente si existe
        cuenta = None
        if cliente:
            cuenta, _ = CuentaCliente.objects.get_or_create(cliente=cliente)
        
        # 4. Validar disponibilidad para cada método
        VentaService._validar_metodo_pago(metodo_principal, monto_principal, cuenta)
        if metodo_secundario:
            VentaService._validar_metodo_pago(metodo_secundario, monto_secundario, cuenta)
        
        # 5. Crear venta
        venta = Venta.objects.create(
            turno=turno,
            cliente=cliente,
            subtotal=total_venta / Decimal('1.16'),
            impuestos=total_venta - (total_venta / Decimal('1.16')),
            total=total_venta,
            metodo_pago_principal=metodo_principal,
            monto_metodo_principal=monto_principal,
            metodo_pago_secundario=metodo_secundario,
            monto_metodo_secundario=monto_secundario,
            estado='PAGADA'
        )
        
        # 6. Crear detalles de venta
        for pid, info in productos_map.items():
            DetalleVenta.objects.create(
                venta=venta,
                producto=info['prod'],
                cantidad=info['qty'],
                precio_unitario=info['price'],
                subtotal=info['price'] * info['qty']
            )
        
        # 7. Aplicar movimientos de cuenta
        VentaService._aplicar_movimiento_cuenta(
            metodo_principal, monto_principal, cuenta, venta
        )
        if metodo_secundario:
            VentaService._aplicar_movimiento_cuenta(
                metodo_secundario, monto_secundario, cuenta, venta
            )
        
        return venta

    @staticmethod
    def _validar_metodo_pago(metodo, monto, cuenta):
        """
        Valida que el método de pago sea válido y tenga fondos suficientes.
        
        Raises:
            ValueError: Si la validación falla
        """
        if metodo in ['CREDITO', 'ANTICIPO'] and not cuenta:
            raise ValueError("Cliente requerido para crédito/anticipo")
        
        if metodo == 'CREDITO' and cuenta.credito_disponible < monto:
            raise ValueError(
                f"Crédito insuficiente. Disponible: ${cuenta.credito_disponible}"
            )
        
        if metodo == 'ANTICIPO' and cuenta.saldo < monto:
            raise ValueError(
                f"Anticipo insuficiente. Disponible: ${cuenta.saldo}"
            )

    @staticmethod
    def _aplicar_movimiento_cuenta(metodo, monto, cuenta, venta):
        """
        Aplica movimientos a la cuenta del cliente según el método de pago.
        """
        if not cuenta or metodo not in ['CREDITO', 'ANTICIPO']:
            return
        
        saldo_anterior = cuenta.saldo
        
        if metodo == 'CREDITO':
            cuenta.saldo -= monto
            tipo_mov = 'CARGO_VENTA'
        elif metodo == 'ANTICIPO':
            cuenta.saldo -= monto
            tipo_mov = 'CARGO_USO_ANTICIPO'
        
        cuenta.save()
        
        MovimientoSaldoCliente.objects.create(
            cuenta=cuenta,
            tipo=tipo_mov,
            monto=monto,
            referencia_venta=venta,
            saldo_anterior=saldo_anterior,
            saldo_nuevo=cuenta.saldo,
            comentarios=f"Pago {metodo} - Venta {venta.folio}"
        )

    @staticmethod
    @transaction.atomic
    def cancelar_venta(venta, supervisor, motivo):
        """
        Cancela una venta y revierte los movimientos de cuenta.
        
        Args:
            venta: Instancia de Venta a cancelar
            supervisor: Usuario que autoriza la cancelación
            motivo: Motivo de la cancelación
        
        Raises:
            ValueError: Si la venta ya está cancelada
        """
        if venta.estado == 'CANCELADA':
            raise ValueError("La venta ya está cancelada")
        
        venta.estado = 'CANCELADA'
        venta.cancelado_por = supervisor
        venta.motivo_cancelacion = motivo
        venta.save()
        
        # Revertir movimientos de saldo si aplica
        if venta.metodo_pago_principal in ['CREDITO', 'ANTICIPO'] and venta.cliente:
            cuenta = CuentaCliente.objects.get(cliente=venta.cliente)
            saldo_anterior = cuenta.saldo
            cuenta.saldo += venta.total
            cuenta.save()
            
            MovimientoSaldoCliente.objects.create(
                cuenta=cuenta,
                tipo='CANCELACION',
                monto=venta.total,
                referencia_venta=venta,
                saldo_anterior=saldo_anterior,
                saldo_nuevo=cuenta.saldo,
                comentarios=f"Cancelación venta {venta.folio}"
            )

    @staticmethod
    @transaction.atomic
    def autorizar_cancelacion_solicitud(solicitud, autorizador):
        """
        Autoriza una solicitud de cancelación y revierte los movimientos.
        
        Args:
            solicitud: Instancia de SolicitudCancelacion
            autorizador: Usuario que autoriza
        
        Raises:
            ValueError: Si la solicitud no está pendiente
        """
        if solicitud.estado != 'PENDIENTE':
            raise ValueError(f"Esta solicitud ya fue {solicitud.estado.lower()}")
        
        venta = solicitud.venta
        
        # Revertir movimientos de saldo si aplica
        if venta.metodo_pago_principal in ['CREDITO', 'ANTICIPO'] and venta.cliente:
            try:
                cuenta = CuentaCliente.objects.get(cliente=venta.cliente)
                saldo_anterior = cuenta.saldo
                cuenta.saldo += venta.total
                cuenta.save()
                
                MovimientoSaldoCliente.objects.create(
                    cuenta=cuenta,
                    tipo='CANCELACION',
                    monto=venta.total,
                    referencia_venta=venta,
                    saldo_anterior=saldo_anterior,
                    saldo_nuevo=cuenta.saldo,
                    comentarios=f"Cancelación autorizada - Venta {venta.folio}"
                )
            except CuentaCliente.DoesNotExist:
                pass
