#!/bin/bash
# Script pour vérifier et corriger la configuration SSL

echo "🔧 Vérification et correction de la configuration SSL"
echo "=========================================="

cd /opt/servicemenager

# Vérifier que le certificat inclut tous les domaines
echo "1️⃣ Vérification du certificat..."
CERT_DOMAINS=$(certbot certificates 2>/dev/null | grep -A 10 "ease-dom.fr" | grep "Domains:" | sed 's/.*Domains: //')
echo "   Domaines dans le certificat: $CERT_DOMAINS"
echo ""

# Vérifier la configuration Nginx actuelle dans le conteneur
echo "2️⃣ Vérification de la configuration Nginx..."
docker compose -f docker-compose.sqlite.yml exec frontend cat /etc/nginx/conf.d/default.conf | grep -A 1 "server_name" | head -4
echo ""

# Vérifier que le certificat est accessible
echo "3️⃣ Vérification de l'accessibilité du certificat..."
docker compose -f docker-compose.sqlite.yml exec frontend test -f /etc/letsencrypt/live/ease-dom.fr/fullchain.pem && echo "   ✅ Certificat accessible" || echo "   ❌ Certificat non accessible"
docker compose -f docker-compose.sqlite.yml exec frontend test -f /etc/letsencrypt/live/ease-dom.fr/privkey.pem && echo "   ✅ Clé privée accessible" || echo "   ❌ Clé privée non accessible"
echo ""

# Tester HTTPS pour chaque domaine avec SNI
echo "4️⃣ Test HTTPS avec SNI pour chaque domaine..."
for domain in ease-dom.fr ease-dom.net ease-dom.com; do
    echo "   Test $domain:"
    CERT_SUBJECT=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)
    CERT_SAN=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null | grep -A 1 "Subject Alternative Name" | grep "DNS:" | sed 's/.*DNS://g' | tr ',' '\n' | sed 's/^ *//')
    
    if [ -n "$CERT_SUBJECT" ]; then
        echo "      ✅ Certificat reçu"
        echo "      📋 Domaines dans le certificat:"
        echo "$CERT_SAN" | while read line; do
            echo "         - $line"
        done
    else
        echo "      ❌ Aucun certificat reçu"
    fi
    echo ""
done

# Vérifier si la configuration doit être mise à jour
echo "5️⃣ Vérification de la configuration..."
CURRENT_CONFIG=$(docker compose -f docker-compose.sqlite.yml exec frontend cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -c "ease-dom.com")
if [ "$CURRENT_CONFIG" -gt 0 ]; then
    echo "   ✅ Configuration inclut ease-dom.com"
else
    echo "   ❌ Configuration ne inclut pas ease-dom.com"
    echo "   🔄 Mise à jour nécessaire..."
    ./enable_https_multi.sh
fi

echo ""
echo "📝 Note importante sur Let's Encrypt:"
echo "   - Let's Encrypt ne peut PAS fournir de certificats qui expirent en 2030"
echo "   - Les certificats Let's Encrypt expirent après 90 jours"
echo "   - Le renouvellement est AUTOMATIQUE (configuré par Certbot)"
echo "   - Pour un certificat valide jusqu'en 2030, il faut un certificat payant"
echo "   - Les certificats Let's Encrypt sont GRATUITS et renouvelés automatiquement"

