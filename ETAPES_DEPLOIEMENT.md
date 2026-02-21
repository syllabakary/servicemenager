# 🚀 Étapes de Déploiement - Suite après Git Clone

## ✅ Étape 1 : Projet cloné ✓

Vous êtes ici : `/opt/servicemenager`

## 📋 Étape 2 : Installer Docker et Docker Compose

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

## ⚙️ Étape 3 : Configurer le fichier .env

```bash
# Aller dans le dossier du projet
cd /opt/servicemenager

# Créer le fichier .env depuis l'exemple (si existe)
# Sinon créer manuellement
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

**Générer une SECRET_KEY sécurisée :**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```
Copiez le résultat et remplacez `GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE-CHANGEZ-MOI` dans le fichier `.env`.

**Changer le mot de passe de la base de données** : Remplacez `VOTRE-MOT-DE-PASSE-FORT-CHANGEZ-MOI` par un mot de passe fort.

## 🐳 Étape 4 : Construire et démarrer les conteneurs Docker

```bash
# Construire les images Docker
docker compose build

# Démarrer les services en arrière-plan
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
```

## ⏳ Étape 5 : Attendre que les services démarrent

```bash
# Attendre 15-20 secondes pour que la base de données soit prête
sleep 20

# Vérifier les logs pour voir si tout va bien
docker compose logs -f
# (Appuyez sur Ctrl+C pour quitter les logs)
```

## 🔧 Étape 6 : Initialiser la base de données

```bash
# Appliquer les migrations (si pas déjà fait automatiquement)
docker compose exec backend python manage.py migrate

# Créer un superutilisateur Django
docker compose exec backend python manage.py createsuperuser
```

Vous devrez entrer :
- Username (ex: admin)
- Email (ex: admin@example.com)
- Password (choisissez un mot de passe fort)

## ✅ Étape 7 : Vérifier le déploiement

```bash
# Vérifier les logs
docker compose logs -f

# Vérifier l'état des conteneurs
docker compose ps
```

Tous les conteneurs doivent être en état "Up" (running).

## 🌐 Étape 8 : Accéder à l'application

- **Frontend** : http://76.13.56.224
- **API Backend** : http://76.13.56.224/api/
- **Admin Django** : http://76.13.56.224/api/admin/

## 🔍 En cas de problème

```bash
# Voir les logs d'erreur
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Redémarrer un service
docker compose restart backend

# Reconstruire après modification
docker compose up -d --build
```

## 📝 Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Arrêter tous les services
docker compose down

# Redémarrer tous les services
docker compose restart

# Voir l'utilisation des ressources
docker stats
```



