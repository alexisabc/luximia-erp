from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .general_views import RrhhBaseViewSet
from ..models import Asistencia, Empleado, TipoIncidencia, OrigenChecada
from ..serializers import AsistenciaSerializer

class AsistenciaViewSet(RrhhBaseViewSet):
    queryset = Asistencia.objects.all().order_by('-fecha', '-hora_entrada')
    serializer_class = AsistenciaSerializer

    @action(detail=False, methods=['post'], url_path='checadas')
    def checadas(self, request):
        """
        API para registro de entradas y salidas.
        Si no hay registro en el día, crea Entrada.
        Si hay registro sin hora de salida, registra Salida.
        """
        empleado_id = request.data.get('empleado_id')
        timestamp_str = request.data.get('timestamp')
        ubicacion = request.data.get('ubicacion')

        if not empleado_id:
            return Response({"error": "empleado_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            empleado = Empleado.objects.get(id=empleado_id)
        except Empleado.DoesNotExist:
            return Response({"error": "Empleado no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if timestamp_str:
            timestamp = timezone.datetime.fromisoformat(timestamp_str)
        else:
            timestamp = timezone.now()

        fecha = timestamp.date()
        hora = timestamp.time()

        asistencia, created = Asistencia.objects.get_or_create(
            empleado=empleado,
            fecha=fecha,
            defaults={
                'hora_entrada': hora,
                'origen': OrigenChecada.BIOMETRICO,
                'incidencia': TipoIncidencia.ASISTENCIA,
                'ubicacion_gps': ubicacion
            }
        )

        if not created:
            if not asistencia.hora_salida:
                asistencia.hora_salida = hora
                asistencia.save()
                return Response({
                    "mensaje": "Salida registrada",
                    "asistencia": AsistenciaSerializer(asistencia).data
                })
            else:
                return Response(
                    {"error": "Ya existe registro de entrada y salida para hoy"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response({
            "mensaje": "Entrada registrada",
            "asistencia": AsistenciaSerializer(asistencia).data
        }, status=status.HTTP_201_CREATED)
