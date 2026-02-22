#!/bin/bash
# Récupère la base de données du serveur vers ta machine locale.
# À lancer depuis la racine du projet. Après ça tu as la même base qu'en prod.
# Usage : ./sync-db-from-server.sh

set -e

USER="root"
HOST="76.13.56.224"
SERVER_PATH="/opt/servicemenager"
DB_FILE="backend/db.sqlite3"

mkdir -p backend
echo "Téléchargement de la base depuis $USER@$HOST..."
scp "$USER@$HOST:$SERVER_PATH/backend/db.sqlite3" "$DB_FILE"
echo "Terminé. Tu as maintenant $DB_FILE (copie du serveur)."
