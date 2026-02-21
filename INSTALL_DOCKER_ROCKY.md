# 🐳 Installation Docker sur Rocky Linux

## Installation Docker sur Rocky Linux

Rocky Linux nécessite une installation manuelle de Docker.

### Méthode 1 : Installation via les dépôts officiels (Recommandé)

```bash
# 1. Installer les dépendances nécessaires
dnf install -y yum-utils

# 2. Ajouter le dépôt Docker
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 3. Installer Docker Engine, Docker CLI et Containerd
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Démarrer Docker
systemctl start docker
systemctl enable docker

# 5. Vérifier l'installation
docker --version
docker compose version

# 6. Tester Docker
docker run hello-world
```

### Méthode 2 : Installation via Podman (Alternative)

Rocky Linux inclut Podman par défaut, qui est compatible avec Docker :

```bash
# Vérifier si Podman est installé
podman --version

# Si pas installé
dnf install -y podman podman-compose

# Créer un alias pour utiliser 'docker' au lieu de 'podman'
echo 'alias docker=podman' >> ~/.bashrc
echo 'alias docker-compose=podman-compose' >> ~/.bashrc
source ~/.bashrc
```

**Note :** Podman est compatible avec Docker mais utilise des commandes légèrement différentes. Pour docker-compose, utilisez `podman-compose` ou installez Docker Compose séparément.

### Méthode 3 : Installation manuelle de Docker Compose

Si Docker est installé mais pas Docker Compose :

```bash
# Télécharger Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Rendre exécutable
chmod +x /usr/local/bin/docker-compose

# Créer un lien symbolique
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Vérifier
docker-compose --version
```

## Vérification

```bash
# Vérifier que Docker fonctionne
systemctl status docker

# Vérifier les versions
docker --version
docker compose version

# Tester avec un conteneur
docker run hello-world
```

## Problèmes courants

### Erreur de permissions

Si vous avez une erreur de permissions :

```bash
# Ajouter votre utilisateur au groupe docker
usermod -aG docker $USER

# Ou pour root (déjà fait)
# Reconnectez-vous pour que les changements prennent effet
newgrp docker
```

### Firewall

Si le firewall bloque Docker :

```bash
# Vérifier le statut du firewall
systemctl status firewalld

# Si actif, autoriser Docker
firewall-cmd --permanent --zone=public --add-masquerade
firewall-cmd --reload
```

## Continuer avec le déploiement

Une fois Docker installé, continuez avec :

```bash
cd /opt/servicemenager

# Créer le fichier .env
nano .env

# Puis construire et démarrer
docker compose build
docker compose up -d
```



