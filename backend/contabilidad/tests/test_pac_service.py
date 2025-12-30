import pytest
from django.test import override_settings
from contabilidad.services.pac.factory import PACFactory
from contabilidad.services.pac.base_provider import PACProvider
from contabilidad.services.pac.mock_provider import MockPACProvider

@pytest.mark.django_db
class TestTimbradoService:
    
    @override_settings(PAC_PROVIDER='MOCK')
    def test_factory_returns_mock_provider(self):
        """Valida que la Factory devuelva el proveedor Mock cuando se configura."""
        provider = PACFactory.get_provider()
        assert isinstance(provider, MockPACProvider)
        assert isinstance(provider, PACProvider)

    @override_settings(PAC_PROVIDER='MOCK')
    def test_mock_provider_timbrar(self):
        """Valida que el MockProvider devuelva una respuesta exitosa y dummy con el UUID esperado."""
        provider = PACFactory.get_provider()
        xml_dummy = "<cfdi:Comprobante Version='4.0'></cfdi:Comprobante>"
        
        resultado = provider.timbrar(xml_dummy)
        
        assert resultado['success'] is True
        assert resultado['uuid'] == '12345-MOCK-UUID-67890'
        # Verificamos que el XML de respuesta contenga el Timbre simulado
        assert '<tfd:TimbreFiscalDigital' in resultado['xml_timbrado']

    @override_settings(PAC_PROVIDER='INVALID_PROVIDER')
    def test_factory_raises_error_for_invalid_provider(self):
        """Valida que la Factory lance error si el proveedor no existe."""
        with pytest.raises(ValueError):
            PACFactory.get_provider()
