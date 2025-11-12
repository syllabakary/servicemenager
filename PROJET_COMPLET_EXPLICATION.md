# 📚 Explication complète du projet Services Locaux

## 🎯 Vue d'ensemble

**Services Locaux** est une plateforme web complète permettant aux utilisateurs de :
- Découvrir des services à domicile (ménage, garde d'enfants, jardinage, etc.)
- Trouver des agences partenaires par ville ou par service
- Demander des devis personnalisés via un formulaire multi-étapes
- Contacter directement les agences

---

## 🏗️ Architecture actuelle

### Frontend (React + TypeScript)
- **Localisation** : `client/` dans le projet actuel
- **Technologies** : React 18, Vite, TypeScript, Tailwind CSS, Shadcn/UI
- **État** : ✅ **Complètement développé** avec données mockées
- **Fonctionnalités** : Toutes les pages et composants sont fonctionnels

### Backend (À créer avec Django)
- **État** : ❌ **À développer**
- **Objectif** : Remplacer toutes les données mockées par des données dynamiques depuis une API REST

---

## 📄 Pages et fonctionnalités détaillées

### 1. **Page d'accueil** (`/`)

**Fonctionnalités** :
- Hero section avec image de fond, titre, description, CTA
- Bannière promotionnelle (crédit d'impôt)
- Section "Nos services" : Affiche les 3 premiers services
- Section "Nos agences" : Affiche les 3 premières agences
- Section "Comment ça marche" : 3 étapes avec icônes
- Section témoignages : Avis clients avec photos
- CTA final : Bouton pour demander un devis

**Données nécessaires depuis l'API** :
```json
GET /api/services/?limit=3
GET /api/agencies/?limit=3
GET /api/content/?type=hero
GET /api/content/?type=banner
GET /api/content/?type=testimonial
GET /api/content/?type=how_it_works
```

---

### 2. **Page Services** (`/services`)

**Fonctionnalités** :
- Header avec image de fond et texte
- Section statistiques : Total services, note moyenne, total avis
- Barre de recherche : Recherche en temps réel par nom, description, avantages
- Filtres : Note minimale (4.5+, 4.0+, 3.5+, Toutes)
- Grille de cartes services avec :
  - Icône du service
  - Note et nombre d'avis (badge jaune)
  - Description
  - 3 premiers avantages avec checkmarks
  - Durée et prix
  - Bouton "Voir les détails"

**Données nécessaires** :
```json
GET /api/services/?search=ménage&minRating=4.5
GET /api/services/stats/
```

**Champs Service** :
- `id`, `nom`, `description`, `icone`, `image`
- `avantages` (array), `duree`, `prix`
- `note`, `nombre_avis`, `actif`

---

### 3. **Page Détail Service** (`/services/:id`)

**Fonctionnalités** :
- Header avec image de fond et badge
- Description complète
- Tous les avantages listés
- Informations : Durée, prix, note, avis
- Section "Pourquoi choisir ce service"
- CTA pour demander un devis

**Données nécessaires** :
```json
GET /api/services/:id/
```

---

### 4. **Page Agences** (`/agences`)

**Fonctionnalités** :
- Header avec image de fond
- Section statistiques : 5 cartes (agences, note, avis, clients, expérience)
- Barre de recherche : Par nom, description, services
- Filtres : Par ville (dropdown), par service (dropdown)
- Grille de cartes agences avec :
  - Image de l'agence
  - Nom et ville (badge)
  - Note et nombre d'avis
  - Description
  - Services proposés (badges)
  - Horaires et années d'expérience
  - Bouton "Voir les détails"

**Données nécessaires** :
```json
GET /api/agencies/?ville=Abidjan&service=Ménage&search=...
GET /api/agencies/stats/
```

**Champs Agence** :
- `id`, `nom`, `description`, `ville`, `image`
- `telephone`, `email`, `horaires`, `adresse`
- `services` (ManyToMany vers Service)
- `note`, `nombre_avis`, `annee_experience`, `nombre_clients`
- `actif`

---

### 5. **Page Détail Agence** (`/agences/:id`)

**Fonctionnalités** :
- Header avec image, badge ville, nom
- Informations de contact :
  - Adresse avec icône
  - Téléphone (lien cliquable)
  - Email (lien cliquable)
  - Horaires
- Services proposés (liste complète)
- Description détaillée
- CTA pour demander un devis

**Données nécessaires** :
```json
GET /api/agencies/:id/
```

---

### 6. **Page Demande de Devis** (`/devis`) - Formulaire multi-étapes

#### **Étape 1 : Localisation**
- Champ texte pour saisir la localisation
- Affichage dynamique des services disponibles selon la région
- Logique de détection : France, Côte d'Ivoire, villes spécifiques (Abidjan, Bouaké, etc.)

#### **Étape 2 : Service**
- Sélection du service principal parmi ceux disponibles dans la région

#### **Étape 3 : Type d'aide**
- Radio buttons : "Aide aux personnes âgées", "Garde d'enfants", "Ménage et entretien", "Jardinage", "Autre"

#### **Étape 4 : Sous-type d'aide** (si applicable)
- Sélection d'un sous-type selon le type choisi
- Exemples : "Accompagnement du handicap", "Garde régulière", "Ménage régulier", etc.

#### **Étape 5 : Besoins**
- Checkboxes multiples : Toilette, Aide au repas, Livraison de repas, Ménage, Accompagnement quotidien, Soins médicaux, Transport, Courses

#### **Étape 6 : Destinataire**
- Radio buttons : "Pour vous", "Pour un parent", "Pour quelqu'un d'autre"

#### **Étape 7 : Coordonnées**
- Formulaire de contact :
  - Nom (requis, min 2 caractères)
  - Email (requis, format email)
  - Téléphone (optionnel)
  - Message (requis, min 10 caractères)

**Envoi des données** :
```json
POST /api/quotes/
{
  "localisation": "Abidjan",
  "service": "Ménage",
  "type_aide": "Ménage et entretien",
  "sous_type_aide": "Ménage régulier",
  "besoins": ["Toilette", "Ménage", "Courses"],
  "destinataire": "moi",
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "telephone": "+225 07 12 34 56 78",
  "message": "J'aimerais un devis pour..."
}
```

**Données nécessaires pour la logique** :
- Mapping services par région (peut être dans ContentBlock ou config)
- Types d'aide et sous-types (peut être dans ContentBlock ou config)
- Liste des besoins disponibles (peut être dans ContentBlock ou config)

---

### 7. **Page Contact** (`/contact`)

**Fonctionnalités** :
- Formulaire de contact :
  - Nom complet
  - Email
  - Sujet
  - Message
- Informations de contact :
  - Adresse
  - Téléphone
  - Email
- Horaires d'ouverture

**Envoi des données** :
```json
POST /api/contact/
{
  "nom": "Marie Martin",
  "email": "marie@example.com",
  "sujet": "Question générale",
  "message": "Bonjour, j'aimerais..."
}
```

**Données nécessaires** :
- Informations de contact (peut être dans ContentBlock type "footer")

---

### 8. **Navigation** (`Navbar.tsx`)

**Fonctionnalités** :
- Menu principal :
  - Accueil
  - Services (dropdown multi-niveaux)
  - Agences (dropdown multi-niveaux)
  - Contact
  - Bouton "Demander un devis"
- Menu mobile responsive
- Dropdown Services avec sous-menus :
  - Garde d'enfants → Sous-options
  - Ménage et repassage → Sous-options
  - Jardinage → Sous-options
  - Peinture → Sous-options
  - Sécurité → Sous-options
  - Déménagement → Sous-options
- Dropdown Agences avec sous-menus :
  - Par ville → Sous-options
  - Par service → Sous-options
  - Recherche → Sous-options

**Données nécessaires** :
- Structure des menus (peut être statique ou dans ContentBlock)

---

## 🎨 Design et Style

### Palette de couleurs
- **Primaire** : `#A0522D` (Sienna/Brun)
- **Primaire foncé** : `#8B4513` (SaddleBrown)
- **Accent** : `#FFD700` (Or)
- **Fond** : Dégradés de gris et blanc

### Composants UI
- **Shadcn/UI** : Tous les composants (Button, Card, Input, etc.)
- **Animations** : Framer Motion pour les transitions
- **Responsive** : Mobile-first design
- **Icônes** : Lucide React

---

## 📡 API Endpoints nécessaires

### Services
```
GET    /api/services/                    # Liste avec pagination
GET    /api/services/?limit=3           # Limité pour accueil
GET    /api/services/:id/                # Détail
GET    /api/services/?search=ménage     # Recherche
GET    /api/services/?minRating=4.5     # Filtre par note
GET    /api/services/stats/             # Statistiques
```

### Agences
```
GET    /api/agencies/                    # Liste avec pagination
GET    /api/agencies/?limit=3            # Limité pour accueil
GET    /api/agencies/:id/                 # Détail
GET    /api/agencies/?ville=Abidjan      # Filtre par ville
GET    /api/agencies/?service=Ménage    # Filtre par service
GET    /api/agencies/?search=...         # Recherche
GET    /api/agencies/stats/              # Statistiques
```

### Devis
```
POST   /api/quotes/                      # Créer une demande
GET    /api/quotes/:id/                  # Détail (admin)
```

### Contact
```
POST   /api/contact/                     # Envoyer un message
GET    /api/contact/:id/                # Détail (admin)
```

### Contenu dynamique
```
GET    /api/content/                     # Liste
GET    /api/content/?type=hero           # Par type
GET    /api/content/by_type/?type=banner # Alternative
```

---

## 🗄️ Modèles de données Django

### Service
```python
{
  "id": 1,
  "nom": "Nettoyage résidentiel",
  "description": "Un service complet...",
  "description_longue": "...",
  "icone": "Sparkles",
  "image": "/media/services/nettoyage.jpg",
  "avantages": [
    "Aides-ménagères qualifiées",
    "Prestations personnalisables",
    "Aucune gestion administrative"
  ],
  "duree": "2-4 heures",
  "prix": "À partir de 25€/heure",
  "note": 4.8,
  "nombre_avis": 1245,
  "actif": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Agence
```python
{
  "id": 1,
  "nom": "ProNet Abidjan",
  "description": "Experts du nettoyage...",
  "ville": "Abidjan",
  "adresse": "Plateau, Abidjan",
  "telephone": "+225 07 12 34 56 78",
  "email": "contact@pronet-abidjan.ci",
  "horaires": "Lun - Ven: 8h - 18h | Sam: 9h - 15h",
  "image": "/media/agences/pronet.jpg",
  "services": [1, 2, 3],  # IDs des services
  "note": 4.8,
  "nombre_avis": 1245,
  "annee_experience": 12,
  "nombre_clients": 3500,
  "actif": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Quote (Demande de devis)
```python
{
  "id": 1,
  "localisation": "Abidjan",
  "service": "Ménage",
  "type_aide": "Ménage et entretien",
  "sous_type_aide": "Ménage régulier",
  "besoins": ["Toilette", "Ménage", "Courses"],
  "destinataire": "moi",
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "telephone": "+225 07 12 34 56 78",
  "message": "J'aimerais un devis...",
  "statut": "en_attente",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### ContentBlock
```python
{
  "id": 1,
  "type": "hero",
  "titre": "Des services pensés pour vous",
  "description": "Découvrez notre gamme...",
  "contenu": {
    "cta_text": "Obtenez votre devis personnalisé",
    "cta_link": "/devis"
  },
  "image": "/media/content/hero.jpg",
  "actif": true,
  "ordre": 1
}
```

---

## 🔄 Migration Frontend → Backend

### Actuellement (Frontend)
- ✅ Toutes les données sont **mockées** dans les composants
- ✅ Pas de vraie API
- ✅ Images statiques dans `/public`
- ✅ Recherche et filtres côté client uniquement

### Après intégration Backend
- ✅ **API REST** Django pour toutes les données
- ✅ **Base de données** pour stocker tout
- ✅ **Admin Django** pour gérer le contenu
- ✅ **Upload d'images** pour services et agences
- ✅ **Recherche et filtres** côté serveur
- ✅ **Envoi d'emails** pour devis et contact

### Modifications nécessaires dans le Frontend

1. **Remplacer les données mockées** :
   - `Home.tsx` : Utiliser `useQuery` avec `/api/services/?limit=3`
   - `Services.tsx` : Utiliser `/api/services/` avec filtres
   - `Agencies.tsx` : Utiliser `/api/agencies/` avec filtres

2. **Mettre à jour les appels API** :
   - Dans `queryClient.ts`, configurer la base URL de l'API
   - Remplacer les `mockServices` et `mockAgencies` par des appels API

3. **Gestion des images** :
   - Les images seront servies depuis `/media/` du backend
   - URLs complètes : `http://localhost:8000/media/services/image.jpg`

---

## ✅ Checklist de développement Backend

- [ ] Créer le projet Django avec les apps `api` et `content`
- [ ] Configurer Django REST Framework et CORS
- [ ] Créer tous les modèles (Service, Agence, Quote, Contact, ContentBlock)
- [ ] Créer les serializers
- [ ] Créer les ViewSets avec recherche, filtres, pagination
- [ ] Configurer les URLs
- [ ] Configurer l'admin Django
- [ ] Tester tous les endpoints
- [ ] Configurer l'upload d'images
- [ ] Créer des données de test
- [ ] Intégrer avec le frontend
- [ ] Tester le formulaire de devis
- [ ] Tester le formulaire de contact
- [ ] Configurer l'envoi d'emails (optionnel)

---

## 📞 Support

Pour toute question sur :
- **Frontend** : Voir `README.md`
- **Backend Django** : Voir `DJANGO_BACKEND_GUIDE.md`
- **Création du projet** : Voir `PROMPT_DJANGO_CREATION.md`

---

**Le projet est prêt à être développé ! Tous les documents nécessaires sont disponibles.**




