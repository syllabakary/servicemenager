#!/bin/bash
# Script pour résoudre les conflits et récupérer les fichiers

cd /opt/servicemenager

echo "🔧 Résolution du conflit Git..."
echo "=========================================="

# Sauvegarder les modifications locales si nécessaire
if [ -f "check_dns.sh" ]; then
    echo "📦 Sauvegarde de check_dns.sh..."
    cp check_dns.sh check_dns.sh.local-backup
fi

# Stash les modifications locales
echo "💾 Mise en stash des modifications locales..."
git stash

# Récupérer les dernières modifications
echo "⬇️  Récupération des modifications depuis GitHub..."
git pull origin youssef-dev

echo "✅ Conflit résolu !"
echo ""
echo "📝 Fichiers disponibles:"
ls -la *.sh 2>/dev/null | grep -E "(check_dns|obtain_certificate|enable_https)" || echo "Scripts trouvés"

