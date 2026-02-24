# Images 404 et erreur 413 sur le serveur

## Chemins corrects des images

- **Service** : stockage `backend/media/services/` → URL **`/media/services/xxx.png`**
- **Agence** : stockage `backend/media/agencies/` → URL **`/media/agencies/xxx.png`**

L’API renvoie toujours l’URL correspondant au bon dossier (services ou agencies). Les 404 viennent du fait que **les fichiers ne sont pas sur le serveur** : `loaddata` ne copie que la base de données, pas les binaires.

### Solution : copier le dossier `media` sur le serveur

**Sur ta machine (PowerShell ou Git Bash) :**

```bash
# Depuis la racine du projet
scp -r backend/media root@76.13.56.224:/opt/servicemenager/backend/
```

(Adapte l’IP et le chemin si besoin.)

**Sur le serveur**, le `docker-compose` monte `./backend/media` dans le conteneur. Après la copie, les images seront donc disponibles et les 404 disparaîtront.

Créer le dossier si besoin avant le `scp` :

```bash
ssh root@76.13.56.224 "mkdir -p /opt/servicemenager/backend/media"
```

Puis relancer le backend pour être sûr que le volume est bien pris en compte :

```bash
ssh root@76.13.56.224 "cd /opt/servicemenager && docker compose up -d backend"
```

---

## 2. Erreur 413 (Content Too Large) sur PATCH services / agences / site-settings

Le backend et le Nginx frontend acceptent des requêtes jusqu’à **200 Mo**. Si tu as encore du 413, c’est en général un **reverse proxy sur l’hôte** qui limite.

**Sur l’hôte (Nginx devant Docker), ajouter ou modifier :**

```nginx
client_max_body_size 200M;
```

**Apache :**

```apache
LimitRequestBody 209715200
```

(209715200 = 200 Mo.)

Après modification, recharger la config (ex. `nginx -s reload` ou redémarrage du service).

---

## 3. Récapitulatif des changements dans le projet

- **docker-compose** : le volume nommé `backend_media` a été remplacé par le montage `./backend/media:/app/media` pour que les fichiers copiés dans `backend/media` sur le serveur soient bien vus par le backend.
- **Limites 413** : dans le repo, Nginx et Django sont à **200 Mo**. Si 413 persiste, configurer le proxy sur l’hôte à 200 Mo aussi.
