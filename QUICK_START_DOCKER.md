# 🚀 Déploiement Rapide - Docker

## Étapes Rapides

### 1. Sur votre machine locale (Windows)

Transférez le projet sur le serveur :

```powershell
# Dans PowerShell
scp -r C:\Users\VICTUS\Documents\servicemenager-main root@76.13.56.224:/opt/servicemenager
```

### 2. Sur le serveur (SSH)

```bash
# Se connecter
ssh root@76.13.56.224

# Aller dans le dossier
cd /opt/servicemenager

# Installer Docker (si pas déjà installé)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y

# Créer le fichier .env
cat > .env << 'EOF'
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
EOF

# Générer une SECRET_KEY
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
sed -i "s/GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE-CHANGEZ-MOI/$SECRET_KEY/" .env

# Construire et démarrer
docker compose build
docker compose up -d

# Attendre quelques secondes
sleep 15

# Créer un superutilisateur
docker compose exec backend python manage.py createsuperuser

# Vérifier les logs
docker compose logs -f
```

### 3. Accéder à l'application

- **Frontend** : http://76.13.56.224
- **API** : http://76.13.56.224/api/
- **Admin** : http://76.13.56.224/api/admin/

## Commandes Utiles

```bash
# Voir les logs
docker compose logs -f

# Redémarrer
docker compose restart

# Arrêter
docker compose down

# Mettre à jour le code
git pull  # ou transférer les nouveaux fichiers
docker compose up -d --build
```

## Problèmes ?

Voir le guide complet : `DEPLOIEMENT_DOCKER.md`

