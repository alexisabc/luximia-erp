from django.db.models import Sum, Q
from decimal import Decimal
from obras.models import Obra, Estimacion
from tesoreria.models.cxp import ContraRecibo
from compras.models.compras import OrdenCompra

class DashboardService:
    @staticmethod
    def get_executive_summary(user):
        """
        Retorna los KPIs principales para el Dashboard Ejecutivo.
        """
        
        # 1. KPIs Financieros (Tesorería)
        # CXP: Documentos Validados o Programados que aun deben dinero
        cxp_raw = ContraRecibo.objects.filter(
            estado__in=['VALIDADO', 'PROGRAMADO'],
            saldo_pendiente__gt=0
        ).aggregate(total=Sum('saldo_pendiente'))['total'] or 0
        
        # CXC: Estimaciones Autorizadas o Facturadas que no están Pagadas
        # Nota: Idealmente usaríamos CobroCliente para calcular saldo real, 
        # pero aqui usamos la logica de estado simple del Sprint 36
        cxc_raw = Estimacion.objects.filter(
            estado__in=['AUTORIZADA', 'FACTURADA']
        ).aggregate(total=Sum('total'))['total'] or 0
        
        # Enfoque simple: Restamos lo que ya se cobró si tuviéramos campo saldo en estimacion
        # Asumiremos que 'total' es lo pendiente por simplicidad o que AUTORIZADA implica pendiente full
        
        # Banco (Mock)
        saldo_banco = Decimal('1500000.00') 

        # 2. Rentabilidad por Obra
        obras_stats = []
        obras = Obra.objects.all()
        for obra in obras:
            # Ingresos (Estimaciones)
            ingresos = Estimacion.objects.filter(obra=obra).aggregate(t=Sum('subtotal'))['t'] or 0
            
            # Egresos (ODCs Autorizadas)
            egresos = OrdenCompra.objects.filter(
                proyecto=obra, 
                estado__in=['AUTORIZADA', 'COMPRADA', 'RECIBIDA']
            ).aggregate(t=Sum('subtotal'))['t'] or 0
            
            margen = ingresos - egresos
            pct = (margen / ingresos * 100) if ingresos > 0 else 0
            
            obras_stats.append({
                'id': obra.id,
                'nombre': obra.nombre,
                'ingresos': ingresos,
                'egresos': egresos,
                'margen': margen,
                'pct': round(pct, 1)
            })

        # 3. Alertas
        alertas = []
        if cxp_raw > saldo_banco:
            alertas.append({'nivel': 'CRITICO', 'mensaje': 'Cuentas por Pagar exceden Saldo en Banco'})
        
        return {
            'kpis': {
                'bancos': saldo_banco,
                'cxc': cxc_raw,
                'cxp': cxp_raw,
                'flujo_neto': saldo_banco + cxc_raw - cxp_raw
            },
            'obras': obras_stats,
            'alertas': alertas
        }
