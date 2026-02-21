# 📋 Fonctionnement des Services et Devis

## 🎯 Vue d'ensemble

Votre application gère deux éléments principaux :
1. **Services** : Les prestations proposées (ménage, garde d'enfants, jardinage, etc.)
2. **Devis (QuoteRequest)** : Les demandes de devis créées par les clients

---

## 🛠️ Comment les SERVICES sont créés

### 1. Modèle de données (Backend)

Un **Service** contient :
- **Informations de base** : nom, slug, descriptions (courte et détaillée)
- **Image** : photo du service
- **Catégorie** : classification du service (optionnel)
- **Tarification** : prix par heure, label de prix, devise (EUR, USD, FCFA)
- **Durée** : temps estimé (ex: "2-4 heures")
- **Statut** : actif/inactif (seuls les actifs apparaissent sur le site)
- **Ordre d'affichage** : pour trier les services
- **Avis** : note moyenne et nombre d'avis
- **FAQ** : questions fréquentes
- **Caractéristiques** : liste JSON des features
- **Garanties** : liste JSON des garanties
- **Processus** : étapes du service (JSON)
- **Agences** : agences où le service est disponible (Many-to-Many)

### 2. Création d'un service

#### Via l'API (Backend)

**Endpoint** : `POST /api/services/`

**Permissions** : Seuls les **ADMIN** et **SUPERADMIN** peuvent créer des services

**Exemple de requête** :
```json
{
  "name": "Ménage à domicile",
  "short_description": "Service de ménage professionnel",
  "detailed_description": "Description complète...",
  "category": 1,
  "price_per_hour": 25.00,
  "currency": "EUR",
  "duration": "2-4 heures",
  "active": true,
  "order": 1,
  "features": ["Professionnels certifiés", "Matériel fourni"],
  "guarantees": ["Satisfaction garantie", "Assurance incluse"]
}
```

#### Via Django Admin

1. Accéder à `http://localhost:8000/admin/`
2. Se connecter avec un compte Admin/SuperAdmin
3. Aller dans **API > Services**
4. Cliquer sur **"Ajouter un service"**
5. Remplir le formulaire
6. Sauvegarder

#### Via le frontend (si interface admin créée)

L'interface admin permet de créer/modifier les services directement depuis le site.

### 3. Affichage des services

**Endpoint public** : `GET /api/services/`

- Seuls les services avec `active=True` sont visibles pour les visiteurs non authentifiés
- Les admins voient tous les services (actifs et inactifs)
- Les services sont triés par `order` puis par `name`

---

## 💰 Comment les DEVIS sont créés

### 1. Modèle de données (Backend)

Un **QuoteRequest** (Demande de devis) contient :

**Informations client** :
- `client_name` : Nom complet
- `client_email` : Email
- `client_phone` : Téléphone

**Informations de localisation** :
- `location` : Adresse complète
- `location_lat` / `location_lng` : Coordonnées GPS (optionnel)

**Service demandé** :
- `service` : Référence au service (ForeignKey)

**Informations supplémentaires** :
- `additional_info` : JSON avec les réponses du formulaire dynamique
- `calculated_price` : Prix calculé automatiquement depuis les choix
- `discount_percentage` : Réduction appliquée (%)

**Statut** :
- `status` : PENDING, CONTACTED, QUOTED, ACCEPTED, REJECTED, COMPLETED
- `contacted_at` : Date de contact
- `quoted_at` : Date d'envoi du devis
- `admin_notes` : Notes internes

### 2. Système de formulaire dynamique

Le système utilise un **formulaire multi-étapes configurable** :

#### Structure

1. **QuoteFormStep** : Définit une étape du formulaire
   - `service` : Service associé
   - `step_type` : Type d'étape (LOCATION, SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT_INPUT, CONTACT)
   - `title` : Titre de l'étape
   - `description` : Description/instructions
   - `order` : Ordre d'affichage
   - `field_key` : Clé pour stocker la réponse (ex: "typeAide", "besoins")
   - `required` : Obligatoire ou non

2. **QuoteFormOption** : Options de choix pour les étapes
   - `step` : Étape parente
   - `parent` : Option parente (pour hiérarchie infinie)
   - `label` : Texte affiché
   - `value` : Valeur stockée
   - `price` : Prix associé à cette option
   - `price_enabled` : Si le prix doit être ajouté au total
   - `order` : Ordre d'affichage
   - `allow_custom_text` : Permettre texte personnalisé

#### Exemple de configuration

**Étape 1 - Localisation** :
```json
{
  "step_type": "LOCATION",
  "title": "Où avez-vous besoin du service ?",
  "field_key": "location",
  "order": 1
}
```

**Étape 2 - Type d'aide** :
```json
{
  "step_type": "SINGLE_CHOICE",
  "title": "Quel type d'aide souhaitez-vous ?",
  "field_key": "typeAide",
  "order": 2,
  "options": [
    {"label": "Ménage complet", "value": "menage_complet", "price": 50.00},
    {"label": "Repassage", "value": "repassage", "price": 25.00},
    {"label": "Autre", "value": "autre", "allow_custom_text": true}
  ]
}
```

**Étape 3 - Besoins** :
```json
{
  "step_type": "MULTIPLE_CHOICE",
  "title": "Quels sont vos besoins ?",
  "field_key": "besoins",
  "order": 3,
  "options": [
    {"label": "Aspirateur", "value": "aspirateur", "price": 5.00},
    {"label": "Nettoyage vitres", "value": "vitres", "price": 10.00}
  ]
}
```

### 3. Création d'un devis

#### Via le frontend (Client)

**Page** : `/devis?service=1` (ID du service)

**Processus** :
1. Client sélectionne un service
2. Le formulaire charge les étapes configurées pour ce service
3. Client remplit les étapes une par une :
   - Localisation (avec géolocalisation optionnelle)
   - Choix du service/options
   - Sous-options (si hiérarchie)
   - Coordonnées de contact
4. Le prix est calculé en temps réel selon les choix
5. Soumission du formulaire

**Endpoint** : `POST /api/quote-requests/`

**Exemple de données envoyées** :
```json
{
  "service": 1,
  "location": "123 Rue Example, Paris 75001",
  "location_lat": 48.8566,
  "location_lng": 2.3522,
  "client_name": "Jean Dupont",
  "client_email": "jean@example.com",
  "client_phone": "+33123456789",
  "additional_info": {
    "typeAide": "menage_complet",
    "besoins": ["aspirateur", "vitres"],
    "frequence": "hebdomadaire"
  },
  "calculated_price": 65.00
}
```

#### Calcul automatique du prix

Le frontend calcule le prix total en additionnant :
- Prix de base du service (si défini)
- Prix des options sélectionnées (si `price_enabled=true`)
- Application d'une réduction (si définie)

**Exemple** :
- Service de base : 50€
- Option "Aspirateur" : +5€
- Option "Nettoyage vitres" : +10€
- **Total calculé** : 65€

### 4. Gestion des devis (Admin)

#### Endpoints disponibles

- `GET /api/quote-requests/` : Liste tous les devis
- `GET /api/quote-requests/{id}/` : Détail d'un devis
- `PATCH /api/quote-requests/{id}/` : Modifier un devis
- `PATCH /api/quote-requests/{id}/mark_contacted/` : Marquer comme contacté
- `PATCH /api/quote-requests/{id}/mark_quoted/` : Marquer comme devis envoyé

#### Workflow typique

1. **PENDING** : Devis créé, en attente
2. **CONTACTED** : Client contacté par l'équipe
3. **QUOTED** : Devis envoyé au client
4. **ACCEPTED** : Client a accepté le devis
5. **REJECTED** : Client a refusé
6. **COMPLETED** : Service terminé

### 5. Génération de factures

Une fois le devis accepté, l'admin peut créer une **Facture (Invoice)** :

**Endpoint** : `POST /api/invoices/`

**Données** :
```json
{
  "quote_request": 1,
  "subtotal": 65.00,
  "tax_rate": 20.00,
  "currency": "EUR",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15"
}
```

**Fonctionnalités** :
- Génération automatique du numéro de facture (ex: FACT-2024-0001)
- Calcul automatique de la TVA
- Génération PDF : `GET /api/invoices/{id}/pdf/`
- Envoi par email : `POST /api/invoices/{id}/send_email/`

---

## 🔄 Flux complet : De la création du service au devis

### Étape 1 : Créer un service (Admin)

1. Admin crée un service "Ménage à domicile"
2. Configure le prix de base : 25€/heure
3. Ajoute des caractéristiques, garanties, FAQ

### Étape 2 : Configurer le formulaire de devis (Admin)

1. Admin crée des **QuoteFormStep** pour ce service :
   - Étape 1 : Localisation
   - Étape 2 : Type de ménage (choix unique)
   - Étape 3 : Options supplémentaires (choix multiples)
   - Étape 4 : Coordonnées

2. Pour chaque étape, crée des **QuoteFormOption** :
   - "Ménage complet" : +30€
   - "Repassage inclus" : +15€
   - "Nettoyage vitres" : +10€

### Étape 3 : Client demande un devis

1. Client va sur `/devis?service=1`
2. Remplit le formulaire étape par étape
3. Voit le prix se calculer en temps réel
4. Soumet le formulaire

### Étape 4 : Traitement par l'admin

1. Admin reçoit la notification (email ou dashboard)
2. Consulte le devis dans `/admin/quote-requests/`
3. Contacte le client si nécessaire
4. Envoie un devis personnalisé (ou utilise le prix calculé)
5. Marque le statut comme "QUOTED"

### Étape 5 : Génération de facture (si accepté)

1. Client accepte le devis
2. Admin crée une facture depuis le devis
3. Génère le PDF
4. Envoie par email au client

---

## 📊 Permissions et accès

### Services

- **Public** : Lecture seule des services actifs
- **Client** : Lecture seule des services actifs
- **Admin/SuperAdmin** : CRUD complet (créer, lire, modifier, supprimer)

### Devis

- **Public/Client** : Peuvent créer un devis (pas de liste)
- **Client authentifié** : Voit ses propres devis
- **Admin/SuperAdmin** : Voit et gère tous les devis

---

## 🎨 Interface Frontend

### Page de service

- Affiche les détails du service
- Bouton "Demander un devis" qui redirige vers `/devis?service={id}`

### Page de devis (`/devis`)

- Formulaire multi-étapes dynamique
- Calcul du prix en temps réel
- Validation des champs
- Soumission avec feedback visuel

### Interface Admin

- Liste des devis avec filtres (statut, service, date)
- Détail d'un devis avec toutes les informations
- Actions : Marquer contacté, Marquer devis envoyé
- Création de facture depuis un devis

---

## 💡 Points importants

1. **Formulaires dynamiques** : Chaque service peut avoir son propre formulaire de devis configuré
2. **Calcul automatique** : Le prix se calcule selon les options choisies
3. **Hiérarchie infinie** : Les options peuvent avoir des sous-options à l'infini
4. **Statuts** : Suivi complet du cycle de vie d'un devis
5. **Factures** : Génération automatique de PDF et envoi par email

---

## 🔧 Configuration avancée

### Personnaliser le calcul du prix

Le calcul se fait côté frontend. Pour modifier la logique :
- Fichier : `frontend/src/pages/QuoteRequest.tsx`
- Fonction de calcul : `calculateTotalPrice()`

### Ajouter des types d'étapes

Dans `backend/api/models.py`, ajoutez de nouveaux types dans `STEP_TYPE_CHOICES` :
```python
STEP_TYPE_CHOICES = [
    ('SERVICE_SELECTION', 'Sélection du service'),
    ('LOCATION', 'Localisation'),
    ('SINGLE_CHOICE', 'Choix unique'),
    ('MULTIPLE_CHOICE', 'Choix multiples'),
    ('TEXT_INPUT', 'Saisie texte'),
    ('CONTACT', 'Coordonnées de contact'),
    ('DATE_PICKER', 'Sélection de date'),  # Nouveau type
    ('FILE_UPLOAD', 'Upload de fichier'),  # Nouveau type
]
```

---

## 📝 Exemples d'utilisation

### Créer un service via API

```bash
curl -X POST http://localhost:8000/api/services/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Garde d'enfants",
    "short_description": "Service de garde professionnel",
    "detailed_description": "Description complète...",
    "price_per_hour": 20.00,
    "currency": "EUR",
    "active": true
  }'
```

### Créer un devis via API

```bash
curl -X POST http://localhost:8000/api/quote-requests/ \
  -H "Content-Type: application/json" \
  -d '{
    "service": 1,
    "location": "Paris",
    "client_name": "Marie Martin",
    "client_email": "marie@example.com",
    "client_phone": "+33123456789",
    "additional_info": {"typeAide": "menage_complet"},
    "calculated_price": 50.00
  }'
```

---

## ❓ Questions fréquentes

**Q : Comment modifier le formulaire de devis pour un service ?**
R : Via l'interface admin ou l'API, créez/modifiez les `QuoteFormStep` et `QuoteFormOption` associés au service.

**Q : Le prix calculé est-il définitif ?**
R : Non, c'est une estimation. L'admin peut modifier le prix final lors de la création de la facture.

**Q : Peut-on avoir plusieurs formulaires différents pour le même service ?**
R : Non, un service a un seul formulaire, mais vous pouvez créer plusieurs services similaires avec des formulaires différents.

**Q : Comment désactiver un service ?**
R : Mettez `active=False` dans le service. Il ne sera plus visible publiquement mais restera dans la base de données.









