# 🔐 Créer .env sur le Serveur

## ⚠️ Important : Sécurité

**Ne poussez JAMAIS un fichier `.env` avec des secrets réels sur Git !**

Si vous voulez que `.env` soit présent sur le serveur, utilisez plutôt `.env.example` (template sans secrets).

## ✅ Solution Recommandée : Utiliser .env.example

### Sur le serveur, après git pull :
###de
```bash
cd /opt/servicemenager

# Copier .env.example vers .env
cp .env.example .env

# Éditer .env
nano .env

# Générer SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
# Copier le résultat dans .env à la place de GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE-CHANGEZ-MOI
```

### Ou utiliser le script automatique :

```bash
cd /opt/servicemenager

# Rendre le script exécutable
chmod +x setup-env.sh

# Exécuter
./setup-env.sh

# Puis éditer .env
nano .env
```

## 📋 Configuration minimale pour SQLite

Dans `.env`, vous devez avoir :

```env
DEBUG=False
SECRET_KEY=VOTRE-SECRET-KEY-GENERE
ALLOWED_HOSTS=76.13.56.224,localhost,127.0.0.1

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

CORS_ALLOWED_ORIGINS=http://76.13.56.224
CORS_ALLOW_ALL_ORIGINS=False

VITE_API_URL=http://76.13.56.224/api
```

## 🚀 Après avoir créé .env

```bash
# Construire et démarrer
docker compose -f docker-compose.sqlite.yml build
docker compose -f docker-compose.sqlite.yml up -d

# Vérifier
sleep 10
docker compose -f docker-compose.sqlite.yml ps
docker compose -f docker-compose.sqlite.yml logs -f
```



