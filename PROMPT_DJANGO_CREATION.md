# 🚀 Prompt de création du projet Django - Services Locaux

## Prompt complet pour créer le backend Django

Copiez-collez ce prompt dans votre assistant IA ou suivez ces instructions étape par étape :

---

## 📝 PROMPT COMPLET

```
Je veux créer un projet Django REST Framework complet pour une plateforme de services à domicile appelée "Services Locaux".

CONTEXTE :
- Frontend React déjà développé qui attend des données via API REST
- TOUT doit être dynamique et géré depuis l'admin Django
- Pas de données statiques dans le code

REQUIREMENTS :
1. Créer un projet Django avec 2 apps : 'api' et 'content'
2. Configurer Django REST Framework avec CORS
3. Créer les modèles suivants avec tous les champs nécessaires :

MODÈLES À CRÉER :

1. Service
   - nom, description, description_longue (optionnel)
   - icone (string pour nom d'icône Lucide)
   - image (ImageField)
   - avantages (JSONField - array de strings)
   - duree (string, ex: "2-4 heures")
   - prix (string, ex: "À partir de 25€/heure")
   - note (DecimalField 0-5)
   - nombre_avis (IntegerField)
   - actif (BooleanField)
   - created_at, updated_at

2. Agence
   - nom, description, ville
   - adresse, telephone, email, horaires (optionnels)
   - image (ImageField requis)
   - services (ManyToMany vers Service)
   - note, nombre_avis, annee_experience, nombre_clients
   - actif (BooleanField)
   - created_at, updated_at

3. Quote (Demande de devis)
   - localisation, service, type_aide, sous_type_aide (optionnels)
   - besoins (JSONField - array)
   - destinataire (string)
   - nom, email, telephone (optionnel), message
   - statut (choices: en_attente, traite, annule)
   - created_at, updated_at

4. Contact
   - nom, email, sujet, message
   - lu (BooleanField)
   - created_at

5. ContentBlock (Contenu dynamique)
   - type (choices: hero, banner, testimonial, footer, how_it_works)
   - titre, description (optionnels)
   - contenu (JSONField)
   - image (ImageField optionnel)
   - actif, ordre
   - created_at, updated_at

ENDPOINTS API NÉCESSAIRES :

GET    /api/services/              # Liste avec pagination, recherche, filtres
GET    /api/services/:id/          # Détail
GET    /api/services/stats/        # Statistiques (total, moyenne note, total avis)
GET    /api/agencies/              # Liste avec filtres (ville, service), recherche
GET    /api/agencies/:id/           # Détail
GET    /api/agencies/stats/        # Statistiques
POST   /api/quotes/                # Créer une demande de devis
POST   /api/contact/               # Envoyer un message
GET    /api/content/               # Liste du contenu
GET    /api/content/by_type/?type=hero  # Contenu filtré par type

FONCTIONNALITÉS :
- ViewSets avec recherche, filtres, pagination
- Serializers complets
- Admin Django configuré pour tous les modèles
- CORS configuré pour localhost:5173
- Gestion des images (media/)
- Filtres : recherche par nom/description, filtre par ville, service, note
- Pagination : 10 éléments par page
- Tous les champs JSON doivent être des arrays/listes

CONFIGURATION :
- Base de données : SQLite pour développement
- Timezone : Africa/Abidjan
- Langue : fr-fr
- Media files dans media/
- Static files dans staticfiles/

ADMIN DJANGO :
- Interface admin complète pour tous les modèles
- Listes avec filtres et recherche
- Édition des champs JSON via interface admin
- Upload d'images fonctionnel

FICHIERS À CRÉER :
- requirements.txt avec toutes les dépendances
- .env.example avec les variables d'environnement
- README.md avec instructions d'installation
- Tous les fichiers Django standards (models, views, serializers, urls, admin)

IMPORTANT :
- Tout doit être prêt à l'emploi
- Code commenté en français
- Respect des conventions Django
- Gestion des erreurs appropriée
```

---

## 🎯 Instructions étape par étape

### Étape 1 : Créer l'environnement

```bash
# Créer le dossier
mkdir servicemenager-backend
cd servicemenager-backend

# Créer venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer Django et dépendances
pip install django djangorestframework django-cors-headers pillow python-decouple django-filter
```

### Étape 2 : Créer le projet

```bash
django-admin startproject servicemenager .
python manage.py startapp api
python manage.py startapp content
```

### Étape 3 : Copier le frontend

```bash
# Copier le dossier client/ du frontend dans le projet Django
cp -r ../servicemenager-main/client ./
```

### Étape 4 : Configurer settings.py

Ajouter dans `INSTALLED_APPS` :
- `'rest_framework'`
- `'corsheaders'`
- `'api'`
- `'content'`

Ajouter `'corsheaders.middleware.CorsMiddleware'` dans `MIDDLEWARE`.

Configurer CORS, MEDIA, STATIC, REST_FRAMEWORK (voir guide complet).

### Étape 5 : Créer les modèles

Créer tous les modèles dans `api/models.py` et `content/models.py` (voir guide).

### Étape 6 : Créer les serializers

Créer les serializers dans `api/serializers.py` et `content/serializers.py`.

### Étape 7 : Créer les viewsets

Créer les ViewSets dans `api/views.py` et `content/views.py`.

### Étape 8 : Configurer les URLs

Configurer les routers et URLs (voir guide).

### Étape 9 : Configurer l'admin

Créer les classes Admin pour tous les modèles.

### Étape 10 : Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Étape 11 : Tester

```bash
python manage.py runserver
# Accéder à http://localhost:8000/admin
# Créer des données de test
# Tester les endpoints API
```

---

## 📦 Structure finale attendue

```
servicemenager-backend/
├── servicemenager/
│   ├── settings.py      # Configuré avec CORS, REST, etc.
│   ├── urls.py          # Routes API + admin
│   └── wsgi.py
├── api/
│   ├── models.py        # Service, Agence, Quote, Contact
│   ├── serializers.py
│   ├── views.py         # ViewSets
│   ├── urls.py          # Router API
│   └── admin.py         # Admin configuré
├── content/
│   ├── models.py        # ContentBlock
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── client/              # Frontend React (copié)
├── media/               # Images uploadées
├── staticfiles/         # Fichiers statiques
├── manage.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## ✅ Checklist de validation

Une fois le projet créé, vérifier :

- [ ] Tous les modèles créés avec les bons champs
- [ ] Migrations créées et appliquées
- [ ] Serializers fonctionnels
- [ ] ViewSets avec recherche et filtres
- [ ] URLs configurées
- [ ] Admin Django accessible et fonctionnel
- [ ] CORS configuré
- [ ] Upload d'images fonctionnel
- [ ] Endpoints API testés avec Postman/curl
- [ ] Frontend peut se connecter à l'API
- [ ] Pagination fonctionnelle
- [ ] Recherche fonctionnelle
- [ ] Filtres fonctionnels

---

## 🧪 Tests des endpoints

```bash
# Services
curl http://localhost:8000/api/services/
curl http://localhost:8000/api/services/1/
curl http://localhost:8000/api/services/stats/

# Agences
curl http://localhost:8000/api/agencies/
curl http://localhost:8000/api/agencies/?ville=Abidjan
curl http://localhost:8000/api/agencies/stats/

# Devis
curl -X POST http://localhost:8000/api/quotes/ \
  -H "Content-Type: application/json" \
  -d '{"localisation":"Abidjan","service":"Ménage",...}'

# Contact
curl -X POST http://localhost:8000/api/contact/ \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","email":"test@test.com",...}'
```

---

## 🎉 Résultat attendu

Un backend Django complet, prêt à servir le frontend React avec :
- ✅ Toutes les données dynamiques
- ✅ Admin Django pour gérer le contenu
- ✅ API REST complète
- ✅ Gestion des images
- ✅ Recherche et filtres
- ✅ Pagination
- ✅ CORS configuré

Le frontend pourra alors remplacer toutes les données mockées par des appels API réels !







