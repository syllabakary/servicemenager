#!/bin/bash
# Copie la base de données locale (backend/db.sqlite3) vers le serveur.
# À lancer depuis votre MACHINE LOCALE.
# Usage : ./sync-db-to-server.sh

set -e

USER="root"
HOST="76.13.56.224"
SERVER_PATH="/opt/servicemenager"

DB_FILE="backend/db.sqlite3"
if [ ! -f "$DB_FILE" ]; then
    echo "Erreur: $DB_FILE introuvable. Lancez ce script depuis la racine du projet."
    exit 1
fi

echo "Envoi de la base locale vers $USER@$HOST:$SERVER_PATH/backend/"
echo "La base actuelle sur le serveur sera remplacée (une sauvegarde sera faite côté serveur)."
read -p "Continuer ? (o/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[oOyY]$ ]]; then
    exit 0
fi

# Sauvegarde sur le serveur puis copie
ssh "$USER@$HOST" "cd $SERVER_PATH/backend && cp -f db.sqlite3 db.sqlite3.backup.\$(date +%Y%m%d_%H%M) 2>/dev/null || true"
scp "$DB_FILE" "$USER@$HOST:$SERVER_PATH/backend/db.sqlite3"

echo "Base copiée. Redémarrage du backend..."
ssh "$USER@$HOST" "cd $SERVER_PATH && docker compose -f docker-compose.sqlite.yml restart backend"

echo "Terminé. Le site utilise maintenant la même base que en local."
