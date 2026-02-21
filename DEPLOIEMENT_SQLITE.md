# 🚀 Déploiement avec SQLite (Test)

## Configuration pour SQLite

Pour tester avec SQLite d'abord, utilisez cette configuration simplifiée.

### 1. Créer le fichier .env avec SQLite

```bash
cd /opt/servicemenager
nano .env
```

**Contenu du fichier `.env` :**

```env
DEBUG=False
SECRET_KEY=GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE-CHANGEZ-MOI
ALLOWED_HOSTS=76.13.56.224,localhost,127.0.0.1

# SQLite - Pas besoin de mot de passe
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=/app/db.sqlite3

CORS_ALLOWED_ORIGINS=http://76.13.56.224
CORS_ALLOW_ALL_ORIGINS=False

VITE_API_URL=http://76.13.56.224/api
```

### 2. Générer une SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Copiez le résultat et remplacez `GENERER-UNE-CLE-SECRETE-LONGUE-ET-ALEATOIRE-CHANGEZ-MOI` dans `.env`.

### 3. Utiliser docker-compose.sqlite.yml

```bash
# Construire avec la configuration SQLite
docker compose -f docker-compose.sqlite.yml build

# Démarrer les services
docker compose -f docker-compose.sqlite.yml up -d

# Vérifier l'état
docker compose -f docker-compose.sqlite.yml ps
```

### 4. Vérifier les logs

```bash
# Attendre quelques secondes
sleep 10

# Voir les logs
docker compose -f docker-compose.sqlite.yml logs -f
```

### 5. Créer un superutilisateur

```bash
docker compose -f docker-compose.sqlite.yml exec backend python manage.py createsuperuser
```

### 6. Accéder à l'application

- **Frontend** : http://76.13.56.224
- **API Backend** : http://76.13.56.224/api/
- **Admin Django** : http://76.13.56.224/api/admin/

## Commandes utiles avec SQLite

```bash
# Voir les logs
docker compose -f docker-compose.sqlite.yml logs -f

# Redémarrer
docker compose -f docker-compose.sqlite.yml restart backend

# Arrêter
docker compose -f docker-compose.sqlite.yml down

# Reconstruire
docker compose -f docker-compose.sqlite.yml up -d --build
```

## Migration vers PostgreSQL plus tard

Quand vous voudrez passer à PostgreSQL :

1. Arrêter les services SQLite :
   ```bash
   docker compose -f docker-compose.sqlite.yml down
   ```

2. Sauvegarder la base SQLite :
   ```bash
   docker compose -f docker-compose.sqlite.yml exec backend python manage.py dumpdata > data.json
   ```

3. Modifier `.env` pour PostgreSQL :
   ```env
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=servicemenager
   DB_USER=postgres
   DB_PASSWORD=VOTRE-MOT-DE-PASSE
   DB_HOST=db
   DB_PORT=5432
   ```

4. Utiliser docker-compose.yml (avec PostgreSQL) :
   ```bash
   docker compose build
   docker compose up -d
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py loaddata data.json
   ```

## Avantages de commencer avec SQLite

- ✅ Plus simple à configurer
- ✅ Pas besoin de mot de passe
- ✅ Parfait pour tester
- ✅ Facile à migrer vers PostgreSQL plus tard

## Inconvénients de SQLite en production

- ⚠️ Moins performant avec beaucoup d'utilisateurs
- ⚠️ Pas de connexions simultanées multiples
- ⚠️ Pas adapté pour la production à grande échelle

**Recommandation :** Utilisez SQLite pour tester, puis migrez vers PostgreSQL pour la production.



