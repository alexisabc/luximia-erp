"""
Servicio centralizado de caching con Redis
"""
from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json
from typing import Any, Callable, Optional


class CacheService:
    """
    Servicio centralizado para manejo de cache con Redis
    """
    
    # TTL por defecto en segundos
    DEFAULT_TIMEOUT = 300  # 5 minutos
    
    # Prefijos para diferentes tipos de cache
    PREFIX_REPORTS = 'reports:'
    PREFIX_KPIS = 'kpis:'
    PREFIX_CATALOGS = 'catalogs:'
    PREFIX_QUERIES = 'queries:'
    
    @staticmethod
    def _make_key(prefix: str, *args, **kwargs) -> str:
        """
        Genera una clave única para el cache
        
        Args:
            prefix: Prefijo del tipo de cache
            *args: Argumentos posicionales
            **kwargs: Argumentos con nombre
            
        Returns:
            str: Clave única para el cache
        """
        # Crear string único con argumentos
        key_data = f"{args}:{sorted(kwargs.items())}"
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"{prefix}{key_hash}"
    
    @staticmethod
    def get(key: str) -> Optional[Any]:
        """
        Obtener valor del cache
        
        Args:
            key: Clave del cache
            
        Returns:
            Valor almacenado o None si no existe
        """
        return cache.get(key)
    
    @staticmethod
    def set(key: str, value: Any, timeout: int = DEFAULT_TIMEOUT) -> bool:
        """
        Guardar valor en cache
        
        Args:
            key: Clave del cache
            value: Valor a almacenar
            timeout: Tiempo de vida en segundos
            
        Returns:
            bool: True si se guardó exitosamente
        """
        try:
            cache.set(key, value, timeout)
            return True
        except Exception as e:
            print(f"Error setting cache: {e}")
            return False
    
    @staticmethod
    def delete(key: str) -> bool:
        """
        Eliminar valor del cache
        
        Args:
            key: Clave del cache
            
        Returns:
            bool: True si se eliminó exitosamente
        """
        try:
            cache.delete(key)
            return True
        except Exception as e:
            print(f"Error deleting cache: {e}")
            return False
    
    @staticmethod
    def invalidate_pattern(pattern: str) -> int:
        """
        Invalidar todas las claves que coincidan con un patrón
        
        Args:
            pattern: Patrón de búsqueda (ej: 'reports:*')
            
        Returns:
            int: Número de claves eliminadas
        """
        try:
            # Obtener todas las claves que coincidan
            keys = cache.keys(pattern)
            if keys:
                cache.delete_many(keys)
                return len(keys)
            return 0
        except Exception as e:
            print(f"Error invalidating pattern: {e}")
            return 0
    
    @staticmethod
    def get_or_set(
        key: str,
        callback: Callable,
        timeout: int = DEFAULT_TIMEOUT,
        *args,
        **kwargs
    ) -> Any:
        """
        Obtener del cache o ejecutar callback y cachear resultado
        
        Args:
            key: Clave del cache
            callback: Función a ejecutar si no hay cache
            timeout: Tiempo de vida en segundos
            *args: Argumentos para callback
            **kwargs: Argumentos con nombre para callback
            
        Returns:
            Valor del cache o resultado del callback
        """
        # Intentar obtener del cache
        value = CacheService.get(key)
        
        if value is not None:
            return value
        
        # Ejecutar callback
        value = callback(*args, **kwargs)
        
        # Guardar en cache
        CacheService.set(key, value, timeout)
        
        return value
    
    @staticmethod
    def cached(
        prefix: str = '',
        timeout: int = DEFAULT_TIMEOUT,
        key_func: Optional[Callable] = None
    ):
        """
        Decorador para cachear resultados de funciones
        
        Args:
            prefix: Prefijo para la clave del cache
            timeout: Tiempo de vida en segundos
            key_func: Función personalizada para generar la clave
            
        Example:
            @CacheService.cached(prefix='reports:', timeout=600)
            def get_financial_summary(fecha_inicio, fecha_fin):
                # ...expensive operation...
                return result
        """
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Generar clave
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    cache_key = CacheService._make_key(prefix, *args, **kwargs)
                
                # Intentar obtener del cache
                result = CacheService.get(cache_key)
                
                if result is not None:
                    return result
                
                # Ejecutar función
                result = func(*args, **kwargs)
                
                # Guardar en cache
                CacheService.set(cache_key, result, timeout)
                
                return result
            
            return wrapper
        return decorator


# Funciones de utilidad para tipos específicos de cache

def cache_report(timeout: int = 900):  # 15 minutos
    """Decorador para cachear reportes"""
    return CacheService.cached(
        prefix=CacheService.PREFIX_REPORTS,
        timeout=timeout
    )


def cache_kpis(timeout: int = 300):  # 5 minutos
    """Decorador para cachear KPIs"""
    return CacheService.cached(
        prefix=CacheService.PREFIX_KPIS,
        timeout=timeout
    )


def cache_catalog(timeout: int = 3600):  # 1 hora
    """Decorador para cachear catálogos"""
    return CacheService.cached(
        prefix=CacheService.PREFIX_CATALOGS,
        timeout=timeout
    )


def invalidate_reports():
    """Invalidar todos los reportes cacheados"""
    return CacheService.invalidate_pattern(f"{CacheService.PREFIX_REPORTS}*")


def invalidate_kpis():
    """Invalidar todos los KPIs cacheados"""
    return CacheService.invalidate_pattern(f"{CacheService.PREFIX_KPIS}*")


# Ejemplo de uso
"""
from core.services.cache_service import CacheService, cache_report

# Uso directo
key = 'my_expensive_query'
result = CacheService.get_or_set(
    key,
    lambda: expensive_database_query(),
    timeout=600
)

# Uso con decorador
@cache_report(timeout=900)
def get_financial_summary(fecha_inicio, fecha_fin):
    # ...expensive operation...
    return result

# Invalidar cache
from core.services.cache_service import invalidate_reports
invalidate_reports()  # Invalida todos los reportes
"""
