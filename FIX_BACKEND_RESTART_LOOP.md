# Corriger le backend en boucle de redémarrage

Quand le backend redémarre en boucle, c’est souvent parce que `migrate` échoue au démarrage. Procédure sur le serveur.

## 1. Vérifier les logs

```bash
cd /opt/servicemenager
docker compose logs backend --tail 80
```

Si tu vois un conflit de migrations (ex. `0030_alter_sitesettings_button_border_color` vs `0030_sitesettings_default_green`), passe à l’étape 2.

## 2. S’assurer d’avoir le code à jour (conflit migrations)

```bash
cd /opt/servicemenager
git pull origin youssef-dev
```

Le dépôt doit contenir :
- `backend/api/migrations/0030_alter_sitesettings_button_border_color.py`
- `backend/api/migrations/0035_merge_0030_migrations.py`
- `backend/api/migrations/0031_alter_sitesettings_banner_bg_color_and_more.py` avec `dependencies = [('api', '0035_merge_0030_migrations')]`

## 3. Arrêter le backend et lancer un conteneur “sleep” pour faire migrate à la main

```bash
cd /opt/servicemenager
docker compose stop backend
docker compose run --rm -d --name backend_fix backend sh -c "sleep 3600"
```

Attendre quelques secondes, puis :

```bash
docker exec backend_fix python manage.py migrate --noinput
```

Si tout est vert, créer le superadmin :

```bash
docker exec backend_fix python manage.py create_initial_data
```

Puis arrêter le conteneur de dépannage et redémarrer le backend normal :

```bash
docker stop backend_fix
docker compose up -d backend
```

## 4. Vérifier

```bash
docker compose ps
docker compose logs backend --tail 20
```

Le backend doit rester “Up” et tu peux te connecter avec le compte créé par `create_initial_data`.
