from celery import shared_task
from .services import NotificacionService
import logging

logger = logging.getLogger(__name__)

@shared_task(name="notifications.send_notification_async")
def send_notification_async(usuario_id, titulo, mensaje, tipo='INFO', link=None):
    """
    Tarea asíncrona para crear notificaciones.
    Permite que otros módulos disparen alertas sin bloquear el hilo principal.
    """
    try:
        NotificacionService.crear_notificacion(
            usuario_id=usuario_id,
            titulo=titulo,
            mensaje=mensaje,
            tipo=tipo,
            link=link
        )
        return f"Notificación enviada a usuario {usuario_id}"
    except Exception as e:
        logger.error(f"Error enviando notificación asíncrona: {str(e)}")
        # No relanzar para evitar reintentos infinitos si es error de datos, 
        # pero en producción podrías configurar reintentos.
        return f"Error: {str(e)}"
