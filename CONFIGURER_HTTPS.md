# Guide de Configuration HTTPS avec Let's Encrypt

## 📋 Prérequis

- Serveur avec accès root
- Domaine `ease-dom.fr` pointant vers l'IP `76.13.56.224`
- Ports 80 et 443 ouverts dans le firewall
- Docker et Docker Compose installés

## 🚀 Étapes de Configuration

### 1. Installer Certbot

Sur votre serveur Rocky Linux :

```bash
# Installer Certbot
dnf install -y certbot python3-certbot-nginx

# Vérifier l'installation
certbot --version
```

### 2. Arrêter temporairement les conteneurs

```bash
cd /opt/servicemenager
docker compose -f docker-compose.sqlite.yml down
```

### 3. Créer un conteneur Nginx temporaire pour la validation

Certbot a besoin d'accéder au port 80 pour valider le domaine. Créez un fichier temporaire :

```bash
cat > /tmp/nginx-temp.conf << 'EOF'
server {
    listen 80;
    server_name ease-dom.fr www.ease-dom.fr;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}
EOF
```

### 4. Obtenir le certificat SSL

```bash
# Créer le dossier pour les challenges
mkdir -p /var/www/certbot

# Obtenir le certificat (mode standalone)
certbot certonly --standalone \
  --preferred-challenges http \
  -d ease-dom.fr \
  -d www.ease-dom.fr \
  --email votre-email@example.com \
  --agree-tos \
  --non-interactive

# Les certificats seront dans :
# /etc/letsencrypt/live/ease-dom.fr/fullchain.pem
# /etc/letsencrypt/live/ease-dom.fr/privkey.pem
```

### 5. Modifier la configuration Nginx pour HTTPS

Mettez à jour `frontend/nginx.conf` pour supporter HTTPS :

```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name ease-dom.fr www.ease-dom.fr;
    
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
    
    # Certificats SSL
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
```

### 6. Modifier docker-compose.sqlite.yml

Ajoutez les volumes pour les certificats SSL et le port 443 :

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-/api}
    container_name: servicemenager_frontend
    ports:
      - "80:80"
      - "443:443"  # Ajouter le port HTTPS
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro  # Monter les certificats SSL
      - /var/www/certbot:/var/www/certbot:ro  # Pour les challenges Let's Encrypt
    depends_on:
      - backend
    networks:
      - servicemenager_network
    restart: unless-stopped
```

### 7. Mettre à jour les settings Django

Dans `backend/servicemenager/settings.py`, ajoutez les paramètres HTTPS :

```python
# Sécurité HTTPS (décommenter en production)
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# CORS - Mettre à jour avec HTTPS
CORS_ALLOWED_ORIGINS = [
    "https://ease-dom.fr",
    "https://www.ease-dom.fr",
]
```

### 8. Mettre à jour le fichier .env

```bash
# Dans .env sur le serveur
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
CORS_ALLOWED_ORIGINS=https://ease-dom.fr,https://www.ease-dom.fr
```

### 9. Reconstruire et redémarrer

```bash
cd /opt/servicemenager

# Reconstruire le frontend avec la nouvelle config
docker compose -f docker-compose.sqlite.yml build frontend

# Redémarrer les conteneurs
docker compose -f docker-compose.sqlite.yml up -d

# Vérifier les logs
docker compose -f docker-compose.sqlite.yml logs -f
```

### 10. Configurer le renouvellement automatique

Let's Encrypt expire après 90 jours. Configurez le renouvellement automatique :

```bash
# Tester le renouvellement
certbot renew --dry-run

# Ajouter une tâche cron pour renouveler automatiquement
crontab -e

# Ajouter cette ligne (renouvelle tous les jours à 3h du matin)
0 3 * * * certbot renew --quiet --deploy-hook "docker compose -f /opt/servicemenager/docker-compose.sqlite.yml restart frontend"
```

## 🔧 Configuration du Firewall

Assurez-vous que les ports 80 et 443 sont ouverts :

```bash
# Pour firewalld (Rocky Linux)
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# Vérifier
firewall-cmd --list-all
```

## ✅ Vérification

1. **Tester HTTPS** : `https://ease-dom.fr`
2. **Vérifier la redirection** : `http://ease-dom.fr` doit rediriger vers HTTPS
3. **Vérifier le certificat** : Le cadenas vert doit apparaître dans le navigateur
4. **Tester l'API** : `https://ease-dom.fr/api/`

## 🐛 Dépannage

### Erreur "Connection refused" sur le port 443

```bash
# Vérifier que le port 443 est ouvert
netstat -tlnp | grep 443

# Vérifier les logs Docker
docker compose -f docker-compose.sqlite.yml logs frontend
```

### Certificat non trouvé dans le conteneur

```bash
# Vérifier que les volumes sont bien montés
docker compose -f docker-compose.sqlite.yml exec frontend ls -la /etc/letsencrypt/live/ease-dom.fr/
```

### Erreur de validation Let's Encrypt

- Vérifiez que le domaine pointe bien vers l'IP du serveur
- Vérifiez que le port 80 est accessible depuis l'extérieur
- Vérifiez les DNS : `dig ease-dom.fr`

## 📝 Notes importantes

1. **Renouvellement automatique** : Les certificats Let's Encrypt expirent après 90 jours. Le cron job les renouvelle automatiquement.

2. **Backup des certificats** : Les certificats sont dans `/etc/letsencrypt/`. Faites-en une sauvegarde régulière.

3. **Test en local** : Pour tester HTTPS en local, vous pouvez utiliser un certificat auto-signé, mais ce n'est pas recommandé pour la production.

4. **Performance** : HTTPS ajoute une légère surcharge, mais c'est négligeable avec les certificats modernes.

