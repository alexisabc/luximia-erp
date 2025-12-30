from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task(name='send_email_async')
def send_email_async(subject, message, from_email, recipient_list, html_message=None, attachments=None):
    """
    Tarea asíncrona para envío de correos con soporte para adjuntos.
    attachments: Lista de dicts [{'filename': str, 'content': str(base64), 'mimetype': str}]
    """
    try:
        from django.core.mail import EmailMultiAlternatives
        import base64

        msg = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=from_email,
            to=recipient_list
        )
        
        if html_message:
            msg.attach_alternative(html_message, "text/html")
            
        if attachments:
            for attachment in attachments:
                # Decodificar contenido base64
                content = base64.b64decode(attachment['content'])
                msg.attach(attachment['filename'], content, attachment['mimetype'])

        msg.send(fail_silently=False)
        
        return f"Email '{subject}' enviado a {recipient_list}"
    except Exception as e:
        # Check if it's an Anymail exception for better logging
        if 'anymail' in str(type(e)):
             logger.error(f"Anymail API Error: {str(e)}")
        else:
             logger.error(f"Error enviando email asíncrono '{subject}' a {recipient_list}: {str(e)}")
        
        # In a real scenario, we might retry:
        # raise self.retry(exc=e)
        return f"Error enviando email: {str(e)}"
