# Guide d'installation - Django REST Framework Backend

## Prérequis

- Python 3.9+
- pip
- Virtual environment (recommandé)

## Installation

### 1. Créer et activer l'environnement virtuel

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet `backend/`:

```env
SECRET_KEY=votre-secret-key-tres-longue-et-securisee
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 4. Migrations de la base de données

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Créer les données initiales

```bash
python manage.py create_initial_data
```

Cela créera:
- 1 superadmin: `super@local.test` / `SuperPass123!`
- 1 admin: `admin@local.test` / `AdminPass123!`
- 2 services (1 actif, 1 inactif)
- 2 agences (1 siège à Paris)
- 1 contact siège
- 1 page content (home_banner)

### 6. Créer un superutilisateur Django (optionnel)

```bash
python manage.py createsuperuser
```

### 7. Lancer le serveur de développement

```bash
python manage.py runserver
```

Le serveur sera accessible sur `http://localhost:8000`

## Accès à l'admin Django

- URL: `http://localhost:8000/admin/`
- Identifiants: ceux du superadmin créé (`super@local.test` / `SuperPass123!`)

## Structure des endpoints API

- Base URL: `http://localhost:8000/api/`
- Documentation Swagger (si installé): `http://localhost:8000/api/docs/`

### Endpoints principaux

- `POST /api/token/` - Obtenir un token JWT
- `POST /api/token/refresh/` - Rafraîchir le token
- `POST /api/register/` - Inscription client
- `GET /api/navbar/` - Données pour la navbar
- `GET /api/services/` - Liste des services
- `GET /api/agencies/` - Liste des agences
- `GET /api/contacts/` - Liste des contacts
- `GET /api/pages/` - Liste des pages

## Tests

```bash
python manage.py test api
```

## Notes importantes

- Les mots de passe dans `create_initial_data.py` doivent être changés en production
- Le fichier `.env` ne doit jamais être commité dans Git
- En production, mettre `DEBUG=False` et configurer `ALLOWED_HOSTS` correctement

