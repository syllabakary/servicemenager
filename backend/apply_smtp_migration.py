#!/usr/bin/env python
"""
Script pour appliquer la migration SMTP manuellement
Utilisez ce script si vous avez des problèmes avec python manage.py migrate
"""
import os
import sys
import django

# Configuration du chemin Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'servicemenager.settings')

# Initialiser Django
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def check_if_columns_exist():
    """Vérifier si les colonnes SMTP existent déjà"""
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(api_sitesettings);")
        columns = [row[1] for row in cursor.fetchall()]
        smtp_columns = ['smtp_host', 'smtp_port', 'smtp_use_tls', 'smtp_use_ssl', 'smtp_username', 'smtp_password']
        missing = [col for col in smtp_columns if col not in columns]
        return len(missing) == 0, missing

def apply_migration_manually():
    """Appliquer la migration manuellement en exécutant le SQL directement"""
    with connection.cursor() as cursor:
        try:
            # Vérifier si les colonnes existent
            exists, missing = check_if_columns_exist()
            if exists:
                print("✅ Les colonnes SMTP existent déjà dans la base de données.")
                return True
            
            print(f"⚠️  Colonnes manquantes: {', '.join(missing)}")
            print("📝 Application de la migration...")
            
            # Ajouter les colonnes manquantes
            if 'smtp_host' in missing:
                cursor.execute("ALTER TABLE api_sitesettings ADD COLUMN smtp_host VARCHAR(255) NULL;")
            if 'smtp_port' in missing:
                cursor.execute("ALTER TABLE api_sitesettings ADD COLUMN smtp_port INTEGER NOT NULL DEFAULT 587;")
            if 'smtp_use_tls' in missing:
                cursor.execute("ALTER TABLE api_sitesettings ADD COLUMN smtp_use_tls BOOLEAN NOT NULL DEFAULT 1;")
            if 'smtp_use_ssl' in missing:
                cursor.execute("ALTER TABLE api_sitesettings ADD COLUMN smtp_use_ssl BOOLEAN NOT NULL DEFAULT 0;")
            if 'smtp_username' in missing:
                cursor.execute("ALTER TABLE api_sitesettings ADD COLUMN smtp_username VARCHAR(255) NULL;")
            if 'smtp_password' in missing:
                cursor.execute("ALTER TABLE api_sitesettings ADD COLUMN smtp_password VARCHAR(255) NULL;")
            
            print("✅ Migration appliquée avec succès!")
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de l'application de la migration: {e}")
            return False

if __name__ == '__main__':
    print("🚀 Application de la migration SMTP...")
    success = apply_migration_manually()
    
    if success:
        print("\n✅ La migration a été appliquée avec succès!")
        print("🔄 Redémarrez votre serveur Django pour que les changements prennent effet.")
    else:
        print("\n❌ Échec de l'application de la migration.")
        print("💡 Essayez d'appliquer la migration avec: python manage.py migrate")
        sys.exit(1)









