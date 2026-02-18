#!/bin/bash
# Script pour vérifier que HTTPS fonctionne pour tous les domaines

echo "🔍 Vérification HTTPS pour tous les domaines"
echo "=========================================="
echo ""

DOMAINS=("ease-dom.fr" "ease-dom.net" "ease-dom.com")

for domain in "${DOMAINS[@]}"; do
    echo "🔐 Test de $domain..."
    
    # Test HTTPS avec curl
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$domain" 2>/dev/null)
    SSL_VERIFY=$(curl -s -o /dev/null -w "%{ssl_verify_result}" --max-time 5 "https://$domain" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        if [ "$SSL_VERIFY" = "0" ]; then
            echo "   ✅ HTTPS fonctionne (Code: $HTTP_CODE, SSL: OK)"
        else
            echo "   ⚠️  HTTPS répond mais certificat non vérifié (Code: $HTTP_CODE, SSL Error: $SSL_VERIFY)"
        fi
    else
        echo "   ❌ HTTPS ne fonctionne pas (Code: $HTTP_CODE)"
    fi
    
    # Vérifier le certificat
    CERT_DOMAINS=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null | grep -A 1 "Subject Alternative Name" | grep "DNS:" | sed 's/.*DNS://g' | tr ',' '\n' | sed 's/^ *//')
    
    if [ -n "$CERT_DOMAINS" ]; then
        echo "   📋 Domaines dans le certificat:"
        echo "$CERT_DOMAINS" | while read line; do
            echo "      - $line"
        done
    fi
    
    echo ""
done

echo "📝 Vérification dans le conteneur:"
echo "----------------------------------------"
echo "Configuration Nginx:"
docker compose -f docker-compose.sqlite.yml exec frontend cat /etc/nginx/conf.d/default.conf | grep "server_name" | head -2
echo ""
echo "Port 443 en écoute:"
docker compose -f docker-compose.sqlite.yml exec frontend netstat -tuln 2>/dev/null | grep 443 || ss -tuln 2>/dev/null | grep 443
echo ""
echo "Certificat accessible:"
docker compose -f docker-compose.sqlite.yml exec frontend ls -la /etc/letsencrypt/live/ease-dom.fr/ 2>/dev/null | grep -E "(fullchain|privkey)" || echo "   ❌ Certificat non trouvé dans le conteneur"

