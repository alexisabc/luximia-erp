# backend/luximia_erp/settings.py

from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta
import os
import dj_database_url

# --- Carga de Entorno ---
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = BASE_DIR.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)


# --- Variables Clave de Entorno ---
SECRET_KEY = os.getenv('SECRET_KEY')
# La variable DEVELOPMENT_MODE es la única fuente de verdad para el entorno
DEVELOPMENT_MODE = os.getenv('DEVELOPMENT_MODE', 'False') == 'True'
DEBUG = DEVELOPMENT_MODE


# --- Dominios y Hosts ---
# En desarrollo, permite localhost. En producción, lee de la variable de entorno.
if DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']
else:
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Se usará para configurar Passkeys, CORS y otras URLs
FRONTEND_DOMAIN = os.getenv('FRONTEND_DOMAIN', 'localhost:3000')


# --- Application definition ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'rest_framework',
    'cxc.apps.CxcConfig',
    'users.apps.UsersConfig',
    'corsheaders',
    'csp',  # django-csp para la política de seguridad de contenido
    'rest_framework_simplejwt.token_blacklist',
    'django_extensions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'csp.middleware.CSPMiddleware',  # Middleware de django-csp
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# --- Configuración de CORS ---
# Leemos los orígenes permitidos desde las variables de entorno, con un valor por defecto para desarrollo
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
CORS_ALLOW_CREDENTIALS = True


# --- Rutas, WSGI y Modelo de Usuario ---
ROOT_URLCONF = 'luximia_erp.urls'
WSGI_APPLICATION = 'luximia_erp.wsgi.application'
AUTH_USER_MODEL = 'users.CustomUser'


# --- Base de Datos ---
# La lógica revisa si DATABASE_URL existe (para Render) o usa las variables locales
if 'DATABASE_URL' in os.environ and os.getenv('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(conn_max_age=600, ssl_require=True)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB'),
            'USER': os.getenv('POSTGRES_USER'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
            'HOST': os.getenv('POSTGRES_HOST', 'db'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }


# --- Internacionalización ---
LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Cancun'
USE_I18N = True
USE_TZ = True


# --- Plantillas y Claves Primarias ---
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [], 'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- Archivos Estáticos ---
STATIC_URL = 'static/'

# 1. Directorio donde `collectstatic` copiará todos los archivos para producción.
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 2. Directorios adicionales donde Django buscará archivos estáticos.
#    Apuntamos a la carpeta /app/assets, que es donde Docker monta tus assets.
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'assets'),
]

# 3. Almacenamiento para producción (solo se activa cuando DEBUG=False).
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# --- Opciones de Seguridad ---
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Cookies seguras en producción, Lax en desarrollo
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
SESSION_COOKIE_HTTPONLY = True

# Orígenes de confianza para CSRF en producción (Render)
if not DEBUG:
    CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS


# --- Configuración de Email ---
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST', 'mailhog')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 1025))
    EMAIL_USE_TLS = False
    DEFAULT_FROM_EMAIL = os.getenv(
        'DEFAULT_FROM_EMAIL', 'desarrollo@luximia.local')
else:
    EMAIL_BACKEND = 'anymail.backends.sendgrid.EmailBackend'
    ANYMAIL = {"SENDGRID_API_KEY": os.getenv("SENDGRID_API_KEY")}
    DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")


# --- Configuración para Passkeys (WebAuthn) ---
if DEBUG:
    RP_ID = "localhost"
    WEBAUTHN_ORIGIN = f"http://{FRONTEND_DOMAIN}"
else:
    # En producción, el RP_ID es tu dominio raíz sin subdominio.
    # Por ejemplo, si tu app corre en 'app.luximia-erp.com', el RP_ID es 'luximia-erp.com'
    RP_ID = os.getenv("RP_ID", "tu-dominio.com")
    WEBAUTHN_ORIGIN = f"https://{FRONTEND_DOMAIN}"

# --- Django REST Framework y JWT ---
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'cxc.pagination.CustomPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('ACCESS_TOKEN_LIFETIME_MINUTES', '15'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('REFRESH_TOKEN_LIFETIME_DAYS', '1'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# --- Logging ---
LOGGING = {
    'version': 1, 'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'},
    },
    'root': {'handlers': ['console'], 'level': os.getenv('LOG_LEVEL', 'INFO')},
}
