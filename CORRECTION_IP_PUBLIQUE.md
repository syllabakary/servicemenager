# 🔧 Correction IP Publique au lieu de localhost

## Problème
Les APIs utilisent `localhost` au lieu de l'IP publique du serveur (76.13.56.224).

## Corrections apportées

### 1. Configuration API (`frontend/src/config/api.ts`)
- ✅ Modifié pour utiliser l'IP publique en production
- ✅ Utilise `VITE_API_URL` si défini dans `.env`
- ✅ Détecte automatiquement l'hostname en production

### 2. Fichiers corrigés
- ✅ `frontend/src/pages/Agencies.tsx`
- ✅ `frontend/src/pages/Home.tsx`
- ✅ `frontend/src/pages/admin/Login.tsx`
- ✅ `frontend/src/pages/admin/Services.tsx`
- ✅ `frontend/src/pages/admin/Employes.tsx`
- ✅ `frontend/src/pages/admin/EmployeDetail.tsx`
- ✅ `frontend/src/pages/admin/Devis.tsx`
- ✅ `frontend/src/pages/admin/DevisDetail.tsx`
- ✅ `frontend/src/pages/admin/Parametres.tsx`
- ✅ `frontend/src/components/admin/DashboardLayout.tsx`

Tous utilisent maintenant `import { API_URL } from "@/config/api"` au lieu de `localhost` codé en dur.

## Sur le serveur

### 1. Vérifier que VITE_API_URL est dans .env

```bash
cd /opt/servicemenager
cat .env | grep VITE_API_URL
```

Doit afficher :
```
VITE_API_URL=http://76.13.56.224/api
```

### 2. Reconstruire le frontend

```bash
# Arrêter les conteneurs
docker compose -f docker-compose.sqlite.yml down

# Reconstruire le frontend avec la nouvelle configuration
docker compose -f docker-compose.sqlite.yml build frontend

# Redémarrer
docker compose -f docker-compose.sqlite.yml up -d

# Vérifier les logs
docker compose -f docker-compose.sqlite.yml logs -f frontend
```

## Vérification

Après reconstruction, vérifier dans le navigateur (F12 > Console) :
- L'URL de l'API doit être `http://76.13.56.224/api` et non `http://localhost:8000/api`

## Note

Le backend retourne parfois `localhost` dans les réponses JSON. C'est normal pour les URLs internes. Le frontend utilisera maintenant toujours l'IP publique pour les requêtes.



