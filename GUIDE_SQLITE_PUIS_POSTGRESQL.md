# 📋 Guide : SQLite d'abord, puis PostgreSQL

## ✅ Configuration pour SQLite (Test)

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
DB_NAME=db.sqlite3

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

---

## 🔄 Migration vers PostgreSQL (Quand vous êtes prêt)

### Étape 1 : Sauvegarder les données SQLite

```bash
# Exporter toutes les données depuis SQLite
docker compose -f docker-compose.sqlite.yml exec backend python manage.py dumpdata > data.json

# Vérifier que le fichier est créé
ls -lh data.json
```

### Étape 2 : Arrêter les services SQLite

```bash
docker compose -f docker-compose.sqlite.yml down
```

### Étape 3 : Modifier le fichier .env pour PostgreSQL

```bash
nano .env
```

**Modifier ces lignes :**

```env
# Avant (SQLite)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# Après (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=servicemenager
DB_USER=postgres
DB_PASSWORD=VOTRE-MOT-DE-PASSE-FORT-CHANGEZ-MOI
DB_HOST=db
DB_PORT=5432
```

### Étape 4 : Démarrer avec PostgreSQL

```bash
# Utiliser docker-compose.yml (avec PostgreSQL)
docker compose build
docker compose up -d

# Attendre que la base de données soit prête
sleep 20

# Appliquer les migrations
docker compose exec backend python manage.py migrate

# Importer les données sauvegardées
docker compose exec backend python manage.py loaddata data.json
```

### Étape 5 : Vérifier

```bash
# Vérifier les logs
docker compose logs -f

# Vérifier que les données sont là
docker compose exec backend python manage.py shell
# Dans le shell Django :
# >>> from api.models import CustomUser
# >>> CustomUser.objects.count()
# (Devrait afficher le nombre d'utilisateurs)
# >>> exit()
```

---

## 📝 Commandes utiles

### Avec SQLite

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

### Avec PostgreSQL

```bash
# Voir les logs
docker compose logs -f

# Redémarrer
docker compose restart backend

# Arrêter
docker compose down

# Reconstruire
docker compose up -d --build
```

---

## ⚠️ Notes importantes

1. **SQLite** : Parfait pour tester, mais pas adapté pour la production avec beaucoup d'utilisateurs
2. **PostgreSQL** : Recommandé pour la production, meilleures performances et sécurité
3. **Migration** : Les données peuvent être migrées facilement avec `dumpdata` et `loaddata`
4. **Backup** : Toujours faire une sauvegarde avant de migrer

---

## ✅ Checklist

### Phase SQLite (Test)
- [ ] Fichier `.env` configuré avec SQLite
- [ ] SECRET_KEY générée
- [ ] Services démarrés avec `docker-compose.sqlite.yml`
- [ ] Superutilisateur créé
- [ ] Application accessible et fonctionnelle

### Phase PostgreSQL (Production)
- [ ] Données SQLite exportées (`data.json`)
- [ ] Services SQLite arrêtés
- [ ] Fichier `.env` modifié pour PostgreSQL
- [ ] Services PostgreSQL démarrés
- [ ] Migrations appliquées
- [ ] Données importées
- [ ] Application vérifiée



