# Pourquoi .fr est à jour mais .com / .net affichent une ancienne version ?

Sur le serveur, **ease-dom.fr**, **ease-dom.net** et **ease-dom.com** sont servis par la **même** application (même Nginx, même conteneur frontend). Si le .fr affiche la nouvelle version et pas le .com/.net, c’est en général l’une des deux causes suivantes.

---

## 1. DNS : .com et .net pointent encore vers l’ancien hébergeur

Si **ease-dom.com** et **ease-dom.net** pointent vers une **autre IP** (ancien serveur), vous voyez l’ancienne version sur ces domaines, et la nouvelle uniquement sur .fr (qui pointe vers le bon serveur).

### À faire

1. **Vérifier les DNS** (depuis votre PC ou le serveur) :
   ```bash
   ./check_dns.sh
   ```
   Ou à la main :
   ```bash
   dig ease-dom.fr +short
   dig ease-dom.com +short
   dig ease-dom.net +short
   ```
   Tous doivent renvoyer la même IP que votre serveur actuel (ex. **76.13.56.224**).

2. **Si .com ou .net renvoient une autre IP** :
   - Aller dans l’interface de gestion DNS (ex. Viaduc, OVH, etc.).
   - Pour **ease-dom.com** et **ease-dom.net**, mettre un enregistrement **A** vers l’IP du serveur (celle de .fr, ex. 76.13.56.224).
   - Attendre la propagation (souvent 5–30 min, parfois jusqu’à 24 h).

3. Re-tester après propagation :  
   `https://ease-dom.com` et `https://ease-dom.net` doivent afficher la même version que `https://ease-dom.fr`.

---

## 2. Cache navigateur ou CDN (même serveur pour tous les domaines)

Si les trois domaines pointent déjà vers la **même IP** mais que .com/.net affichent encore l’ancienne version, c’est en général du **cache** :

- **Cache navigateur** : chaque domaine (origine) a son propre cache. Le .fr peut être rechargé à jour alors que .com/.net gardent l’ancien `index.html` et les anciens JS/CSS.
- **CDN / proxy** (Cloudflare, etc.) : la purge de cache peut n’avoir été faite que pour .fr ; .com et .net gardent alors l’ancienne version en cache.

### À faire

1. **Cache navigateur**
   - Sur .com et .net : **rechargement forcé** (Ctrl+Shift+R ou Cmd+Shift+R).
   - Ou ouvrir ces sites en **navigation privée** pour vérifier sans cache.

2. **Si vous utilisez un CDN (ex. Cloudflare)**
   - Aller dans le tableau de bord du CDN.
   - Purger le cache pour **ease-dom.com** et **ease-dom.net** (ou purge globale si vous préférez).

3. **Après un déploiement**
   - Toujours faire un **rechargement forcé** (ou test en navigation privée) sur chaque domaine pour confirmer que la nouvelle version s’affiche partout.

---

## Résumé

| Situation | Cause probable | Action |
|-----------|----------------|--------|
| .fr à jour, .com/.net ancienne version | DNS .com/.net → ancienne IP | Vérifier avec `./check_dns.sh`, corriger les A vers l’IP du serveur, attendre la propagation. |
| Même IP pour les 3, mais .com/.net anciens | Cache navigateur ou CDN | Rechargement forcé (Ctrl+Shift+R), navigation privée, purge cache CDN pour .com et .net. |

En pratique : **commencez par lancer `./check_dns.sh`** pour confirmer que les trois domaines pointent bien vers la même IP que votre serveur actuel.
