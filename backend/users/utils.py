"""Utilities for the users app."""

from __future__ import annotations

import os
from urllib.parse import urljoin
from typing import Any, Dict, Optional

from django.conf import settings
from django.templatetags.static import static
from django.utils import timezone


def _get_assets_base_url() -> str:
    """Return the base URL for assets used in transactional emails."""

    configured = getattr(settings, "EMAIL_ASSETS_BASE_URL", None) or os.getenv(
        "EMAIL_ASSETS_BASE_URL"
    )
    if configured:
        base_url = configured
    elif getattr(settings, "DEVELOPMENT_MODE", False):
        base_url = (
            os.getenv("EMAIL_ASSETS_BASE_URL_DEV")
            or os.getenv("BACKEND_BASE_URL")
            or "http://localhost:8000/"
        )
    else:
        domain = (
            getattr(settings, "EMAIL_ASSETS_DOMAIN", None)
            or os.getenv("EMAIL_ASSETS_DOMAIN")
            or getattr(settings, "FRONTEND_DOMAIN", None)
            or "tudominio.com"
        )
        if domain.startswith("http://") or domain.startswith("https://"):
            base_url = domain
        else:
            protocol = os.getenv("EMAIL_ASSETS_PROTOCOL") or "https"
            base_url = f"{protocol}://{domain}"

    if not base_url.endswith("/"):
        base_url = f"{base_url}/"

    return base_url


def _resolve_logo_url() -> str:
    """Resolve the absolute URL for the logo used in enrollment emails."""

    # Prioridad 1: Variable explícita de logo
    env_logo_url = getattr(settings, "NEXT_PUBLIC_LOGO_URL", None) or os.getenv("NEXT_PUBLIC_LOGO_URL")
    if env_logo_url:
        # Si ya es URL absoluta, retornarla
        if env_logo_url.startswith("http"):
            return env_logo_url
        # Si es ruta relativa, unirla al Frontend Domain
        base_front = f"https://{getattr(settings, 'FRONTEND_DOMAIN', 'localhost:3000')}"
        if getattr(settings, 'DEVELOPMENT_MODE', False):
             base_front = "http://localhost:3000"
        return urljoin(base_front, env_logo_url)

    # Fallback legacy
    try:
        # Intenta resolver usando staticfiles manifest (si existe)
        clean_path = "img/logo.png"
        static_path = static(clean_path).lstrip("/")
        base_url = _get_assets_base_url()
        return urljoin(base_url, static_path)
    except ValueError:
        # Si falla (ej. Manifest no tiene el archivo), retornamos una URL genérica al frontend
        # para evitar romper el flujo de creación de usuario.
        base_front = f"https://{getattr(settings, 'FRONTEND_DOMAIN', 'localhost:3000')}"
        if getattr(settings, 'DEVELOPMENT_MODE', False):
             base_front = "http://localhost:3000"
        return urljoin(base_front, "/static/img/logo.png")


def build_enrollment_email_context(
    enrollment_url: str,
    *,
    user=None,
    link_validity: str | None = None,
    extra_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Genera el contexto base para los correos de enrolamiento."""

    company_name = getattr(settings, "NEXT_PUBLIC_APP_NAME", "Sistema ERP")

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
