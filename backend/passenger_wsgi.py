"""
Fichier WSGI pour le déploiement sur cPanel avec Passenger.
Ce fichier doit être placé à la racine du dossier backend.
"""

import sys
import os

# Ajouter le chemin du projet au PYTHONPATH
sys.path.insert(0, os.path.dirname(__file__))

# Définir le module de settings (utilisez settings_production.py si vous l'avez créé)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'servicemenager.settings')

# Importer l'application WSGI Django
from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()







