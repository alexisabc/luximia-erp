from django.db.models import Sum, F, DecimalField, Q
from decimal import Decimal
from pos.models import Venta
from compras.models import OrdenCompra
from rrhh.models import Nomina
# Asumimos que existe un modelo de Pago o Aplicación para restar saldos, 
# si no, lo calcularemos contra movimientos bancarios ligados.

class DeudaService:
    @staticmethod
    def get_cuentas_por_pagar(empresa_id):
        """
        CXP: OrdenCompra 'AUTORIZADA' con recepciones + Nominas 'TIMBRADA' no pagadas.
        """
        # 1. OC con recepciones
        oc_pendientes = OrdenCompra.objects.filter(
            empresa_id=empresa_id,
            estado__in=['AUTORIZADA', 'COMPLETADA'],
            recepciones__isnull=False
        ).distinct()
        
        # 2. Nóminas timbradas (asumiendo que hay un campo de estado de pago o checamos movimientos)
        nominas_pendientes = Nomina.objects.filter(
            empresa_id=empresa_id,
            estado='TIMBRADA'
        )
        
        return {
            "ordenes_compra": oc_pendientes,
            "nominas": nominas_pendientes,
            "total_cxp": sum(oc.total for oc in oc_pendientes) + sum(n.total_neto for n in nominas_pendientes)
        }

    @staticmethod
    def get_cuentas_por_cobrar(empresa_id):
        """
        CXC: Ventas con metodo_pago='CREDITO' o 'PPD' (según CFDI) y saldo > 0.
        """
        # Nota: Usaremos 'CREDITO' de METODO_PAGO_CHOICES del modelo Venta
        ventas_pendientes = Venta.objects.filter(
            empresa_id=empresa_id,
            metodo_pago='CREDITO',
            estado='PENDIENTE'
        )
        
        return {
            "ventas": ventas_pendientes,
            "total_cxc": ventas_pendientes.aggregate(total=Sum('total'))['total'] or Decimal('0.00')
        }
