#!/bin/bash
# Active HTTPS avec la stack PostgreSQL (docker-compose.yml).
# Même effet que enable_https_multi.sh mais pour PostgreSQL au lieu de SQLite.
# Prérequis : certificat déjà obtenu (obtain_certificate_multi.sh) et docker-compose.yml avec 443 + volumes letsencrypt.

echo "🔒 Activation HTTPS — stack PostgreSQL"
echo "========================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
# Sur le serveur, souvent /opt/servicemenager
if [ -d /opt/servicemenager ] && [ -f /opt/servicemenager/docker-compose.yml ]; then
    cd /opt/servicemenager
fi

if [ ! -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "❌ Certificat SSL introuvable. Exécutez d'abord: ./obtain_certificate_multi.sh"
    exit 1
fi
echo "✅ Certificat SSL trouvé"

cp frontend/nginx.conf frontend/nginx.conf.http-backup 2>/dev/null || true

cat > /tmp/nginx_https_config.txt << 'EOF'
server {
    listen 80;
    server_name ease-dom.fr www.ease-dom.fr ease-dom.net ease-dom.com 76.13.56.224;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}
server {
    listen 443 ssl;
    http2 on;
    server_name ease-dom.fr www.ease-dom.fr ease-dom.net ease-dom.com;
    ssl_certificate /etc/letsencrypt/live/ease-dom.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ease-dom.fr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    root /usr/share/nginx/html;
    index index.html;
    client_max_body_size 200M;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_request_buffering off;
        client_max_body_size 200M;
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        if ($request_method = OPTIONS) { return 204; }
    }
    location /media/ {
        root /;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location /static/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

cp /tmp/nginx_https_config.txt frontend/nginx.conf
echo "✅ Nginx configuré pour HTTPS (multi-domaines)"

echo "🔄 Reconstruction du frontend..."
docker compose build frontend --no-cache
echo "🔄 Redémarrage des conteneurs..."
docker compose up -d

echo ""
echo "✅ HTTPS activé (stack PostgreSQL)."
echo "   https://ease-dom.fr  https://ease-dom.net  https://ease-dom.com"
echo "   HTTP redirige vers HTTPS."
