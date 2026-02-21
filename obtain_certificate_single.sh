#!/bin/bash
# Script pour obtenir le certificat SSL uniquement pour ease-dom.fr (sans www)
# Utilisez ce script si www.ease-dom.fr ne pointe pas encore vers votre serveur

echo "🔒 Obtention du certificat SSL pour ease-dom.fr (sans www)"
echo "=========================================="

cd /opt/servicemenager

# Vérifier si le certificat existe déjà
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "✅ Le certificat SSL existe déjà !"
    echo "   Pour le renouveler, utilisez: certbot renew"
    exit 0
fi

# Vérifier que ease-dom.fr pointe vers ce serveur
EASE_IP=$(dig ease-dom.fr +short | head -1)
if [ "$EASE_IP" != "76.13.56.224" ]; then
    echo "❌ Erreur: ease-dom.fr ne pointe pas vers ce serveur"
    echo "   IP actuelle: $EASE_IP"
    echo "   IP attendue: 76.13.56.224"
    echo ""
    echo "   Configurez d'abord le DNS dans Viaduc pour pointer vers 76.13.56.224"
    exit 1
fi

echo "✅ ease-dom.fr pointe vers la bonne IP (76.13.56.224)"

echo "⏸️  Arrêt temporaire du frontend pour libérer le port 80..."
docker compose -f docker-compose.sqlite.yml stop frontend

# Attendre que le port soit libéré
sleep 2

echo "🔐 Obtention du certificat SSL avec Certbot (uniquement pour ease-dom.fr)..."
certbot certonly --standalone \
  --preferred-challenges http \
  -d ease-dom.fr \
  --email issouf.fof0@gmail.com \
  --agree-tos \
  --non-interactive

# Vérifier si le certificat a été obtenu
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "✅ Certificat SSL obtenu avec succès pour ease-dom.fr !"
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    
    echo ""
    echo "✅ Frontend redémarré"
    echo ""
    echo "📝 Note: Le certificat est uniquement pour ease-dom.fr"
    echo "   Pour ajouter www.ease-dom.fr plus tard, utilisez:"
    echo "   certbot certonly --standalone -d ease-dom.fr -d www.ease-dom.fr --expand"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Exécutez: ./enable_https.sh pour activer HTTPS"
    echo "   2. Une fois www.ease-dom.fr configuré, vous pourrez étendre le certificat"
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



