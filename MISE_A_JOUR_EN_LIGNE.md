# Mises à jour en ligne – ServiceManager

## ✅ Les mises à jour peuvent bien passer en ligne

À condition d’utiliser le **bon** fichier Docker Compose et la **bonne** procédure.

---

## ⚠️ Problème actuel : deux stacks différentes

| Fichier | Utilisé par | Base de données |
|--------|-------------|------------------|
| **docker-compose.yml** | `deploy.sh` (sans `-f`) | **PostgreSQL** (3 services : db, backend, frontend) |
| **docker-compose.sqlite.yml** | `start_services.sh`, `check_status.sh`, scripts SSL | **SQLite** (2 services : backend, frontend) |

- Sur le serveur, vous utilisez en pratique **docker-compose.sqlite.yml** (start_services, SSL, etc.).
- **deploy.sh** lance lui **docker-compose.yml** (PostgreSQL). Si vous lancez `./deploy.sh` sur le serveur, vous démarrez l’autre stack, pas celle en ligne.

Donc : en ligne, il faut **toujours** utiliser **docker-compose.sqlite.yml** pour les mises à jour.

---

## Comment les mises à jour passent avec SQLite (votre cas)

Avec **docker-compose.sqlite.yml** :

1. **Backend**  
   - Le code est monté avec `./backend:/app`.  
   - Au **démarrage** du conteneur, la commande fait :  
     `migrate` → `collectstatic` → `runserver`.  
   - Donc à chaque **redémarrage** du backend, les migrations et les statiques sont à jour.

2. **Frontend**  
   - Le front est servi par une **image** buildée (Nginx + build React).  
   - Pour voir un nouveau code front, il faut **rebuild** l’image frontend puis redémarrer.

3. **Base SQLite**  
   - Fichier dans `./backend` (monté dans le conteneur).  
   - Persistée tant que vous ne supprimez pas ce fichier ni le volume.

Donc oui : **en ligne, avec la stack SQLite, les mises à jour peuvent bien passer** si vous suivez la procédure ci‑dessous.

---

## Procédure recommandée pour une mise à jour en ligne (stack SQLite)

Sur le serveur (ex. dans `/opt/servicemenager`) :

```bash
cd /opt/servicemenager   # ou le chemin de votre projet

# 1. Récupérer le nouveau code
git pull

# 2. Reconstruire les images et redémarrer (migrations + collectstatic au démarrage du backend)
docker compose -f docker-compose.sqlite.yml build --no-cache
docker compose -f docker-compose.sqlite.yml up -d

# 3. Vérifier
docker compose -f docker-compose.sqlite.yml ps
docker compose -f docker-compose.sqlite.yml logs --tail=30 backend
```

Après ça :
- Le **backend** redémarre, relance `migrate` + `collectstatic` + `runserver` → migrations et statiques à jour.
- Le **frontend** sert la nouvelle version buildée.

---

## Script `update.sh` (optionnel)

Un script **update.sh** est fourni à la racine du projet. Il enchaîne `git pull`, build et up avec **docker-compose.sqlite.yml**. Vous pouvez l’utiliser pour standardiser les mises à jour en ligne.

Usage :

```bash
./update.sh
```

---

## Résumé

- **Oui**, en ligne avec **docker-compose.sqlite.yml**, les mises à jour (code + migrations + statiques) passent correctement.
- **Ne pas** utiliser `deploy.sh` sur ce serveur sans l’adapter : il cible la stack PostgreSQL (docker-compose.yml).
- Pour chaque mise à jour : **git pull** puis **build + up** avec **docker-compose.sqlite.yml** (ou utiliser **update.sh**).
