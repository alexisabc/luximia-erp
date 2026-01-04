from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

class ProveedorAuthService:
    signer = TimestampSigner()

    @classmethod
    def generate_token(cls, orden_compra_id):
        """
        Genera un token firmado que expira en X tiempo (ej. 7 días).
        Embeds the OC ID.
        """
        token = cls.signer.sign(orden_compra_id)
        return token

    @classmethod
    def validate_token(cls, token, max_age=60*60*24*7): # 7 días por defecto
        """
        Valida el token y retorna el ID de la Orden de Compra.
        Raises BadSignature or SignatureExpired.
        """
        try:
            original = cls.signer.unsign(token, max_age=max_age)
            return original # This is the OC ID (string or int)
        except SignatureExpired:
            raise
        except BadSignature:
            raise
