from django.core.cache import cache
from .models import ConfiguracionGlobal

def get_global_config():
    """
    Obtiene la configuración global del ERP.
    Implementa un patrón de lectura en caché (Read-through cache) para evitar 
    consultas repetitivas a la base de datos en cada request.
    """
    config = cache.get('GLOBAL_CONFIG')
    
    if not config:
        # Si no está en cache, lo traemos de DB y lo guardamos
        config = ConfiguracionGlobal.get_solo()
        cache.set('GLOBAL_CONFIG', config, timeout=None) # Timeout indefinido hasta save()
        
    return config
