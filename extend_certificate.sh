#!/bin/bash
# Script pour étendre le certificat SSL existant avec de nouveaux domaines

echo "🔒 Extension du certificat SSL existant"
echo "=========================================="

cd /opt/servicemenager

# Vérifier si le certificat existe
if [ ! -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "❌ Erreur: Aucun certificat SSL trouvé."
    echo "   Obtenez d'abord un certificat avec: ./obtain_certificate_smart.sh"
    exit 1
fi

echo "✅ Certificat existant trouvé pour ease-dom.fr"
echo ""

# Liste des domaines à inclure
DOMAINS=("ease-dom.fr" "www.ease-dom.fr" "ease-dom.net" "ease-dom.com")
EXPECTED_IP="76.13.56.224"
VALID_DOMAINS=()

echo "🔍 Vérification du DNS pour tous les domaines..."
echo ""

for domain in "${DOMAINS[@]}"; do
    DOMAIN_IP=$(dig "$domain" +short | head -1)
    if [ "$DOMAIN_IP" = "$EXPECTED_IP" ]; then
        echo "✅ $domain → $DOMAIN_IP (OK)"
        VALID_DOMAINS+=("$domain")
    else
        echo "❌ $domain → $DOMAIN_IP (attendu: $EXPECTED_IP) - IGNORÉ"
    fi
done

echo ""

if [ ${#VALID_DOMAINS[@]} -eq 0 ]; then
    echo "❌ Erreur: Aucun domaine valide trouvé"
    exit 1
fi

echo "✅ Domaines valides à inclure: ${VALID_DOMAINS[*]}"
echo ""

# Vérifier quels domaines sont déjà dans le certificat
CURRENT_DOMAINS=$(certbot certificates 2>/dev/null | grep -A 10 "ease-dom.fr" | grep "Domains:" | sed 's/Domains: //' | tr ',' ' ')

echo "📋 Domaines actuellement dans le certificat: $CURRENT_DOMAINS"
echo ""

read -p "Voulez-vous étendre le certificat avec les domaines valides ? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo "⏸️  Arrêt temporaire du frontend pour libérer le port 80..."
docker compose -f docker-compose.sqlite.yml stop frontend

# Attendre que le port soit libéré
sleep 2

echo "🔐 Extension du certificat SSL avec Certbot..."
echo "   Domaines: ${VALID_DOMAINS[*]}"
echo ""

# Construire la commande certbot avec --expand
CERTBOT_CMD="certbot certonly --standalone --preferred-challenges http --expand"
for domain in "${VALID_DOMAINS[@]}"; do
    CERTBOT_CMD="$CERTBOT_CMD -d $domain"
done
CERTBOT_CMD="$CERTBOT_CMD --email issouf.fof0@gmail.com --agree-tos --non-interactive"

# Exécuter la commande
echo "🔐 Commande: $CERTBOT_CMD"
echo ""
eval $CERTBOT_CMD

# Vérifier si le certificat a été étendu
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo ""
    echo "✅ Certificat SSL étendu avec succès !"
    echo ""
    
    # Afficher les domaines dans le certificat
    echo "📋 Domaines dans le certificat:"
    certbot certificates 2>/dev/null | grep -A 10 "ease-dom.fr" | grep "Domains:" || echo "   (vérification en cours...)"
    echo ""
    
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    
    echo ""
    echo "✅ Frontend redémarré"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Reconstruire le frontend: docker compose -f docker-compose.sqlite.yml build frontend"
    echo "   2. Redémarrer: docker compose -f docker-compose.sqlite.yml up -d"
    echo "   3. Redémarrer le backend: docker compose -f docker-compose.sqlite.yml restart backend"
else
    echo ""
    echo "❌ Erreur: Le certificat n'a pas pu être étendu."
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    exit 1
fi

