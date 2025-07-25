# backend/luximia_erp/settings_prod.py
import os
import dj_database_url
from .settings import *  # Importa la configuración base

SECRET_KEY = os.getenv('SECRET_KEY')

# ### CAMBIO: Ahora lee la variable DEBUG desde el archivo .env ###
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

IS_DEVELOPMENT = os.getenv('DEVELOPMENT_MODE', 'False') == 'True'

DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        # Exigir SSL solo si NO estamos en modo desarrollo
        ssl_require=(not IS_DEVELOPMENT)
    )
}

CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
# ### MEJORA: Es buena práctica que CSRF_TRUSTED_ORIGINS también use la variable de entorno ###
if CORS_ALLOWED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Configuración de Whitenoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
