#!/bin/bash
# Script pour démarrer les services

echo "🚀 Démarrage des services..."

cd /opt/servicemenager

# 1. Vérifier si les conteneurs sont déjà en cours d'exécution
if docker compose -f docker-compose.sqlite.yml ps | grep -q "Up"; then
    echo "⚠️  Des conteneurs sont déjà en cours d'exécution"
    echo "Voulez-vous les redémarrer ? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        echo "🔄 Redémarrage des conteneurs..."
        docker compose -f docker-compose.sqlite.yml down
    else
        echo "✅ Les conteneurs sont déjà démarrés"
        exit 0
    fi
fi

# 2. Démarrer les conteneurs
echo "▶️  Démarrage des conteneurs..."
docker compose -f docker-compose.sqlite.yml up -d

# 3. Attendre quelques secondes
echo "⏳ Attente du démarrage (10 secondes)..."
sleep 10

# 4. Afficher l'état
echo ""
echo "📊 État des conteneurs :"
docker compose -f docker-compose.sqlite.yml ps

# 5. Afficher les logs récents
echo ""
echo "📋 Logs récents du backend :"
docker compose -f docker-compose.sqlite.yml logs --tail=20 backend

echo ""
echo "📋 Logs récents du frontend :"
docker compose -f docker-compose.sqlite.yml logs --tail=20 frontend

echo ""
echo "✅ Services démarrés !"
echo "🌐 Accédez à : http://76.13.56.224 ou http://ease-dom.fr"



