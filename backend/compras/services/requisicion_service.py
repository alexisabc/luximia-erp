from django.db import transaction
from django.core.exceptions import ValidationError
from decimal import Decimal
from ..models import Requisicion, DetalleRequisicion
from obras.services import ObrasService
from core.services.config_service import ConfigService

class RequisicionService:
    @staticmethod
    @transaction.atomic
    def crear_requisicion(data, usuario):
        """
        Crea una requisición y sus detalles, validando presupuesto si aplica.
        data: {
            'obra_id': int,
            'centro_costo_id': int,
            'detalles': [
                {'producto_id': int, 'cantidad': float, 'costo_estimado': float}
            ],
            'prioridad': 'NORMAL',
            'observaciones': '...'
        }
        """
        obra_id = data.get('obra_id')
        centro_costo_id = data.get('centro_costo_id')
        detalles_data = data.pop('detalles', [])
        
        # Crear Requisicion
        req = Requisicion.objects.create(
            usuario_solicitante=usuario,
            obra_id=obra_id,
            centro_costo_id=centro_costo_id,
            observaciones=data.get('observaciones', ''),
            prioridad=data.get('prioridad', 'NORMAL')
        )
        
        # Procesar Detalles y Calcular Total
        total_estimado = Decimal('0')
        for item in detalles_data:
            costo = Decimal(str(item.get('costo_estimado', 0)))
            cantidad = Decimal(str(item.get('cantidad', 1)))
            total_estimado += (costo * cantidad)
            
            # Guardamos el detalle
            # (Si no hay producto_id, usamos producto_texto)
            DetalleRequisicion.objects.create(
                requisicion=req,
                producto_id=item.get('producto_id'),
                producto_texto=item.get('producto_texto', ''),
                cantidad=cantidad,
                costo_estimado_unitario=costo
            )
            
        # Validación Presupuestal (Solo si tiene Centro de Costo)
        if centro_costo_id:
            # Asumimos MATERIALES por defecto si no viene categorizado
            categoria = 'MATERIALES' 
            
            # Verificamos si la restricción es estricta o permisiva
            strict_mode = ConfigService.get_value('OBRAS_STRICT_BUDGET', True)
            
            suficiente, msg = ObrasService.validar_suficiencia(centro_costo_id, categoria, total_estimado)
            
            if not suficiente:
                if strict_mode:
                    # En modo estricto, revertimos toda la transacción
                    # Lanzamos excepción
                    raise ValidationError(f"BLOQUEO PRESUPUESTAL: {msg}")
                else:
                    # En modo permisivo, permitimos crearla pero dejamos registro
                    req.observaciones = f"[ALERTA PRESUPUESTO]: {msg}\n" + req.observaciones
                    req.save()

        return req

    @staticmethod
    @transaction.atomic
    def aprobar_requisicion(requisicion_id, usuario_aprobador):
        req = Requisicion.objects.get(id=requisicion_id)
        if req.estado != 'PENDIENTE':
            raise ValidationError("Solo se pueden aprobar requisiciones pendientes")
            
        # Al aprobar, comprometemos el presupuesto
        if req.centro_costo_id:
             # Calcular total
            total = sum(d.total_estimado for d in req.detalles.all())
            
            # Comprometer presupuesto
            # Asumimos MATERIALES. En un futuro, cada detalle podria tener su categoria
            ObrasService.comprometer_presupuesto(req.centro_costo_id, 'MATERIALES', total)
            
        req.estado = 'APROBADA'
        req.save()
        return req
