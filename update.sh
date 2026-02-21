#!/bin/bash
# Script de mise à jour en ligne – utilise la stack SQLite (docker-compose.sqlite.yml)
# Usage : ./update.sh
# À lancer sur le serveur après git pull, ou pour rebuild + redémarrer.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.sqlite.yml"

echo "🔄 Mise à jour ServiceManager (stack SQLite)..."

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Fichier $COMPOSE_FILE introuvable.${NC}"
    exit 1
fi

# Optionnel : récupérer le code (décommenter si vous lancez update.sh après un git pull)
# echo "📥 Récupération du code..."
# git pull

echo "🔨 Reconstruction des images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "🚀 Redémarrage des services (migrations + collectstatic au démarrage du backend)..."
docker compose -f "$COMPOSE_FILE" up -d

echo "⏳ Attente démarrage (5 s)..."
sleep 5

echo ""
echo "📊 État des conteneurs :"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo -e "${GREEN}✅ Mise à jour terminée.${NC}"
echo "   Logs backend : docker compose -f $COMPOSE_FILE logs -f backend"
echo "   Logs frontend: docker compose -f $COMPOSE_FILE logs -f frontend"
