# Guide de Déploiement sur cPanel

## 📋 Vue d'ensemble

Votre projet est composé de :
- **Backend** : Django (Python) avec API REST
- **Frontend** : React + TypeScript + Vite

## ⚠️ Compatibilité cPanel

### Options disponibles :

#### ✅ Option 1 : cPanel avec Python App (Recommandé si disponible)
Si votre hébergeur propose l'application "Python App" dans cPanel, c'est la solution la plus simple.

#### ✅ Option 2 : cPanel avec VPS/Cloud
Si vous avez un VPS avec cPanel, vous pouvez configurer manuellement Django.

#### ✅ Option 3 : Hébergement séparé (Recommandé pour production)
- **Frontend** : Hébergé sur cPanel (fichiers statiques)
- **Backend** : Hébergé sur un VPS ou service cloud (PythonAnywhere, Heroku, Railway, etc.)

---

## 🚀 Option 1 : Déploiement complet sur cPanel avec Python App

### Prérequis
- cPanel avec l'application "Python App" activée
- Accès SSH (recommandé)
- Base de données MySQL/PostgreSQL (pas SQLite pour la production)

### Étapes de déploiement

#### 1. Préparer le backend

**1.1. Modifier les settings pour la production**

Créez un fichier `backend/servicemenager/settings_production.py` :

```python
from .settings import *
import os

DEBUG = False
ALLOWED_HOSTS = ['votre-domaine.com', 'www.votre-domaine.com']

# Base de données MySQL/PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',  # ou 'postgresql'
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
    }
}

# Sécurité
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS - Mettre votre domaine frontend
CORS_ALLOWED_ORIGINS = [
    "https://votre-domaine.com",
    "https://www.votre-domaine.com",
]
```

**1.2. Créer le fichier `.htaccess` pour cPanel**

Dans le dossier `backend/`, créez `.htaccess` :

```apache
PassengerEnabled On
PassengerAppRoot /home/votreuser/public_html/backend
PassengerBaseURI /api
PassengerPython /home/votreuser/virtualenv/backend/3.13/bin/python
PassengerAppType wsgi
PassengerStartupFile servicemenager/wsgi.py
```

**1.3. Créer `passenger_wsgi.py`**

Dans `backend/passenger_wsgi.py` :

```python
import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.dirname(__file__))

# Définir le module de settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'servicemenager.settings_production')

# Importer l'application WSGI
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

#### 2. Préparer le frontend

**2.1. Build du frontend**

```bash
cd frontend
npm install
npm run build
```

Cela créera un dossier `dist/` avec les fichiers statiques.

**2.2. Configurer Vite pour la production**

Modifiez `frontend/vite.config.ts` pour pointer vers votre API :

```typescript
export default defineConfig({
  // ... config existante
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  // Ajouter la base URL pour l'API
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://votre-domaine.com/api')
  }
})
```

**2.3. Créer `.htaccess` pour le frontend**

Dans `frontend/dist/.htaccess` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### 3. Upload sur cPanel

**Structure recommandée :**

```
public_html/
├── index.html (frontend/dist/index.html)
├── assets/ (frontend/dist/assets/)
├── .htaccess (frontend)
├── backend/
│   ├── manage.py
│   ├── servicemenager/
│   ├── api/
│   ├── passenger_wsgi.py
│   ├── .htaccess
│   ├── requirements.txt
│   └── .env
└── media/ (pour les uploads Django)
```

#### 4. Configuration dans cPanel

**4.1. Créer l'application Python**

1. Allez dans cPanel → **Python App**
2. Créez une nouvelle application :
   - **App Directory** : `backend`
   - **App URL** : `/api`
   - **Python Version** : 3.13 (ou la version disponible)
   - **App Startup File** : `passenger_wsgi.py`

**4.2. Installer les dépendances**

Via SSH ou Terminal de cPanel :

```bash
cd ~/public_html/backend
source ~/virtualenv/backend/3.13/bin/activate
pip install -r requirements.txt
```

**4.3. Configuration de la base de données**

1. Créez une base de données MySQL dans cPanel
2. Créez un utilisateur et accordez les permissions
3. Configurez le fichier `.env` :

```env
SECRET_KEY=votre-secret-key-tres-longue-et-securisee
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com
DB_NAME=nom_de_votre_db
DB_USER=nom_utilisateur_db
DB_PASSWORD=mot_de_passe_db
DB_HOST=localhost
DB_PORT=3306
```

**4.4. Migrations Django**

```bash
cd ~/public_html/backend
source ~/virtualenv/backend/3.13/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
```

**4.5. Créer un superutilisateur**

```bash
python manage.py createsuperuser
```

---

## 🚀 Option 2 : Frontend sur cPanel + Backend séparé (Recommandé)

Cette option est plus simple et plus performante.

### Frontend sur cPanel

1. **Build le frontend** :
```bash
cd frontend
npm install
npm run build
```

2. **Upload le contenu de `dist/`** dans `public_html/`

3. **Créer `.htaccess`** dans `public_html/` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

4. **Configurer l'URL de l'API** dans votre code frontend pour pointer vers votre backend externe.

### Backend sur service cloud

Options populaires :
- **PythonAnywhere** (gratuit pour débuter)
- **Railway** (gratuit avec limites)
- **Heroku** (payant)
- **DigitalOcean App Platform**
- **Render** (gratuit avec limites)

---

## 📝 Checklist de déploiement

### Avant le déploiement

- [ ] Changer `DEBUG = False` en production
- [ ] Configurer `ALLOWED_HOSTS` avec votre domaine
- [ ] Générer une nouvelle `SECRET_KEY` sécurisée
- [ ] Configurer une base de données MySQL/PostgreSQL (pas SQLite)
- [ ] Mettre à jour les URLs CORS
- [ ] Configurer les emails (SMTP)
- [ ] Tester le build du frontend localement

### Après le déploiement

- [ ] Vérifier que l'API répond (`https://votre-domaine.com/api/`)
- [ ] Vérifier que le frontend charge
- [ ] Tester l'authentification
- [ ] Vérifier les uploads de fichiers (media)
- [ ] Configurer SSL/HTTPS
- [ ] Configurer les backups de la base de données
- [ ] Monitorer les logs d'erreurs

---

## 🔧 Configuration des fichiers statiques et médias

### Dans `settings.py` :

```python
# En production sur cPanel
STATIC_URL = '/static/'
STATIC_ROOT = '/home/votreuser/public_html/static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/votreuser/public_html/media/'
```

### Créer les dossiers et permissions :

```bash
mkdir -p ~/public_html/static
mkdir -p ~/public_html/media
chmod 755 ~/public_html/static
chmod 755 ~/public_html/media
```

### Configurer Apache pour servir les médias :

Dans `.htaccess` à la racine :

```apache
Alias /media /home/votreuser/public_html/media
<Directory /home/votreuser/public_html/media>
    Require all granted
</Directory>
```

---

## 🐛 Dépannage

### L'API ne répond pas

1. Vérifiez les logs dans cPanel → **Errors**
2. Vérifiez que Python App est activé
3. Vérifiez le fichier `passenger_wsgi.py`
4. Vérifiez les permissions des fichiers

### Erreur 500

1. Activez temporairement `DEBUG = True` pour voir l'erreur
2. Vérifiez les logs Django
3. Vérifiez la configuration de la base de données

### Les fichiers statiques ne se chargent pas

1. Exécutez `python manage.py collectstatic`
2. Vérifiez les permissions des dossiers
3. Vérifiez la configuration `STATIC_ROOT` et `STATIC_URL`

### CORS errors

1. Vérifiez `CORS_ALLOWED_ORIGINS` dans settings
2. Ajoutez votre domaine frontend
3. Vérifiez que `CORS_ALLOW_CREDENTIALS = True`

---

## 📚 Ressources supplémentaires

- [Documentation Django Deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [cPanel Python App Documentation](https://docs.cpanel.net/knowledge-base/web-services/guide-to-python-applications/)
- [Passenger Documentation](https://www.phusionpassenger.com/docs/)

---

## 💡 Recommandations

1. **Utilisez un VPS** si vous avez besoin de plus de contrôle
2. **Séparez frontend et backend** pour une meilleure scalabilité
3. **Utilisez un CDN** pour les fichiers statiques
4. **Configurez des backups automatiques**
5. **Utilisez un gestionnaire de processus** (PM2, Supervisor) pour le backend
6. **Activez SSL/HTTPS** (Let's Encrypt via cPanel)

---

## ❓ Questions fréquentes

**Q : Puis-je utiliser SQLite en production ?**
R : Non, SQLite n'est pas adapté pour la production. Utilisez MySQL ou PostgreSQL.

**Q : Dois-je modifier le code pour cPanel ?**
R : Principalement la configuration (settings, URLs, CORS). Le code reste le même.

**Q : Combien ça coûte ?**
R : Dépend de votre hébergeur. Un hébergement cPanel standard coûte généralement 5-20€/mois.

**Q : Puis-je tester localement avant de déployer ?**
R : Oui, testez toujours en local avec `DEBUG=False` avant de déployer.







