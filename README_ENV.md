# 🔐 Configuration .env sur le Serveur

## Méthode Automatique (Recommandée)

Après `git pull`, exécutez le script :

```bash
cd /opt/servicemenager

# Rendre le script exécutable
chmod +x setup-env.sh

# Exécuter le script
./setup-env.sh

# Éditer .env
nano .env

# Générer SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
# Copier le résultat dans .env à la place de GENERER-UNE-CLE-SECRETE...
```

## Méthode Manuelle

```bash
cd /opt/servicemenager

# Copier .env.example vers .env
cp .env.example .env

# Éditer .env
nano .env

# Générer SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
# Copier le résultat dans .env
```

## Configuration minimale pour SQLite

Dans `.env`, vous devez avoir au minimum :

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

## ⚠️ Important

- `.env` contient des secrets et ne doit **JAMAIS** être poussé sur Git
- `.env.example` est un template sans secrets et peut être poussé
- Sur le serveur, copiez `.env.example` vers `.env` et modifiez les valeurs

