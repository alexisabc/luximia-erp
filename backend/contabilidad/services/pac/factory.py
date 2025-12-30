from django.conf import settings
from .base_provider import PACProvider
from .mock_provider import MockPACProvider

class PACFactory:
    """
    Factory para instanciar el proveedor de PAC configurado en settings.
    Soporta: 'MOCK'
    """
    @staticmethod
    def get_provider() -> PACProvider:
        # Default a MOCK si no está definido para evitar errores en dev
        provider_name = getattr(settings, 'PAC_PROVIDER', 'MOCK')
        
        if provider_name == 'MOCK':
            return MockPACProvider()
        
        # Aquí se agregarán futuros proveedores (Finkok, SW Sapien, etc.)
        
        raise ValueError(f"Proveedor PAC no soportado o mal configurado: {provider_name}")
