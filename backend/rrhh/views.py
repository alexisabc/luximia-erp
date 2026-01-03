from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .services.nomina_engine import NominaEngine
from .models import (
    Departamento,
    Puesto,
    CentroTrabajo,
    RazonSocial,
    Empleado,
    Nomina,
)
from .serializers import (
    DepartamentoSerializer,
    PuestoSerializer,
    CentroTrabajoSerializer,
    RazonSocialSerializer,
    EmpleadoSerializer,
    NominaSerializer,
)
from .permissions import HasPermissionForAction
from .services.nomina_orchestrator import NominaOrchestrator


from core.views import BaseViewSet

class RrhhBaseViewSet(BaseViewSet):
    permission_classes = [HasPermissionForAction]


class DepartamentoViewSet(RrhhBaseViewSet):
    queryset = Departamento.objects.all().order_by("id")
    serializer_class = DepartamentoSerializer


class PuestoViewSet(RrhhBaseViewSet):
    queryset = Puesto.objects.all().order_by("id")
    serializer_class = PuestoSerializer


class CentroTrabajoViewSet(RrhhBaseViewSet):
    queryset = CentroTrabajo.objects.all().order_by("id")
    serializer_class = CentroTrabajoSerializer


class RazonSocialViewSet(RrhhBaseViewSet):
    queryset = RazonSocial.objects.all().order_by("id")
    serializer_class = RazonSocialSerializer


class EmpleadoViewSet(RrhhBaseViewSet):
    queryset = Empleado.objects.all().order_by("id")
    serializer_class = EmpleadoSerializer

    @action(detail=False, methods=['get'])
    def organigrama(self, request):
        """
        Devuelve el organigrama completo en estructura jerárquica (Tree).
        Construcción en Python para máxima compatibilidad DB.
        """
        # Fetch optimizado de todos los empleados activos
        # O(1) query con joins necesarios
        empleados = Empleado.objects.filter(activo=True).select_related(
            'puesto', 'departamento', 'user'
        )

        # 1. Construir mapa de nodos
        node_map = {}
        for e in empleados:
            node = {
                "id": e.id,
                "label": f"{e.nombres} {e.apellido_paterno}",
                "title": e.puesto.nombre if e.puesto else "Sin Puesto",
                "department": e.departamento.nombre if e.departamento else "General",
                "email": e.user.email if e.user else "",
                "supervisorId": e.supervisor_id,
                "children": []
            }
            node_map[e.id] = node

        # 2. Ensamblar árbol
        tree = []
        for emp_id, node in node_map.items():
            sup_id = node['supervisorId']
            if sup_id and sup_id in node_map:
                node_map[sup_id]['children'].append(node)
            else:
                tree.append(node)

        return Response(tree)

    @action(detail=True, methods=['get'], url_path='proyeccion-costo')
    def proyeccion_costo(self, request, pk=None):
        """
        Retorna el cálculo detallado del costo anual estimado del empleado (Presupuesto).
        """
        empleado = self.get_object()
        from .engine import PayrollCalculator
        try:
            calculator = PayrollCalculator()
            proyeccion = calculator.proyectar_costo_anual(empleado)
            return Response(proyeccion)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='simular-nomina')
    def simular_nomina(self, request, pk=None):
        """
        Simula el cálculo de nómina quincenal para el empleado.
        """
        empleado = self.get_object()
        fecha_inicio_str = request.data.get('fecha_inicio')
        fecha_fin_str = request.data.get('fecha_fin')
        
        # Default a la quincena actual si no se proporciona
        from django.utils import timezone
        now = timezone.now()
        if not fecha_inicio_str or not fecha_fin_str:
            if now.day <= 15:
                fecha_inicio = now.replace(day=1)
                fecha_fin = now.replace(day=15)
            else:
                fecha_inicio = now.replace(day=16)
                import calendar
                _, last_day = calendar.monthrange(now.year, now.month)
                fecha_fin = now.replace(day=last_day)
        else:
            fecha_inicio = timezone.datetime.fromisoformat(fecha_inicio_str).date()
            fecha_fin = timezone.datetime.fromisoformat(fecha_fin_str).date()

        try:
            resultado = NominaEngine.calcular_prenomina(empleado, fecha_inicio, fecha_fin)
            return Response(resultado)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



