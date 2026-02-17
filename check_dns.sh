#!/bin/bash
# Script pour vérifier la configuration DNS

echo "🔍 Vérification de la configuration DNS"
echo "=========================================="
echo ""

echo "1️⃣ Vérification de ease-dom.fr :"
echo "----------------------------------------"
dig ease-dom.fr +short
echo ""

echo "2️⃣ Vérification de www.ease-dom.fr :"
echo "----------------------------------------"
dig www.ease-dom.fr +short
echo ""

echo "3️⃣ Vérification avec plus de détails :"
echo "----------------------------------------"
echo "ease-dom.fr :"
dig ease-dom.fr A +noall +answer
echo ""
echo "www.ease-dom.fr :"
dig www.ease-dom.fr A +noall +answer
echo ""

echo "4️⃣ Vérification de l'IP attendue :"
echo "----------------------------------------"
echo "IP attendue : 76.13.56.224"
echo ""

# Vérifier si les DNS pointent vers la bonne IP
EASE_IP=$(dig ease-dom.fr +short | head -1)
WWW_IP=$(dig www.ease-dom.fr +short | head -1)

if [ "$EASE_IP" = "76.13.56.224" ]; then
    echo "✅ ease-dom.fr pointe vers la bonne IP (76.13.56.224)"
else
    echo "❌ ease-dom.fr pointe vers $EASE_IP (attendu: 76.13.56.224)"
fi

if [ "$WWW_IP" = "76.13.56.224" ]; then
    echo "✅ www.ease-dom.fr pointe vers la bonne IP (76.13.56.224)"
else
    echo "❌ www.ease-dom.fr pointe vers $WWW_IP (attendu: 76.13.56.224)"
fi

echo ""
echo "📝 Instructions :"
echo "   Si les DNS ne pointent pas vers 76.13.56.224, vous devez :"
echo "   1. Aller dans votre espace client Viaduc"
echo "   2. Modifier les enregistrements DNS pour pointer vers 76.13.56.224"
echo "   3. Attendre 5-30 minutes pour la propagation"
echo "   4. Réessayer d'obtenir le certificat"

