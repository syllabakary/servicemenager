#!/bin/bash
# Script pour résoudre le conflit Git et récupérer les fichiers

cd /opt/servicemenager

echo "🔧 Résolution du conflit Git..."
echo "=========================================="

# Sauvegarder les modifications locales si nécessaire
if [ -f "enable_https.sh" ]; then
    echo "📦 Sauvegarde de enable_https.sh..."
    cp enable_https.sh enable_https.sh.local-backup
fi

# Stash les modifications locales
echo "💾 Mise en stash des modifications locales..."
git stash

# Récupérer les dernières modifications
echo "⬇️  Récupération des modifications depuis GitHub..."
git pull origin youssef-dev

# Appliquer les modifications stashées si nécessaire (optionnel)
# git stash pop

echo "✅ Conflit résolu !"
echo ""
echo "📝 Fichiers disponibles:"
ls -la *.sh 2>/dev/null || echo "Aucun script trouvé"



