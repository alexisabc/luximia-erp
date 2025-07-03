# backend/luximia_erp/settings_prod.py
import os
import dj_database_url
from .settings import *  # Importa la configuración base

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = False
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

DATABASES = {
    'default': dj_database_url.config(conn_max_age=600, ssl_require=True)
}

CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Configuración de Whitenoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
