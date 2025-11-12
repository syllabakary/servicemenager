# 🚀 Démarrage rapide - Services Locaux

## 📁 Structure du projet

```
servicemenager-main/
├── backend/          # Backend Django (API + Admin)
│   ├── venv/        # Environnement virtuel Python
│   ├── api/         # Services, Agences, Devis, Contact
│   ├── content/     # Contenu dynamique
│   └── manage.py
│
└── frontend/        # Frontend React
    ├── src/
    └── package.json
```

## ⚡ Installation et démarrage

### 1️⃣ Backend Django

```bash
# Aller dans le dossier backend
cd backend

# Activer l'environnement virtuel
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac

# Installer les dépendances (première fois seulement)
pip install -r requirements.txt

# Créer les migrations (première fois seulement)
python manage.py makemigrations
python manage.py migrate

# Créer un superutilisateur (première fois seulement)
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

✅ **Backend disponible sur** : http://localhost:8000

### 2️⃣ Frontend React

**Ouvrez un NOUVEAU terminal** :

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances (première fois seulement)
npm install

# Lancer le serveur de développement
npm run dev
```

✅ **Frontend disponible sur** : http://localhost:5173

## 📍 URLs importantes

- **Admin Django** : http://localhost:8000/admin
- **API REST** : http://localhost:8000/api/
- **Frontend** : http://localhost:5173

## ✅ Vérification

1. ✅ Backend Django fonctionne sur le port 8000
2. ✅ Frontend React fonctionne sur le port 5173
3. ✅ Accédez à http://localhost:8000/admin
4. ✅ Créez des services et agences depuis l'admin
5. ✅ Le frontend affichera automatiquement ces données !

## 🎯 Prochaines étapes

1. **Créer des données de test** dans l'admin Django
2. **Vérifier l'API** : http://localhost:8000/api/services/
3. **Tester le frontend** : http://localhost:5173

## 📝 Notes

- Le frontend est déjà configuré pour se connecter à l'API Django
- CORS est configuré pour permettre les requêtes depuis le frontend
- Toutes les données sont maintenant dynamiques (gérées depuis l'admin Django)

## 🐛 Problèmes courants

### "ModuleNotFoundError: No module named 'django'"
→ Activez l'environnement virtuel : `venv\Scripts\activate`

### "Port 8000 already in use"
→ Changez le port : `python manage.py runserver 8001`

### "CORS error"
→ Vérifiez que le backend tourne sur le port 8000

---

**Tout est prêt ! Suivez les étapes ci-dessus pour démarrer le projet.** 🎉



