import pytest
import time
from django.core.signing import SignatureExpired, BadSignature
from proveedores.auth import ProveedorAuthService

class TestProveedorAuth:
    def test_token_generation_and_validation(self):
        odc_id = 12345
        token = ProveedorAuthService.generate_token(odc_id)
        
        assert token is not None
        
        # Validar
        decoded_id = ProveedorAuthService.validate_token(token)
        assert decoded_id == odc_id or int(decoded_id) == odc_id

    def test_token_tampering_fails(self):
        token = ProveedorAuthService.generate_token(999)
        tampered = token + "fake"
        
        with pytest.raises(BadSignature):
            ProveedorAuthService.validate_token(tampered)

    def test_token_expiration(self):
        token = ProveedorAuthService.generate_token(100)
        # Validar con max_age=0 (inmediatamente expirado)
        time.sleep(1)
        with pytest.raises(SignatureExpired):
            ProveedorAuthService.validate_token(token, max_age=0.5)
