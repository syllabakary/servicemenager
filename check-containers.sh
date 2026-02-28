#!/bin/bash
# Vérifie l'état des conteneurs et affiche les logs en cas d'erreur.
# Usage: ./check-containers.sh

echo "=== État des conteneurs ==="
docker compose ps

echo ""
echo "=== Dernières lignes du backend (si erreur, regarder ici) ==="
docker compose logs backend --tail 80

echo ""
echo "=== Dernières lignes du frontend (nginx) ==="
docker compose logs frontend --tail 20

echo ""
echo "=== Test rapide: le backend répond-il sur le port 8000 ? ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:8000/api/services/ 2>/dev/null || echo "Impossible de joindre le backend (conteneur arrêté ou pas démarré)"
