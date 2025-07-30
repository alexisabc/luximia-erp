# settings_prod.py
import os
import dj_database_url
from .settings import * # Importa la configuración base

# --- Configuración de Producción ---

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# --- Variable para diferenciar entre desarrollo y producción ---
IS_DEVELOPMENT = os.getenv('DEVELOPMENT_MODE', 'False') == 'True'

# --- Base de Datos con Lógica Condicional para SSL ---
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        # Exigir SSL solo si NO estamos en modo desarrollo
        ssl_require=(not IS_DEVELOPMENT)
    )
}

# --- CORS: La Solución Definitiva ---
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
#CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://luximia-erp-git-.*-alexisabc\.vercel\.app$",]
CSRF_TRUSTED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')


# --- Archivos Estáticos con Whitenoise ---
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'assets'),
]

# --- Opciones de Seguridad para Producción ---
# (Se recomienda que SECURE_SSL_REDIRECT sea False en desarrollo local si no tienes un proxy reverso)
SECURE_SSL_REDIRECT = (not IS_DEVELOPMENT)
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = (not IS_DEVELOPMENT)
CSRF_COOKIE_SECURE = (not IS_DEVELOPMENT)
X_FRAME_OPTIONS = 'DENY'

# Encabezados adicionales
CONTENT_SECURITY_POLICY = os.getenv('CONTENT_SECURITY_POLICY', "default-src 'self'")
PERMISSIONS_POLICY = os.getenv('PERMISSIONS_POLICY', 'geolocation=()')