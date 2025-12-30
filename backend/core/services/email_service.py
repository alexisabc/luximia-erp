from django.template.loader import render_to_string
from django.conf import settings
from config.models import ConfiguracionGlobal
from core.tasks import send_email_async
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_template_email(to_email, subject, template_name, context=None, attachments=None):
        """
        Renderiza un template HTML y envía el correo de forma asíncrona.
        Inyecta automáticamente la configuración global.
        attachments: Lista de tuplas (filename, content_bytes, mimetype)
        """
        if context is None:
            context = {}

        # Obtener configuración global para branding
        config = ConfiguracionGlobal.get_solo()
        
        # Preparar URLs absolutas o públicas para imágenes
        logo_url = None
        if config.logo_login:
            logo_url = config.logo_login.url 
            if settings.DEBUG and logo_url.startswith('/'):
                 # Convertir ruta relativa web a ruta de sistema de archivos para Weasyprint local
                 # (Aunque esto es más para PDF, para email lo ideal es URL pública)
                 pass 

        # Contexto base
        base_context = {
            'system_name': config.nombre_sistema or 'ERP Sistema',
            'logo_url': logo_url,
            'subject': subject,
        }
        
        # Merge de contextos
        full_context = {**base_context, **context}

        try:
            # Renderizar HTML
            html_content = render_to_string(template_name, full_context)
            
            # Texto plano fallback
            plain_message = "Por favor habilite HTML para ver este mensaje."
            
            # Procesar adjuntos para serialización JSON (Celery)
            serialized_attachments = []
            if attachments:
                import base64
                for filename, content, mimetype in attachments:
                    # Convertir bytes a base64 string
                    b64_content = base64.b64encode(content).decode('utf-8')
                    serialized_attachments.append({
                        'filename': filename,
                        'content': b64_content,
                        'mimetype': mimetype
                    })

            # Enviar tarea asíncrona
            send_email_async.delay(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_content,
                attachments=serialized_attachments
            )
            return True
        except Exception as e:
            logger.error(f"Error preparando email '{subject}' para {to_email}: {str(e)}")
            return False
