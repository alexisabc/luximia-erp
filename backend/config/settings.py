# backend/config/settings.py

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
ROOT_DOMAIN = os.getenv("ROOT_DOMAIN")  # p.ej. tudominio.com
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
    "auditlog",
    "axes",  # Protección contra fuerza bruta
    "django_permissions_policy",  # Headers de seguridad del navegador
    "core",
    "ia", # App de Inteligencia Artificial (Source of Truth DB)
    "pos", # Punto de Venta (SICAR-like)
    "contabilidad.apps.ContabilidadConfig",
    "rrhh.apps.RrhhConfig",
    "auditoria.apps.AuditoriaConfig",
    "sistemas.apps.SistemasConfig",
    "tesoreria.apps.TesoreriaConfig",
    "juridico.apps.JuridicoConfig",
    "compras.apps.ComprasConfig",
    "users.apps.UsersConfig",
    "notifications.apps.NotificationsConfig",
    "corsheaders",
    "csp",  # django-csp para la política de seguridad de contenido
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "django_extensions",
    "pgvector.django",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django_permissions_policy.PermissionsPolicyMiddleware",  # Header Permissions-Policy (sin .middleware)
    "csp.middleware.CSPMiddleware",  # Middleware de django-csp
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "auditoria.middleware.AuditMiddleware",  # Auditoría de cambios
    "core.middleware.EmpresaMiddleware",  # Multi-empresa
    "auditlog.middleware.AuditlogMiddleware",
    "core.middleware.ThreadLocalMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware", # Monitor de intentos de login
]

# --- Seguridad Adicional (Headers & Policies) ---
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Permissions Policy (Floc, Camera, USB, etc.) - "Zero Permission" por defecto
PERMISSIONS_POLICY = {
    "accelerometer": [],
    "ambient-light-sensor": [],
    "camera": [],
    "encrypted-media": [],
    "fullscreen": [],
    "geolocation": [],
    "gyroscope": [],
    "magnetometer": [],
    "microphone": [],
    "midi": [],
    "payment": [],
    "usb": [],
}

# --- Configuración de Django Axes (Brute Force Protection) ---
AXES_FAILURE_LIMIT = 5 # Bloquear tras 5 intentos fallidos
AXES_COOLOFF_TIME = timedelta(minutes=15) # Bloqueo por 15 minutos
AXES_LOCKOUT_PARAMETERS = [["username", "ip_address"]] # Bloquear combinación usuario+IP
AXES_RESET_ON_SUCCESS = True # Resetear contador si logra entrar
# AXES_ENABLE_ACCESS_FAILURE_LOG = True # Loguear intentos fallidos en DB



# --- Configuración de CORS ---
# --- Configuración de CORS ---
cors_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

# Agregar automáticamente el FRONTEND_DOMAIN para evitar errores de configuración
if FRONTEND_DOMAIN:
    if "://" not in FRONTEND_DOMAIN:
        CORS_ALLOWED_ORIGINS.append(f"https://{FRONTEND_DOMAIN}")
        if DEBUG:
            CORS_ALLOWED_ORIGINS.append(f"http://{FRONTEND_DOMAIN}")
    else:
        CORS_ALLOWED_ORIGINS.append(FRONTEND_DOMAIN)

# Default Localhost fallback
if not CORS_ALLOWED_ORIGINS and DEBUG:
    CORS_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

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
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
AUTH_USER_MODEL = "users.CustomUser"


# --- Base de Datos ---
# La lógica revisa si DATABASE_URL existe (para Render) o usa las variables locales
if "DATABASE_URL" in os.environ and os.getenv("DATABASE_URL"):
    # Configuración para producción (Render, etc.)
    # Por defecto no forzamos SSL para ser compatibles con instancias sin soporte.
    ssl_flag = os.getenv("DATABASE_SSL_REQUIRE")
    ssl_require = (
        ssl_flag.lower() in {"1", "true", "t", "yes"}
        if ssl_flag is not None
        else False
    )
    DATABASES = {
        "default": dj_database_url.config(conn_max_age=600, ssl_require=ssl_require)
    }
else:
    # Configuración para desarrollo local
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
            "HOST": os.getenv("POSTGRES_HOST", "db"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }

# --- Sandbox Configuration ---
# 1. Start with a copy of Default to inherit HOST, PORT, USER, PASSWORD, SSL, etc.
if "DATABASE_URL_SANDBOX" in os.environ and os.getenv("DATABASE_URL_SANDBOX"):
    ssl_flag = os.getenv("DATABASE_SSL_REQUIRE")
    ssl_require = (
        ssl_flag.lower() in {"1", "true", "t", "yes"}
        if ssl_flag is not None
        else False
    )
    DATABASES["sandbox"] = dj_database_url.config(
        env="DATABASE_URL_SANDBOX",
        conn_max_age=600,
        ssl_require=ssl_require
    )
else:
    # Inherit from default (works for both local env vars and DATABASE_URL)
    DATABASES["sandbox"] = DATABASES["default"].copy()
    
    # 2. Override specific Sandbox values
    SANDBOX_DB_NAME = os.getenv("POSTGRES_DB_SANDBOX")
    
    if not SANDBOX_DB_NAME:
        # Fallback local naming
        default_name = DATABASES["default"].get("NAME", "erp_system_db")
        SANDBOX_DB_NAME = f"{default_name}_sandbox"

    DATABASES["sandbox"]["NAME"] = SANDBOX_DB_NAME

DATABASE_ROUTERS = ["config.routers.SandboxRouter"]

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
#    Configuración híbrida para local y Docker/producción.
STATICFILES_DIRS = []

# Buscar assets en múltiples ubicaciones (híbrido local/Docker)
ASSETS_PATH = os.getenv("ASSETS_PATH")
if not ASSETS_PATH:
    # Intentar primero la raíz del proyecto (para Docker y desarrollo)
    root_assets = os.path.join(BASE_DIR.parent, "assets")
    backend_assets = os.path.join(BASE_DIR, "assets")
    
    if os.path.isdir(root_assets):
        ASSETS_PATH = root_assets
    elif os.path.isdir(backend_assets):
        ASSETS_PATH = backend_assets

if ASSETS_PATH and os.path.isdir(ASSETS_PATH):
    STATICFILES_DIRS.append(ASSETS_PATH)

# 3. Almacenamiento
# Usamos WhiteNoise para servir archivos estáticos eficientemente tanto en dev (opcional) como en prod.
if not DEBUG:
    # Producción: Compresión y Hashing único (cache-busting)
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
else:
    # Desarrollo: Solo compresión, sin hash para evitar re-colectar constantemente
    STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"


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
# Las cookies deben ser seguras (solo HTTPS) en producción
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# Define el dominio de la cookie solo en producción para permitir subdominios.
# En desarrollo, no se establece para que funcione correctamente con 'localhost'.
if not DEBUG and ROOT_DOMAIN:
    SESSION_COOKIE_DOMAIN = f".{ROOT_DOMAIN}"
    CSRF_COOKIE_DOMAIN = f".{ROOT_DOMAIN}"

# 'SameSite=None' es necesario en producción para enviar cookies entre
# el frontend y el backend (que son orígenes distintos).
# Requiere que la cookie sea segura (Secure=True).
# En desarrollo, 'Lax' es un valor predeterminado seguro y funcional.
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"

# Evita que JavaScript acceda a la cookie de sesión (medida de seguridad)
SESSION_COOKIE_HTTPONLY = True


# --- Configuración para Passkeys (WebAuthn) ---
PASSKEY_STRICT_UV = os.getenv("PASSKEY_STRICT_UV", "True") == "True"
# RP_NAME explícito para mostrar en diálogos del sistema
RP_NAME = os.getenv("RP_NAME", "ERP System")
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
        "script-src": ("'self'", "'unsafe-inline'") if DEBUG else ("'self'",),
        "style-src": ("'self'", "'unsafe-inline'"), # Tailwind/Next.js often requires inline styles/fonts
        "img-src": ("'self'", "data:", "https:"), # Allow external images (S3/Cloudflare)
        "font-src": ("'self'", "data:", "https://fonts.gstatic.com"), # Google Fonts support
        "frame-ancestors": ("'none'",), # Prevent embedding in iframes
    }
}

# --- Authentication Backends ---
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesBackend", # Debe ser el primero
    "users.auth_backends.RolePermissionBackend",  # RBAC personalizado
    "django.contrib.auth.backends.ModelBackend",
]

# --- Password Validation ---
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 10,
        },
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# --- Configuración de Email ---
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.getenv("EMAIL_HOST", "mailhog")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", 1025))
    EMAIL_USE_TLS = False
    DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "system@local.dev")
else:
    EMAIL_BACKEND = "config.emails.ResendEmailBackend"
    DEFAULT_FROM_EMAIL = os.getenv(
        "RESEND_FROM_EMAIL", os.getenv("DEFAULT_FROM_EMAIL", "noreply@system.app")
    )

RESEND_API_KEY = os.getenv("RESEND_API_KEY")


# --- Django REST Framework y JWT ---
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "core.pagination.CustomPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "users.authentication.VersionedJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "1000/day",
        "user": "100000/day",
        "login_start": "10/minute", # Límite estricto para evitar enumeración y spam
    },
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
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

# --- Configuración de almacenamiento S3 compatible (Cloudflare R2) ---

# --- Configuración de almacenamiento S3 compatible (Cloudflare R2) ---

if os.getenv("CLOUDFLARE_R2_BUCKET_NAME"):
    # Credenciales y Configuración GLOBAL de AWS/S3/R2
    AWS_ACCESS_KEY_ID = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = os.getenv("CLOUDFLARE_R2_BUCKET_NAME")
    AWS_S3_ENDPOINT_URL = os.getenv("CLOUDFLARE_R2_ENDPOINT_URL")
    AWS_S3_REGION_NAME = os.getenv("CLOUDFLARE_R2_REGION", "auto")
    AWS_S3_SIGNATURE_VERSION = "s3v4"
    AWS_S3_ADDRESSING_STYLE = os.getenv("CLOUDFLARE_R2_ADDRESSING_STYLE", "virtual")
    
    # Seguridad: Deshabilitar ACLs ya que R2 no las soporta igual y es mejor manejarlo por bucket policy
    AWS_DEFAULT_ACL = None 
    
    # Definición de Storages (Django 4.2+ / 5.0)
    STORAGES = {
        "default": {
            "BACKEND": "config.storage_backends.MediaStorage",
        },
        "staticfiles": {
            # Si en producción quieres static en R2, cambia esto. 
            # Recomendación: Mantener Whitenoise para Static (Rendimiento)
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage", 
        },
    }
    
    # Comentado: Si se quisiera Static en R2 también:
    # STORAGES["staticfiles"]["BACKEND"] = "config.storage_backends.StaticStorage"
    
    # Fallback para librerías viejas que buscan estas variables
    DEFAULT_FILE_STORAGE = "config.storage_backends.MediaStorage"

else:
    # Local Storage
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage", 
        },
    }

APPEND_SLASH = True

# ============================================================================
# AUDITORÍA - Modelos a vigilar
# ============================================================================
AUDITED_MODELS = [
    # Core & Config
    'core.Empresa',
    # Users & Auth
    'users.CustomUser',
    'users.Role',
    # RRHH
    'rrhh.Empleado',
    'rrhh.Nomina',
    # Compras & Inventario
    'compras.Insumo',          # ¡Vital para cambios de precios!
    'compras.OrdenCompra',
    'compras.Proveedor',
    # POS
    'pos.Caja',                # Aperturas/Cierres
    'pos.Turno',
    'pos.Venta',               # Cancelaciones o cambios
    # Tesorería
    'tesoreria.CuentaBancaria',
    'tesoreria.MovimientoBancario',
    # Contabilidad
    'contabilidad.Poliza',
]
