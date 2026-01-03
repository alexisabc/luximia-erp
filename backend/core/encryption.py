from cryptography.fernet import Fernet
import base64
from django.conf import settings

def get_cipher_suite():
    # Derive a 32-byte key from settings.SECRET_KEY
    # In production, use a dedicated Env Var: FISCAL_ENCRYPTION_KEY
    key = getattr(settings, 'FISCAL_ENCRYPTION_KEY', settings.SECRET_KEY)
    if not key:
        raise ValueError("Encryption key not found")
    
    # Pad or truncate to 32 bytes URL-safe base64-encoded
    pass_bytes = key.encode()[:32].ljust(32, b'0')
    return Fernet(base64.urlsafe_b64encode(pass_bytes))

def encrypt_data(data: bytes) -> bytes:
    if not data: return b""
    cipher = get_cipher_suite()
    return cipher.encrypt(data)

def decrypt_data(token: bytes) -> bytes:
    if not token: return b""
    cipher = get_cipher_suite()
    return cipher.decrypt(token)

def encrypt_text(text: str) -> str:
    if not text: return ""
    encrypted = encrypt_data(text.encode())
    return base64.urlsafe_b64encode(encrypted).decode()

def decrypt_text(text: str) -> str:
    if not text: return ""
    decoded = base64.urlsafe_b64decode(text.encode())
    decrypted = decrypt_data(decoded)
    return decrypted.decode()
