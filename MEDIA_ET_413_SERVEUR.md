# Images 404 et erreur 413 sur le serveur

## Chemins corrects des images

- **Service** : stockage `backend/media/services/` → URL **`/media/services/xxx.png`**
- **Agence** : stockage `backend/media/agencies/` → URL **`/media/agencies/xxx.png`**

L’API renvoie l’URL (ex. `https://ease-dom.fr/media/services/Gardening_service_photo_0007b568.png`). Les 404 viennent en général de : **(1)** les fichiers ne sont pas sur le serveur dans `backend/media/` ; **(2)** le conteneur frontend n’a pas le volume `backend/media` monté sur `/media` (Nginx sert les images depuis ce chemin).

### 1. Vérifier que le frontend a bien le volume media

Les deux compose doivent monter `./backend/media` dans le frontend pour que Nginx puisse servir `/media/` :

- **docker-compose.sqlite.yml** : `./backend/media:/media:ro` (déjà présent)
- **docker-compose.yml** : `./backend/media:/media:ro` (ajouté si vous utilisez PostgreSQL)

Sans ce volume, le conteneur n’a pas de répertoire `/media/` → 404 sur toutes les images.

### 2. Copier le dossier `media` sur le serveur

`loaddata` / import de base ne copie pas les fichiers. Il faut copier `backend/media` sur le serveur.

**Depuis ta machine :**

```bash
scp -r backend/media root@76.13.56.224:/opt/servicemenager/backend/
```

Créer le dossier si besoin avant le `scp` :

```bash
ssh root@76.13.56.224 "mkdir -p /opt/servicemenager/backend/media"
```

**Sur le serveur**, après la copie, redémarrer au moins le frontend (pour que le volume soit bien relu) :

```bash
cd /opt/servicemenager
docker compose -f docker-compose.sqlite.yml up -d frontend
# ou, si vous utilisez le compose PostgreSQL :
# docker compose up -d frontend
```

Vérifier que les fichiers sont présents :

```bash
ls -la /opt/servicemenager/backend/media/services/
ls -la /opt/servicemenager/backend/media/agencies/
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
