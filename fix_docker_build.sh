#!/bin/bash
# Script pour nettoyer le cache Docker et reconstruire les images

echo "🧹 Nettoyage du cache Docker..."

# 1. Arrêter tous les conteneurs
echo "1. Arrêt des conteneurs..."
docker compose -f docker-compose.sqlite.yml down 2>/dev/null || true
docker compose down 2>/dev/null || true

# 2. Supprimer les images existantes
echo "2. Suppression des images existantes..."
docker rmi servicemenager-backend:latest 2>/dev/null || true
docker rmi servicemenager-frontend:latest 2>/dev/null || true

# 3. Nettoyer le cache de build Docker
echo "3. Nettoyage du cache de build..."
docker builder prune -f

# 4. Nettoyer les images non utilisées
echo "4. Nettoyage des images non utilisées..."
docker image prune -f

# 5. Reconstruire les images sans cache
echo "5. Reconstruction des images (sans cache)..."
docker compose -f docker-compose.sqlite.yml build --no-cache

echo "✅ Nettoyage terminé !"
echo "Vous pouvez maintenant démarrer les conteneurs avec :"
echo "docker compose -f docker-compose.sqlite.yml up -d"



