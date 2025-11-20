# Réinitialiser la base de données

Si vous avez une erreur `InconsistentMigrationHistory`, suivez ces étapes :

## Solution rapide (développement uniquement)

```bash
cd backend

# 1. Supprimer la base de données
rm db.sqlite3  # Linux/Mac
# ou
del db.sqlite3  # Windows

# 2. Supprimer les migrations (garder seulement __init__.py)
# Supprimez tous les fichiers .py dans api/migrations/ sauf __init__.py

# 3. Recréer les migrations
python manage.py makemigrations api

# 4. Appliquer les migrations
python manage.py migrate

# 5. Créer les données initiales
python manage.py create_initial_data
```

## Alternative : Marquer les migrations comme appliquées

Si vous voulez garder la base de données :

```bash
# Marquer les migrations api comme appliquées (sans les exécuter)
python manage.py migrate api --fake

# Puis appliquer les autres migrations
python manage.py migrate
```

