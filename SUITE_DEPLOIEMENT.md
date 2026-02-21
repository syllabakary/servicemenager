# ✅ Suite du Déploiement - Docker Installé

## ✅ Docker est installé et fonctionne !

Vous avez Docker version 29.2.1 installé.

### Test correct de Docker

```bash
# La bonne commande est "hello-world" (pas "hello-word")
docker run hello-world
```

## Vérifier Docker Compose

```bash
# Vérifier si Docker Compose est installé
docker compose version

# Si pas installé, installer Docker Compose
dnf install -y docker-compose-plugin
```

## Continuer avec le déploiement

### 1. Créer le fichier .env

```bash
# Vous êtes déjà dans /opt/servicemenager
nano .env
```

**Contenu du fichier `.env` :**

```env
DEBUG=False
SECRET_KEY=GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE-CHANGEZ-MOI
ALLOWED_HOSTS=76.13.56.224,localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=servicemenager
DB_USER=postgres
DB_PASSWORD=VOTRE-MOT-DE-PASSE-FORT-CHANGEZ-MOI
DB_HOST=db
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://76.13.56.224
CORS_ALLOW_ALL_ORIGINS=False

VITE_API_URL=http://76.13.56.224/api
```

### 2. Générer une SECRET_KEY sécurisée

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Copiez le résultat et remplacez `GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE-CHANGEZ-MOI` dans le fichier `.env`.

**Important :** Changez aussi `VOTRE-MOT-DE-PASSE-FORT-CHANGEZ-MOI` par un mot de passe fort pour la base de données.

Sauvegarder avec `Ctrl+O`, puis `Enter`, puis `Ctrl+X`.

### 3. Construire et démarrer les conteneurs

```bash
# Construire les images Docker
docker compose build

# Démarrer les services en arrière-plan
docker compose up -d

# Vérifier l'état des conteneurs
docker compose ps
```

### 4. Attendre et vérifier les logs

```bash
# Attendre 20 secondes pour que la base de données démarre
sleep 20

# Voir les logs
docker compose logs -f
# (Appuyez sur Ctrl+C pour quitter les logs)
```

### 5. Initialiser la base de données

```bash
# Appliquer les migrations
docker compose exec backend python manage.py migrate

# Créer un superutilisateur Django
docker compose exec backend python manage.py createsuperuser
```

Vous devrez entrer :
- Username (ex: `admin`)
- Email (ex: `admin@example.com`)
- Password (choisissez un mot de passe fort)

### 6. Accéder à l'application

- **Frontend** : http://76.13.56.224
- **API Backend** : http://76.13.56.224/api/
- **Admin Django** : http://76.13.56.224/api/admin/

## Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Redémarrer un service
docker compose restart backend

# Arrêter tous les services
docker compose down

# Reconstruire après modification
docker compose up -d --build
```



