#!/bin/bash
# Script intelligent pour obtenir le certificat SSL uniquement pour les domaines configurés

echo "🔒 Obtention intelligente du certificat SSL"
echo "=========================================="

cd /opt/servicemenager

EXPECTED_IP="76.13.56.224"
DOMAINS=("ease-dom.fr" "www.ease-dom.fr" "ease-dom.net" "ease-dom.com")
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
    echo "❌ Erreur: Aucun domaine ne pointe vers ce serveur ($EXPECTED_IP)"
    echo ""
    echo "📝 Instructions pour configurer le DNS:"
    echo "   1. Allez dans votre espace client Viaduc (ou votre registrar)"
    echo "   2. Pour chaque domaine, créez/modifiez les enregistrements DNS:"
    echo "      - Type: A, Nom: @ (ou laissez vide), Valeur: $EXPECTED_IP"
    echo "      - Type: A, Nom: www, Valeur: $EXPECTED_IP"
    echo "   3. Attendez 5-30 minutes pour la propagation DNS"
    echo "   4. Réessayez ce script"
    exit 1
fi

echo "✅ Domaines valides détectés: ${VALID_DOMAINS[*]}"
echo ""

# Vérifier si le certificat existe déjà
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "⚠️  Un certificat existe déjà pour ease-dom.fr"
    read -p "Voulez-vous le renouveler/étendre avec les domaines valides ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo "⏸️  Arrêt temporaire du frontend pour libérer le port 80..."
docker compose -f docker-compose.sqlite.yml stop frontend

# Attendre que le port soit libéré
sleep 2

echo "🔐 Obtention du certificat SSL avec Certbot pour les domaines valides..."
echo "   Domaines: ${VALID_DOMAINS[*]}"
echo ""

# Construire la commande certbot avec les domaines valides
CERTBOT_CMD="certbot certonly --standalone --preferred-challenges http"
for domain in "${VALID_DOMAINS[@]}"; do
    CERTBOT_CMD="$CERTBOT_CMD -d $domain"
done
CERTBOT_CMD="$CERTBOT_CMD --email issouf.fof0@gmail.com --agree-tos --non-interactive"

# Exécuter la commande
eval $CERTBOT_CMD

# Vérifier si le certificat a été obtenu
if [ -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo ""
    echo "✅ Certificat SSL obtenu avec succès pour: ${VALID_DOMAINS[*]}"
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    
    echo ""
    echo "✅ Frontend redémarré"
    echo ""
    
    if [ ${#VALID_DOMAINS[@]} -lt ${#DOMAINS[@]} ]; then
        echo "⚠️  Note: Certains domaines n'ont pas été inclus dans le certificat:"
        for domain in "${DOMAINS[@]}"; do
            if [[ ! " ${VALID_DOMAINS[@]} " =~ " ${domain} " ]]; then
                echo "   - $domain (DNS non configuré)"
            fi
        done
        echo ""
        echo "📝 Pour ajouter ces domaines plus tard:"
        echo "   1. Configurez le DNS pour qu'ils pointent vers $EXPECTED_IP"
        echo "   2. Attendez la propagation DNS"
        echo "   3. Exécutez: certbot certonly --standalone --expand -d ease-dom.fr -d www.ease-dom.fr -d ease-dom.net -d ease-dom.com"
    fi
    
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Exécutez: ./enable_https_multi.sh pour activer HTTPS"
    echo "   2. Redémarrez le backend: docker compose -f docker-compose.sqlite.yml restart backend"
else
    echo ""
    echo "❌ Erreur: Le certificat n'a pas pu être obtenu."
    echo "   Vérifiez que:"
    echo "   - Les domaines pointent vers ce serveur ($EXPECTED_IP)"
    echo "   - Le port 80 est accessible depuis Internet"
    echo ""
    echo "▶️  Redémarrage du frontend..."
    docker compose -f docker-compose.sqlite.yml start frontend
    exit 1
fi

