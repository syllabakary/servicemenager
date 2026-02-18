#!/bin/bash
# Script pour obtenir le certificat SSL pour plusieurs domaines
# Domaines: ease-dom.fr, www.ease-dom.fr, ease-dom.net, ease-dom.com

echo "🔒 Obtention du certificat SSL multi-domaines"
echo "=========================================="

cd /opt/servicemenager

# Liste des domaines
DOMAINS=("ease-dom.fr" "www.ease-dom.fr" "ease-dom.net" "ease-dom.com")
EXPECTED_IP="76.13.56.224"

echo "📋 Domaines à configurer:"
for domain in "${DOMAINS[@]}"; do
    echo "   - $domain"
done
echo ""

# Vérifier que tous les domaines pointent vers ce serveur
echo "🔍 Vérification du DNS pour tous les domaines..."
ALL_VALID=true

for domain in "${DOMAINS[@]}"; do
    DOMAIN_IP=$(dig "$domain" +short | head -1)
    if [ "$DOMAIN_IP" = "$EXPECTED_IP" ]; then
        echo "✅ $domain → $DOMAIN_IP (OK)"
    else
        echo "❌ $domain → $DOMAIN_IP (attendu: $EXPECTED_IP)"
        ALL_VALID=false
    fi
done

echo ""

if [ "$ALL_VALID" = false ]; then
    echo "⚠️  Attention: Certains domaines ne pointent pas vers ce serveur"
    echo ""
    echo "📝 Instructions pour configurer le DNS:"
    echo "   1. Allez dans votre espace client Viaduc (ou votre registrar)"
    echo "   2. Pour chaque domaine, créez/modifiez les enregistrements DNS:"
    echo ""
    for domain in "${DOMAINS[@]}"; do
        if [[ "$domain" == www.* ]]; then
            echo "      - Type: A, Nom: www, Valeur: $EXPECTED_IP"
        else
            echo "      - Type: A, Nom: @ (ou laissez vide), Valeur: $EXPECTED_IP"
        fi
    done
    echo ""
    echo "   3. Attendez 5-30 minutes pour la propagation DNS"
    echo "   4. Réessayez ce script"
    echo ""
    read -p "Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Vérifier si le certificat existe déjà
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "⚠️  Un certificat existe déjà pour ease-dom.fr"
    read -p "Voulez-vous le renouveler/étendre avec les nouveaux domaines ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo "⏸️  Arrêt temporaire du frontend pour libérer le port 80..."
docker compose -f docker-compose.sqlite.yml stop frontend

# Attendre que le port soit libéré
sleep 2

echo "🔐 Obtention du certificat SSL avec Certbot pour tous les domaines..."
certbot certonly --standalone \
  --preferred-challenges http \
  -d ease-dom.fr \
  -d www.ease-dom.fr \
  -d ease-dom.net \
  -d ease-dom.com \
  --email issouf.fof0@gmail.com \
  --agree-tos \
  --non-interactive

# Vérifier si le certificat a été obtenu
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "✅ Certificat SSL obtenu avec succès pour tous les domaines !"
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    
    echo ""
    echo "✅ Frontend redémarré"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Exécutez: ./enable_https_multi.sh pour activer HTTPS pour tous les domaines"
else
    echo "❌ Erreur: Le certificat n'a pas pu être obtenu."
    echo "   Vérifiez que:"
    echo "   - Tous les domaines pointent vers ce serveur ($EXPECTED_IP)"
    echo "   - Le port 80 est accessible depuis Internet"
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    exit 1
fi

