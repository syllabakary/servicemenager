# 🔧 Correction Immédiate sur le Serveur

## Problème
- Backend redémarre en boucle : `gunicorn: not found`
- Impossible d'accéder aux pages (login, etc.) car l'API ne répond pas

## Solution Rapide : Utiliser runserver au lieu de gunicorn

### Sur le serveur, exécutez :

```bash
cd /opt/servicemenager

# Arrêter les conteneurs
docker compose -f docker-compose.sqlite.yml down

# Modifier docker-compose.sqlite.yml pour utiliser runserver
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
             python manage.py runserver 0.0.0.0:8000"
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

# Redémarrer
docker compose -f docker-compose.sqlite.yml up -d

# Vérifier les logs
sleep 5
docker compose -f docker-compose.sqlite.yml logs -f backend
```

## Vérifier que tout fonctionne

```bash
# Vérifier l'état des conteneurs
docker compose -f docker-compose.sqlite.yml ps

# Tester l'API
curl http://localhost:8000/api/

# Vérifier la base de données
docker compose -f docker-compose.sqlite.yml exec backend python manage.py shell
# Dans le shell :
# >>> from django.contrib.auth import get_user_model
# >>> User = get_user_model()
# >>> User.objects.count()
# >>> exit()
```

## Créer un superutilisateur

```bash
docker compose -f docker-compose.sqlite.yml exec backend python manage.py createsuperuser
```

## Accéder à l'application

- **Frontend** : http://76.13.56.224
- **API** : http://76.13.56.224/api/
- **Admin** : http://76.13.56.224/api/admin/

## Note

`runserver` est pour le développement. Pour la production, il faudra installer gunicorn correctement plus tard.

