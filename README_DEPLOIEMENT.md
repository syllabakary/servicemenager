# 📦 Guide de Déploiement - ServiceManager

## 🎯 Vue d'ensemble

Ce projet peut être déployé de deux façons :
1. **Docker** (recommandé) - Plus simple et isolé
2. **Déploiement direct** - Sur cPanel ou serveur traditionnel

## 🐳 Option 1 : Déploiement avec Docker (Recommandé)

### Avantages
- ✅ Isolation complète des dépendances
- ✅ Facile à mettre à jour
- ✅ Configuration simple
- ✅ Base de données PostgreSQL incluse

### Fichiers créés
- `docker-compose.yml` - Configuration des services
- `backend/Dockerfile` - Image Docker pour Django
- `frontend/Dockerfile` - Image Docker pour React
- `frontend/nginx.conf` - Configuration Nginx pour le frontend
- `.env.example` - Exemple de variables d'environnement
- `deploy.sh` - Script de déploiement automatique
- `DEPLOIEMENT_DOCKER.md` - Guide détaillé

### Démarrage rapide

1. **Transférer le projet sur le serveur**
   ```bash
   scp -r servicemenager-main root@76.13.56.224:/opt/servicemenager
   ```

2. **Sur le serveur**
   ```bash
   ssh root@76.13.56.224
   cd /opt/servicemenager
   
   # Installer Docker
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   apt install docker-compose-plugin -y
   
   # Configurer .env (voir DEPLOIEMENT_DOCKER.md)
   cp .env.example .env
   nano .env
   
   # Démarrer
   docker compose up -d
   ```

3. **Créer un superutilisateur**
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

**Voir `DEPLOIEMENT_DOCKER.md` pour le guide complet.**

## 🖥️ Option 2 : Déploiement Direct (cPanel/Traditionnel)

### Fichiers existants
- `DEPLOIEMENT_CPANEL.md` - Guide pour cPanel
- `backend/servicemenager/settings_production.py` - Settings pour production
- `backend/passenger_wsgi.py` - Configuration WSGI pour Passenger

**Voir `DEPLOIEMENT_CPANEL.md` pour le guide complet.**

## 📋 Checklist Générale

### Avant le déploiement
- [ ] Changer `DEBUG = False` en production
- [ ] Générer une `SECRET_KEY` sécurisée
- [ ] Configurer `ALLOWED_HOSTS` avec votre IP/domaine
- [ ] Configurer la base de données (PostgreSQL recommandé)
- [ ] Configurer les variables CORS
- [ ] Configurer les emails SMTP (optionnel)

### Après le déploiement
- [ ] Vérifier que l'application est accessible
- [ ] Tester l'authentification
- [ ] Créer un superutilisateur
- [ ] Configurer HTTPS/SSL (recommandé)
- [ ] Configurer les backups automatiques
- [ ] Configurer le monitoring

## 🔐 Sécurité

### Obligatoire
- ✅ `DEBUG = False` en production
- ✅ `SECRET_KEY` longue et aléatoire
- ✅ `ALLOWED_HOSTS` restreint
- ✅ Mots de passe forts pour la base de données
- ✅ HTTPS/SSL activé

### Recommandé
- 🔒 Firewall configuré (UFW)
- 🔒 Rate limiting
- 🔒 Backups automatiques
- 🔒 Monitoring des logs
- 🔒 Mises à jour régulières

## 📞 Support

En cas de problème :
1. Vérifier les logs : `docker compose logs -f` (Docker) ou logs du serveur
2. Vérifier la configuration dans `.env` ou `settings_production.py`
3. Vérifier les permissions des fichiers
4. Vérifier la connexion à la base de données

## 📚 Documentation

- `DEPLOIEMENT_DOCKER.md` - Guide Docker complet
- `DEPLOIEMENT_CPANEL.md` - Guide cPanel complet
- `QUICK_START_DOCKER.md` - Démarrage rapide Docker
- `SECURITY_REPORT.md` - Rapport de sécurité

---

**Bon déploiement ! 🚀**

