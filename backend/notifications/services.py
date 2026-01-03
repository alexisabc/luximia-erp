import requests
import logging
from django.conf import settings
from .models import WebhookConfig

logger = logging.getLogger(__name__)

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
            "timestamp": timezone.now().isoformat() if 'timezone' in globals() else None
        }
        
        # Necesitamos timezone
        from django.utils import timezone
        payload["timestamp"] = timezone.now().isoformat()

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
