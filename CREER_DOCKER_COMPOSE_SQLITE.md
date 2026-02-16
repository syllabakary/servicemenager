# Créer docker-compose.sqlite.yml sur le serveur

## Commande à exécuter sur le serveur

```bash
cd /opt/servicemenager

# Créer le fichier docker-compose.sqlite.yml
cat > docker-compose.sqlite.yml << 'EOF'
version: '3.8'

services:
  # Backend Django avec SQLite
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: servicemenager_backend
    command: >
      sh -c "python manage.py migrate --noinput &&
             python manage.py collectstatic --noinput &&
             gunicorn servicemenager.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --access-logfile - --error-logfile -"
    volumes:
      - ./backend:/app
      - backend_static:/app/staticfiles
      - backend_media:/app/media
      - backend_db:/app
    ports:
      - "8000:8000"
    env_file:
      - .env
    networks:
      - servicemenager_network
    restart: unless-stopped

  # Frontend React
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-http://76.13.56.224/api}
    container_name: servicemenager_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - servicemenager_network
    restart: unless-stopped

volumes:
  backend_static:
  backend_media:
  backend_db:

networks:
  servicemenager_network:
    driver: bridge
EOF

# Vérifier que le fichier est créé
ls -la docker-compose.sqlite.yml
```

