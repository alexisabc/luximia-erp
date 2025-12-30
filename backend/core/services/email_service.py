from django.template.loader import render_to_string
from django.conf import settings
from config.models import ConfiguracionGlobal
from core.tasks import send_email_async
import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_template_email(to_email, subject, template_name, context=None):
        """
        Renderiza un template HTML y envía el correo de forma asíncrona.
        Inyecta automáticamente la configuración global (logo, nombre del sistema) en el contexto.
        """
        if context is None:
            context = {}

        # Obtener configuración global para branding
        config = ConfiguracionGlobal.get_solo()
        
        # Preparar URLs absolutas o públicas para imágenes
        # En producción (Resend), las imágenes deben ser accesibles públicamente.
        logo_url = None
        if config.logo_login:
            # Aquí podrías implementar lógica para usar una URL de CDN/S3 si está disponible.
            # Por defecto usamos la URL relativa, que funciona en MailHog pero no en clientes reales
            # sin un dominio configurado.
            logo_url = config.logo_login.url 
            # Si se requiere URL absoluta:
            # logo_url = f"{settings.SITE_URL}{config.logo_login.url}"

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
            
            # Texto plano fallback (opcional, strip tags)
            plain_message = "Por favor habilite HTML para ver este mensaje."

            # Enviar tarea asíncrona
            send_email_async.delay(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_content
            )
            return True
        except Exception as e:
            logger.error(f"Error preparando email '{subject}' para {to_email}: {str(e)}")
            return False
