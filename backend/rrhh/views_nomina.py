from rest_framework import viewsets, status, permissions, decorators
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum

from core.permissions import HasPermissionForAction
from .models import Nomina, ReciboNomina, Empleado
from .serializers_nomina import (
    NominaSerializer, NominaDetailSerializer, 
    ReciboNominaSerializer, CalculoNominaSerializer
)
from .engine import PayrollCalculator

class NominaViewSet(viewsets.ModelViewSet):
    queryset = Nomina.objects.all().order_by('-fecha_inicio')
    permission_classes = [permissions.IsAuthenticated, HasPermissionForAction]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return NominaDetailSerializer
        return NominaSerializer

    @decorators.action(detail=True, methods=['post'], url_path='calcular')
    def calcular_nomina(self, request, pk=None):
        """
        Ejecuta el motor de cálculo de nómina para esta nómina específica.
        Puede recibir una lista de empleados parcial o calcular todos.
        """
        nomina = self.get_object()
        
        if nomina.estado in ['TIMBRADA', 'CANCELADA']:
            return Response(
                {"detail": "No se puede recalcular una nómina cerrada o cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CalculoNominaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        empleados_ids = serializer.validated_data.get('empleados_ids')

        # 1. Definir Universo de Empleados
        if empleados_ids:
            empleados = Empleado.objects.filter(id__in=empleados_ids, activo=True)
        else:
            # Todos los activos (idealmente filtrar por periodicidad de pago coincidente con nómina)
            empleados = Empleado.objects.filter(activo=True)

        if not empleados.exists():
            return Response({"detail": "No hay empleados activos para calcular."}, status=400)

        # 2. Instanciar Motor
        try:
            calculator = PayrollCalculator(anio=nomina.fecha_fin.year)
        except ValueError as e:
            return Response({"detail": str(e)}, status=500)

        resultados = []
        errores = []

        try:
            with transaction.atomic():
                # Limpiar recibos PREVIOS de estos empleados en ESTA nómina para evitar duplicados
                ReciboNomina.objects.filter(nomina=nomina, empleado__in=empleados).delete()

                for emp in empleados:
                    try:
                        recibo = calculator.calcular_recibo(nomina, emp)
                        resultados.append(f"Empleado {emp.id}: Neto {recibo.neto}")
                    except Exception as e:
                        errores.append(f"Error con empleado {emp}: {str(e)}")

                # 3. Actualizar Totales de la Nómina
                totales = ReciboNomina.objects.filter(nomina=nomina).aggregate(
                    sum_percepciones=Sum('subtotal'), # Aprox
                    sum_deducciones=Sum('descuentos'),
                    sum_neto=Sum('neto')
                )
                nomina.total_percepciones = totales['sum_percepciones'] or 0
                nomina.total_deducciones = totales['sum_deducciones'] or 0
                nomina.total_neto = totales['sum_neto'] or 0
                nomina.estado = 'CALCULADA'
                nomina.save()

        except Exception as e:
             return Response({"detail": f"Error crítico transaccional: {str(e)}"}, status=500)

        return Response({
            "detail": "Cálculo finalizado.",
            "procesados": len(resultados),
            "errores_count": len(errores),
            "errores": errores,
            "totales": {
                "neto": nomina.total_neto
            }
        })

    @decorators.action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        """Bloquea la nómina para evitar cambios futuros."""
        nomina = self.get_object()
        if nomina.estado != 'CALCULADA':
            return Response({"detail": "La nómina debe estar CALCULADA para poder cerrarse."}, status=400)
        
        nomina.estado = 'TIMBRADA' # O 'CERRADA' si el timbrado es un proceso externo
        nomina.save()
        return Response({"detail": "Nómina cerrada exitosamente."})
