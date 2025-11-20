# Backend Django REST Framework - Services Locaux

Backend complet pour gérer un site de services et agences avec Django REST Framework.

## 📋 Table des matières

- [Installation](#installation)
- [Structure du projet](#structure-du-projet)
- [Modèles](#modèles)
- [API Endpoints](#api-endpoints)
- [Authentification](#authentification)
- [Permissions](#permissions)
- [Tests](#tests)
- [Exemples d'utilisation](#exemples-dutilisation)

## 🚀 Installation

Voir le fichier [INSTALLATION.md](./INSTALLATION.md) pour les instructions détaillées.

### Installation rapide

```bash
# 1. Activer l'environnement virtuel
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Créer le fichier .env
# SECRET_KEY=votre-secret-key
# DEBUG=True
# ALLOWED_HOSTS=localhost,127.0.0.1

# 4. Migrations
python manage.py makemigrations
python manage.py migrate

# 5. Créer les données initiales
python manage.py create_initial_data

# 6. Lancer le serveur
python manage.py runserver
```

## 📁 Structure du projet

```
backend/
├── api/                    # Application principale
│   ├── models.py          # Modèles (User, Service, Agency, Contact, PageContent)
│   ├── serializers.py     # Serializers DRF
│   ├── views.py           # ViewSets DRF
│   ├── views_auth.py      # Vues d'authentification
│   ├── permissions.py     # Classes de permissions
│   ├── admin.py           # Configuration Django Admin
│   ├── urls.py            # URLs de l'API
│   ├── tests.py           # Tests unitaires
│   └── fixtures/         # Données initiales (JSON)
├── management/
│   └── commands/
│       └── create_initial_data.py  # Commande pour créer les données initiales
├── servicemenager/        # Configuration Django
│   ├── settings.py
│   └── urls.py
└── requirements.txt
```

## 🗄️ Modèles

### CustomUser
- **Rôles**: SUPERADMIN, ADMIN, CLIENT
- **Champs**: username, email, password, role, phone, timestamps

### Service
- **Champs**: name, slug, short_description, detailed_description, image, active, order, created_by
- **Logique**: Seuls les services avec `active=True` apparaissent dans les API publiques

### Agency
- **Champs**: name, slug, address, city, postal_code, phone, email, latitude, longitude, active, details
- **Fonctionnalités**: Recherche par proximité (Haversine)

### Contact
- **Champs**: name, role, phone, email, agency (FK nullable), is_headquarter, address
- **Logique**: `is_headquarter=True` pour le siège social

### PageContent
- **Champs**: key (unique), title, body, is_active, order
- **Usage**: Contenu dynamique pour les pages (ex: home_banner)

## 🔌 API Endpoints

### Authentification
- `POST /api/token/` - Obtenir un token JWT
- `POST /api/token/refresh/` - Rafraîchir le token
- `POST /api/register/` - Inscription client

### Navbar (Meta endpoint)
- `GET /api/navbar/` - Données pour construire la navbar
- `GET /api/meta/navbar/` - Alias

### Services
- `GET /api/services/` - Liste (public: actifs seulement)
- `GET /api/services/{id}/` - Détail
- `POST /api/services/` - Créer (admin/superadmin)
- `PATCH /api/services/{id}/` - Modifier (admin/superadmin)
- `PATCH /api/services/{id}/toggle_active/` - Activer/Désactiver

### Agences
- `GET /api/agencies/` - Liste (public: actives seulement)
- `GET /api/agencies/?lat=48.8566&lng=2.3522&radius_km=50` - Recherche par proximité
- `GET /api/agencies/headquarters/` - Récupérer le siège social
- `GET /api/agencies/{id}/` - Détail
- `POST /api/agencies/` - Créer (admin/superadmin)
- `PATCH /api/agencies/{id}/` - Modifier (admin/superadmin)

### Contacts
- `GET /api/contacts/` - Liste
- `GET /api/contacts/?agency={id}` - Filtrer par agence
- `GET /api/contacts/?is_headquarter=true` - Filtrer siège

### Pages
- `GET /api/pages/` - Liste (public: actives seulement)
- `GET /api/pages/{key}/` - Détail par clé
- `POST /api/pages/` - Créer (admin/superadmin)

### Users
- `GET /api/users/` - Liste (selon permissions)
- `POST /api/users/` - Créer (inscription client ou superadmin crée admin)

## 🔐 Authentification

### JWT (SimpleJWT)

**Obtenir un token:**
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "super@local.test", "password": "SuperPass123!"}'
```

**Utiliser le token:**
```bash
curl http://localhost:8000/api/services/ \
  -H "Authorization: Bearer votre-access-token"
```

## 🛡️ Permissions

- **IsSuperAdmin**: Accès complet, peut créer des admins
- **IsAdminOrReadOnly**: Admins peuvent modifier, autres en lecture seule
- **IsOwnerOrAdmin**: Propriétaire ou admin peut modifier
- **IsClientOrReadOnly**: Clients peuvent créer, lecture pour tous

## 🧪 Tests

```bash
python manage.py test api
```

Tests inclus:
- Service inactif n'apparaît pas dans l'API publique
- Admin peut activer/désactiver un service
- Superadmin peut créer un admin
- Recherche par proximité des agences
- Structure de l'endpoint navbar

## 📖 Exemples d'utilisation

Voir le fichier [API_EXAMPLES.md](./API_EXAMPLES.md) pour des exemples détaillés avec cURL, fetch, axios et React.

### Exemple rapide - Navbar React

```jsx
import { useEffect, useState } from 'react';

function Navbar() {
  const [data, setData] = useState({ services: [], agencies: [], pages: [] });

  useEffect(() => {
    fetch('http://localhost:8000/api/navbar/')
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <nav>
      <Link to="/">Accueil</Link>
      
      {/* Services - affiché seulement si data.services.length > 0 */}
      {data.services.length > 0 && (
        <Dropdown title="Services">
          {data.services.map(s => (
            <Link key={s.id} to={s.url}>{s.name}</Link>
          ))}
        </Dropdown>
      )}
      
      {/* Agences - affiché seulement si data.agencies.length > 0 */}
      {data.agencies.length > 0 && (
        <Dropdown title="Agences">
          {data.agencies.map(a => (
            <Link key={a.id} to={a.url}>{a.name}</Link>
          ))}
        </Dropdown>
      )}
      
      <Link to="/contact">Contact</Link>
    </nav>
  );
}
```

## 📝 Identifiants par défaut

Après `python manage.py create_initial_data`:

- **Superadmin**: `super@local.test` / `SuperPass123!`
- **Admin**: `admin@local.test` / `AdminPass123!`

## 🔧 Configuration Django Admin

Accès: `http://localhost:8000/admin/`

**Actions personnalisées disponibles:**
- Services: "Activer les services sélectionnés" / "Désactiver les services sélectionnés"
- Agences: "Activer les agences sélectionnées" / "Désactiver les agences sélectionnées"

## 📊 Schéma de décision Navbar

```
Frontend appelle GET /api/navbar/
    ↓
Backend filtre: active=True pour services/agencies, is_active=True pour pages
    ↓
Retourne JSON: { services: [], agencies: [], pages: [] }
    ↓
Frontend vérifie array.length
    ↓
Si length > 0: Afficher le dropdown avec les items
Si length = 0: Ne pas afficher le dropdown
```

## 🚨 Notes importantes

- Les mots de passe par défaut doivent être changés en production
- Le fichier `.env` ne doit jamais être commité
- En production: `DEBUG=False` et `ALLOWED_HOSTS` correctement configuré
- Les images sont servies via `/media/` en développement

## 📚 Documentation complète

- [INSTALLATION.md](./INSTALLATION.md) - Guide d'installation détaillé
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Exemples d'utilisation de l'API
