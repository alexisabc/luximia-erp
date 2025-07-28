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

# Permitir sobreescribir las listas de CSRF directamente
extra_csrf = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if extra_csrf:
    CSRF_TRUSTED_ORIGINS = extra_csrf.split(',')

# Configuración de Whitenoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Ruta base de los activos en despliegue. Se puede ajustar con ``ASSETS_PATH``.
ASSETS_PATH = os.getenv('ASSETS_PATH', STATIC_ROOT)

# Opciones de seguridad para producción
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True') == 'True'
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# Encabezados adicionales
CONTENT_SECURITY_POLICY = os.getenv('CONTENT_SECURITY_POLICY', "default-src 'self'")
PERMISSIONS_POLICY = os.getenv('PERMISSIONS_POLICY', 'geolocation=()')
