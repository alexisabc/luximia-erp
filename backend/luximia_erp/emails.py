from __future__ import annotations

import logging
import os
from base64 import b64encode
from typing import Sequence

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.mail.backends.base import BaseEmailBackend
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Attachment,
    Bcc,
    Cc,
    Disposition,
    FileContent,
    FileName,
    FileType,
    Mail,
)


class SendGridEmailBackend(BaseEmailBackend):
    """Email backend that delivers messages via the Twilio SendGrid API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = getattr(settings, "SENDGRID_API_KEY", os.getenv("SENDGRID_API_KEY"))
        self.logger = logging.getLogger(__name__)

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            if self.fail_silently:
                return 0
            raise RuntimeError("SendGrid is not configured")

        client = SendGridAPIClient(self.api_key)
        default_sender = getattr(settings, "DEFAULT_FROM_EMAIL", None)
        sent_count = 0

        for message in email_messages:
            try:
                mail = self._build_mail(message, default_sender)
            except Exception:
                if self.fail_silently:
                    continue
                raise

            try:
                response = client.send(mail)
                status_code = getattr(response, "status_code", "unknown")
                self.logger.info(
                    "SendGrid envió correo '%s' a %s (status %s)",
                    message.subject,
                    list(message.to or []),
                    status_code,
                )
                sent_count += 1
            except Exception:
                self.logger.exception(
                    "Error al enviar correo '%s' a %s via SendGrid",
                    message.subject,
                    list(message.to or []),
                )
                if not self.fail_silently:
                    raise

        return sent_count

    def _build_mail(self, message, default_sender):
        sender = message.from_email or default_sender
        if not sender:
            raise RuntimeError("No sender email configured for SendGrid")

        plain_body = message.body if message.content_subtype == "plain" else None
        html_body = message.body if message.content_subtype == "html" else None

        for alternative, mimetype in getattr(message, "alternatives", []):
            if mimetype == "text/html":
                html_body = alternative
            elif mimetype == "text/plain" and plain_body is None:
                plain_body = alternative

        mail = Mail(
            from_email=sender,
            to_emails=list(message.to or []),
            subject=message.subject,
            plain_text_content=plain_body,
            html_content=html_body,
        )

        for cc_address in message.cc or []:
            mail.add_cc(Cc(cc_address))
        for bcc_address in message.bcc or []:
            mail.add_bcc(Bcc(bcc_address))
        if message.reply_to:
            mail.reply_to = message.reply_to[0]

        for attachment in getattr(message, "attachments", []):
            mail.add_attachment(self._build_attachment(attachment))

        return mail

    def _build_attachment(self, attachment):
        if isinstance(attachment, tuple):
            filename, content, mimetype = (attachment + (None,))[:3]
            data = content.encode() if isinstance(content, str) else content
        else:
            # Django stores MIMEBase instances when attaching file objects.
            filename = attachment.get_filename()
            mimetype = attachment.get_content_type()
            data = attachment.get_payload(decode=True)

        encoded = b64encode(data).decode()
        return Attachment(
            FileContent(encoded),
            FileName(filename or "attachment"),
            FileType(mimetype or "application/octet-stream"),
            Disposition("attachment"),
        )


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
    # Usa el backend configurado en settings (MailHog en dev, SendGrid en prod).
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
