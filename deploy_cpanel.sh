#!/bin/bash
# Script de déploiement pour cPanel
# Utilisez ce script via SSH sur votre serveur cPanel

echo "🚀 Déploiement sur cPanel - ServiceManager"
echo "=========================================="

# Variables (à modifier selon votre configuration)
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
VENV_PATH="$HOME/virtualenv/backend/3.13"
PYTHON_VERSION="3.13"

# 1. Activer l'environnement virtuel Python
echo "📦 Activation de l'environnement virtuel..."
source $VENV_PATH/bin/activate

# 2. Installer/Mettre à jour les dépendances backend
echo "📥 Installation des dépendances Python..."
cd $BACKEND_DIR
pip install --upgrade pip
pip install -r requirements.txt

# 3. Migrations de la base de données
echo "🗄️  Exécution des migrations..."
python manage.py makemigrations
python manage.py migrate

# 4. Collecte des fichiers statiques
echo "📁 Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

# 5. Build du frontend
echo "🏗️  Build du frontend..."
cd ../$FRONTEND_DIR
npm install
npm run build

echo "✅ Déploiement terminé!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Vérifiez que le fichier .env est configuré correctement"
echo "2. Vérifiez les permissions des dossiers static/ et media/"
echo "3. Testez l'API: https://votre-domaine.com/api/"
echo "4. Testez le frontend: https://votre-domaine.com/"









