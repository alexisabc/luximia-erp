"""
Endpoint para cancelación de facturas
"""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from contabilidad.services.pac_service import PACFactory
from contabilidad.catalogs.motivos_cancelacion import get_motivo_cancelacion


@action(detail=True, methods=['post'], url_path='cancelar')
def cancelar_factura(self, request, pk=None):
    """
    POST /api/facturas/{id}/cancelar/
    
    Cancela una factura timbrada en el SAT
    
    Body:
        motivo: str - Código de motivo SAT (01-04)
        uuid_sustitucion: str - UUID de factura sustituta (opcional)
    """
    factura = self.get_object()
    
    # Validar estado
    if factura.estado != 'TIMBRADA':
        return Response({
            'error': 'Solo se pueden cancelar facturas timbradas'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Obtener datos
    motivo = request.data.get('motivo')
    uuid_sustitucion = request.data.get('uuid_sustitucion')
    
    # Validar motivo
    motivo_info = get_motivo_cancelacion(motivo)
    if not motivo_info:
        return Response({
            'error': 'Motivo de cancelación inválido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validar UUID de sustitución si es requerido
    if motivo_info['requiere_sustitucion'] and not uuid_sustitucion:
        return Response({
            'error': 'Este motivo requiere UUID de factura sustituta'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Cancelar en PAC
        pac = PACFactory.get_pac_service()
        resultado = pac.cancelar(
            uuid=factura.uuid,
            motivo=motivo,
            uuid_sustitucion=uuid_sustitucion
        )
        
        if resultado['success']:
            # Actualizar factura
            factura.estado = 'CANCELADA'
            factura.fecha_cancelacion = timezone.now()
            factura.motivo_cancelacion = motivo
            factura.uuid_sustitucion = uuid_sustitucion
            factura.save()
            
            # Log de auditoría
            from auditlog.models import LogEntry
            from django.contrib.contenttypes.models import ContentType
            
            LogEntry.objects.create(
                content_type=ContentType.objects.get_for_model(factura),
                object_pk=factura.pk,
                object_repr=str(factura),
                action=2,  # UPDATE
                changes={
                    'estado': ['TIMBRADA', 'CANCELADA'],
                    'motivo_cancelacion': motivo,
                    'cancelado_por': request.user.username
                }
            )
            
            return Response({
                'message': 'Factura cancelada exitosamente',
                'uuid': factura.uuid,
                'fecha_cancelacion': factura.fecha_cancelacion
            })
        else:
            return Response({
                'error': resultado.get('error', 'Error al cancelar en el PAC')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'Error al cancelar factura: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
