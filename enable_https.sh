#!/bin/bash
# Script pour activer HTTPS après obtention du certificat SSL

echo "🔒 Activation de HTTPS pour ease-dom.fr"
echo "=========================================="

cd /opt/servicemenager

# Vérifier si le certificat existe
if [ ! -f "/etc/letsencrypt/live/ease-dom.fr/fullchain.pem" ]; then
    echo "❌ Erreur: Le certificat SSL n'existe pas encore."
    echo "   Obtenez d'abord le certificat avec:"
    echo "   certbot certonly --standalone -d ease-dom.fr -d www.ease-dom.fr"
    exit 1
fi

echo "✅ Certificat SSL trouvé"

# Créer une sauvegarde de la configuration actuelle
cp frontend/nginx.conf frontend/nginx.conf.http-backup

# Modifier nginx.conf pour activer HTTPS
# Remplacer le bloc HTTP par une version qui redirige vers HTTPS
# et décommenter le bloc HTTPS

cat > /tmp/nginx_https_config.txt << 'EOF'
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name ease-dom.fr www.ease-dom.fr 76.13.56.224;
    
    # Pour Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Rediriger tout le reste vers HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name ease-dom.fr www.ease-dom.fr;
    
    # Certificats SSL (montés depuis /etc/letsencrypt)
    ssl_certificate /etc/letsencrypt/live/ease-dom.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ease-dom.fr/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # Servir les fichiers statiques
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    # Cache pour les assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy pour l'API backend
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
    
    # Proxy pour les fichiers media
    location /media/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy pour les fichiers statiques Django
    location /static/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Copier la nouvelle configuration
cp /tmp/nginx_https_config.txt frontend/nginx.conf

# Modifier docker-compose pour activer le port 443 et les volumes SSL
# Créer une sauvegarde
cp docker-compose.sqlite.yml docker-compose.sqlite.yml.backup

# Décommenter le port 443
sed -i 's/^      # - "443:443"/      - "443:443"/' docker-compose.sqlite.yml

# Décommenter le volume SSL
sed -i 's/^      # - \/etc\/letsencrypt:\/etc\/letsencrypt:ro/      - \/etc\/letsencrypt:\/etc\/letsencrypt:ro/' docker-compose.sqlite.yml

echo "✅ Configuration docker-compose mise à jour"

echo "✅ Configuration Nginx mise à jour pour HTTPS"

# Reconstruire et redémarrer le frontend
echo "🔄 Reconstruction du conteneur frontend..."
docker compose -f docker-compose.sqlite.yml build frontend

echo "🔄 Redémarrage des conteneurs..."
docker compose -f docker-compose.sqlite.yml up -d

echo ""
echo "✅ HTTPS activé !"
echo "🌐 Votre site est maintenant accessible sur:"
echo "   - https://ease-dom.fr"
echo "   - https://www.ease-dom.fr"
echo ""
echo "📝 Note: Le HTTP redirige automatiquement vers HTTPS"

