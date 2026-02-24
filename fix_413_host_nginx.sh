#!/bin/bash
# À exécuter SUR LE SERVEUR en root (ou avec sudo).
# Ajoute client_max_body_size 200M dans la config Nginx de l'hôte qui fait le proxy HTTPS vers Docker.
# Utilisation: sudo ./fix_413_host_nginx.sh

set -e
CONF_DIRS="/etc/nginx/sites-enabled /etc/nginx/conf.d /etc/nginx"
TARGET=""
for d in $CONF_DIRS; do
  [ -d "$d" ] || continue
  for f in "$d"/*; do
    [ -f "$f" ] || continue
    if grep -q -l "ease-dom\|proxy_pass.*80\|listen.*443" "$f" 2>/dev/null; then
      TARGET="$f"
      break 2
    fi
  done
done

if [ -z "$TARGET" ]; then
  echo "Aucun fichier Nginx trouvé contenant ease-dom ou proxy_pass. Cherchez à la main:"
  echo "  grep -r 'ease-dom\\|proxy_pass' /etc/nginx/"
  exit 1
fi

echo "Fichier Nginx trouvé: $TARGET"
if grep -q "client_max_body_size 200M" "$TARGET"; then
  echo "client_max_body_size 200M est déjà présent. Rien à faire."
  exit 0
fi

# Backup
cp "$TARGET" "${TARGET}.bak.$(date +%Y%m%d%H%M%S)"
echo "Sauvegarde créée: ${TARGET}.bak.*"

# Ajouter une seule fois après la première ligne "server {"
if grep -q "server {" "$TARGET"; then
  sed -i '0,/server {/s/server {/server {\n    client_max_body_size 200M;/' "$TARGET"
  echo "Ajout: client_max_body_size 200M; dans le premier bloc server."
fi

echo ""
echo "Vérification de la config Nginx..."
nginx -t
echo "Rechargement de Nginx..."
systemctl reload nginx
echo "Terminé. Retestez un upload (PATCH/POST avec image) sur https://ease-dom.fr"
