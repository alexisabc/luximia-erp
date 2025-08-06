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
# Leemos la variable una sola vez
DEVELOPMENT_MODE = os.getenv('DEVELOPMENT_MODE', 'False') == 'True'
# DEBUG y IS_DEVELOPMENT dependen de la misma variable
DEBUG = DEVELOPMENT_MODE
IS_DEVELOPMENT = DEVELOPMENT_MODE


# --- Configuración de Hosts ---
# En desarrollo, permite localhost. En producción, lee de la variable de entorno.
if DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']
else:
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

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
    'rest_framework_simplejwt.token_blacklist',
    'django_extensions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Para estáticos en producción
    'cxc.middleware.SecurityHeadersMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --- Configuración de CORS ---
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ALLOW_CREDENTIALS = True
else:
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
    CSRF_TRUSTED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')


ROOT_URLCONF = 'luximia_erp.urls'
WSGI_APPLICATION = 'luximia_erp.wsgi.application'
AUTH_USER_MODEL = 'users.CustomUser'

# --- Base de Datos ---
if 'DATABASE_URL' in os.environ:
    # --- Configuración para PRODUCCIÓN (Render) ---
    # Usa DATABASE_URL y exige SSL
    DATABASES = {
        'default': dj_database_url.config(
            conn_max_age=600,
            ssl_require=True
        )
    }
else:
    # --- Configuración para DESARROLLO (Docker Local) ---
    # Usa las variables individuales y no exige SSL
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

# --- Plantillas, Internacionalización, etc. (se mantienen igual) ---
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
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
FRONTEND_DOMAIN = os.getenv('FRONTEND_DOMAIN', 'localhost:3000')

# --- Archivos Estáticos (Configuración Unificada y Robusta) ---

STATIC_URL = 'static/'

# 1. Directorio donde `collectstatic` copiará todos los archivos para producción.
#    Es bueno tenerlo definido siempre para evitar errores.
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 2. Directorios adicionales donde Django buscará archivos estáticos.
#    Apuntamos a la carpeta /app/assets, que es donde Docker monta tus assets.
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'assets'),
]

# 3. Almacenamiento para producción (solo se activa cuando DEBUG=False).
#    Esto activa la compresión y el cache-busting de Whitenoise.
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# --- Opciones de Seguridad para Producción ---
# (Se recomienda que SECURE_SSL_REDIRECT sea False en desarrollo local si no tienes un proxy reverso)
SECURE_SSL_REDIRECT = not IS_DEVELOPMENT
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = not IS_DEVELOPMENT
CSRF_COOKIE_SECURE = not IS_DEVELOPMENT
X_FRAME_OPTIONS = 'DENY'

# Encabezados adicionales (leídos desde variables de entorno)
CONTENT_SECURITY_POLICY = os.getenv('CONTENT_SECURITY_POLICY', "default-src 'self'")
PERMISSIONS_POLICY = os.getenv('PERMISSIONS_POLICY', 'geolocation=()')


# --- Resto de la Configuración (REST_FRAMEWORK, SIMPLE_JWT, LOGGING, etc.) ---

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'cxc.pagination.CustomPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        'rest_framework.permissions.DjangoModelPermissions',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('ACCESS_TOKEN_LIFETIME_MINUTES', '5'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('REFRESH_TOKEN_LIFETIME_DAYS', '1'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'TOKEN_OBTAIN_SERIALIZER': 'cxc.serializers.MyTokenObtainPairSerializer',
}

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


# --- Configuración de Email Inteligente ---
if DEVELOPMENT_MODE:
    # --- Configuración para DESARROLLO (MailHog) ---
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST', 'mailhog')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 1025))
    EMAIL_USE_TLS = False
    DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'desarrollo@luximia.local')
else:
    # --- Configuración para PRODUCCIÓN (SendGrid API) ---
    EMAIL_BACKEND = 'anymail.backends.sendgrid.EmailBackend'
    ANYMAIL = {
        "SENDGRID_API_KEY": os.getenv("SENDGRID_API_KEY"),
    }
    DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")



# --- Configuración para Passkeys (WebAuthn) ---
# El "Relying Party ID" debe ser el dominio donde corre tu app (sin puerto).
RP_ID = "localhost"

# El "Origen" debe ser la URL completa de tu frontend.
WEBAUTHN_ORIGIN = f"http://{os.getenv('FRONTEND_DOMAIN', 'localhost:3000')}"