# Backend Django - Services Locaux

## Installation

1. Activer l'environnement virtuel :
```bash
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Créer les migrations :
```bash
python manage.py makemigrations
python manage.py migrate
```

4. Créer un superutilisateur :
```bash
python manage.py createsuperuser
```

5. Lancer le serveur :
```bash
python manage.py runserver
```

## Accès

- **Admin Django** : http://localhost:8000/admin
- **API** : http://localhost:8000/api/

## Structure

- `api/` : App principale (Services, Agences, Devis, Contact)
- `content/` : App pour le contenu dynamique (Hero, Bannière, etc.)
- `media/` : Images uploadées
- `staticfiles/` : Fichiers statiques

## Endpoints API

- `GET /api/services/` - Liste des services
- `GET /api/services/:id/` - Détail d'un service
- `GET /api/services/stats/` - Statistiques
- `GET /api/agencies/` - Liste des agences
- `GET /api/agencies/:id/` - Détail d'une agence
- `GET /api/agencies/stats/` - Statistiques
- `POST /api/quotes/` - Créer une demande de devis
- `POST /api/contact/` - Envoyer un message
- `GET /api/content/` - Liste du contenu
- `GET /api/content/by_type/?type=hero` - Contenu par type




