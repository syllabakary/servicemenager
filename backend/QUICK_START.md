# Démarrage rapide

## 1. Créer les migrations pour l'application api

```bash
cd backend
python manage.py makemigrations api
```

**⚠️ IMPORTANT :** Il faut spécifier `api` car c'est l'application qui contient les modèles.

## 2. Appliquer les migrations

```bash
python manage.py migrate
```

## 3. Créer les données initiales

```bash
python manage.py create_initial_data
```

**⚠️ IMPORTANT :** Utilisez `python manage.py create_initial_data` et NON `python management/commands/create_initial_data.py`

**⚠️ ERREUR "no such table" ?** Cela signifie que les migrations n'ont pas été créées/appliquées. Exécutez d'abord les étapes 1 et 2.

## 4. Lancer le serveur

```bash
python manage.py runserver
```

## Identifiants créés

Après avoir exécuté `create_initial_data`, vous aurez :

- **Superadmin**: `superadmin` / `superadmin`
- **Admin**: `admin` / `admin`
- **Client**: `client` / `client`

## Accès à l'admin Django

- URL: http://localhost:8000/admin/
- Identifiants: `superadmin` / `superadmin`

## Tester l'API

- Navbar: http://localhost:8000/api/navbar/
- Services: http://localhost:8000/api/services/
- Agences: http://localhost:8000/api/agencies/
