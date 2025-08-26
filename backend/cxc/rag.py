import os
from typing import List

import numpy as np
from django.apps import apps as django_apps
from django.core.exceptions import ObjectDoesNotExist
from django.db import OperationalError
from django.forms.models import model_to_dict
from openai import OpenAI
from pgvector.django import CosineDistance

from .models import DocumentEmbedding


IGNORED_APPS = {"auth", "contenttypes", "sessions", "admin"}


def _get_client() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _build_documents() -> List[str]:
    docs: List[str] = []
    for model in django_apps.get_models():
        if model._meta.app_label in IGNORED_APPS:
            continue
        try:
            queryset = model.objects.all()
        except OperationalError:
            continue
        for obj in queryset:
            try:
                data = model_to_dict(obj)
                fields = " ".join(f"{k}: {v}" for k, v in data.items())
            except (ObjectDoesNotExist, OperationalError):
                fields = str(obj)
            docs.append(f"{model.__name__} {obj.pk}: {fields}")
    return docs


def _embed_texts(texts: List[str]) -> np.ndarray:
    if not texts:
        return np.array([])
    client = _get_client()
    resp = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return np.array([d.embedding for d in resp.data])


def index_documents() -> int:
    """Construye y almacena embeddings en la base de datos."""

    docs = _build_documents()
    if not docs:
        return 0
    embeddings = _embed_texts(docs)
    objs = [
        DocumentEmbedding(content=doc, embedding=emb.tolist())
        for doc, emb in zip(docs, embeddings)
    ]
    DocumentEmbedding.objects.all().delete()
    DocumentEmbedding.objects.bulk_create(objs)
    return len(objs)


def retrieve_relevant(consulta: str, k: int = 5) -> List[str]:
    query_emb = _embed_texts([consulta])
    if query_emb.size == 0:
        return []
    try:
        results = (
            DocumentEmbedding.objects
            .order_by(CosineDistance("embedding", query_emb[0].tolist()))[:k]
        )
    except OperationalError:
        return []
    return [r.content for r in results]
