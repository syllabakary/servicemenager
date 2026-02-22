# Mise à jour sur le serveur

Après un push depuis ta machine, sur le serveur :

```bash
cd /opt/servicemenager

# Optionnel : sauvegarder la base avant de pull (si tu ne veux pas l’écraser)
cp backend/db.sqlite3 backend/db.sqlite3.backup.$(date +%Y%m%d_%H%M)

# Récupérer le code
git pull

# Reconstruire et redémarrer les conteneurs (frontend + backend)
./update.sh
```

Si `git pull` signale un conflit sur `backend/db.sqlite3`, voir le fichier en question ou utiliser :

```bash
cp backend/db.sqlite3 backend/db.sqlite3.backup.$(date +%Y%m%d_%H%M)
rm -f backend/db.sqlite3
git pull
./update.sh
```

Puis redémarrer le backend si besoin :

```bash
docker compose -f docker-compose.sqlite.yml restart backend
```
