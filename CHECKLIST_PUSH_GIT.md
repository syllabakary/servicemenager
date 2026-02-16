# ✅ Checklist avant Push Git

## Fichiers créés et prêts

### Configuration Docker
- ✅ `docker-compose.yml` - Configuration avec PostgreSQL
- ✅ `docker-compose.sqlite.yml` - Configuration avec SQLite
- ✅ `backend/Dockerfile` - Image Docker pour Django
- ✅ `frontend/Dockerfile` - Image Docker pour React
- ✅ `frontend/nginx.conf` - Configuration Nginx
- ✅ `.dockerignore` - Fichiers à ignorer pour Docker
- ✅ `backend/.dockerignore` - Fichiers à ignorer pour backend
- ✅ `frontend/.dockerignore` - Fichiers à ignorer pour frontend

### Configuration
- ✅ `.env.example` - Exemple de configuration (à copier sur le serveur)
- ✅ `backend/servicemenager/settings.py` - Modifié pour supporter SQLite/PostgreSQL

### Documentation
- ✅ `DEPLOIEMENT_DOCKER.md` - Guide complet Docker
- ✅ `QUICK_START_DOCKER.md` - Démarrage rapide
- ✅ `GUIDE_SQLITE_PUIS_POSTGRESQL.md` - Guide migration
- ✅ `INSTALL_DOCKER_ROCKY.md` - Installation Docker sur Rocky Linux
- ✅ `README_DEPLOIEMENT.md` - Vue d'ensemble

### Scripts
- ✅ `deploy.sh` - Script de déploiement automatique

## Vérifications avant Push

### 1. Vérifier que .env n'est PAS dans Git
```bash
git status
# .env ne doit PAS apparaître dans les fichiers à commiter
```

### 2. Vérifier que les fichiers Docker sont présents
```bash
ls -la docker-compose*.yml
ls -la backend/Dockerfile
ls -la frontend/Dockerfile
ls -la frontend/nginx.conf
```

### 3. Vérifier .gitignore
Le fichier `.gitignore` doit contenir :
- `.env`
- `backend/.env`
- `backend/db.sqlite3`
- `backend/media/`
- `backend/staticfiles/`

## Commandes pour Push

```bash
# Vérifier l'état
git status

# Ajouter tous les nouveaux fichiers
git add .

# Vérifier ce qui sera commité
git status

# Faire le commit
git commit -m "Ajout configuration Docker pour déploiement"

# Pousser sur GitHub
git push origin main
# ou
git push origin master
```

## Sur le serveur après Pull

```bash
# Se connecter au serveur
ssh root@76.13.56.224

# Aller dans le dossier
cd /opt/servicemenager

# Récupérer les dernières modifications
git pull

# Copier .env.example vers .env
cp .env.example .env

# Éditer .env et modifier :
# - SECRET_KEY (générer avec python3 -c "import secrets; print(secrets.token_urlsafe(50))")
nano .env

# Construire et démarrer avec SQLite
docker compose -f docker-compose.sqlite.yml build
docker compose -f docker-compose.sqlite.yml up -d

# Vérifier
docker compose -f docker-compose.sqlite.yml ps
docker compose -f docker-compose.sqlite.yml logs -f
```

## Fichiers qui NE doivent PAS être poussés

- ❌ `.env` (contient des secrets)
- ❌ `backend/db.sqlite3` (base de données locale)
- ❌ `backend/media/` (fichiers uploadés)
- ❌ `backend/staticfiles/` (fichiers statiques générés)
- ❌ `node_modules/` (dépendances Node)
- ❌ `backend/env/` (environnement virtuel Python)

Ces fichiers sont déjà dans `.gitignore`.

