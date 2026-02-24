#!/bin/bash
# À exécuter SUR LE SERVEUR en root (ou avec sudo).
# Ajoute LimitRequestBody 209715200 (200 Mo) dans le VirtualHost Apache qui proxy vers Docker.
# Utilisation: sudo ./fix_413_host_apache.sh

set -e
CONF_DIRS="/etc/httpd/conf.d /etc/httpd/conf /etc/apache2/sites-enabled /etc/apache2/sites-available"
TARGET=""
for d in $CONF_DIRS; do
  [ -d "$d" ] || continue
  for f in "$d"/*.conf "$d"/*; do
    [ -f "$f" ] || continue
    if grep -q -E "ease-dom|ProxyPass|VirtualHost.*443" "$f" 2>/dev/null; then
      TARGET="$f"
      break 2
    fi
  done
done

if [ -z "$TARGET" ]; then
  echo "Aucun fichier Apache trouvé. Lancez le diagnostic : sudo ./find_proxy_config.sh"
  exit 1
fi

echo "Fichier Apache trouvé: $TARGET"
if grep -q "LimitRequestBody 209715200" "$TARGET"; then
  echo "LimitRequestBody 209715200 est déjà présent. Rien à faire."
  exit 0
fi

# Backup
cp "$TARGET" "${TARGET}.bak.$(date +%Y%m%d%H%M%S)"
echo "Sauvegarde créée: ${TARGET}.bak.*"

# Ajouter dans le premier VirtualHost qui contient 443
if grep -q "<VirtualHost.*443" "$TARGET"; then
  sed -i '0,/\(<VirtualHost.*443[^>]*>\)/s//\1\n    LimitRequestBody 209715200/' "$TARGET"
  echo "Ajout: LimitRequestBody 209715200 dans le VirtualHost 443."
else
  # Sinon après la première ligne <VirtualHost
  sed -i '0,/<VirtualHost/s/<VirtualHost/\n    LimitRequestBody 209715200\n<VirtualHost/' "$TARGET"
  echo "Ajout: LimitRequestBody 209715200."
fi

echo ""
echo "Rechargement d'Apache..."
if systemctl reload httpd 2>/dev/null; then
  echo "httpd rechargé."
elif systemctl reload apache2 2>/dev/null; then
  echo "apache2 rechargé."
else
  echo "Rechargez manuellement: systemctl reload httpd ou systemctl reload apache2"
fi
echo "Terminé. Retestez un upload sur https://ease-dom.fr"