from rest_framework import viewsets, status, permissions, decorators
from rest_framework.response import Response
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from decimal import Decimal

from .models import Caja, Turno, Venta, Producto
from .serializers import (
    CajaSerializer, TurnoSerializer, VentaReadSerializer,
    CobroVentaSerializer, ProductoSerializer
)
from .services.caja_service import CajaService
from .services.venta_service import VentaService
from compras.models import Insumo
from inventarios.models import Existencia, Almacen
from compras.serializers import InsumoSerializer, AlmacenSerializer


class CajaManagementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para gestión de cajas con acciones de apertura y cierre de turnos.
    """
    queryset = Caja.objects.filter(activo=True)
    serializer_class = CajaSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=True, methods=['post'], url_path='abrir-turno')
    def abrir_turno(self, request, pk=None):
        """Abre un nuevo turno en esta caja."""
        caja = self.get_object()
        saldo_inicial = request.data.get('saldo_inicial', caja.saldo_inicial_default)
        
        try:
            turno = CajaService.abrir_turno(
                caja_id=caja.id,
                usuario=request.user,
                saldo_inicial=saldo_inicial
            )
            return Response(TurnoSerializer(turno).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @decorators.action(detail=True, methods=['post'], url_path='cerrar-turno')
    def cerrar_turno(self, request, pk=None):
        """Cierra el turno activo de esta caja."""
        caja = self.get_object()
        saldo_declarado = request.data.get('saldo_declarado')
        
        if saldo_declarado is None:
            return Response(
                {'detail': 'Se requiere saldo_declarado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar turno abierto en esta caja
        turno = Turno.objects.filter(caja=caja, estado='ABIERTA').first()
        if not turno:
            return Response(
                {'detail': 'No hay turno abierto en esta caja'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            turno_cerrado = CajaService.cerrar_turno(
                turno_id=turno.id,
                saldo_declarado=saldo_declarado
            )
            return Response(TurnoSerializer(turno_cerrado).data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @decorators.action(detail=True, methods=['get'], url_path='estado-actual')
    def estado_actual(self, request, pk=None):
        """Retorna el estado actual de la caja (turno abierto o cerrada)."""
        caja = self.get_object()
        turno_abierto = Turno.objects.filter(caja=caja, estado='ABIERTA').first()
        
        if turno_abierto:
            return Response({
                'tiene_turno_abierto': True,
                'turno': TurnoSerializer(turno_abierto).data
            })
        else:
            return Response({
                'tiene_turno_abierto': False,
                'turno': None
            })


class VentaPOSViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para ventas del POS.
    Solo lectura para consultas, la creación se hace vía action 'cobrar'.
    """
    queryset = Venta.objects.all().order_by('-fecha')
    serializer_class = VentaReadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtrar por turno del usuario si no es staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(turno__usuario=self.request.user)
        return queryset

    @decorators.action(detail=False, methods=['post'])
    def cobrar(self, request):
        """
        Crea una nueva venta (checkout).
        Requiere un turno abierto del usuario actual.
        """
        serializer = CobroVentaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Buscar turno abierto del usuario
        turno = Turno.objects.filter(usuario=request.user, estado='ABIERTA').first()
        if not turno:
            return Response(
                {'detail': 'No tienes un turno abierto. Abre una caja primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            venta = VentaService.crear_venta(
                turno_id=turno.id,
                items=data['items'],
                metodo_pago=data['metodo_pago'],
                almacen_id=data['almacen_id'],
                usuario=request.user,
                cliente_id=data.get('cliente_id')
            )
            
            return Response(
                VentaReadSerializer(venta).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'detail': f'Error inesperado: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CatalogoUnificadoViewSet(viewsets.ViewSet):
    """
    Endpoint helper para el frontend del POS.
    Retorna una lista unificada de productos e insumos disponibles para venta.
    """
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get'])
    def items(self, request):
        """
        GET /api/pos/catalogo/items/
        Retorna productos legacy e insumos del inventario en formato unificado.
        """
        almacen_id = request.query_params.get('almacen_id')
        
        items = []
        
        # Productos legacy (sin control de inventario)
        productos = Producto.objects.filter(activo=True)
        for prod in productos:
            items.append({
                'id': prod.id,
                'tipo': 'producto',
                'codigo': prod.codigo,
                'nombre': prod.nombre,
                'descripcion': prod.descripcion,
                'precio': float(prod.precio_final),
                'unidad_medida': prod.unidad_medida,
                'color_ui': prod.color_ui,
                'stock_actual': None,  # No aplica para productos legacy
                'tiene_inventario': False
            })
        
        # Insumos (con control de inventario)
        insumos = Insumo.objects.filter(activo=True, tipo='PRODUCTO')
        for insumo in insumos:
            stock_actual = None
            if almacen_id:
                existencia = Existencia.objects.filter(
                    insumo=insumo,
                    almacen_id=almacen_id
                ).first()
                stock_actual = float(existencia.cantidad) if existencia else 0
            
            # Calcular precio con IVA (asumiendo 16%)
            precio_base = float(insumo.costo_promedio) if insumo.costo_promedio > 0 else 0
            precio_con_iva = precio_base * 1.16
            
            items.append({
                'id': insumo.id,
                'tipo': 'insumo',
                'codigo': insumo.codigo,
                'nombre': insumo.descripcion,
                'descripcion': insumo.descripcion,
                'precio': precio_con_iva,
                'unidad_medida': insumo.unidad_medida,
                'color_ui': '#10b981',  # Verde para insumos
                'stock_actual': stock_actual,
                'tiene_inventario': True
            })
        
        return Response({
            'count': len(items),
            'results': items
        })


class AlmacenPOSViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet simple para listar almacenes disponibles."""
    queryset = Almacen.objects.filter(activo=True)
    serializer_class = AlmacenSerializer
    permission_classes = [permissions.IsAuthenticated]
