#!/bin/bash
# Copie le dossier media (logos, images agences) vers le serveur.
# À lancer depuis votre MACHINE LOCALE (où les fichiers existent), pas sur le serveur.
#
# Prérequis : SSH configuré vers le serveur (clé ou mot de passe).
# Usage :
#   1. Modifier USER, HOST et SERVER_PATH ci-dessous
#   2. Depuis la racine du projet : ./sync-media-to-server.sh

set -e

# --- À ADAPTER ---
USER="root"                                    # ou votre user SSH
HOST="76.13.56.224"                            # ou ease-dom.fr
SERVER_PATH="/opt/servicemenager"              # chemin du projet sur le serveur (sans /backend)

# Chemins
MEDIA_DIR="backend/media"
if [ ! -d "$MEDIA_DIR" ]; then
    echo "Erreur: $MEDIA_DIR introuvable. Lancez ce script depuis la racine du projet."
    exit 1
fi

echo "Envoi de $MEDIA_DIR vers $USER@$HOST:$SERVER_PATH/backend/"
echo "Les fichiers existants sur le serveur seront mis à jour."
read -p "Continuer ? (o/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[oOyY]$ ]]; then
    exit 0
fi

# Créer le dossier backend sur le serveur si besoin, puis copier media
ssh "$USER@$HOST" "mkdir -p $SERVER_PATH/backend"
scp -r "$MEDIA_DIR" "$USER@$HOST:$SERVER_PATH/backend/"

echo "Terminé. Les images (logo, agences) devraient maintenant s'afficher sur le site."
