"""
Servicio centralizado para generación de reportes y analytics
"""
from django.db.models import Sum, Count, Q, F, Avg
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any

from core.services.cache_service import cache_report, cache_kpis


class ReportesService:
    """
    Servicio para generación de reportes financieros y analytics
    """
    
    @staticmethod
    @cache_report(timeout=900)  # 15 minutos
    def get_financial_summary(fecha_inicio: datetime, fecha_fin: datetime, empresa_id: int = None) -> Dict[str, Any]:
        """
        Resumen financiero con ingresos, egresos y utilidad
        
        Args:
            fecha_inicio: Fecha de inicio del período
            fecha_fin: Fecha de fin del período
            empresa_id: ID de la empresa (opcional)
            
        Returns:
            dict: {
                'ingresos_total': Decimal,
                'egresos_total': Decimal,
                'utilidad': Decimal,
                'margen': float,
                'facturas_count': int,
                'egresos_count': int
            }
        """
        from contabilidad.models import Factura
        from tesoreria.models import Egreso
        
        # Filtros base
        facturas_filter = Q(fecha__gte=fecha_inicio, fecha__lte=fecha_fin, estado='TIMBRADA')
        egresos_filter = Q(fecha__gte=fecha_inicio, fecha__lte=fecha_fin)
        
        if empresa_id:
            facturas_filter &= Q(empresa_id=empresa_id)
            egresos_filter &= Q(empresa_id=empresa_id)
        
        # Calcular ingresos
        ingresos_data = Factura.objects.filter(facturas_filter).aggregate(
            total=Sum('total'),
            count=Count('id')
        )
        
        # Calcular egresos
        egresos_data = Egreso.objects.filter(egresos_filter).aggregate(
            total=Sum('monto'),
            count=Count('id')
        )
        
        ingresos_total = ingresos_data['total'] or Decimal('0')
        egresos_total = egresos_data['total'] or Decimal('0')
        utilidad = ingresos_total - egresos_total
        
        margen = 0
        if ingresos_total > 0:
            margen = float((utilidad / ingresos_total) * 100)
        
        return {
            'ingresos_total': float(ingresos_total),
            'egresos_total': float(egresos_total),
            'utilidad': float(utilidad),
            'margen': round(margen, 2),
            'facturas_count': ingresos_data['count'],
            'egresos_count': egresos_data['count']
        }
    
    @staticmethod
    @cache_report(timeout=900)  # 15 minutos
    def get_ventas_por_periodo(
        fecha_inicio: datetime,
        fecha_fin: datetime,
        periodo: str = 'mes',
        empresa_id: int = None
    ) -> List[Dict[str, Any]]:
        """
        Ventas agrupadas por período
        
        Args:
            fecha_inicio: Fecha de inicio
            fecha_fin: Fecha de fin
            periodo: 'dia', 'semana', 'mes'
            empresa_id: ID de la empresa (opcional)
            
        Returns:
            list: [{
                'periodo': str,
                'total': float,
                'cantidad': int
            }]
        """
        from contabilidad.models import Factura
        
        # Determinar función de truncado
        trunc_func = {
            'dia': TruncDay,
            'semana': TruncWeek,
            'mes': TruncMonth
        }.get(periodo, TruncMonth)
        
        # Filtros
        filters = Q(fecha__gte=fecha_inicio, fecha__lte=fecha_fin, estado='TIMBRADA')
        if empresa_id:
            filters &= Q(empresa_id=empresa_id)
        
        # Agrupar por período
        ventas = Factura.objects.filter(filters).annotate(
            periodo=trunc_func('fecha')
        ).values('periodo').annotate(
            total=Sum('total'),
            cantidad=Count('id')
        ).order_by('periodo')
        
        return [
            {
                'periodo': v['periodo'].strftime('%Y-%m-%d'),
                'total': float(v['total']),
                'cantidad': v['cantidad']
            }
            for v in ventas
        ]
    
    @staticmethod
    @cache_report(timeout=1800)  # 30 minutos
    def get_top_clientes(
        fecha_inicio: datetime,
        fecha_fin: datetime,
        limit: int = 10,
        empresa_id: int = None
    ) -> List[Dict[str, Any]]:
        """
        Top clientes por facturación
        
        Args:
            fecha_inicio: Fecha de inicio
            fecha_fin: Fecha de fin
            limit: Número de clientes a retornar
            empresa_id: ID de la empresa (opcional)
            
        Returns:
            list: [{
                'cliente_id': int,
                'cliente_nombre': str,
                'cliente_rfc': str,
                'total_facturado': float,
                'num_facturas': int
            }]
        """
        from contabilidad.models import Factura
        
        filters = Q(fecha__gte=fecha_inicio, fecha__lte=fecha_fin, estado='TIMBRADA')
        if empresa_id:
            filters &= Q(empresa_id=empresa_id)
        
        top_clientes = Factura.objects.filter(filters).values(
            'cliente_id',
            'cliente__nombre_completo',
            'cliente__rfc'
        ).annotate(
            total_facturado=Sum('total'),
            num_facturas=Count('id')
        ).order_by('-total_facturado')[:limit]
        
        return [
            {
                'cliente_id': c['cliente_id'],
                'cliente_nombre': c['cliente__nombre_completo'],
                'cliente_rfc': c['cliente__rfc'],
                'total_facturado': float(c['total_facturado']),
                'num_facturas': c['num_facturas']
            }
            for c in top_clientes
        ]
    
    @staticmethod
    @cache_report(timeout=1800)  # 30 minutos
    def get_obras_rentabilidad(empresa_id: int = None) -> List[Dict[str, Any]]:
        """
        Rentabilidad por obra
        
        Returns:
            list: [{
                'obra_id': int,
                'obra_nombre': str,
                'presupuesto': float,
                'costo_real': float,
                'utilidad': float,
                'margen': float,
                'estado': str
            }]
        """
        from obras.models import Obra
        from tesoreria.models import Egreso
        
        filters = Q()
        if empresa_id:
            filters &= Q(empresa_id=empresa_id)
        
        obras = Obra.objects.filter(filters).select_related('empresa')
        
        resultados = []
        for obra in obras:
            # Calcular costos reales
            costos = Egreso.objects.filter(obra=obra).aggregate(
                total=Sum('monto')
            )
            costo_real = float(costos['total'] or 0)
            presupuesto = float(obra.presupuesto_total or 0)
            
            utilidad = presupuesto - costo_real
            margen = 0
            if presupuesto > 0:
                margen = (utilidad / presupuesto) * 100
            
            resultados.append({
                'obra_id': obra.id,
                'obra_nombre': obra.nombre,
                'presupuesto': presupuesto,
                'costo_real': costo_real,
                'utilidad': utilidad,
                'margen': round(margen, 2),
                'estado': obra.estado or 'ACTIVA'
            })
        
        return sorted(resultados, key=lambda x: x['margen'], reverse=True)
    
    @staticmethod
    @cache_kpis(timeout=300)  # 5 minutos
    def get_kpis_principales(empresa_id: int = None) -> Dict[str, Any]:
        """
        KPIs principales del sistema
        
        Returns:
            dict: {
                'facturacion_mes_actual': float,
                'facturacion_mes_anterior': float,
                'crecimiento_mensual': float,
                'obras_activas': int,
                'obras_en_riesgo': int,
                'liquidez': float
            }
        """
        from contabilidad.models import Factura
        from obras.models import Obra
        from tesoreria.models import CuentaBancaria
        
        # Fechas
        hoy = datetime.now()
        inicio_mes_actual = hoy.replace(day=1)
        inicio_mes_anterior = (inicio_mes_actual - timedelta(days=1)).replace(day=1)
        
        # Facturación mes actual
        filters_actual = Q(fecha__gte=inicio_mes_actual, estado='TIMBRADA')
        filters_anterior = Q(
            fecha__gte=inicio_mes_anterior,
            fecha__lt=inicio_mes_actual,
            estado='TIMBRADA'
        )
        
        if empresa_id:
            filters_actual &= Q(empresa_id=empresa_id)
            filters_anterior &= Q(empresa_id=empresa_id)
        
        fact_actual = Factura.objects.filter(filters_actual).aggregate(total=Sum('total'))
        fact_anterior = Factura.objects.filter(filters_anterior).aggregate(total=Sum('total'))
        
        facturacion_actual = float(fact_actual['total'] or 0)
        facturacion_anterior = float(fact_anterior['total'] or 0)
        
        crecimiento = 0
        if facturacion_anterior > 0:
            crecimiento = ((facturacion_actual - facturacion_anterior) / facturacion_anterior) * 100
        
        # Obras
        obras_filters = Q()
        if empresa_id:
            obras_filters &= Q(empresa_id=empresa_id)
        
        obras_activas = Obra.objects.filter(obras_filters, estado='ACTIVA').count()
        
        # Liquidez (saldo en cuentas bancarias)
        cuentas_filters = Q()
        if empresa_id:
            cuentas_filters &= Q(empresa_id=empresa_id)
        
        liquidez_data = CuentaBancaria.objects.filter(cuentas_filters).aggregate(
            total=Sum('saldo_actual')
        )
        liquidez = float(liquidez_data['total'] or 0)
        
        return {
            'facturacion_mes_actual': facturacion_actual,
            'facturacion_mes_anterior': facturacion_anterior,
            'crecimiento_mensual': round(crecimiento, 2),
            'obras_activas': obras_activas,
            'obras_en_riesgo': 0,  # TODO: Implementar lógica de riesgo
            'liquidez': liquidez
        }


# Ejemplo de uso
"""
from core.services.reportes_service import ReportesService
from datetime import datetime, timedelta

# Resumen financiero del mes
hoy = datetime.now()
inicio_mes = hoy.replace(day=1)
resumen = ReportesService.get_financial_summary(inicio_mes, hoy)
print(f"Utilidad del mes: ${resumen['utilidad']:,.2f}")

# Top 10 clientes
top_clientes = ReportesService.get_top_clientes(inicio_mes, hoy, limit=10)
for cliente in top_clientes:
    print(f"{cliente['cliente_nombre']}: ${cliente['total_facturado']:,.2f}")
"""
