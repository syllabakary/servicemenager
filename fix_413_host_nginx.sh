#!/bin/bash
# À exécuter SUR LE SERVEUR en root (ou avec sudo).
# Ajoute client_max_body_size 200M dans la config Nginx de l'hôte qui fait le proxy HTTPS vers Docker.
# Utilisation: sudo ./fix_413_host_nginx.sh

set -e
CONF_DIRS="/etc/nginx/sites-enabled /etc/nginx/sites-available /etc/nginx/conf.d /etc/nginx"
TARGET=""
# 1) Chercher un fichier avec ease-dom ou proxy_pass
for d in $CONF_DIRS; do
  [ -d "$d" ] || continue
  for f in "$d"/*; do
    [ -f "$f" ] || continue
    if grep -q -E "ease-dom|proxy_pass|listen.*443" "$f" 2>/dev/null; then
      TARGET="$f"
      break 2
    fi
  done
done
# 2) Si rien, prendre le premier fichier .conf avec proxy_pass (config proxy générique)
if [ -z "$TARGET" ]; then
  for d in $CONF_DIRS; do
    [ -d "$d" ] || continue
    for f in "$d"/*.conf "$d"/*; do
      [ -f "$f" ] || continue
      if grep -q "proxy_pass" "$f" 2>/dev/null; then
        TARGET="$f"
        break 2
      fi
    done
  done
fi

if [ -z "$TARGET" ]; then
  echo "Aucun fichier Nginx trouvé contenant ease-dom ou proxy_pass."
  echo "Lancez le diagnostic pour voir quel service fait le proxy (Nginx ou Apache) :"
  echo "  sudo ./find_proxy_config.sh"
  echo "Puis cherchez à la main :"
  echo "  grep -r -E 'ease-dom|proxy_pass' /etc/nginx/ /etc/httpd/ /etc/apache2/"
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
