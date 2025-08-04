import os
try:
    from authy.api import AuthyApiClient
except Exception:  # pragma: no cover - librería opcional
    AuthyApiClient = None

AUTHY_API_KEY = os.getenv("AUTHY_API_KEY", "")
_authy_client = AuthyApiClient(AUTHY_API_KEY) if (AuthyApiClient and AUTHY_API_KEY) else None


def register_user(email: str, phone: str, country_code: str):
    """Registra un usuario en Authy y devuelve la respuesta."""
    if not _authy_client:
        raise RuntimeError("AUTHY_API_KEY no configurado")
    return _authy_client.users.create(email, phone, country_code)


def request_sms(authy_id: str):
    if not _authy_client:
        raise RuntimeError("AUTHY_API_KEY no configurado")
    return _authy_client.users.request_sms(authy_id, {'force': True})


def verify_token(authy_id: str, token: str) -> bool:
    if not _authy_client:
        raise RuntimeError("AUTHY_API_KEY no configurado")
    verification = _authy_client.tokens.verify(authy_id, token)
    return verification.ok()
