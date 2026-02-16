# 🐳 Guide de Déploiement Docker - ServiceManager

Ce guide vous explique comment déployer l'application ServiceManager sur votre serveur avec Docker.

## 📋 Prérequis

- Serveur Ubuntu/Debian avec accès SSH
- Docker et Docker Compose installés
- Domaine ou IP publique (dans votre cas : `76.13.56.224`)

## 🚀 Installation sur le Serveur

### 1. Connexion SSH au serveur

```bash
ssh root@76.13.56.224
```

### 2. Installation de Docker et Docker Compose

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt install docker-compose-plugin -y

# Vérifier l'installation
docker --version
docker compose version
```

### 3. Cloner ou transférer le projet

**Option A : Cloner depuis Git**
```bash
cd /opt
git clone <votre-repo-url> servicemenager
cd servicemenager
```

**Option B : Transférer les fichiers depuis votre machine locale**
```bash
# Sur votre machine locale (Windows PowerShell)
scp -r C:\Users\VICTUS\Documents\servicemenager-main root@76.13.56.224:/opt/servicemenager

# Puis sur le serveur
cd /opt/servicemenager
```

### 4. Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
nano .env
```

**Configuration minimale dans `.env` :**
```env
DEBUG=False
SECRET_KEY=GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE
ALLOWED_HOSTS=76.13.56.224,localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=servicemenager
DB_USER=postgres
DB_PASSWORD=VOTRE-MOT-DE-PASSE-FORT
DB_HOST=db
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://76.13.56.224

VITE_API_URL=http://76.13.56.224/api
```

**Générer une SECRET_KEY sécurisée :**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 5. Construire et démarrer les conteneurs

```bash
# Construire les images Docker
docker compose build

# Démarrer les services
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
docker compose logs -f
```

### 6. Initialiser la base de données

```bash
# Créer un superutilisateur Django
docker compose exec backend python manage.py createsuperuser

# Charger les données initiales (si nécessaire)
docker compose exec backend python manage.py loaddata api/fixtures/initial_data.json
```

### 7. Vérifier le déploiement

- **Frontend** : http://76.13.56.224
- **Backend API** : http://76.13.56.224/api/
- **Admin Django** : http://76.13.56.224/api/admin/

## 🔧 Commandes Utiles

### Gestion des conteneurs

```bash
# Voir les logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Redémarrer un service
docker compose restart backend

# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (⚠️ supprime la base de données)
docker compose down -v

# Reconstruire après modification du code
docker compose up -d --build
```

### Commandes Django

```bash
# Migrations
docker compose exec backend python manage.py migrate

# Collecter les fichiers statiques
docker compose exec backend python manage.py collectstatic --noinput

# Shell Django
docker compose exec backend python manage.py shell

# Créer un superutilisateur
docker compose exec backend python manage.py createsuperuser
```

### Sauvegarde de la base de données

```bash
# Sauvegarder
docker compose exec db pg_dump -U postgres servicemenager > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer
docker compose exec -T db psql -U postgres servicemenager < backup_20240101_120000.sql
```

## 🔒 Configuration HTTPS avec Let's Encrypt (Recommandé)

### 1. Installer Certbot

```bash
apt install certbot python3-certbot-nginx -y
```

### 2. Modifier docker-compose.yml pour utiliser Nginx en reverse proxy

Créez un fichier `nginx/nginx.conf` :

```nginx
server {
    listen 80;
    server_name 76.13.56.224;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Obtenir un certificat SSL

```bash
certbot --nginx -d 76.13.56.224
```

## 📊 Monitoring et Logs

### Voir les logs en temps réel

```bash
# Tous les services
docker compose logs -f

# Un service spécifique
docker compose logs -f backend
```

### Vérifier l'utilisation des ressources

```bash
docker stats
```

## 🛠️ Dépannage

### Le frontend ne se charge pas

1. Vérifier les logs : `docker compose logs frontend`
2. Vérifier que le port 80 n'est pas utilisé : `netstat -tulpn | grep :80`
3. Reconstruire : `docker compose up -d --build frontend`

### L'API ne répond pas

1. Vérifier les logs : `docker compose logs backend`
2. Vérifier la connexion à la base de données : `docker compose exec backend python manage.py dbshell`
3. Vérifier les migrations : `docker compose exec backend python manage.py migrate`

### Erreur de connexion à la base de données

1. Vérifier que le conteneur db est démarré : `docker compose ps`
2. Vérifier les logs : `docker compose logs db`
3. Vérifier les variables d'environnement dans `.env`

### Les fichiers statiques ne se chargent pas

```bash
docker compose exec backend python manage.py collectstatic --noinput
docker compose restart backend
```

## 🔄 Mise à jour de l'application

```bash
# 1. Arrêter les services
docker compose down

# 2. Mettre à jour le code (si Git)
git pull

# 3. Reconstruire les images
docker compose build

# 4. Redémarrer
docker compose up -d

# 5. Appliquer les migrations
docker compose exec backend python manage.py migrate

# 6. Collecter les fichiers statiques
docker compose exec backend python manage.py collectstatic --noinput
```

## 📝 Checklist de Déploiement

- [ ] Docker et Docker Compose installés
- [ ] Projet transféré sur le serveur
- [ ] Fichier `.env` configuré avec les bonnes valeurs
- [ ] `SECRET_KEY` générée et sécurisée
- [ ] `DB_PASSWORD` fort et sécurisé
- [ ] Conteneurs démarrés avec `docker compose up -d`
- [ ] Migrations appliquées
- [ ] Superutilisateur créé
- [ ] Frontend accessible sur http://76.13.56.224
- [ ] API accessible sur http://76.13.56.224/api/
- [ ] HTTPS configuré (recommandé)
- [ ] Sauvegarde automatique de la base de données configurée

## 🔐 Sécurité Production

1. **Changer tous les mots de passe par défaut**
2. **Configurer un firewall** (UFW) :
   ```bash
   ufw allow 22/tcp   # SSH
   ufw allow 80/tcp   # HTTP
   ufw allow 443/tcp  # HTTPS
   ufw enable
   ```

3. **Désactiver DEBUG** : `DEBUG=False` dans `.env`
4. **Configurer HTTPS** avec Let's Encrypt
5. **Mettre à jour régulièrement** : `apt update && apt upgrade`
6. **Configurer des backups automatiques** de la base de données

## 📞 Support

En cas de problème, vérifiez les logs :
```bash
docker compose logs -f
```

---

**Bon déploiement ! 🚀**

