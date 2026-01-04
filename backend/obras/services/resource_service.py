from django.db import transaction
from django.db.models import Sum, Q
from django.core.exceptions import ValidationError
from django.contrib.contenttypes.models import ContentType
from ..models import ActividadProyecto, AsignacionRecurso
from rrhh.models import Empleado
from compras.models import Insumo
from activos.models import ActivoFijo

class ResourceService:
    @staticmethod
    @transaction.atomic
    def asignar_recurso(actividad_id, tipo_recurso, recurso_id, cantidad, fecha_inicio=None, fecha_fin=None, dedicacion=100.0):
        """
        Asigna un recurso a una actividad y valida conflictos.
        """
        try:
            actividad = ActividadProyecto.objects.get(pk=actividad_id)
        except ActividadProyecto.DoesNotExist:
            raise ValidationError(f"No existe la actividad ID {actividad_id}")
        
        # Por defecto usamos las fechas de la actividad
        f_inicio = fecha_inicio or actividad.fecha_inicio_planeada
        f_fin = fecha_fin or actividad.fecha_fin_planeada
        
        # Obtener ContentType según el tipo de recurso
        if tipo_recurso == "LABOR":
            content_type = ContentType.objects.get_for_model(Empleado)
        elif tipo_recurso == "MATERIAL":
            content_type = ContentType.objects.get_for_model(Insumo)
        elif tipo_recurso == "EQUIPO":
            content_type = ContentType.objects.get_for_model(ActivoFijo)
        else:
            raise ValidationError(f"Tipo de recurso invalido: {tipo_recurso}")

        # Detectar conflictos
        conflictos = ResourceService.detectar_conflictos(
            content_type, recurso_id, f_inicio, f_fin, tipo_recurso, dedicacion
        )
        
        # En esta version permitimos la asignacion con sobre-cupo pero retornamos el conflicto
        # En una version mas estricta podriamos levantar ValidationError aqui.

        asignacion = AsignacionRecurso.objects.create(
            actividad=actividad,
            tipo_recurso=tipo_recurso,
            content_type=content_type,
            object_id=recurso_id,
            cantidad_asignada=cantidad,
            porcentaje_dedicacion=dedicacion,
            fecha_inicio=f_inicio,
            fecha_fin=f_fin
        )
        
        return asignacion, conflictos

    @staticmethod
    def detectar_conflictos(content_type, object_id, fecha_inicio, fecha_fin, tipo_recurso, dedicacion_nueva=0):
        """
        Verifica si el recurso tiene otras asignaciones que se traslapan.
        """
        traslapes = AsignacionRecurso.objects.filter(
            content_type=content_type,
            object_id=object_id
        ).filter(
            Q(fecha_inicio__range=(fecha_inicio, fecha_fin)) |
            Q(fecha_fin__range=(fecha_inicio, fecha_fin)) |
            Q(fecha_inicio__lte=fecha_inicio, fecha_fin__gte=fecha_fin)
        )

        resultado = {
            "sobre_asignado": False,
            "mensaje": "",
            "nivel_utilizacion": 0,
            "traslapes": list(traslapes.values("actividad__nombre", "fecha_inicio", "fecha_fin", "porcentaje_dedicacion"))
        }

        if tipo_recurso == "LABOR":
            sum_dedicacion = traslapes.aggregate(total=Sum("porcentaje_dedicacion"))["total"] or 0
            resultado["nivel_utilizacion"] = float(sum_dedicacion) + float(dedicacion_nueva)
            if resultado["nivel_utilizacion"] > 100:
                resultado["sobre_asignado"] = True
                resultado["mensaje"] = f"El empleado esta sobre-asignado ({resultado[nivel_utilizacion]}%)."
        
        elif tipo_recurso == "EQUIPO":
            if traslapes.exists():
                resultado["sobre_asignado"] = True
                resultado["mensaje"] = "El equipo ya esta asignado a otra actividad en este periodo."
        
        return resultado

    @staticmethod
    def obtener_resumen_recursos_obra(obra_id):
        return AsignacionRecurso.objects.filter(actividad__obra_id=obra_id).select_related("actividad")
