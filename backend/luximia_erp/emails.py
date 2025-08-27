from __future__ import annotations

import os
from typing import Sequence

from azure.communication.email import EmailClient
from django.conf import settings


def send_mail(
    subject: str,
    message: str,
    from_email: str | None,
    recipient_list: Sequence[str],
    fail_silently: bool = False,
    html_message: str | None = None,
    **kwargs,
) -> int:
    """Send an email using Azure Communication Services.

    Returns the number of successfully delivered messages (1 or 0).
    """
    connection_string = getattr(
        settings,
        "AZURE_COMMUNICATION_CONNECTION_STRING",
        os.getenv("AZURE_COMMUNICATION_CONNECTION_STRING"),
    )
    sender = from_email or getattr(
        settings,
        "AZURE_COMMUNICATION_SENDER_ADDRESS",
        os.getenv("AZURE_COMMUNICATION_SENDER_ADDRESS"),
    )

    if not connection_string or not sender:
        if fail_silently:
            return 0
        raise RuntimeError("Azure Communication Services is not configured")

    try:
        client = EmailClient.from_connection_string(connection_string)
        email_message = {
            "senderAddress": sender,
            "recipients": {"to": [{"address": addr} for addr in recipient_list]},
            "content": {"subject": subject, "plainText": message},
        }
        if html_message:
            email_message["content"]["html"] = html_message
        poller = client.begin_send(email_message)
        poller.result()
        return 1
    except Exception:
        if fail_silently:
            return 0
        raise
