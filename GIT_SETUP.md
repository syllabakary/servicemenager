# 📦 Configuration Git pour le Déploiement

## Option 1 : Mettre le projet sur Git (Recommandé)

### 1. Initialiser Git sur votre machine locale

```powershell
# Dans PowerShell, aller dans le dossier du projet
cd C:\Users\VICTUS\Documents\servicemenager-main

# Initialiser Git (si pas déjà fait)
git init

# Créer un fichier .gitignore si pas déjà présent
```

### 2. Créer un fichier .gitignore

Créez un fichier `.gitignore` à la racine du projet :

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
*.sqlite3
*.db

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
/media
/staticfiles

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Docker
*.log

# OS
Thumbs.db
```

### 3. Créer un dépôt sur GitHub/GitLab

1. Allez sur GitHub.com ou GitLab.com
2. Créez un nouveau dépôt (repository)
3. Ne cochez PAS "Initialize with README" si vous avez déjà des fichiers

### 4. Ajouter et pousser le code

```powershell
# Ajouter tous les fichiers
git add .

# Faire un commit
git commit -m "Initial commit - ServiceManager application"

# Ajouter le remote (remplacez par votre URL)
git remote add origin https://github.com/VOTRE-USERNAME/servicemenager.git

# Pousser le code
git push -u origin main
```

### 5. Cloner sur le serveur

```bash
# Sur le serveur
ssh root@76.13.56.224

# Installer Git si nécessaire
apt update && apt install git -y

# Cloner le projet
cd /opt
git clone https://github.com/VOTRE-USERNAME/servicemenager.git
cd servicemenager

# Continuer avec le déploiement Docker
```

## Option 2 : Transférer directement (Sans Git)

Si vous ne voulez pas utiliser Git pour le moment :

### Sur votre machine locale (Windows PowerShell)

```powershell
# Transférer le projet complet
scp -r C:\Users\VICTUS\Documents\servicemenager-main root@76.13.56.224:/opt/servicemenager
```

### Sur le serveur

```bash
ssh root@76.13.56.224
cd /opt/servicemenager
# Continuer avec le déploiement Docker
```

## Recommandation

**Utilisez Git** car :
- ✅ Facilite les mises à jour futures
- ✅ Historique des modifications
- ✅ Backup automatique
- ✅ Facilite le travail en équipe
- ✅ Facilite le déploiement avec `git pull`

## Mise à jour future avec Git

Une fois sur Git, pour mettre à jour le serveur :

```bash
# Sur le serveur
cd /opt/servicemenager
git pull
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py collectstatic --noinput
```

