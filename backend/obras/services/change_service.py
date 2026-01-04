from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from ..models import OrdenCambio, PartidaPresupuestal, ActividadProyecto
from .scheduling_service import SchedulingService

class ChangeManagementService:
    @staticmethod
    @transaction.atomic
    def autorizar_orden_cambio(orden_id, usuario_id):
        """
        Autoriza una orden de cambio y aplica los impactos correspondientes.
        """
        try:
            orden = OrdenCambio.objects.get(pk=orden_id)
        except OrdenCambio.DoesNotExist:
            raise ValidationError(f"No existe la orden de cambio ID {orden_id}")

        if orden.estado != "SOLICITADA":
            raise ValidationError(f"La orden ya se encuentra en estado {orden.estado}")

        # 1. Aplicar Impacto Presupuestal
        if orden.tipo in ["ADITIVA", "DEDUCTIVA"] and orden.partida:
            partida = orden.partida
            impacto = orden.monto_impacto if orden.tipo == "ADITIVA" else -orden.monto_impacto
            partida.monto_aditivas += impacto
            partida.save()

        # 2. Aplicar Impacto en Cronograma
        if orden.tipo == "REPROGRAMACION" and orden.actividad:
            actividad = orden.actividad
            if orden.nueva_fecha_inicio:
                actividad.fecha_inicio_planeada = orden.nueva_fecha_inicio
            if orden.nueva_fecha_fin:
                actividad.fecha_fin_planeada = orden.nueva_fecha_fin
            actividad.save()
            
            # Recalcular Ruta Crítica para toda la obra
            SchedulingService.calcular_ruta_critica(orden.obra_id)

        # 3. Actualizar Estado de la Orden
        orden.estado = "AUTORIZADA"
        orden.autorizado_por_id = usuario_id
        orden.fecha_autorizacion = timezone.now()
        orden.save()

        return orden

    @staticmethod
    @transaction.atomic
    def rechazar_orden_cambio(orden_id, usuario_id):
        orden = OrdenCambio.objects.get(pk=orden_id)
        orden.estado = "RECHAZADA"
        orden.autorizado_por_id = usuario_id
        orden.fecha_autorizacion = timezone.now()
        orden.save()
        return orden
