from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.services.dashboard_service import DashboardService

class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet para el Dashboard Ejecutivo (Business Intelligence).
    Provee métricas consolidadas de todos los módulos.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        usuario = request.user
        
        # 1. Obtener KPIs Globales
        kpis = DashboardService.get_kpis_financieros()
        
        # 2. Filtrado de Seguridad (Masking)
        # Solo mostrar Saldo Bancario si tiene permiso explícito
        if not usuario.has_perm('tesoreria.view_bank_balances') and not usuario.is_superuser:
            kpis['saldo_bancos'] = None # Ocultar
            
        # Ocultar nómina si no es de RRHH/Admin
        if not usuario.has_perm('rrhh.view_nomina') and not usuario.is_superuser:
             kpis['nomina_activa'] = None

        # 3. Acciones / Pendientes
        acciones = DashboardService.get_pendientes_operativos(usuario)
        
        # 4. Gráfica
        grafica = DashboardService.get_grafica_ventas_semana()
        
        data = {
            "kpis": kpis,
            "grafica": grafica,
            "acciones": acciones,
            "timestamp": "Now" # Frontend can parse real time
        }
        
        return Response(data)
