#!/bin/bash
# Script pour obtenir le certificat SSL en arrêtant temporairement Nginx

echo "🔒 Obtention du certificat SSL pour ease-dom.fr"
echo "=========================================="

cd /opt/servicemenager

# Vérifier si le certificat existe déjà
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "✅ Le certificat SSL existe déjà !"
    echo "   Pour le renouveler, utilisez: certbot renew"
    exit 0
fi

echo "⏸️  Arrêt temporaire du frontend pour libérer le port 80..."
docker compose -f docker-compose.sqlite.yml stop frontend

# Attendre que le port soit libéré
sleep 2

echo "🔐 Obtention du certificat SSL avec Certbot..."
certbot certonly --standalone \
  --preferred-challenges http \
  -d ease-dom.fr \
  -d www.ease-dom.fr \
  --email issouf.fof0@gmail.com \
  --agree-tos \
  --non-interactive

# Vérifier si le certificat a été obtenu
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "✅ Certificat SSL obtenu avec succès !"
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    
    echo ""
    echo "✅ Frontend redémarré"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Vérifiez que le DNS pointe vers ce serveur (76.13.56.224)"
    echo "   2. Exécutez: ./enable_https.sh pour activer HTTPS"
else
    echo "❌ Erreur: Le certificat n'a pas pu être obtenu."
    echo "   Vérifiez que:"
    echo "   - Le DNS pointe vers ce serveur (76.13.56.224)"
    echo "   - Le port 80 est accessible depuis Internet"
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    exit 1
fi
