from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task(name='send_email_async')
def send_email_async(subject, message, from_email, recipient_list, html_message=None):
    """
    Tarea asíncrona para envío de correos.
    Maneja excepciones para evitar que fallos en el proveedor de email (Resend/SMTP)
    afecten al worker de Celery permanentemente.
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
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
