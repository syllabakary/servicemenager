#!/bin/bash
# Script pour vérifier l'état des conteneurs et afficher les logs

echo "=========================================="
echo "🔍 VÉRIFICATION DE L'ÉTAT DES CONTENEURS"
echo "=========================================="
echo ""

# 1. Vérifier l'état des conteneurs
echo "1️⃣ État des conteneurs Docker :"
echo "----------------------------------------"
docker compose -f docker-compose.sqlite.yml ps
echo ""

# 2. Vérifier si les conteneurs sont en cours d'exécution
echo "2️⃣ Conteneurs en cours d'exécution :"
echo "----------------------------------------"
docker ps --filter "name=servicemenager" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 3. Vérifier les ports ouverts
echo "3️⃣ Ports en écoute sur le serveur :"
echo "----------------------------------------"
netstat -tuln | grep -E ":(80|443|8000)" || ss -tuln | grep -E ":(80|443|8000)"
echo ""

# 4. Vérifier les logs du backend (dernières 50 lignes)
echo "4️⃣ 📋 LOGS DU BACKEND (dernières 50 lignes) :"
echo "=========================================="
docker compose -f docker-compose.sqlite.yml logs --tail=50 backend
echo ""

# 5. Vérifier les logs du frontend (dernières 50 lignes)
echo "5️⃣ 📋 LOGS DU FRONTEND (dernières 50 lignes) :"
echo "=========================================="
docker compose -f docker-compose.sqlite.yml logs --tail=50 frontend
echo ""

# 6. Vérifier les erreurs récentes
echo "6️⃣ ⚠️ ERREURS RÉCENTES :"
echo "=========================================="
docker compose -f docker-compose.sqlite.yml logs --tail=100 | grep -i "error\|exception\|failed\|traceback" | tail -20
echo ""

echo "=========================================="
echo "✅ Vérification terminée"
echo "=========================================="

