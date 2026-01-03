from auditlog.registry import auditlog
from .base import BaseModel, SoftDeleteModel, SoftDeleteManager
from .config import SystemSetting, FeatureFlag
from .empresa import Empresa

# Helper para registrar modelos en auditlog fácilmente
def register_audit(model_class):
    """
    Registra un modelo en el sistema de auditoría (django-auditlog).
    Uso: register_audit(MiModelo)
    """
    if not auditlog.contains(model_class):
        auditlog.register(model_class)

# Registrar modelos automáticamente aquí para centralizar
register_audit(Empresa)
register_audit(SystemSetting)
register_audit(FeatureFlag)

__all__ = [
    'BaseModel',
    'SoftDeleteModel',
    'SoftDeleteManager',
    'SystemSetting',
    'FeatureFlag',
    'Empresa',
    'register_audit',
]
