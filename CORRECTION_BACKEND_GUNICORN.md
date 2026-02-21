# Correction du problème Gunicorn

## Problème
Le backend redémarre en boucle avec l'erreur : `sh: 3: gunicorn: not found`

## Solution

Gunicorn est dans requirements.txt mais n'a peut-être pas été installé correctement. Il faut reconstruire l'image Docker.

### Sur le serveur :

```bash
cd /opt/servicemenager

# Arrêter les conteneurs
docker compose -f docker-compose.sqlite.yml down

# Reconstruire l'image backend (forcer la reconstruction)
docker compose -f docker-compose.sqlite.yml build --no-cache backend

# Redémarrer
docker compose -f docker-compose.sqlite.yml up -d

# Vérifier les logs
docker compose -f docker-compose.sqlite.yml logs -f backend
```

### Vérifier que gunicorn est installé

```bash
# Entrer dans le conteneur
docker compose -f docker-compose.sqlite.yml exec backend bash

# Vérifier gunicorn
which gunicorn
gunicorn --version

# Si gunicorn n'est pas trouvé, installer manuellement
pip install gunicorn

# Sortir du conteneur
exit
```

### Alternative : Utiliser runserver en développement

Si gunicorn pose problème, vous pouvez temporairement utiliser runserver :

Modifier `docker-compose.sqlite.yml` :

```yaml
command: >
  sh -c "python manage.py migrate --noinput &&
         python manage.py collectstatic --noinput &&
         python manage.py runserver 0.0.0.0:8000"
```

Puis redémarrer :
```bash
docker compose -f docker-compose.sqlite.yml up -d --build
```



