# Guide de développement Backend Django - Services Locaux

## 🎯 Objectif

Créer un backend Django complet pour la plateforme **Services Locaux** qui servira toutes les données dynamiquement au frontend React. **TOUT** doit être géré depuis l'admin Django : services, agences, images, textes, contenu de la page d'accueil, etc.

---

## 📋 Prérequis

- Python 3.10+
- Django 4.2+
- Django REST Framework
- PostgreSQL ou MySQL (recommandé) / SQLite (développement)
- pip, virtualenv

---

## 🚀 Installation et création du projet

### 1. Créer l'environnement virtuel

```bash
# Créer le dossier du projet
mkdir servicemenager-backend
cd servicemenager-backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Installer les dépendances
pip install django djangorestframework django-cors-headers pillow python-decouple django-filter
```

### 2. Créer le projet Django

```bash
django-admin startproject servicemenager .
python manage.py startapp api
python manage.py startapp content
```

### 3. Structure du projet

```
servicemenager-backend/
├── servicemenager/          # Configuration du projet
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/                     # App principale pour Services, Agences, Devis, Contact
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── content/                 # App pour le contenu dynamique (Hero, Bannière, etc.)
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── media/                   # Images uploadées
├── static/                  # Fichiers statiques
├── client/                  # Frontend React (à copier ici)
├── manage.py
└── requirements.txt
```

---

## ⚙️ Configuration Django

### `servicemenager/settings.py`

```python
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'corsheaders',
    
    # Local apps
    'api',
    'content',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS avant CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'servicemenager.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'servicemenager.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        # Pour PostgreSQL :
        # 'ENGINE': 'django.db.backends.postgresql',
        # 'NAME': config('DB_NAME', default='servicemenager'),
        # 'USER': config('DB_USER', default='postgres'),
        # 'PASSWORD': config('DB_PASSWORD', default=''),
        # 'HOST': config('DB_HOST', default='localhost'),
        # 'PORT': config('DB_PORT', default='5432'),
    }
}

# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Abidjan'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
    # Ajouter le domaine de production
]

CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

---

## 📦 Modèles de données

### `api/models.py`

```python
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Service(models.Model):
    """Modèle pour les services proposés"""
    nom = models.CharField(max_length=200)
    description = models.TextField()
    description_longue = models.TextField(blank=True, null=True)
    icone = models.CharField(
        max_length=50,
        help_text="Nom de l'icône Lucide (ex: Sparkles, Baby, TreeDeciduous)"
    )
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    avantages = models.JSONField(
        default=list,
        help_text="Liste des avantages (array de strings)"
    )
    duree = models.CharField(
        max_length=100,
        help_text="Ex: '2-4 heures', 'Sur mesure'"
    )
    prix = models.CharField(
        max_length=100,
        help_text="Ex: 'À partir de 25€/heure'"
    )
    note = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        default=0
    )
    nombre_avis = models.IntegerField(default=0)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self):
        return self.nom


class Agence(models.Model):
    """Modèle pour les agences partenaires"""
    nom = models.CharField(max_length=200)
    description = models.TextField()
    ville = models.CharField(max_length=100)
    adresse = models.TextField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    horaires = models.CharField(max_length=200, blank=True, null=True)
    image = models.ImageField(upload_to='agences/')
    services = models.ManyToManyField(
        Service,
        related_name='agences',
        help_text="Services proposés par cette agence"
    )
    note = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    nombre_avis = models.IntegerField(default=0)
    annee_experience = models.IntegerField(default=0)
    nombre_clients = models.IntegerField(default=0)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Agence"
        verbose_name_plural = "Agences"

    def __str__(self):
        return f"{self.nom} - {self.ville}"


class Quote(models.Model):
    """Modèle pour les demandes de devis"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('traite', 'Traité'),
        ('annule', 'Annulé'),
    ]
    
    localisation = models.CharField(max_length=200)
    service = models.CharField(max_length=200)
    type_aide = models.CharField(max_length=200, blank=True, null=True)
    sous_type_aide = models.CharField(max_length=200, blank=True, null=True)
    besoins = models.JSONField(default=list)
    destinataire = models.CharField(max_length=50)
    nom = models.CharField(max_length=200)
    email = models.EmailField()
    telephone = models.CharField(max_length=20, blank=True, null=True)
    message = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande de devis"
        verbose_name_plural = "Demandes de devis"

    def __str__(self):
        return f"Devis de {self.nom} - {self.service}"


class Contact(models.Model):
    """Modèle pour les messages de contact"""
    nom = models.CharField(max_length=200)
    email = models.EmailField()
    sujet = models.CharField(max_length=200)
    message = models.TextField()
    lu = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"

    def __str__(self):
        return f"{self.nom} - {self.sujet}"
```

### `content/models.py`

```python
from django.db import models


class ContentBlock(models.Model):
    """Modèle pour le contenu dynamique (Hero, Bannière, Témoignages, etc.)"""
    TYPE_CHOICES = [
        ('hero', 'Hero Section'),
        ('banner', 'Bannière promotionnelle'),
        ('testimonial', 'Témoignage'),
        ('footer', 'Footer'),
        ('how_it_works', 'Comment ça marche'),
    ]
    
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    contenu = models.JSONField(
        default=dict,
        help_text="Contenu structuré en JSON"
    )
    image = models.ImageField(upload_to='content/', blank=True, null=True)
    actif = models.BooleanField(default=True)
    ordre = models.IntegerField(default=0, help_text="Ordre d'affichage")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordre', '-created_at']
        verbose_name = "Bloc de contenu"
        verbose_name_plural = "Blocs de contenu"

    def __str__(self):
        return f"{self.get_type_display()} - {self.titre or 'Sans titre'}"
```

---

## 🔄 Serializers

### `api/serializers.py`

```python
from rest_framework import serializers
from .models import Service, Agence, Quote, Contact


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            'id', 'nom', 'description', 'description_longue',
            'icone', 'image', 'avantages', 'duree', 'prix',
            'note', 'nombre_avis', 'actif', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AgenceSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    services_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.all(),
        source='services',
        write_only=True,
        required=False
    )

    class Meta:
        model = Agence
        fields = [
            'id', 'nom', 'description', 'ville', 'adresse',
            'telephone', 'email', 'horaires', 'image',
            'services', 'services_ids', 'note', 'nombre_avis',
            'annee_experience', 'nombre_clients', 'actif',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            'id', 'localisation', 'service', 'type_aide',
            'sous_type_aide', 'besoins', 'destinataire',
            'nom', 'email', 'telephone', 'message', 'statut',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'statut']


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'nom', 'email', 'sujet', 'message', 'lu', 'created_at']
        read_only_fields = ['lu', 'created_at']
```

### `content/serializers.py`

```python
from rest_framework import serializers
from .models import ContentBlock


class ContentBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBlock
        fields = [
            'id', 'type', 'titre', 'description', 'contenu',
            'image', 'actif', 'ordre', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
```

---

## 🎯 Views / ViewSets

### `api/views.py`

```python
from django.db import models
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Service, Agence, Quote, Contact
from .serializers import (
    ServiceSerializer, AgenceSerializer,
    QuoteSerializer, ContactSerializer
)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(actif=True)
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['actif']
    # Note: La recherche dans 'avantages' (JSONField) nécessite un filtre personnalisé
    # Pour l'instant, la recherche fonctionne sur 'nom' et 'description'
    search_fields = ['nom', 'description']
    ordering_fields = ['nom', 'note', 'created_at']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retourne les statistiques des services"""
        total = self.queryset.count()
        avg_rating = self.queryset.aggregate(
            avg=models.Avg('note')
        )['avg'] or 0
        total_reviews = self.queryset.aggregate(
            total=models.Sum('nombre_avis')
        )['total'] or 0
        
        return Response({
            'total_services': total,
            'avg_rating': round(float(avg_rating), 1),
            'total_reviews': total_reviews
        })


class AgenceViewSet(viewsets.ModelViewSet):
    queryset = Agence.objects.filter(actif=True)
    serializer_class = AgenceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ville', 'actif']
    search_fields = ['nom', 'description', 'ville']
    ordering_fields = ['nom', 'ville', 'note', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        service = self.request.query_params.get('service', None)
        if service:
            queryset = queryset.filter(services__nom__icontains=service)
        return queryset.distinct()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retourne les statistiques des agences"""
        total = self.queryset.count()
        avg_rating = self.queryset.aggregate(
            avg=models.Avg('note')
        )['avg'] or 0
        total_reviews = self.queryset.aggregate(
            total=models.Sum('nombre_avis')
        )['total'] or 0
        total_clients = self.queryset.aggregate(
            total=models.Sum('nombre_clients')
        )['total'] or 0
        total_experience = self.queryset.aggregate(
            total=models.Sum('annee_experience')
        )['total'] or 0
        
        return Response({
            'total_agencies': total,
            'avg_rating': round(float(avg_rating), 1),
            'total_reviews': total_reviews,
            'total_clients': total_clients,
            'total_experience': total_experience
        })


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    http_method_names = ['post', 'get']  # Seulement création et lecture

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Ici, vous pouvez envoyer un email de notification
        # send_quote_notification_email(serializer.instance)
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    http_method_names = ['post', 'get']  # Seulement création et lecture

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Ici, vous pouvez envoyer un email de notification
        # send_contact_notification_email(serializer.instance)
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
```

### `content/views.py`

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ContentBlock
from .serializers import ContentBlockSerializer


class ContentBlockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ContentBlock.objects.filter(actif=True)
    serializer_class = ContentBlockSerializer
    lookup_field = 'type'

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Retourne tous les blocs d'un type donné"""
        content_type = request.query_params.get('type', None)
        if content_type:
            blocks = self.queryset.filter(type=content_type)
            serializer = self.get_serializer(blocks, many=True)
            return Response(serializer.data)
        return Response([])
```

---

## 🔗 URLs

### `api/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, AgenceViewSet, QuoteViewSet, ContactViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'agencies', AgenceViewSet, basename='agence')
router.register(r'quotes', QuoteViewSet, basename='quote')
router.register(r'contact', ContactViewSet, basename='contact')

urlpatterns = [
    path('', include(router.urls)),
]
```

### `content/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContentBlockViewSet

router = DefaultRouter()
router.register(r'content', ContentBlockViewSet, basename='content')

urlpatterns = [
    path('', include(router.urls)),
]
```

### `servicemenager/urls.py`

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/', include('content.urls')),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

---

## 👨‍💼 Admin Django

### `api/admin.py`

```python
from django.contrib import admin
from .models import Service, Agence, Quote, Contact


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'note', 'nombre_avis', 'actif', 'created_at']
    list_filter = ['actif', 'created_at']
    search_fields = ['nom', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Agence)
class AgenceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'ville', 'note', 'actif', 'created_at']
    list_filter = ['ville', 'actif', 'created_at']
    search_fields = ['nom', 'ville', 'description']
    filter_horizontal = ['services']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'service', 'statut', 'created_at']
    list_filter = ['statut', 'created_at']
    search_fields = ['nom', 'email', 'service']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'sujet', 'lu', 'created_at']
    list_filter = ['lu', 'created_at']
    search_fields = ['nom', 'email', 'sujet']
    readonly_fields = ['created_at']
```

### `content/admin.py`

```python
from django.contrib import admin
from .models import ContentBlock


@admin.register(ContentBlock)
class ContentBlockAdmin(admin.ModelAdmin):
    list_display = ['type', 'titre', 'actif', 'ordre', 'created_at']
    list_filter = ['type', 'actif', 'created_at']
    search_fields = ['titre', 'description']
    readonly_fields = ['created_at', 'updated_at']
```

---

## 🗄️ Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

---

## 🧪 Commandes utiles

```bash
# Lancer le serveur de développement
python manage.py runserver

# Créer un superutilisateur
python manage.py createsuperuser

# Collecter les fichiers statiques
python manage.py collectstatic

# Shell Django
python manage.py shell
```

---

## 📝 Notes importantes

1. **django-filter** : Déjà inclus dans les dépendances pour les filtres avancés
2. **Gestion des images** : Utiliser `Pillow` (déjà dans les dépendances)
3. **Recherche dans JSONField** : La recherche dans les champs JSONField (comme `avantages`) nécessite un filtre personnalisé. Pour l'instant, la recherche fonctionne sur les champs texte standards. Exemple de filtre personnalisé :
   ```python
   # Dans api/filters.py
   from django_filters import rest_framework as filters
   from .models import Service
   
   class ServiceFilter(filters.FilterSet):
       avantage = filters.CharFilter(method='filter_avantage')
       
       def filter_avantage(self, queryset, name, value):
           return queryset.filter(avantages__icontains=value)
       
       class Meta:
           model = Service
           fields = ['actif']
   ```
4. **Emails** : Configurer SMTP dans `settings.py` pour envoyer des notifications
5. **Production** : Utiliser `gunicorn`, `whitenoise` pour les fichiers statiques
6. **Sécurité** : Changer `SECRET_KEY`, configurer `ALLOWED_HOSTS` en production
7. **Pagination** : La pagination est configurée à 10 éléments par page, ajustable via `?page_size=20`

---

## 🔗 Endpoints API disponibles

Une fois le backend configuré, les endpoints suivants seront disponibles :

```
GET    /api/services/              # Liste des services
GET    /api/services/:id/          # Détail d'un service
GET    /api/services/stats/        # Statistiques
GET    /api/agencies/              # Liste des agences
GET    /api/agencies/:id/           # Détail d'une agence
GET    /api/agencies/stats/         # Statistiques
POST   /api/quotes/                # Créer une demande de devis
POST   /api/contact/                # Envoyer un message
GET    /api/content/                # Liste du contenu
GET    /api/content/by_type/?type=hero  # Contenu par type
```

---

## ✅ Checklist de déploiement

- [ ] Configurer la base de données (PostgreSQL recommandé)
- [ ] Configurer les variables d'environnement (.env)
- [ ] Configurer CORS pour le frontend
- [ ] Tester tous les endpoints
- [ ] Configurer l'envoi d'emails
- [ ] Configurer le stockage des images (local ou cloud)
- [ ] Sécuriser l'admin Django
- [ ] Configurer les logs
- [ ] Déployer avec Gunicorn + Nginx

---

Ce guide vous donne toutes les bases pour créer le backend Django complet. Adaptez selon vos besoins spécifiques !

