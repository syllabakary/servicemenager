# Quelle stack Docker utiliser (SQLite vs PostgreSQL)

## Deux fichiers Compose

| Fichier | Base de données | Utilisation |
|---------|-----------------|-------------|
| **docker-compose.yml** | **PostgreSQL** (service `db`) | Production avec PostgreSQL. |
| **docker-compose.sqlite.yml** | **SQLite** (fichier local, pas de service `db`) | Dépannage, démo, ou si vous n’utilisez pas PostgreSQL. |

**Si vous utilisez PostgreSQL**, il faut toujours lancer la stack avec **docker-compose.yml**.  
Ne pas utiliser `docker-compose.sqlite.yml` avec `--remove-orphans` si vous avez besoin de PostgreSQL : cela peut supprimer le conteneur `servicemenager_db`.

---

## Commandes avec PostgreSQL (docker-compose.yml)

```bash
cd /opt/servicemenager

# Démarrer toute la stack (db + backend + frontend)
docker compose up -d

# Appliquer les migrations
docker compose exec backend python manage.py migrate --noinput

# Redémarrer le backend après un changement
docker compose restart backend

# Voir les logs
docker compose logs -f backend
```

---

## Commandes avec SQLite (docker-compose.sqlite.yml)

```bash
cd /opt/servicemenager

docker compose -f docker-compose.sqlite.yml up -d
docker compose -f docker-compose.sqlite.yml exec backend python manage.py migrate --noinput
```

---

## Service systemd au démarrage

Le fichier `servicemenager.service` est configuré pour lancer **docker-compose.yml** (PostgreSQL).  
Pour l’activer après un `git pull` :

```bash
sudo cp /opt/servicemenager/servicemenager.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable servicemenager.service
sudo systemctl start servicemenager.service
```

Après un redémarrage du serveur, la stack PostgreSQL (db + backend + frontend) redémarrera automatiquement.

---

## HTTPS avec PostgreSQL

Le script `enable_https_multi.sh` est prévu pour la stack SQLite.  
Pour avoir le HTTPS avec PostgreSQL, il faut soit :

- ajouter le port 443 et les volumes certificats dans `docker-compose.yml` (comme dans `docker-compose.sqlite.yml`), puis adapter la config Nginx du frontend ;  
- soit faire terminer le HTTPS par un reverse proxy sur l’hôte (Nginx/Apache) qui envoie vers le frontend sur le port 80.
