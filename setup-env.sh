#!/bin/bash

# Script pour créer .env depuis .env.example sur le serveur
# Usage: ./setup-env.sh

if [ ! -f .env.example ]; then
    echo "❌ Erreur: .env.example n'existe pas"
    exit 1
fi

if [ -f .env ]; then
    echo "⚠️  Le fichier .env existe déjà"
    read -p "Voulez-vous le remplacer? (o/N): " response
    if [[ ! "$response" =~ ^[Oo]$ ]]; then
        echo "Annulé"
        exit 0
    fi
fi

# Copier .env.example vers .env
cp .env.example .env

echo "✅ Fichier .env créé depuis .env.example"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Éditer .env: nano .env"
echo "   2. Générer SECRET_KEY: python3 -c \"import secrets; print(secrets.token_urlsafe(50))\""
echo "   3. Modifier SECRET_KEY dans .env"
echo ""



