"""
Settings pour la production sur cPanel.
Importe les settings de base et les modifie pour la production.
"""

from .settings import *
import os
from decouple import config

# Sécurité - Désactiver le mode debug
DEBUG = config('DEBUG', default=False, cast=bool)

# Hosts autorisés - À modifier avec votre domaine
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost', cast=lambda v: [s.strip() for s in v.split(',')])

# Base de données MySQL/PostgreSQL pour la production
# Remplacez 'mysql' par 'postgresql' si vous utilisez PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.mysql'),
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        } if 'mysql' in config('DB_ENGINE', default='mysql') else {},
    }
}

# Fichiers statiques et médias pour cPanel
# Ajustez les chemins selon votre structure
STATIC_ROOT = config('STATIC_ROOT', default='/home/votreuser/public_html/static')
MEDIA_ROOT = config('MEDIA_ROOT', default='/home/votreuser/public_html/media')

# Sécurité HTTPS
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 an
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS - Mettre votre domaine frontend
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://votre-domaine.com,https://www.votre-domaine.com',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# Logging pour la production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'ERROR',
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# Créer le dossier logs s'il n'existe pas
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)









