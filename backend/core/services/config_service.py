from django.core.cache import cache
from django.db import transaction
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


class ConfigService:
    """
    Servicio centralizado para gestionar configuraciones del sistema.
    
    Características:
    - Cache de 15 minutos para reducir consultas a BD
    - Soporte para valores por defecto
    - Invalidación automática de cache al modificar
    - Thread-safe
    
    Inspirado en: Contpaqi, Enkontrol, SICAR
    """
    
    # Tiempo de cache en segundos (15 minutos)
    CACHE_TIMEOUT = 900
    
    @staticmethod
    def get_value(key: str, default: Any = None) -> Any:
        """
        Obtiene el valor de una configuración del sistema.
        
        Flujo:
        1. Busca en Redis (cache)
        2. Si no está, busca en DB
        3. Si no está, retorna default
        4. Cachea el resultado
        
        Args:
            key: Clave de la configuración (ej: 'POS_ALLOW_NEGATIVE_STOCK')
            default: Valor por defecto si no existe
        
        Returns:
            Valor de la configuración o default
        
        Example:
            >>> ConfigService.get_value('POS_ALLOW_NEGATIVE_STOCK', False)
            True
        """
        cache_key = f"system_setting:{key}"
        
        # 1. Intentar obtener de cache
        cached_value = cache.get(cache_key)
        if cached_value is not None:
            logger.debug(f"Config '{key}' obtenida de cache")
            return cached_value
        
        # 2. Buscar en base de datos
        try:
            from ..models import SystemSetting
            setting = SystemSetting.objects.get(key=key)
            value = setting.value
            
            # 3. Cachear el resultado
            cache.set(cache_key, value, ConfigService.CACHE_TIMEOUT)
            logger.debug(f"Config '{key}' cacheada desde DB")
            
            return value
            
        except SystemSetting.DoesNotExist:
            logger.warning(f"Config '{key}' no encontrada, usando default: {default}")
            # Cachear el default para evitar consultas repetidas
            if default is not None:
                cache.set(cache_key, default, ConfigService.CACHE_TIMEOUT)
            return default
        
        except Exception as e:
            logger.error(f"Error obteniendo config '{key}': {e}")
            return default
    
    @staticmethod
    @transaction.atomic
    def set_value(key: str, value: Any, category: str = 'GENERAL', 
                  description: str = '', is_public: bool = False, 
                  modified_by=None) -> bool:
        """
        Establece o actualiza una configuración del sistema.
        
        Args:
            key: Clave de la configuración
            value: Valor a guardar (será serializado a JSON)
            category: Categoría de la configuración
            description: Descripción de qué hace
            is_public: Si se debe enviar al frontend
            modified_by: Usuario que modifica (opcional)
        
        Returns:
            True si se guardó exitosamente
        
        Example:
            >>> ConfigService.set_value(
            ...     'POS_ALLOW_NEGATIVE_STOCK', 
            ...     True, 
            ...     category='POS',
            ...     description='Permite ventas con stock negativo'
            ... )
            True
        """
        try:
            from ..models import SystemSetting
            
            setting, created = SystemSetting.objects.update_or_create(
                key=key,
                defaults={
                    'value': value,
                    'category': category,
                    'description': description,
                    'is_public': is_public,
                    'modified_by': modified_by,
                }
            )
            
            # El modelo ya invalida el cache en su save()
            action = "creada" if created else "actualizada"
            logger.info(f"Config '{key}' {action} con valor: {value}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error guardando config '{key}': {e}")
            return False
    
    @staticmethod
    def get_public_settings() -> dict:
        """
        Obtiene todas las configuraciones públicas para enviar al frontend.
        
        Returns:
            Dict con {key: value} de todas las configs públicas
        
        Example:
            >>> ConfigService.get_public_settings()
            {
                'POS_FAST_MODE': False,
                'INVENTORY_MULTI_WAREHOUSE': True,
                ...
            }
        """
        cache_key = "system_settings:public"
        
        # Intentar obtener de cache
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        # Buscar en DB
        try:
            from ..models import SystemSetting
            settings = SystemSetting.objects.filter(is_public=True)
            
            result = {s.key: s.value for s in settings}
            
            # Cachear
            cache.set(cache_key, result, ConfigService.CACHE_TIMEOUT)
            
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo configs públicas: {e}")
            return {}
    
    @staticmethod
    def is_feature_enabled(code: str, user=None) -> bool:
        """
        Verifica si un feature flag está habilitado.
        
        Args:
            code: Código del feature (ej: 'MODULE_OBRAS')
            user: Usuario para verificar permisos específicos (opcional)
        
        Returns:
            True si el feature está habilitado
        
        Example:
            >>> ConfigService.is_feature_enabled('MODULE_OBRAS')
            True
            >>> ConfigService.is_feature_enabled('MODULE_OBRAS', request.user)
            False  # Si el usuario no tiene acceso
        """
        cache_key = f"feature_flag:{code}"
        
        # Si no hay usuario, solo verificar si está activo globalmente
        if user is None:
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
            
            try:
                from ..models import FeatureFlag
                feature = FeatureFlag.objects.get(code=code)
                is_active = feature.is_active
                
                cache.set(cache_key, is_active, ConfigService.CACHE_TIMEOUT)
                return is_active
                
            except FeatureFlag.DoesNotExist:
                logger.warning(f"Feature '{code}' no encontrado")
                return False
            except Exception as e:
                logger.error(f"Error verificando feature '{code}': {e}")
                return False
        
        # Si hay usuario, verificar permisos específicos
        try:
            from ..models import FeatureFlag
            feature = FeatureFlag.objects.get(code=code)
            return feature.is_enabled_for_user(user)
            
        except FeatureFlag.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"Error verificando feature '{code}' para usuario: {e}")
            return False
    
    @staticmethod
    def get_all_features() -> dict:
        """
        Obtiene todos los feature flags activos.
        
        Returns:
            Dict con {code: is_active}
        """
        cache_key = "feature_flags:all"
        
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            from ..models import FeatureFlag
            features = FeatureFlag.objects.all()
            
            result = {f.code: f.is_active for f in features}
            
            cache.set(cache_key, result, ConfigService.CACHE_TIMEOUT)
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo features: {e}")
            return {}
    
    @staticmethod
    def invalidate_cache(key: Optional[str] = None):
        """
        Invalida el cache de configuraciones.
        
        Args:
            key: Clave específica a invalidar. Si es None, invalida todo.
        """
        if key:
            cache.delete(f"system_setting:{key}")
            cache.delete(f"feature_flag:{key}")
        else:
            # Invalidar todos los caches de configuración
            cache.delete_pattern("system_setting:*")
            cache.delete_pattern("feature_flag:*")
            cache.delete("system_settings:public")
            cache.delete("feature_flags:all")
        
        logger.info(f"Cache invalidado: {key or 'ALL'}")
