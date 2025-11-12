# Services Locaux - Plateforme de Services à Domicile

## 📁 Structure du projet

```
servicemenager-main/
├── backend/          # Backend Django (API + Admin)
│   ├── api/         # Services, Agences, Devis, Contact
│   ├── content/     # Contenu dynamique
│   └── manage.py
│
└── frontend/        # Frontend React
    ├── src/
    └── package.json
```

## 🚀 Démarrage rapide

### 1️⃣ Backend Django

```bash
cd backend
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

✅ **Backend** : http://localhost:8000

### 2️⃣ Frontend React

**Ouvrez un NOUVEAU terminal** :

```bash
cd frontend
npm install
npm run dev
```

✅ **Frontend** : http://localhost:5173

## 📍 URLs

- **Admin Django** : http://localhost:8000/admin
- **API REST** : http://localhost:8000/api/
- **Frontend** : http://localhost:5173

## 📚 Documentation

- `DEMARRAGE_RAPIDE.md` : Guide de démarrage détaillé
- `DJANGO_BACKEND_GUIDE.md` : Guide complet du backend
- `README_STRUCTURE.md` : Documentation de la structure

## ✅ Fonctionnalités

- ✅ Gestion dynamique des services et agences via l'admin Django
- ✅ API REST complète avec recherche et filtres
- ✅ Frontend React avec toutes les pages
- ✅ Formulaire multi-étapes pour les devis
- ✅ Design responsive et moderne

---

**Tout est organisé et prêt à l'emploi !** 🎉
