from django.db.models import Sum, Count
from django.utils import timezone
from django.db.models.functions import TruncDate
from datetime import timedelta

# Import models
from pos.models import Venta, Turno
from tesoreria.models import CuentaBancaria, ContraRecibo
from rrhh.models_nomina import Nomina
from compras.models import OrdenCompra, Existencia

class DashboardService:
    @staticmethod
    def get_kpis_financieros():
        """
        Calcula KPIs financieros clave para el dashboard.
        """
        hoy = timezone.now().date()
        mes_actual = hoy.month
        anio_actual = hoy.year

        # 1. Ventas Hoy
        ventas_hoy = Venta.objects.filter(
            fecha__date=hoy,
            estado='PAGADA'
        ).aggregate(total=Sum('total'))['total'] or 0

        # 2. Saldo Bancario
        saldo_bancos = CuentaBancaria.objects.filter(
            activa=True
        ).aggregate(total=Sum('saldo_actual'))['total'] or 0

        # 3. Cuentas por Pagar (Mes actual)
        # ContraRecibos validados que vencen este mes
        cxp_mes = ContraRecibo.objects.filter(
            estado='VALIDADO',
            fecha_vencimiento__month=mes_actual,
            fecha_vencimiento__year=anio_actual
        ).aggregate(total=Sum('saldo_pendiente'))['total'] or 0

        # 4. Nómina Activa (Borradores)
        nomina_activa = Nomina.objects.filter(
            estado='BORRADOR'
        ).aggregate(total=Sum('total_neto'))['total'] or 0

        return {
            "ventas_hoy": float(ventas_hoy),
            "saldo_bancos": float(saldo_bancos),
            "cxp_mes": float(cxp_mes),
            "nomina_activa": float(nomina_activa)
        }

    @staticmethod
    def get_pendientes_operativos(usuario):
        """
        Genera alertas/acciones requeridas según permisos del usuario.
        """
        acciones = []
        
        # Check permissions (simple check, refine with RBAC if needed)
        # Asumiendo que el usuario tiene permisos si puede ver el dashboard, 
        # pero filtramos por relevancia.
        
        # Tesorería: Turnos cerrados pendientes de arqueo/depósito
        if usuario.has_perm('pos.view_turno') or usuario.is_superuser:
            turnos_pendientes = Turno.objects.filter(estado='CERRADA').count()
            if turnos_pendientes > 0:
                acciones.append({
                    "tipo": "warning",
                    "mensaje": f"{turnos_pendientes} Turnos de POS por arquear/depositar",
                    "link": "/tesoreria/cortes" 
                })

        # Compras: OCs por autorizar
        if usuario.has_perm('compras.autorizar_oc') or usuario.is_superuser:
            ocs_pendientes = OrdenCompra.objects.filter(estado='PENDIENTE_AUTORIZACION').count()
            if ocs_pendientes > 0:
                acciones.append({
                    "tipo": "info",
                    "mensaje": f"{ocs_pendientes} Órdenes de Compra por autorizar",
                    "link": "/compras/ordenes?estado=PENDIENTE_AUTORIZACION"
                })

        # Almacén: Stock bajo (Mock threshold < 10 for MVP since stock_minimo is missing)
        if usuario.has_perm('compras.view_existencia') or usuario.is_superuser:
            # Contar existencias menores a 10
            stock_bajo = Existencia.objects.filter(cantidad__lt=10).count()
            if stock_bajo > 0:
                acciones.append({
                    "tipo": "error",
                    "mensaje": f"{stock_bajo} Insumos con stock crítico",
                    "link": "/compras/inventario"
                })
        
        return acciones

    @staticmethod
    def get_grafica_ventas_semana():
        """
        Datos para gráfica de ventas últimos 7 días.
        """
        fin = timezone.now().date()
        inicio = fin - timedelta(days=6)
        
        ventas_diarias = Venta.objects.filter(
            fecha__date__range=[inicio, fin],
            estado='PAGADA'
        ).annotate(
            dia=TruncDate('fecha')
        ).values('dia').annotate(
            total=Sum('total')
        ).order_by('dia')
        
        # Formatear para Chart.js / Recharts
        # Asegurar que todos los días esten presentes con 0 si no hay ventas
        data_map = {item['dia']: item['total'] for item in ventas_diarias}
        
        labels = []
        data = []
        
        current = inicio
        while current <= fin:
            labels.append(current.strftime("%a %d")) # Ej: Lun 30
            val = data_map.get(current, 0)
            data.append(float(val))
            current += timedelta(days=1)
            
        return {
            "labels": labels,
            "data": data
        }
