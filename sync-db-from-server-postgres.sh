#!/bin/bash
# Récupère la base PostgreSQL du serveur et la restaure en local.
# À lancer depuis la racine du projet (machine locale). Prérequis : SSH vers le serveur, Docker en local.
# Usage : ./sync-db-from-server-postgres.sh

set -e

USER="root"
HOST="76.13.56.224"
SERVER_PATH="/opt/servicemenager"
DB_NAME="${DB_NAME:-servicemenager}"
DB_USER="${DB_USER:-postgres}"
DUMP_FILE="backend/dump_server.sql"

echo "1/3 Dump de la base sur le serveur ($USER@$HOST)..."
mkdir -p backend
ssh "$USER@$HOST" "cd $SERVER_PATH && docker compose exec -T db pg_dump -U $DB_USER $DB_NAME" > "$DUMP_FILE"
echo "    Sauvegardé dans $DUMP_FILE"

echo "2/3 Recréation de la base locale..."
docker compose exec -T db psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker compose exec -T db psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

echo "3/3 Restauration dans le conteneur local..."
# Retirer la ligne \restrict (pg_dump récent) pour éviter erreur psql en local
grep -v '^\\restrict' "$DUMP_FILE" | docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1

echo "4/4 Redémarrage du backend..."
docker compose restart backend

echo "Terminé. Ta base locale est maintenant une copie de celle du serveur."
