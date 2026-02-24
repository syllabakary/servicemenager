# Corriger l'erreur 413 (Content Too Large) sur POST/PATCH avec image

## Qu’est-ce que l’erreur 413 ?

**413 Content Too Large** = le serveur refuse la requête parce que le **corps de la requête** (body) dépasse la taille maximale autorisée.  
Quand tu envoies un formulaire avec une image (création de service, modification d’agence, etc.), la requête est volumineuse. Si un maillon de la chaîne limite la taille (souvent à 1–2 Mo par défaut), il renvoie 413.

## Chaîne des requêtes (HTTPS)

```
Navigateur  →  [Proxy HTTPS sur l’HÔTE]  →  Conteneur frontend (Nginx)  →  Conteneur backend (Django)
                    ↑
              C’est souvent ICI que la limite est trop basse (ex. 1M).
```

- Dans le projet : **Nginx (frontend)** et **Django** sont réglés à **200 Mo**.
- Si tu accèdes au site en **https://ease-dom.fr**, il y a en général un **Nginx (ou Apache) sur la machine** qui fait le HTTPS et qui redirige vers le conteneur. C’est ce **proxy sur l’hôte** qui applique sa propre limite (souvent 1 Mo) et renvoie 413 **avant** que la requête n’atteigne Docker.

## 1. Tester depuis le serveur (sans passer par le proxy)

Pour vérifier que Docker (frontend + backend) accepte bien les gros body, exécute **sur le serveur** :

```bash
cd /opt/servicemenager
# Créer un fichier de test ~2 Mo
dd if=/dev/zero of=/tmp/test_img.png bs=1M count=2 2>/dev/null

# Obtenir un token (remplace admin/admin par un vrai compte)
TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

# Envoyer une requête vers le backend (port 8000) avec le fichier
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/services/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test service" \
  -F "slug=test-service" \
  -F "short_description=Test" \
  -F "category=1" \
  -F "image=@/tmp/test_img.png"
```

- Si tu obtiens **201** (ou **400** pour erreur métier, pas 413) → le **backend + frontend Docker** acceptent les gros body. Le 413 en production vient alors du **proxy sur l’hôte**.
- Si tu obtiens **413** même ici → il restera à vérifier la config Nginx du conteneur frontend (rebuild, etc.).

## 1b. Si les ports 80/443 sont tenus par Docker (find_proxy_config.sh)

Dans ce cas il n’y a pas de Nginx/Apache sur l’hôte : la limite 413 se règle **dans le conteneur frontend**. Le `frontend/nginx.conf` du dépôt contient déjà `client_max_body_size 200M` ; il faut **reconstruire l’image** pour que ce soit pris en compte :

```bash
cd /opt/servicemenager
docker compose build frontend --no-cache
docker compose up -d frontend
```

Si le 413 continue, un autre conteneur (Caddy, Traefik, etc.) peut recevoir le HTTPS avant le frontend. Vérifier quel conteneur écoute sur 443 :

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Augmenter aussi la limite d’upload dans la config de ce conteneur (ex. 200 Mo).

## 2. Corriger le proxy sur l’hôte (Nginx)

**Option A – Script automatique (sur le serveur) :**

Si vous savez que le proxy est **Nginx** :

```bash
cd /opt/servicemenager
sudo chmod +x fix_413_host_nginx.sh
sudo ./fix_413_host_nginx.sh
```

Si le script ne trouve aucune config (« Aucun fichier Nginx trouvé »), lancez d’abord le **diagnostic** pour voir quel service écoute sur 443 et où est la config :

```bash
sudo chmod +x find_proxy_config.sh
sudo ./find_proxy_config.sh
```

- Si le diagnostic montre **Apache** (httpd) :  
  `sudo ./fix_413_host_apache.sh` (ajoute `LimitRequestBody 209715200` et recharge Apache).
- Si le diagnostic montre **Nginx** mais dans un chemin non standard : modifier à la main (Option B) le fichier indiqué par le diagnostic.

**Option B – Modification manuelle :** augmenter la limite dans la config Nginx qui gère HTTPS, puis recharger. Exemple pour le **serveur** (site `ease-dom.fr`) :

```nginx
server {
    listen 443 ssl;
    server_name ease-dom.fr www.ease-dom.fr ease-dom.net www.ease-dom.net ease-dom.com www.ease-dom.com;

    # Autoriser les gros body (upload d’images)
    client_max_body_size 200M;

    ssl_certificate     /etc/letsencrypt/live/ease-dom.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ease-dom.fr/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_request_buffering off;
        client_max_body_size 200M;
    }
}
```

Ensuite :

```bash
sudo nginx -t
sudo systemctl reload nginx
```

(Chemin de la config selon ton hébergeur, ex. `/etc/nginx/sites-available/ease-dom.fr`.)

## 3. Si tu utilises Apache (au lieu de Nginx) sur l’hôte

Dans la config du VirtualHost HTTPS (ou dans `.htaccess` si autorisé) :

```apache
LimitRequestBody 209715200
```

(209715200 = 200 Mo en octets.) Puis redémarrer Apache.

## Résumé

| Où ça bloque | Action |
|--------------|--------|
| **Proxy HTTPS sur l’hôte** (le plus fréquent) | Ajouter `client_max_body_size 200M;` (Nginx) ou `LimitRequestBody 209715200` (Apache) et recharger le service. |
| **Conteneur frontend** | Vérifier que l’image a bien été reconstruite après modification de `frontend/nginx.conf` (`docker compose build frontend --no-cache`). |
| **Backend Django** | Déjà à 200 Mo dans `settings.py`; pas de changement nécessaire si le 413 vient d’avant. |

Une fois la limite à **200 Mo** sur le proxy qui reçoit https://ease-dom.fr, les **POST / PATCH avec image** ne devraient plus renvoyer 413.
