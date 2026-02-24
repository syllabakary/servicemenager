#!/bin/bash
# Test 413 : vérifier si les gros body sont acceptés.
# À exécuter SUR LE SERVEUR (cd /opt/servicemenager).

set -e
echo "=== Test 413 (upload) ==="
echo ""

# Fichier test 2 Mo
dd if=/dev/zero of=/tmp/test_upload.bin bs=1M count=2 2>/dev/null
echo "1. Fichier test créé : 2 Mo"
echo ""

# Test direct vers le backend (sans passer par le proxy HTTPS de l'hôte)
echo "2. Test POST vers backend (localhost:8000)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/services/ \
  -H "Content-Type: multipart/form-data" \
  -F "name=Test413" \
  -F "slug=test-413" \
  -F "short_description=Test" \
  -F "category=1" \
  -F "image=@/tmp/test_upload.bin" 2>/dev/null || echo "000")
echo "   Réponse HTTP: $CODE"
if [ "$CODE" = "413" ]; then
  echo "   -> 413 sur le backend. Vérifier Django (DATA_UPLOAD_MAX_MEMORY_SIZE) et le conteneur."
elif [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
  echo "   -> Pas 413 : le backend accepte la taille. Le 413 en prod vient du proxy HTTPS sur l'hôte."
else
  echo "   -> Code $CODE (401/403 = auth manquante, normal). Pas 413 = backend OK."
fi
echo ""

# Test vers le frontend (port 80)
echo "3. Test POST vers frontend (localhost:80/api/)..."
CODE2=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:80/api/services/ \
  -F "name=Test413" \
  -F "slug=test-413" \
  -F "short_description=Test" \
  -F "category=1" \
  -F "image=@/tmp/test_upload.bin" 2>/dev/null || echo "000")
echo "   Réponse HTTP: $CODE2"
if [ "$CODE2" = "413" ]; then
  echo "   -> 413 au niveau du conteneur frontend. Rebuild: docker compose build frontend --no-cache && docker compose up -d frontend"
else
  echo "   -> Pas 413 : Nginx frontend OK."
fi
echo ""

rm -f /tmp/test_upload.bin
echo "Si les deux tests ne renvoient pas 413, le 413 en production vient du reverse proxy HTTPS sur l'hôte."
echo "Voir FIX_413_REVERSE_PROXY.md pour ajouter client_max_body_size 200M; dans la config Nginx de l'hôte."
