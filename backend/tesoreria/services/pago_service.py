from django.conf import settings
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from tesoreria.models import CuentaBancaria, MovimientoBancario
from pos.models import Venta
from contabilidad.models import Factura
from contabilidad.services.facturacion_service import FacturacionService
import logging

logger = logging.getLogger(__name__)

class PagoService:
    @staticmethod
    @transaction.atomic
    def registrar_pago_cliente(venta_id, monto, cuenta_destino_id, referencia=None):
        """
        Registra un pago recibido de un cliente.
        """
        monto = Decimal(str(monto))
        venta = Venta.objects.get(id=venta_id)
        cuenta = CuentaBancaria.objects.get(id=cuenta_destino_id)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        system_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

        # 1. Movimiento Bancario
        mov = MovimientoBancario.objects.create(
            cuenta=cuenta,
            fecha=timezone.now().date(),
            tipo='INGRESO',
            monto=monto,
            referencia=referencia or f"Pago Venta {venta.folio}",
            concepto=f"Cobro a cliente: {venta.cliente.nombre_completo if venta.cliente else 'General'}",
            origen_tipo='CXC_PAGO',
            origen_id=venta.id,
            registrado_por=system_user
        )
        
        # 2. Actualizar Saldo Cuenta
        cuenta.saldo_actual += monto
        cuenta.save()
        
        # 3. Actualizar Venta
        # En la vida real, 'saldo' debería ser un campo. Aquí simulamos con el total.
        if monto >= venta.total:
            venta.estado = 'PAGADA'
        venta.save()
        
        # 4. REP (Recibo Electrónico de Pago)
        if venta.metodo_pago == 'CREDITO':
            logger.info(f"Venta {venta.folio} es PPD/Crédito. Generando REP...")
            # Aquí iría la llamada a FacturacionService para el REP
            pass
        
        return mov
