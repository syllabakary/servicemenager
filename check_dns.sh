#!/bin/bash
# Script pour vérifier la configuration DNS

echo "🔍 Vérification de la configuration DNS"
echo "=========================================="
echo ""

DOMAINS=("ease-dom.fr" "www.ease-dom.fr" "ease-dom.net" "ease-dom.com")
EXPECTED_IP="76.13.56.224"

echo "1️⃣ Vérification de tous les domaines :"
echo "----------------------------------------"
for domain in "${DOMAINS[@]}"; do
    IP=$(dig "$domain" +short | head -1)
    echo "$domain → $IP"
done
echo ""

echo "2️⃣ Vérification avec plus de détails :"
echo "----------------------------------------"
for domain in "${DOMAINS[@]}"; do
    echo "$domain :"
    dig "$domain" A +noall +answer
    echo ""
done

echo "3️⃣ Vérification de l'IP attendue :"
echo "----------------------------------------"
echo "IP attendue : $EXPECTED_IP"
echo ""

# Vérifier si les DNS pointent vers la bonne IP
VALID_DOMAINS=()
INVALID_DOMAINS=()

for domain in "${DOMAINS[@]}"; do
    DOMAIN_IP=$(dig "$domain" +short | head -1)
    if [ "$DOMAIN_IP" = "$EXPECTED_IP" ]; then
        echo "✅ $domain pointe vers la bonne IP ($EXPECTED_IP)"
        VALID_DOMAINS+=("$domain")
    else
        echo "❌ $domain pointe vers $DOMAIN_IP (attendu: $EXPECTED_IP)"
        INVALID_DOMAINS+=("$domain")
    fi
done

echo ""
echo "📊 Résumé :"
echo "   Domaines valides : ${#VALID_DOMAINS[@]}"
echo "   Domaines invalides : ${#INVALID_DOMAINS[@]}"

echo ""
echo "📝 Instructions :"
echo "   Si les DNS ne pointent pas vers 76.13.56.224, vous devez :"
echo "   1. Aller dans votre espace client Viaduc"
echo "   2. Modifier les enregistrements DNS pour pointer vers 76.13.56.224"
echo "   3. Attendre 5-30 minutes pour la propagation"
echo "   4. Réessayer d'obtenir le certificat"

