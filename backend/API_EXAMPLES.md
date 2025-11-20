# Exemples d'utilisation de l'API

## Authentification JWT

### 1. Obtenir un token (Login)

**cURL:**
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "super@local.test",
    "password": "SuperPass123!"
  }'
```

**Réponse:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:8000/api/token/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'super@local.test',
    password: 'SuperPass123!'
  })
});

const data = await response.json();
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
```

**Axios:**
```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:8000/api/token/', {
  username: 'super@local.test',
  password: 'SuperPass123!'
});

const { access, refresh } = response.data;
localStorage.setItem('access_token', access);
localStorage.setItem('refresh_token', refresh);
```

### 2. Rafraîchir le token

**cURL:**
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "votre-refresh-token"
  }'
```

### 3. Inscription (Register)

**cURL:**
```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nouveauclient",
    "email": "client@example.com",
    "password": "ClientPass123!",
    "first_name": "Prénom",
    "last_name": "Nom"
  }'
```

**Réponse:**
```json
{
  "user": {
    "id": 3,
    "username": "nouveauclient",
    "email": "client@example.com",
    "role": "CLIENT"
  },
  "tokens": {
    "refresh": "...",
    "access": "..."
  }
}
```

## Endpoint Navbar

### Récupérer les données de la navbar

**cURL:**
```bash
curl http://localhost:8000/api/navbar/
```

**Réponse:**
```json
{
  "services": [
    {
      "id": 1,
      "name": "Nettoyage résidentiel",
      "slug": "nettoyage-residentiel",
      "url": "/services/nettoyage-residentiel/",
      "order": 1
    }
  ],
  "agencies": [
    {
      "id": 1,
      "name": "Agence Paris",
      "slug": "agence-paris",
      "url": "/agences/agence-paris/",
      "latitude": "48.8566",
      "longitude": "2.3522"
    }
  ],
  "pages": [
    {
      "key": "home_banner",
      "title": "Bande annonce",
      "url": "/"
    }
  ]
}
```

**JavaScript (React) - Exemple d'intégration:**

```javascript
import { useEffect, useState } from 'react';
import axios from 'axios';

function Navbar() {
  const [navbarData, setNavbarData] = useState({ services: [], agencies: [], pages: [] });

  useEffect(() => {
    axios.get('http://localhost:8000/api/navbar/')
      .then(response => {
        setNavbarData(response.data);
      })
      .catch(error => {
        console.error('Erreur lors du chargement de la navbar:', error);
      });
  }, []);

  return (
    <nav>
      <ul>
        <li>Accueil</li>
        
        {/* Services dropdown - affiché seulement si services.length > 0 */}
        {navbarData.services.length > 0 && (
          <li className="dropdown">
            <span>Services</span>
            <ul>
              {navbarData.services.map(service => (
                <li key={service.id}>
                  <a href={service.url}>{service.name}</a>
                </li>
              ))}
            </ul>
          </li>
        )}
        
        {/* Agences dropdown - affiché seulement si agencies.length > 0 */}
        {navbarData.agencies.length > 0 && (
          <li className="dropdown">
            <span>Agences</span>
            <ul>
              {navbarData.agencies.map(agency => (
                <li key={agency.id}>
                  <a href={agency.url}>{agency.name}</a>
                </li>
              ))}
            </ul>
          </li>
        )}
        
        <li>Contact</li>
      </ul>
    </nav>
  );
}
```

## Services

### Liste des services (public)

**cURL:**
```bash
curl http://localhost:8000/api/services/
```

**Avec authentification (admin voit aussi les inactifs):**
```bash
curl http://localhost:8000/api/services/ \
  -H "Authorization: Bearer votre-access-token"
```

### Créer un service (admin/superadmin)

**cURL:**
```bash
curl -X POST http://localhost:8000/api/services/ \
  -H "Authorization: Bearer votre-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau Service",
    "slug": "nouveau-service",
    "short_description": "Description courte",
    "detailed_description": "Description détaillée",
    "active": true,
    "order": 1
  }'
```

### Activer/Désactiver un service

**cURL:**
```bash
curl -X PATCH http://localhost:8000/api/services/1/toggle_active/ \
  -H "Authorization: Bearer votre-access-token"
```

## Agences

### Liste des agences (public)

**cURL:**
```bash
curl http://localhost:8000/api/agencies/
```

### Recherche par proximité

**cURL:**
```bash
curl "http://localhost:8000/api/agencies/?lat=48.8566&lng=2.3522&radius_km=50"
```

### Récupérer le siège social

**cURL:**
```bash
curl http://localhost:8000/api/agencies/headquarters/
```

## Utilisation avec Axios (configuration globale)

```javascript
import axios from 'axios';

// Configuration de base
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Exemple d'utilisation
async function fetchNavbar() {
  try {
    const response = await api.get('/navbar/');
    return response.data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

async function createService(serviceData) {
  try {
    const response = await api.post('/services/', serviceData);
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response.data);
    throw error;
  }
}
```

## Schéma de décision pour la navbar

```
Frontend charge /api/navbar/
    ↓
Réponse JSON avec services[], agencies[], pages[]
    ↓
Pour chaque section:
    ↓
Si array.length > 0:
    → Afficher le dropdown avec les items
Sinon:
    → Ne pas afficher le dropdown (ou l'afficher vide)
```

**Exemple React complet:**

```jsx
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

