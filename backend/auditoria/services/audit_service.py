from django.contrib.contenttypes.models import ContentType
from auditoria.models import AuditLog
import json

class AuditService:
    """
    Servicio centralizado para gestión de auditoría.
    Proporciona métodos para registrar acciones y calcular diferencias.
    """
    
    # Campos que deben ser excluidos del diff (sensibles o irrelevantes)
    EXCLUDED_FIELDS = [
        'password', 'last_login', 'created_at', 'updated_at', 
        'modified_at', 'deleted_at', 'is_deleted'
    ]
    
    @staticmethod
    def log_action(
        usuario,
        obj,
        accion,
        cambios=None,
        ip_address=None,
        user_agent=None,
        descripcion=""
    ):
        """
        Registra una acción en el log de auditoría.
        
        Args:
            usuario: Usuario que realizó la acción (puede ser None para acciones del sistema)
            obj: Objeto afectado (instancia de modelo Django)
            accion: Tipo de acción ('CREATE', 'UPDATE', 'DELETE', etc.)
            cambios: Diccionario con los cambios (opcional)
            ip_address: IP del usuario
            user_agent: User-Agent del navegador
            descripcion: Descripción adicional
        
        Returns:
            AuditLog: Registro de auditoría creado
        """
        content_type = None
        object_id = None
        object_repr = ""
        
        if obj is not None:
            content_type = ContentType.objects.get_for_model(obj)
            object_id = str(obj.pk)
            object_repr = str(obj)[:500]  # Limitar a 500 caracteres
        
        audit_log = AuditLog.objects.create(
            usuario=usuario,
            accion=accion,
            content_type=content_type,
            object_id=object_id,
            object_repr=object_repr,
            cambios=cambios,
            ip_address=ip_address,
            user_agent=user_agent,
            descripcion=descripcion
        )
        
        return audit_log
    
    @staticmethod
    def calculate_diff(old_instance, new_instance):
        """
        Calcula las diferencias entre dos instancias del mismo modelo.
        
        Args:
            old_instance: Instancia anterior (puede ser None para CREATE)
            new_instance: Instancia nueva
        
        Returns:
            dict: Diccionario con los cambios en formato:
                  {'campo': {'old': valor_anterior, 'new': valor_nuevo}}
        """
        if old_instance is None:
            # Es una creación, no hay diff
            return None
        
        if type(old_instance) != type(new_instance):
            raise ValueError("Las instancias deben ser del mismo modelo")
        
        cambios = {}
        
        # Obtener todos los campos del modelo
        for field in new_instance._meta.fields:
            field_name = field.name
            
            # Saltar campos excluidos
            if field_name in AuditService.EXCLUDED_FIELDS:
                continue
            
            # Saltar campos de relación inversa
            if field.many_to_many or field.one_to_many:
                continue
            
            old_value = getattr(old_instance, field_name, None)
            new_value = getattr(new_instance, field_name, None)
            
            # Convertir a formato serializable
            old_value = AuditService._serialize_value(old_value)
            new_value = AuditService._serialize_value(new_value)
            
            # Solo registrar si hay cambio
            if old_value != new_value:
                cambios[field_name] = {
                    'old': old_value,
                    'new': new_value
                }
        
        return cambios if cambios else None
    
    @staticmethod
    def _serialize_value(value):
        """
        Convierte un valor a formato serializable para JSON.
        
        Args:
            value: Valor a serializar
        
        Returns:
            Valor serializable
        """
        # None
        if value is None:
            return None
        
        # Tipos básicos
        if isinstance(value, (str, int, float, bool)):
            return value
        
        # Fechas y tiempos
        from datetime import datetime, date, time
        from decimal import Decimal
        
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, time):
            return value.isoformat()
        if isinstance(value, Decimal):
            return float(value)
        
        # Modelos de Django (ForeignKey)
        from django.db import models
        if isinstance(value, models.Model):
            return f"{value._meta.model_name}:{value.pk}"
        
        # UUID
        from uuid import UUID
        if isinstance(value, UUID):
            return str(value)
        
        # Por defecto, convertir a string
        return str(value)
    
    @staticmethod
    def get_logs_for_object(obj, limit=50):
        """
        Obtiene los logs de auditoría para un objeto específico.
        
        Args:
            obj: Objeto del cual obtener los logs
            limit: Número máximo de registros a retornar
        
        Returns:
            QuerySet de AuditLog
        """
        content_type = ContentType.objects.get_for_model(obj)
        return AuditLog.objects.filter(
            content_type=content_type,
            object_id=str(obj.pk)
        ).order_by('-fecha')[:limit]
    
    @staticmethod
    def get_user_activity(usuario, fecha_desde=None, fecha_hasta=None, limit=100):
        """
        Obtiene la actividad de un usuario específico.
        
        Args:
            usuario: Usuario del cual obtener la actividad
            fecha_desde: Fecha inicial del rango (opcional)
            fecha_hasta: Fecha final del rango (opcional)
            limit: Número máximo de registros
        
        Returns:
            QuerySet de AuditLog
        """
        queryset = AuditLog.objects.filter(usuario=usuario)
        
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
        
        return queryset.order_by('-fecha')[:limit]
