# 📁 Structure du projet Services Locaux

## Organisation

```
servicemenager-main/
├── backend/                 # Backend Django
│   ├── venv/               # Environnement virtuel Python
│   ├── servicemenager/     # Configuration Django
│   ├── api/                # App principale (Services, Agences, etc.)
│   ├── content/            # App contenu dynamique
│   ├── media/              # Images uploadées
│   ├── staticfiles/        # Fichiers statiques
│   ├── manage.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/               # Frontend React
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── client/                 # Ancien dossier (peut être supprimé)
└── README.md
```

## 🚀 Démarrage

### Terminal 1 - Backend Django
```bash
cd backend
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
✅ http://localhost:8000

### Terminal 2 - Frontend React
```bash
cd frontend
npm install
npm run dev
```
✅ http://localhost:5173

## 📍 URLs

- **Admin Django** : http://localhost:8000/admin
- **API REST** : http://localhost:8000/api/
- **Frontend** : http://localhost:5173

## ✅ Structure finale

- `backend/` : Toute l'application Django
- `frontend/` : Toute l'application React
- Tout est dans `servicemenager-main/`







