from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from auditoria.services.audit_service import AuditService
from auditoria.middleware import get_current_user, get_client_ip, get_user_agent

# Almacenamiento temporal para instancias anteriores
_pre_save_instances = {}


def get_audited_models():
    """
    Obtiene la lista de modelos que deben ser auditados.
    Se define en settings.AUDITED_MODELS como lista de strings 'app.Model'.
    """
    audited = getattr(settings, 'AUDITED_MODELS', [])
    
    # Si no está configurado, retornar lista vacía (no auditar nada por defecto)
    if not audited:
        return []
    
    models = []
    from django.apps import apps
    
    for model_str in audited:
        try:
            app_label, model_name = model_str.split('.')
            model = apps.get_model(app_label, model_name)
            models.append(model)
        except (ValueError, LookupError) as e:
            # Log error pero no romper la aplicación
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"No se pudo cargar el modelo para auditoría: {model_str} - {e}")
    
    return models


def should_audit_model(instance):
    """Verifica si un modelo debe ser auditado."""
    audited_models = get_audited_models()
    
    # Si la lista está vacía, no auditar nada
    if not audited_models:
        return False
    
    return type(instance) in audited_models


@receiver(pre_save)
def audit_pre_save(sender, instance, **kwargs):
    """
    Captura el estado anterior del objeto antes de guardar.
    Se ejecuta antes de cada save().
    """
    if not should_audit_model(instance):
        return
    
    # Si el objeto ya existe (tiene pk), obtener la versión anterior de la BD
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            # Almacenar en diccionario temporal usando id del objeto en memoria
            _pre_save_instances[id(instance)] = old_instance
        except sender.DoesNotExist:
            # El objeto fue eliminado entre medio, ignorar
            pass


@receiver(post_save)
def audit_post_save(sender, instance, created, **kwargs):
    """
    Registra la creación o actualización del objeto.
    Se ejecuta después de cada save().
    """
    if not should_audit_model(instance):
        return
    
    # Obtener contexto de la petición
    usuario = get_current_user()
    ip_address = get_client_ip()
    user_agent = get_user_agent()
    
    # Determinar acción
    if created:
        accion = 'CREATE'
        cambios = None
    else:
        accion = 'UPDATE'
        # Recuperar instancia anterior
        old_instance = _pre_save_instances.pop(id(instance), None)
        # Calcular diff
        cambios = AuditService.calculate_diff(old_instance, instance)
        
        # Si no hay cambios, no registrar
        if not cambios:
            return
    
    # Registrar en auditoría
    AuditService.log_action(
        usuario=usuario,
        obj=instance,
        accion=accion,
        cambios=cambios,
        ip_address=ip_address,
        user_agent=user_agent
    )


@receiver(post_delete)
def audit_post_delete(sender, instance, **kwargs):
    """
    Registra la eliminación del objeto.
    Se ejecuta después de cada delete().
    """
    if not should_audit_model(instance):
        return
    
    # Obtener contexto de la petición
    usuario = get_current_user()
    ip_address = get_client_ip()
    user_agent = get_user_agent()
    
    # Registrar eliminación
    AuditService.log_action(
        usuario=usuario,
        obj=instance,
        accion='DELETE',
        cambios=None,
        ip_address=ip_address,
        user_agent=user_agent
    )
