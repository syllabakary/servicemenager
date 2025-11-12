# 🚀 Démarrage rapide - Backend

## Étape 1 : Installation (une seule fois)

### Windows
```bash
# Exécutez le script d'installation
setup.bat
```

### Linux/Mac
```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser
```

## Étape 2 : Lancer le serveur

```bash
# Activer l'environnement virtuel (si pas déjà fait)
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac

# Lancer le serveur
python manage.py runserver
```

✅ Backend disponible sur : http://localhost:8000

## Étape 3 : Accéder à l'admin

1. Ouvrez : http://localhost:8000/admin
2. Connectez-vous avec le superutilisateur créé
3. Créez des services et agences
4. Le frontend affichera automatiquement ces données !

## ✅ C'est prêt !

- **Admin** : http://localhost:8000/admin
- **API** : http://localhost:8000/api/services/




