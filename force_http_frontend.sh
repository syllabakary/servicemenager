#!/bin/bash
# Remet la config Nginx HTTP du dépôt (sans redirection HTTPS) et reconstruit le frontend.
# À utiliser quand le frontend renvoie 301 vers HTTPS alors que vous utilisez docker-compose.yml (PostgreSQL)
# sans certificats dans le conteneur.
# Usage: ./force_http_frontend.sh

set -e
cd "$(dirname "$0")"

echo "Restoration de frontend/nginx.conf (HTTP uniquement, pas de redirect)..."
git checkout -- frontend/nginx.conf

if grep -q "return 301 https://" frontend/nginx.conf 2>/dev/null; then
    echo "Erreur: nginx.conf contient encore une redirection HTTPS. Vérifiez le fichier."
    exit 1
fi

echo "Reconstruction du frontend..."
docker compose build frontend --no-cache
echo "Redémarrage du frontend..."
docker compose up -d frontend
echo "Terminé. Testez: curl -I http://localhost/media/services/VOTRE_IMAGE.png (attendu: 200 OK)"
echo "Pour les domaines .net / .com: vérifiez que les DNS pointent vers la même IP que .fr"
