import os
import logging
from typing import List, Dict, Any, Optional
from django.db import models
from django.forms.models import model_to_dict
from django.conf import settings
from openai import OpenAI
from pgvector.django import CosineDistance

from .models import KnowledgeBase

logger = logging.getLogger(__name__)

# Aplicaciones y modelos a ignorar para no indexar basura
IGNORED_APPS = {'auth', 'contenttypes', 'sessions', 'admin', 'axes', 'auditlog', 'ia', 'core'}
IGNORED_MODELS = {'historical', 'logentry', 'permission', 'group', 'contenttype', 'session'}

def _get_openai_client() -> Optional[OpenAI]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

def _get_embedding(text: str) -> List[float]:
    """Genera embedding usando OpenAI."""
    if not text:
        return []
    try:
        client = _get_openai_client()
        if not client:
             return []
        # Usamos text-embedding-3-small por costo/beneficio y performance actual
        response = client.embeddings.create(input=text, model="text-embedding-3-small")
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generando embedding: {e}")
        return []

def _fields_to_text(instance: models.Model) -> str:
    """Convierte un objeto Django a representación de texto."""
    try:
        # Intentamos obtener un diccionario limpio
        data = model_to_dict(instance)
        # Filtramos campos binarios o muy largos si fuera necesario
        text_parts = []
        text_parts.append(f"Objeto: {instance._meta.verbose_name} (ID: {instance.pk})")
        for k, v in data.items():
            if v and str(v).strip(): # Solo valores no vacíos
                text_parts.append(f"{k}: {v}")
        return "\n".join(text_parts)
    except Exception:
        return str(instance)

def _get_required_permissions(instance: models.Model) -> str:
    """
    Deduce los permisos necesarios para ver este objeto.
    Por defecto: 'app_label.view_modelname'
    """
    opts = instance._meta
    return f"{opts.app_label}.view_{opts.model_name}"

def index_instance(instance: models.Model):
    """
    Indexa (crea o actualiza) un objeto individual en la KnowledgeBase.
    """
    opts = instance._meta
    app_label = opts.app_label
    model_name = opts.model_name

    if app_label in IGNORED_APPS or model_name in IGNORED_MODELS:
        return

    # Si es un modelo "Historical" (django-simple-history o auditlog), ignorar
    if 'historical' in model_name or 'audit' in model_name:
        return

    try:
        content = _fields_to_text(instance)
        embedding = _get_embedding(content)
        
        if not embedding:
            return

        permissions = _get_required_permissions(instance)

        # Actualizar o Crear (Upsert)
        KnowledgeBase.objects.update_or_create(
            source_app=app_label,
            source_model=model_name,
            source_id=str(instance.pk),
            defaults={
                'content': content,
                'embedding': embedding,
                'required_permissions': permissions
            }
        )
        logger.info(f"Indexado IA: {app_label}.{model_name} #{instance.pk}")

    except Exception as e:
        logger.error(f"Error indexando instancia {instance}: {e}")

def delete_instance_index(instance: models.Model):
    """Elimina un objeto del índice."""
    opts = instance._meta
    try:
        KnowledgeBase.objects.filter(
            source_app=opts.app_label,
            source_model=opts.model_name,
            source_id=str(instance.pk)
        ).delete()
    except Exception as e:
        logger.error(f"Error eliminando índice {instance}: {e}")

def retrieve_relevant_context(query: str, user, k: int = 5) -> List[str]:
    """
    Recupera contexto relevante respetando los permisos del usuario.
    """
    query_emb = _get_embedding(query)
    if not query_emb:
        return []

    # 1. Búsqueda semántica pura
    candidates = KnowledgeBase.objects.order_by(
        CosineDistance('embedding', query_emb)
    )[:k*3] # Traemos candidatos de sobra para filtrar por permisos después en Python (postgres filter a veces es limitado con listas dinámicas)

    valid_context = []
    count = 0
    
    # 2. Filtrado de permisos
    for doc in candidates:
        if count >= k:
            break
            
        # El campo required_permissions es un string "app.view_model".
        # Verificamos si el usuario tiene ese permiso.
        perm = doc.required_permissions
        has_perm = user.has_perm(perm) if perm else True # Si no hay permiso definido, es público (o error, asumimos público interno)
        
        if has_perm:
            valid_context.append(doc.content)
            count += 1
            
    return valid_context
