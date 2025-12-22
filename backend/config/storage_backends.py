from storages.backends.s3boto3 import S3Boto3Storage
import os

class MediaStorage(S3Boto3Storage):
    """
    Almacenamiento para archivos subidos por usuarios (Media).
    - Privado por defecto (URLs firmadas) para documentos sensibles.
    - Se guarda en el bucket R2 bajo la carpeta 'media/'.
    """
    location = 'media'
    file_overwrite = False  # No sobrescribir archivos con el mismo nombre
    default_acl = None  # R2 no usa ACLs
    
    # Seguridad: URLs firmadas por defecto
    querystring_auth = True 
    querystring_expire = 3600  # Links válidos por 1 hora

class PublicMediaStorage(S3Boto3Storage):
    """
    Almacenamiento para archivos públicos (ej. Avatares si se requieren públicos, o assets).
    """
    location = 'public'
    file_overwrite = False
    default_acl = None
    querystring_auth = False
    
class StaticStorage(S3Boto3Storage):
    """
    Almacenamiento para archivos estáticos (CSS, JS, Images del sistema).
    - Público.
    - Cache agresiva.
    """
    location = 'static'
    default_acl = None
    querystring_auth = False
    object_parameters = {
        'CacheControl': 'max-age=8640000, public',  # Cache por ~100 días
    }
