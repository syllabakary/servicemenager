# Créer les Dockerfiles sur le serveur

## Vérifier les fichiers existants

```bash
cd /opt/servicemenager

# Vérifier si les Dockerfiles existent
ls -la backend/Dockerfile
ls -la frontend/Dockerfile
ls -la frontend/nginx.conf
```

## Si les fichiers n'existent pas, les créer :

### 1. Créer backend/Dockerfile

```bash
cat > backend/Dockerfile << 'EOF'
# Dockerfile pour le backend Django
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY . .

# Créer les dossiers pour les fichiers statiques et médias
RUN mkdir -p /app/staticfiles /app/media

# Créer le dossier de logs
RUN mkdir -p /app/logs

# Exposer le port
EXPOSE 8000

# Commande par défaut (sera override par docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
EOF
```

### 2. Créer frontend/Dockerfile

```bash
cat > frontend/Dockerfile << 'EOF'
# Dockerfile pour le frontend React/Vite
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de l'application
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage de production avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
```

### 3. Créer frontend/nginx.conf

```bash
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;
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
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (si nécessaire)
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
    }

    # Proxy pour les fichiers statiques Django
    location /static/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

### 4. Vérifier que tous les fichiers sont créés

```bash
ls -la backend/Dockerfile
ls -la frontend/Dockerfile
ls -la frontend/nginx.conf
ls -la docker-compose.sqlite.yml
ls -la .env
```

### 5. Construire et démarrer

```bash
docker compose -f docker-compose.sqlite.yml build
docker compose -f docker-compose.sqlite.yml up -d
```

