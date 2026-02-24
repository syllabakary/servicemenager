#!/bin/bash
# Diagnostic : trouver quel service fait le proxy HTTPS (port 443/80) et où est sa config.
# À exécuter sur le serveur : sudo ./find_proxy_config.sh

echo "=== Qui écoute sur les ports 80 et 443 ? ==="
for port in 80 443; do
  echo "Port $port:"
  (ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) | grep -E ":$port\s" || true
done

echo ""
echo "=== Fichiers Nginx (recherche ease-dom, proxy_pass, listen 443) ==="
for dir in /etc/nginx/sites-enabled /etc/nginx/sites-available /etc/nginx/conf.d /etc/nginx; do
  [ -d "$dir" ] || continue
  for f in "$dir"/*; do
    [ -f "$f" ] || continue
    if grep -q -E "ease-dom|proxy_pass|listen.*443" "$f" 2>/dev/null; then
      echo "  -> $f"
      grep -n -E "ease-dom|proxy_pass|listen.*443|server_name" "$f" 2>/dev/null | head -20
      echo ""
    fi
  done
done
# Recherche récursive si rien trouvé
if ! grep -r -l -E "ease-dom|proxy_pass" /etc/nginx/ 2>/dev/null | head -1 | grep -q .; then
  echo "  (aucun fichier trouvé dans /etc/nginx/)"
fi

echo ""
echo "=== Fichiers Apache / httpd (recherche ease-dom, ProxyPass, VirtualHost) ==="
for dir in /etc/httpd/conf.d /etc/httpd/conf /etc/apache2/sites-enabled /etc/apache2/sites-available /etc/apache2/conf.d; do
  [ -d "$dir" ] || continue
  for f in "$dir"/*.conf "$dir"/* 2>/dev/null; do
    [ -f "$f" ] || continue
    if grep -q -E "ease-dom|ProxyPass|VirtualHost.*443" "$f" 2>/dev/null; then
      echo "  -> $f"
      grep -n -E "ease-dom|ProxyPass|VirtualHost|ServerName|LimitRequestBody" "$f" 2>/dev/null | head -25
      echo ""
    fi
  done
done

echo ""
echo "=== Résumé : si c'est Nginx, ajoutez client_max_body_size 200M; dans le bloc server puis: nginx -t && systemctl reload nginx ==="
echo "=== Si c'est Apache, ajoutez LimitRequestBody 209715200 dans le VirtualHost puis: systemctl reload httpd (ou apache2) ==="
