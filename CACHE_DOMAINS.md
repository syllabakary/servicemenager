# Cache et domaines .fr / .net / .com

Tous les domaines (ease-dom.fr, ease-dom.net, ease-dom.com) doivent servir la **même application**. Si .com ou .net affichent une ancienne version (même pour un visiteur en première visite), la cause peut être **côté serveur** : reverse proxy, vhosts différents, ou cache CDN.

---

## 1. Diagnostic sur le serveur (à faire en priorité)

Exécuter ces commandes **sur le serveur** (ex. en SSH sur srv1385225).

### 1.1 Qui écoute sur les ports 80 et 443 ?

```bash
sudo ss -tlnp | grep -E ':80|:443'
# ou
sudo netstat -tlnp | grep -E ':80|:443'
```

- Si vous voyez **uniquement Docker** (conteneur frontend) sur 80/443 → le trafic va bien vers le même conteneur pour tous les domaines. Passez au § 1.3 ou 1.4.
- Si vous voyez **Nginx ou Apache** (processus sur l’hôte) en plus de Docker → il y a un **reverse proxy sur l’hôte** qui reçoit le trafic avant Docker. Il peut avoir une config différente par domaine. Passez au § 1.2.

### 1.2 Vérifier la config du reverse proxy sur l’hôte

Si Nginx est installé sur l’hôte (pas seulement dans Docker) :

```bash
# Lister les sites activés
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/conf.d/

# Chercher les blocs qui mentionnent ease-dom
sudo grep -r "ease-dom" /etc/nginx/
```

Vérifier que **ease-dom.fr, ease-dom.net et ease-dom.com** sont tous les trois :
- soit dans le **même** `server { ... }` qui fait `proxy_pass` vers le conteneur (ex. `http://127.0.0.1:80` ou `http://127.0.0.1:443`),
- soit ont exactement la même config (même `proxy_pass`, pas un `root` vers un ancien dossier).

Si .com ou .net ont un `root /var/www/...` ou un `proxy_pass` vers un autre backend, ils serviront une autre version (ancienne). Il faut alors **modifier la config Nginx de l’hôte** pour que les trois domaines utilisent le même `proxy_pass` que .fr.

Si Apache est utilisé sur l’hôte :

```bash
sudo grep -r "ease-dom" /etc/apache2/
# ou
sudo grep -r "ease-dom" /etc/httpd/
```

Même principe : les trois domaines doivent pointer vers la même application (Docker ou le même répertoire).

### 1.3 Vérifier que Docker sert bien les trois domaines

À l’intérieur du conteneur, la config doit lister les trois noms :

```bash
cd /opt/servicemenager
docker compose exec frontend cat /etc/nginx/conf.d/default.conf | grep server_name
```

Vous devez voir : `server_name ease-dom.fr www.ease-dom.fr ease-dom.net ease-dom.com _;` (ou équivalent). Si c’est le cas, le conteneur traite bien tous les domaines de la même façon.

### 1.4 CDN (Cloudflare, etc.)

Si vous utilisez un CDN (Cloudflare, OVH CDN, etc.) :

- Le cache peut être **par domaine** : .fr a été purgé ou mis à jour, pas .com/.net.
- **À faire** : dans l’interface du CDN, **purger le cache** pour `ease-dom.com` et `ease-dom.net` (et si possible “Purge Everything” ou équivalent pour ces domaines).
- Vérifier aussi que les trois domaines pointent bien vers la **même** origine (même IP / même backend). Si .com ou .net pointent vers une autre IP ou un “ancien” site, ils continueront à servir l’ancienne version.

### 1.5 Vérifier le DNS

Sur votre PC ou sur le serveur :

```bash
nslookup ease-dom.fr
nslookup ease-dom.com
nslookup ease-dom.net
```

Les trois doivent renvoyer la **même IP** (celle de votre serveur). Si l’une est différente, ce domaine ne va pas sur le même serveur.

### 1.6 Vérifier que le conteneur renvoie la même page pour les 3 domaines

Sur le serveur, comparer la réponse pour chaque domaine (en passant l’en-tête `Host` à `curl`) :

```bash
# Depuis le serveur (remplacer par votre chemin si besoin)
cd /opt/servicemenager

# Aperçu de la page pour .fr
curl -sk -H "Host: ease-dom.fr" https://localhost/ | head -30

# Aperçu pour .com (doit être identique)
curl -sk -H "Host: ease-dom.com" https://localhost/ | head -30

# Aperçu pour .net (doit être identique)
curl -sk -H "Host: ease-dom.net" https://localhost/ | head -30
```

Si les trois sorties sont **identiques** (même titre, même chemins `/assets/...`), le serveur ne redirige pas et ne sert pas une autre config : la différence vient **entre le serveur et l’utilisateur** (cache CDN, cache navigateur, proxy).  
Si une sortie est différente (autre titre, ancien nom “Services Locaux”, etc.), alors il y a une config ou un cache **côté serveur** à corriger (vérifier le fichier réellement chargé dans le conteneur : `docker compose exec frontend cat /usr/share/nginx/html/index.html | head -25`).

---

## 2. Ce qui a été fait dans le projet (Nginx dans Docker)

- Pour la page d’accueil (et les routes qui renvoient `index.html`), en-têtes de cache stricts :  
  `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` et `Pragma: no-cache`.  
  Cela évite que le navigateur garde une vieille version après un déploiement.

Pour appliquer cette config sur le serveur :

```bash
cd /opt/servicemenager
git pull
chmod +x enable_https_postgresql.sh
./enable_https_postgresql.sh
```

---

## 3. Si le problème vient du cache navigateur

Pour un visiteur qui a déjà l’ancienne version en cache :

- **Rechargement forcé** : Ctrl + Shift + R (ou Cmd + Shift + R sur Mac) sur https://ease-dom.com et https://ease-dom.net.
- **Navigation privée** : ouvrir .com et .net en fenêtre privée pour voir la version actuelle.
- **Vider le cache** du site (F12 → Application / Stockage → vider pour ease-dom.com et ease-dom.net).

---

## 4. Résumé

| Situation | Action |
|-----------|--------|
| Nginx/Apache sur l’hôte avec vhosts différents pour .com/.net | Configurer les trois domaines pour le même `proxy_pass` (ou même `root`) que .fr. |
| CDN devant .com/.net | Purger le cache pour ease-dom.com et ease-dom.net. |
| Seul Docker écoute sur 80/443, pas de CDN | Après avoir appliqué le script HTTPS (§ 2), si un nouvel ordinateur voit encore l’ancienne version, revérifier le DNS (§ 1.5) et qu’aucun autre reverse proxy n’existe (§ 1.1 et 1.2). |
| Visiteur a déjà visité le site | Lui demander un rechargement forcé ou une navigation privée (§ 3). |

---

## 5. Le serveur sert l’ancien build (titre « Services Locaux »)

Si les trois `curl` (§ 1.6) renvoient **le même HTML** avec le titre **« Services Locaux - Trouvez votre agence... »**, alors le conteneur frontend sert encore **l’ancien build**. La version « EASE - DOM » que vous voyez sur .fr dans le navigateur vient du **cache** ; sur le serveur, tout le monde reçoit l’ancienne version.

**À faire** : reconstruire et redéployer le frontend sur le serveur pour mettre le nouveau build dans le conteneur :

```bash
cd /opt/servicemenager
git pull
chmod +x enable_https_postgresql.sh
./enable_https_postgresql.sh
```

Ou sans régénérer la config HTTPS (si déjà à jour) :

```bash
cd /opt/servicemenager
git pull
docker compose build frontend --no-cache
docker compose up -d frontend
```

Après redémarrage, refaire un `curl -sk -H "Host: ease-dom.fr" https://localhost/ | head -20` : le titre doit être celui de la nouvelle version (ex. « EASE - DOM »). Ensuite, les trois domaines serviront la même version à tous les visiteurs.
