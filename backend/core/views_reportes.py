"""
ViewSets para endpoints de reportes y analytics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from django.utils import timezone

from core.services.reportes_service import ReportesService


class ReportesViewSet(viewsets.ViewSet):
    """
    ViewSet para endpoints de reportes y analytics
    """
    permission_classes = [IsAuthenticated]
    
    def _parse_fechas(self, request):
        """Helper para parsear fechas de request"""
        # Fechas por defecto: mes actual
        hoy = timezone.now()
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        if not fecha_inicio:
            fecha_inicio = hoy.replace(day=1)
        else:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
            
        if not fecha_fin:
            fecha_fin = hoy
        else:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d')
            
        return fecha_inicio, fecha_fin
    
    @action(detail=False, methods=['get'], url_path='financiero')
    def financiero(self, request):
        """
        GET /api/reportes/financiero/
        
        Resumen financiero del período
        
        Query params:
            - fecha_inicio: YYYY-MM-DD (opcional, default: inicio del mes)
            - fecha_fin: YYYY-MM-DD (opcional, default: hoy)
            - empresa_id: int (opcional)
        """
        try:
            fecha_inicio, fecha_fin = self._parse_fechas(request)
            empresa_id = request.query_params.get('empresa_id')
            
            resumen = ReportesService.get_financial_summary(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                empresa_id=empresa_id
            )
            
            return Response(resumen)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='ventas')
    def ventas(self, request):
        """
        GET /api/reportes/ventas/
        
        Análisis de ventas por período
        
        Query params:
            - fecha_inicio: YYYY-MM-DD
            - fecha_fin: YYYY-MM-DD
            - periodo: 'dia', 'semana', 'mes' (default: 'mes')
            - empresa_id: int (opcional)
        """
        try:
            fecha_inicio, fecha_fin = self._parse_fechas(request)
            periodo = request.query_params.get('periodo', 'mes')
            empresa_id = request.query_params.get('empresa_id')
            
            ventas = ReportesService.get_ventas_por_periodo(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                periodo=periodo,
                empresa_id=empresa_id
            )
            
            return Response(ventas)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='top-clientes')
    def top_clientes(self, request):
        """
        GET /api/reportes/top-clientes/
        
        Top clientes por facturación
        
        Query params:
            - fecha_inicio: YYYY-MM-DD
            - fecha_fin: YYYY-MM-DD
            - limit: int (default: 10)
            - empresa_id: int (opcional)
        """
        try:
            fecha_inicio, fecha_fin = self._parse_fechas(request)
            limit = int(request.query_params.get('limit', 10))
            empresa_id = request.query_params.get('empresa_id')
            
            clientes = ReportesService.get_top_clientes(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                limit=limit,
                empresa_id=empresa_id
            )
            
            return Response(clientes)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='obras')
    def obras(self, request):
        """
        GET /api/reportes/obras/
        
        Rentabilidad por obra
        
        Query params:
            - empresa_id: int (opcional)
        """
        try:
            empresa_id = request.query_params.get('empresa_id')
            
            obras = ReportesService.get_obras_rentabilidad(
                empresa_id=empresa_id
            )
            
            return Response(obras)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='kpis')
    def kpis(self, request):
        """
        GET /api/reportes/kpis/
        
        KPIs principales del sistema
        
        Query params:
            - empresa_id: int (opcional)
        """
        try:
            empresa_id = request.query_params.get('empresa_id')
            
            kpis = ReportesService.get_kpis_principales(
                empresa_id=empresa_id
            )
            
            return Response(kpis)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
