# backend/luximia_erp/settings_prod.py
import os
import dj_database_url
from .settings import * # Importa la configuración base

# --- Configuración de Producción ---

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# --- Base de Datos ---
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        ssl_require=True  # Siempre requerir SSL en producción
    )
}

# --- CORS: La Solución Definitiva ---

# 1. Lista de orígenes exactos (leída desde variables de entorno)
#    Útil para desarrollo local y el dominio principal de producción.
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')

# 2. Lista de patrones de orígenes (expresiones regulares)
#    Esto autoriza todas las URLs de preview de Vercel para tu proyecto.
#    Asegúrate de que el nombre de tu repo y usuario de GitHub sean correctos.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://luximia-erp-git-.*-alexisabc\.vercel\.app$",
]

# 3. Lista de dominios de confianza para CSRF
#    Es buena práctica que también confíe en tu dominio de Vercel.
CSRF_TRUSTED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')


# --- Archivos Estáticos con Whitenoise ---
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'assets'),
]

# --- Opciones de Seguridad para Producción ---
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'

# Encabezados adicionales
CONTENT_SECURITY_POLICY = os.getenv('CONTENT_SECURITY_POLICY', "default-src 'self'")
PERMISSIONS_POLICY = os.getenv('PERMISSIONS_POLICY', 'geolocation=()')