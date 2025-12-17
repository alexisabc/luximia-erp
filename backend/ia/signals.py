from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import models
from django.apps import apps
from .rag import index_instance, delete_instance_index

# Lista de apps que queremos indexar automáticamente
WATCHED_APPS = {'contabilidad', 'rrhh', 'juridico', 'sistemas'}

@receiver(post_save)
def handle_post_save(sender, instance, **kwargs):
    """Signal para indexar cambios en modelos monitoreados."""
    if sender._meta.app_label in WATCHED_APPS:
        # Evitar indexar modelos de auditoría o históricos if any
        index_instance(instance)

@receiver(post_delete)
def handle_post_delete(sender, instance, **kwargs):
    """Signal para eliminar del índice lo borrado."""
    if sender._meta.app_label in WATCHED_APPS:
        delete_instance_index(instance)
