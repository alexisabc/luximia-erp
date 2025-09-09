# backend/luximia_erp/settings.py

from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta
import os
import dj_database_url

# --- Carga de Entorno ---
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = BASE_DIR.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

# --- Variables Clave de Entorno ---
SECRET_KEY = os.getenv("SECRET_KEY")
DEVELOPMENT_MODE = os.getenv("DEVELOPMENT_MODE", "False") == "True"
DEBUG = DEVELOPMENT_MODE

# --- Dominios y Hosts ---
FRONTEND_DOMAIN = os.getenv("FRONTEND_DOMAIN", "localhost:3000")  # p.ej. localhost:3000
# Añade 0.0.0.0 para Docker/WSL y el host de tu backend si usas otro nombre
if DEBUG:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]
else:
    ALLOWED_HOSTS = [h for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h]

# --- Application definition ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    "rest_framework",
    "cxc.apps.CxcConfig",
    "users.apps.UsersConfig",
    "corsheaders",
    "csp",  # django-csp para la política de seguridad de contenido
    "rest_framework_simplejwt.token_blacklist",
    "django_extensions",
    "pgvector.django",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "csp.middleware.CSPMiddleware",  # Middleware de django-csp
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# --- Configuración de CORS ---
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# --- CSRF (importante incluso en dev cuando hay dominio/puerto distinto) ---
CSRF_TRUSTED_ORIGINS = list(
    {
        f"http://{FRONTEND_DOMAIN}",
        f"https://{FRONTEND_DOMAIN}",
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:3000",
    }
)
# Nota: mantenlo también en prod; ya no lo limites con if not DEBUG


# --- Rutas, WSGI y Modelo de Usuario ---
ROOT_URLCONF = "luximia_erp.urls"
WSGI_APPLICATION = "luximia_erp.wsgi.application"
AUTH_USER_MODEL = "users.CustomUser"


# --- Base de Datos ---
# La lógica revisa si DATABASE_URL existe (para Render) o usa las variables locales
if "DATABASE_URL" in os.environ and os.getenv("DATABASE_URL"):
    # Configuración para producción (Render, etc.)
    ssl_require = os.getenv("DATABASE_SSL_REQUIRE", "True") == "True"
    DATABASES = {
        "default": dj_database_url.config(conn_max_age=600, ssl_require=ssl_require)
    }
else:
    # Configuración para desarrollo local con pool de conexiones
    DATABASES = {
        "default": {
            "ENGINE": "dj_db_conn_pool.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
            "HOST": os.getenv("POSTGRES_HOST", "db"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "POOL_OPTIONS": {
                "max_overflow": 10,
                "pool_size": 10,
                "recycle": 24 * 60 * 60,
            },
        }
    }

# --- Internacionalización ---
LANGUAGE_CODE = "es-mx"
TIME_ZONE = "America/Cancun"
USE_I18N = True
USE_TZ = True


# --- Plantillas y Claves Primarias ---
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Archivos Estáticos ---
STATIC_URL = "static/"

# 1. Directorio donde `collectstatic` copiará todos los archivos para producción.
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# 2. Directorios adicionales donde Django buscará archivos estáticos.
#    Apuntamos a la carpeta /app/assets, que es donde Docker monta tus assets.
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "assets"),
]

# 3. Almacenamiento para producción (solo se activa cuando DEBUG=False).
if not DEBUG:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


# --- Opciones de Seguridad ---
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# --- Cookies de sesión ---
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
# Para que el navegador envíe cookies en cross-site (frontend:3000 -> backend:8000)
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
SESSION_COOKIE_HTTPONLY = True

# --- Configuración para Passkeys (WebAuthn) ---
PASSKEY_STRICT_UV = os.getenv("PASSKEY_STRICT_UV", "True") == "True"
# RP_NAME explícito para mostrar en diálogos del sistema
RP_NAME = os.getenv("RP_NAME", "Luximia ERP")
if DEBUG:
    # RP_ID = dominio “puro” (sin puerto). En dev normalmente es localhost.
    RP_ID = os.getenv("RP_ID", "localhost")
    # debe coincidir EXACTO con el origin del navegador
    WEBAUTHN_ORIGIN = os.getenv("WEBAUTHN_ORIGIN", f"http://{FRONTEND_DOMAIN}")
else:
    # En producción usa tu dominio raíz como RP_ID (sin subdominio si aplica)
    RP_ID = os.getenv("RP_ID", "tu-dominio.com")
    WEBAUTHN_ORIGIN = os.getenv("WEBAUTHN_ORIGIN", f"https://{FRONTEND_DOMAIN}")

# --- Content Security Policy (híbrida) ---
CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": ("'self'",),
        "connect-src": (
            "'self'",
            f"http://{FRONTEND_DOMAIN}",
            f"https://{FRONTEND_DOMAIN}",
            "http://localhost:3000",
            "https://localhost:3000",
            "http://127.0.0.1:3000",
            "https://127.0.0.1:3000",
        ),
        # En desarrollo permitimos 'unsafe-inline' para evitar errores con Next/Tailwind.
        # En prod se recomienda quitarlo.
        "script-src": ("'self'", "'unsafe-inline'") if DEBUG else ("'self'",),
        "style-src": ("'self'", "'unsafe-inline'") if DEBUG else ("'self'",),
        "img-src": ("'self'", "data:"),
    }
}

# --- Configuración de Email ---
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.getenv("EMAIL_HOST", "mailhog")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", 1025))
    EMAIL_USE_TLS = False
    DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "desarrollo@luximia.local")
else:
    AZURE_COMMUNICATION_CONNECTION_STRING = os.getenv(
        "AZURE_COMMUNICATION_CONNECTION_STRING"
    )
    AZURE_COMMUNICATION_SENDER_ADDRESS = os.getenv("AZURE_COMMUNICATION_SENDER_ADDRESS")
    DEFAULT_FROM_EMAIL = AZURE_COMMUNICATION_SENDER_ADDRESS


# --- Django REST Framework y JWT ---
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "cxc.pagination.CustomPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        # "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("ACCESS_TOKEN_LIFETIME_MINUTES", "15"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("REFRESH_TOKEN_LIFETIME_DAYS", "1"))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- Logging ---
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": '{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}

# --- CONFIGURACIÓN DE AZURE BLOB STORAGE PARA ARCHIVOS ---

# Le dice a Django que use Azure para todos los archivos subidos (ej. PDFs, imágenes de perfil)
DEFAULT_FILE_STORAGE = "storages.backends.azure_storage.AzureStorage"

# Estas son las credenciales. Las pondremos en las variables de entorno de App Service.
AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING")

# El nombre del contenedor que creaste en el paso 1.5
AZURE_CONTAINER = "documentos-pdf"

APPEND_SLASH = False
