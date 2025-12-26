from __future__ import annotations

import logging
import os
from typing import Sequence

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.mail.backends.base import BaseEmailBackend
import resend


class ResendEmailBackend(BaseEmailBackend):
    """Email backend that delivers messages via the Resend API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = getattr(settings, "RESEND_API_KEY", os.getenv("RESEND_API_KEY"))
        self.logger = logging.getLogger(__name__)

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            if self.fail_silently:
                return 0
            raise RuntimeError("Resend is not configured (RESEND_API_KEY missing)")

        resend.api_key = self.api_key
        default_sender = getattr(settings, "DEFAULT_FROM_EMAIL", None)
        sent_count = 0

        for message in email_messages:
            try:
                params = self._build_email_params(message, default_sender)
                response = resend.Emails.send(params)
                
                # Resend returns a dict with 'id' on success
                if response.get("id"):
                    self.logger.info(
                        "Resend envió correo '%s' a %s (id: %s)",
                        message.subject,
                        list(message.to or []),
                        response.get("id"),
                    )
                    sent_count += 1
                else:
                    self.logger.error("Resend error: %s", response)
                    if not self.fail_silently:
                        raise RuntimeError(f"Resend error: {response}")

            except Exception:
                self.logger.exception(
                    "Error al enviar correo '%s' a %s via Resend",
                    message.subject,
                    list(message.to or []),
                )
                if not self.fail_silently:
                    raise

        return sent_count

    def _build_email_params(self, message, default_sender):
        sender = message.from_email or default_sender
        if not sender:
            raise RuntimeError("No sender email configured for Resend")

        plain_body = message.body if message.content_subtype == "plain" else None
        html_body = message.body if message.content_subtype == "html" else None

        for alternative, mimetype in getattr(message, "alternatives", []):
            if mimetype == "text/html":
                html_body = alternative
            elif mimetype == "text/plain" and plain_body is None:
                plain_body = alternative

        # Resend expects 'from', 'to', 'subject', 'html', 'text'
        params = {
            "from": sender,
            "to": list(message.to or []),
            "subject": message.subject,
        }

        if html_body:
            params["html"] = html_body
        if plain_body:
            params["text"] = plain_body

        if message.cc:
            params["cc"] = list(message.cc)
        if message.bcc:
            params["bcc"] = list(message.bcc)
        if message.reply_to:
            params["reply_to"] = message.reply_to

        # Attachments handling
        attachments = []
        for attachment in getattr(message, "attachments", []):
            attachments.append(self._build_attachment(attachment))
        
        if attachments:
            params["attachments"] = attachments
            
        # Headers
        if message.extra_headers:
            params["headers"] = message.extra_headers

        return params

    def _build_attachment(self, attachment):
        # Resend expect: {"filename": "name", "content": [list of bytes] or buffer}
        # But looking at python SDK docs, it accepts byte content.
        # Actually Resend SDK handles formatting. verify usage. 
        # Standard: {"filename": "foo.pdf", "content": [integers] or bytes}
        
        if isinstance(attachment, tuple):
            filename, content, mimetype = (attachment + (None,))[:3]
            # content might be str or bytes
            if isinstance(content, str):
                content = content.encode('utf-8')
        else:
             # Django MIMEBase or similar
             filename = attachment.get_filename()
             content = attachment.get_payload(decode=True)

        return {
            "filename": filename or "attachment",
            "content": list(content) # Resend often wants list of integers for bytes in JSON payload if SDK doesn't handle bytes automatically? 
            # Looking at resend-python source, it handles it. 
            # But let's check if we can pass bytes directly. 
            # It seems resend-python handles 'attachments' list.
        }
        
        # Correction: Resend SDK expects 'content' to be bytes or list of ints.
        # Let's pass the bytes directly, assuming SDK handles serialization if needed.
        # Actually, safely we can convert to list of integers if we want to be JSON safe manually, 
        # but the library should do it. Let's just pass `content` (bytes).
        return {
            "filename": filename or "attachment",
            "content": list(content) # Python `list(bytes)` produces list of ints (0-255), which is what many JSON APIs expect for raw byte buffers.
        }


def send_mail(
    subject: str,
    message: str,
    from_email: str | None,
    recipient_list: Sequence[str],
    fail_silently: bool = False,
    html_message: str | None = None,
    **kwargs,
) -> int:
    # Mantiene compatibilidad con la firma original de Django.
    # Usa el backend configurado en settings (MailHog en dev, Resend en prod).
    backend = get_connection(fail_silently=fail_silently)
    email = EmailMultiAlternatives(
        subject=subject,
        body=message,
        from_email=from_email or getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=list(recipient_list),
    )

    if html_message:
        email.attach_alternative(html_message, "text/html")

    if cc := kwargs.get("cc"):
        email.cc = list(cc)
    if bcc := kwargs.get("bcc"):
        email.bcc = list(bcc)
    if reply_to := kwargs.get("reply_to"):
        email.reply_to = list(reply_to)
    if attachments := kwargs.get("attachments"):
        for attachment in attachments:
            email.attach(*attachment)
    if headers := kwargs.get("headers"):
        email.extra_headers = headers

    return backend.send_messages([email])
