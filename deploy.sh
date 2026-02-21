#!/bin/bash

# Script de déploiement pour ServiceManager
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de ServiceManager..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord.${NC}"
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Le fichier .env n'existe pas. Création depuis .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Veuillez éditer le fichier .env avec vos configurations avant de continuer.${NC}"
        echo -e "${YELLOW}   Puis relancez: ./deploy.sh${NC}"
        exit 1
    else
        echo -e "${RED}❌ Le fichier .env.example n'existe pas non plus.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Vérifications préliminaires OK${NC}"

# Arrêter les conteneurs existants
echo -e "${YELLOW}🛑 Arrêt des conteneurs existants...${NC}"
docker compose down

# Construire les images
echo -e "${YELLOW}🔨 Construction des images Docker...${NC}"
docker compose build --no-cache

# Démarrer les services
echo -e "${YELLOW}🚀 Démarrage des services...${NC}"
docker compose up -d

# Attendre que la base de données soit prête
echo -e "${YELLOW}⏳ Attente que la base de données soit prête...${NC}"
sleep 10

# Appliquer les migrations
echo -e "${YELLOW}📦 Application des migrations...${NC}"
docker compose exec -T backend python manage.py migrate

# Collecter les fichiers statiques
echo -e "${YELLOW}📁 Collecte des fichiers statiques...${NC}"
docker compose exec -T backend python manage.py collectstatic --noinput

# Vérifier l'état des conteneurs
echo -e "${YELLOW}🔍 Vérification de l'état des conteneurs...${NC}"
docker compose ps

echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo ""
echo -e "${GREEN}📝 Prochaines étapes:${NC}"
echo -e "   1. Créer un superutilisateur: ${YELLOW}docker compose exec backend python manage.py createsuperuser${NC}"
echo -e "   2. Vérifier les logs: ${YELLOW}docker compose logs -f${NC}"
echo -e "   3. Accéder à l'application: ${YELLOW}http://76.13.56.224${NC}"
echo ""



