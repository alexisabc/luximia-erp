"""Utilities for the users app."""

from __future__ import annotations

from typing import Any, Dict, Optional

from django.conf import settings
from django.utils import timezone


def _resolve_logo_url() -> str:
    protocol = "https" if not getattr(settings, "DEVELOPMENT_MODE", False) else "http"
    domain = getattr(settings, "FRONTEND_DOMAIN", "localhost:3000")
    fallback = f"{protocol}://{domain}/static/logo-luximia.png"
    return getattr(settings, "EMAIL_LOGO_URL", fallback)


def build_enrollment_email_context(
    enrollment_url: str,
    *,
    user=None,
    link_validity: str | None = None,
    extra_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Genera el contexto base para los correos de enrolamiento."""

    company_name = getattr(settings, "RP_NAME", "Luximia ERP")

    display_name = ""
    if user is not None:
        full_name = ""
        if hasattr(user, "get_full_name"):
            full_name = (user.get_full_name() or "").strip()
        if not full_name:
            first = (getattr(user, "first_name", "") or "").strip()
            last = (getattr(user, "last_name", "") or "").strip()
            full_name = " ".join(filter(None, [first, last]))
        if not full_name:
            email_value = getattr(user, "email", "")
            if "@" in email_value:
                full_name = email_value.split("@", 1)[0]
        display_name = full_name

    context: Dict[str, Any] = {
        "company_name": company_name,
        "logo_url": _resolve_logo_url(),
        "enrollment_url": enrollment_url,
        "enroll_url": enrollment_url,
        "link_validity": link_validity or "24 horas",
        "current_year": timezone.localtime().year,
    }

    if display_name:
        context["user_name"] = display_name
        context["display_name"] = display_name

    if extra_context:
        context.update(extra_context)

    return context
