# 🔄 Migration SQLite → PostgreSQL

## Situation actuelle

- **Développement (local)** : SQLite (`db.sqlite3`) - Pas de mot de passe
- **Production (serveur)** : PostgreSQL - Nécessite un mot de passe

## ⚠️ Important : Les données ne seront PAS migrées automatiquement

Quand vous déployez sur le serveur avec Docker, vous démarrez avec une **base de données vide** (PostgreSQL). C'est normal et recommandé pour la production.

## Options

### Option 1 : Démarrer avec une base vide (Recommandé pour production)

**Avantages :**
- ✅ Base de données propre et optimisée
- ✅ Pas de données de test
- ✅ Meilleure performance
- ✅ Sécurité renforcée

**Ce que vous devrez faire :**
1. Créer un superutilisateur Django : `docker compose exec backend python manage.py createsuperuser`
2. Créer vos données de production (patients, employés, etc.) via l'interface admin
3. Optionnel : Charger des données initiales si vous avez des fixtures

### Option 2 : Migrer les données depuis SQLite (Si nécessaire)

Si vous avez des données importantes dans votre SQLite locale que vous voulez transférer :

```bash
# Sur votre machine locale (Windows)
# 1. Exporter les données depuis SQLite
cd C:\Users\VICTUS\Documents\servicemenager-main\backend
python manage.py dumpdata > data.json

# 2. Transférer le fichier sur le serveur
scp data.json root@76.13.56.224:/opt/servicemenager/

# Sur le serveur
cd /opt/servicemenager
docker compose exec backend python manage.py loaddata /app/data.json
```

**Note :** Cette méthode peut avoir des problèmes de compatibilité entre SQLite et PostgreSQL.

## Configuration pour Docker

Dans votre fichier `.env` sur le serveur, utilisez PostgreSQL :

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=servicemenager
DB_USER=postgres
DB_PASSWORD=VOTRE-MOT-DE-PASSE-FORT
DB_HOST=db
DB_PORT=5432
```

**Le mot de passe PostgreSQL** est différent de votre mot de passe Django. C'est le mot de passe pour accéder à la base de données PostgreSQL elle-même.

## Recommandation

Pour un **nouveau déploiement en production**, démarrez avec une base vide :

1. ✅ Base de données propre
2. ✅ Pas de données de test
3. ✅ Meilleure sécurité
4. ✅ Performance optimale

Vous créerez vos données de production via l'interface admin après le déploiement.

## Étapes après déploiement

```bash
# 1. Créer un superutilisateur
docker compose exec backend python manage.py createsuperuser

# 2. Accéder à l'admin
# http://76.13.56.224/api/admin/

# 3. Créer vos données de production (patients, employés, etc.)
```

## Si vous avez besoin de migrer des données

1. Exportez depuis SQLite local : `python manage.py dumpdata > data.json`
2. Transférez sur le serveur : `scp data.json root@76.13.56.224:/opt/servicemenager/`
3. Importez dans PostgreSQL : `docker compose exec backend python manage.py loaddata data.json`

**Attention :** Vérifiez que les données sont compatibles avant d'importer en production.

