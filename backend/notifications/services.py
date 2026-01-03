from .models import Notificacion, WebhookConfig
import requests
import logging
from django.utils import timezone
from django.db.models import Q

logger = logging.getLogger(__name__)

class NotificacionService:
    @staticmethod
    def crear_notificacion(usuario_id, titulo, mensaje, tipo='INFO', link=None):
        """Crea una notificación para un usuario específico."""
        return Notificacion.objects.create(
            usuario_id=usuario_id,
            titulo=titulo,
            mensaje=mensaje,
            tipo=tipo,
            link=link
        )

    @staticmethod
    def marcar_como_leida(usuario_id, ids='all'):
        """Marca una o varias notificaciones como leídas."""
        queryset = Notificacion.objects.filter(usuario_id=usuario_id, leida=False)
        if ids != 'all':
            if isinstance(ids, list):
                queryset = queryset.filter(id__in=ids)
            else:
                queryset = queryset.filter(id=ids)
        
        count = queryset.update(leida=True)
        return count

    @staticmethod
    def obtener_conteo_no_leidas(usuario_id):
        """Retorna el número de notificaciones sin leer."""
        return Notificacion.objects.filter(usuario_id=usuario_id, leida=False).count()

class WebhookService:
    @classmethod
    def dispatch(cls, empresa, evento, data):
        """Envía una notificación a todos los webhooks configurados para un evento."""
        webhooks = WebhookConfig.objects.filter(
            empresa=empresa,
            activo=True
        )
        
        payload = {
            "empresa_id": empresa.id,
            "empresa_nombre": empresa.nombre_comercial,
            "evento": evento,
            "data": data,
            "timestamp": timezone.now().isoformat()
        }

        for wb in webhooks:
            # Solo enviar si el evento está en la lista o la lista está vacía (all)
            if not wb.eventos or evento in wb.eventos:
                try:
                    headers = {}
                    if wb.secret_token:
                        headers["X-Webhook-Token"] = wb.secret_token
                    
                    response = requests.post(
                        wb.url,
                        json=payload,
                        headers=headers,
                        timeout=10
                    )
                    response.raise_for_status()
                    logger.info(f"Webhook enviado con éxito a {wb.url} para evento {evento}")
                except Exception as e:
                    logger.error(f"Error enviando Webhook a {wb.url}: {e}")

    @classmethod
    def notify_critical_alert(cls, alert):
        """Enviado cuando se genera una alerta crítica."""
        cls.dispatch(
            alert.empresa,
            "ALERT_OBRA" if alert.tipo == 'OBRA' else "STOCK_CRITICAL",
            {
                "id": alert.id,
                "nivel": alert.nivel,
                "tipo": alert.tipo,
                "mensaje": alert.mensaje,
                "data": alert.data
            }
        )

    @classmethod
    def notify_daily_briefing(cls, briefing):
        """Enviado cuando se genera el resumen diario."""
        cls.dispatch(
            briefing.empresa,
            "DAILY_BRIEFING",
            {
                "fecha": briefing.fecha.isoformat(),
                "contenido": briefing.contenido
            }
        )
