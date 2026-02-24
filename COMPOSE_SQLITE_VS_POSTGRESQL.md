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

Le fichier **docker-compose.yml** expose déjà le port **443** et monte **/etc/letsencrypt** et **/var/www/certbot** dans le frontend. Pour activer HTTPS avec PostgreSQL :

```bash
cd /opt/servicemenager
# Certificat déjà obtenu (obtain_certificate_multi.sh)
chmod +x enable_https_postgresql.sh
./enable_https_postgresql.sh
```

Le script applique la config Nginx HTTPS (redirection 80→443, serveur 443), reconstruit le frontend et redémarre la stack. Vous gardez PostgreSQL.

**Alternative (stack SQLite + HTTPS) :** `./enable_https_multi.sh` utilise **docker-compose.sqlite.yml** (SQLite). Si vous voulez PostgreSQL + HTTPS, utilisez **enable_https_postgresql.sh**.

---

## Frontend renvoie 301 (redirect HTTPS) alors que vous êtes en HTTP

Si `curl -I http://localhost/media/...` renvoie **301** vers `https://`, c’est que le conteneur frontend utilise une config Nginx avec redirection HTTPS (souvent après un `enable_https_multi.sh` qui a écrasé `frontend/nginx.conf`).

**À faire sur le serveur :**

```bash
cd /opt/servicemenager
git pull origin youssef-dev
chmod +x force_http_frontend.sh
./force_http_frontend.sh
```

Cela remet la config HTTP du dépôt, reconstruit le frontend et le redémarre. Ensuite `curl -I http://localhost/media/services/xxx.png` doit renvoyer **200 OK**.

**Important :** avec **docker-compose.yml**, ne pas lancer `enable_https_multi.sh` sans avoir prévu les certificats et le port 443 dans ce compose, sinon le frontend attend des certificats et peut crasher ou rediriger.

---

## Domaines .net / .com : mauvaise version ou ancien site

Si **ease-dom.net** et **ease-dom.com** n’affichent pas la même version que **ease-dom.fr** :

1. **DNS** : vérifier que les enregistrements A (ou CNAME) de `ease-dom.net` et `ease-dom.com` pointent vers la **même IP** que `ease-dom.fr` (celle du serveur où tourne Docker).
2. **Cache** : vider le cache du navigateur ou tester en navigation privée pour .net et .com.
3. **Même application** : la config Nginx du frontend a `server_name ease-dom.fr ease-dom.net ease-dom.com` ; une fois le bon nginx.conf (HTTP) en place et le frontend reconstruit, les trois domaines sont servis par le même conteneur. Si l’IP est la même et le cache vidé, ils doivent afficher la même version.
