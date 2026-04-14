import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production-12345')

# URL publique du site (pour build_absolute_uri derrière un proxy HTTPS)
SITE_URL = config('SITE_URL', default='')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0,172.20.10.5,10.10.9.42,192.168.0.133,76.13.56.224,ease-dom.fr,www.ease-dom.fr,ease-dom.net,www.ease-dom.net,ease-dom.com,www.ease-dom.com', cast=lambda v: [s.strip() for s in v.split(',')])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'api',
    'content',
]

# Configuration pour utiliser CustomUser
AUTH_USER_MODEL = 'api.CustomUser'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.CurrentUserMiddleware',
    'api.middleware.ErrorLogMiddleware',
]

ROOT_URLCONF = 'servicemenager.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'api' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'servicemenager.wsgi.application'

# Database
# Permet d'utiliser SQLite ou PostgreSQL selon les variables d'environnement
DB_ENGINE = config('DB_ENGINE', default='django.db.backends.sqlite3')

if DB_ENGINE == 'django.db.backends.sqlite3':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / config('DB_NAME', default='db.sqlite3'),
        }
    }
else:
    # PostgreSQL ou MySQL
    DATABASES = {
        'default': {
            'ENGINE': DB_ENGINE,
            'NAME': config('DB_NAME', default='servicemenager'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }

# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Abidjan'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
# Limite upload (éviter 413) — PATCH services/agences/paramètres avec image
DATA_UPLOAD_MAX_MEMORY_SIZE = 200 * 1024 * 1024   # 200 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 200 * 1024 * 1024   # 200 MB

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173,http://76.13.56.224,http://ease-dom.fr,https://ease-dom.fr,http://www.ease-dom.fr,https://www.ease-dom.fr,http://ease-dom.net,https://ease-dom.net,http://www.ease-dom.net,https://www.ease-dom.net,http://ease-dom.com,https://ease-dom.com,http://www.ease-dom.com,https://www.ease-dom.com',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
# En développement, permettre toutes les origines (à désactiver en production)
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=True, cast=bool)

CORS_ALLOW_CREDENTIALS = True

# Sécurité HTTPS (activé via variables d'environnement)
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'EXCEPTION_HANDLER': 'api.middleware.drf_exception_handler',
}

# Simple JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),   # Réduit de 1h à 30min
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,   # Blacklist l'ancien refresh token après rotation
    'UPDATE_LAST_LOGIN': True,
}

# Désactiver la validation des mots de passe en développement (pour permettre des mots de passe simples)

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@serviceslocaux.ci')
AUTH_PASSWORD_VALIDATORS = [] if DEBUG else [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]










# ── Logging : tout en DB, pas de console en production ────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_handlers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {module}:{lineno} — {message}',
            'style': '{',
        },
    },
    'handlers': {
        # Handler base de données — toujours actif
        'database': {
            'level': 'INFO',
            'class': 'api.middleware.DatabaseLogHandler',
            'formatter': 'verbose',
        },
        # Console — uniquement en développement (DEBUG=True)
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler' if DEBUG else 'logging.NullHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        # Logger principal Django
        'django': {
            'handlers': ['database'] if not DEBUG else ['database', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        # Requêtes Django (erreurs 500, etc.)
        'django.request': {
            'handlers': ['database'] if not DEBUG else ['database', 'console'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Sécurité
        'django.security': {
            'handlers': ['database'] if not DEBUG else ['database', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        # Logger de l'app api (utilisé dans views.py)
        'api': {
            'handlers': ['database'] if not DEBUG else ['database', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        # Logger racine — capture tout le reste
        '': {
            'handlers': ['database'] if not DEBUG else ['database', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
