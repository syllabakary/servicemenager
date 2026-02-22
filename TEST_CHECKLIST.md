# Checklist de tests – ServiceManager

Utilisez cette liste pour vérifier que toutes les fonctionnalités marchent sans erreur (en local ou après déploiement).

---

## 1. Tests automatiques (déjà exécutés)

- **Backend (Django)** : `python manage.py test api.tests` → **8 tests OK**
- **Frontend** : `npm run build` → **build OK** ; pas d’erreurs de lint

Pour relancer vous-même :
```bash
# Backend (depuis backend/, avec venv activé)
python manage.py test api.tests --verbosity=2

# Frontend
cd frontend && npm run build
```

---

## 2. Tests manuels – Site public

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | Ouvrir la page d’accueil | Affichage correct, couleurs du thème (vert par défaut), pas d’erreur console |
| 2 | Cliquer **Services** | Liste des services, filtres, liens « Découvrir le service » |
| 3 | Ouvrir un service (détail) | Fiche détaillée, FAQ, formulaire devis, boutons visibles |
| 4 | Cliquer **Agences** | Liste des agences, carte / liste, lien vers détail |
| 5 | Ouvrir une agence (détail) | Coordonnées, horaires, services proposés |
| 6 | Cliquer **Contact** | Formulaire ou infos de contact, horaires |
| 7 | **Demander un devis** (depuis accueil ou page devis) | Formulaire étapes, envoi sans erreur (ou message clair si config manquante) |
| 8 | Changer les couleurs dans **Admin > Paramètres** | Sauvegarde OK, rafraîchir le site public → couleurs mises à jour |

---

## 3. Tests manuels – Connexion admin

| # | Action | Résultat attendu |
|---|--------|------------------|
| 9 | Aller sur **/admin/login** | Page de connexion, champs identifiant / mot de passe |
| 10 | Se connecter (admin ou superadmin) | Redirection tableau de bord admin, pas d’erreur |
| 11 | **Changer mot de passe** (menu admin) | Formulaire ancien / nouveau mot de passe, succès et reconnexion possible |
| 12 | **Déconnexion** | Retour page login ou accueil |

---

## 4. Tests manuels – Admin (après connexion)

| # | Action | Résultat attendu |
|---|--------|------------------|
| 13 | **Dashboard** | Statistiques / liens, pas d’erreur 500 |
| 14 | **Utilisateurs** : liste, créer, modifier, supprimer | CRUD OK, rôles affichés correctement |
| 15 | **Réinitialiser mot de passe** (icône clé) | Popup personnalisée, confirmation, message succès (ou email si SMTP configuré) |
| 16 | **Employés** : liste, créer, modifier, fiche détail | CRUD OK, matricule, profil employé |
| 17 | **Fiche employé** : bouton « Réinitialiser mot de passe » | Popup personnalisée, nouveau mot de passe affiché ou envoyé par email |
| 18 | **Patients** : liste, créer, modifier, lier à un employé | Pas d’erreur, données cohérentes |
| 19 | **Services** : liste, créer, modifier, activer/désactiver | Services actifs/inactifs, ordre |
| 20 | **Catégories** | CRUD OK |
| 21 | **Agences** : liste, créer, modifier | Adresse, coordonnées, image |
| 22 | **Devis** : liste, ouvrir un devis | Détail, statuts, PDF si disponible |
| 23 | **Formulaires devis** : étapes, options | Enregistrement sans erreur |
| 24 | **Paramètres** : thème (couleurs), logo, SMTP, horaires | Sauvegarde OK, pas d’erreur 500 |
| 25 | **Scans** (si utilisé) | Liste / détail des scans sans erreur |
| 26 | **Avis**, **Bannières**, **Avantages** (si utilisés) | Affichage et sauvegarde OK |

---

## 5. Tests manuels – Espace employé

| # | Action | Résultat attendu |
|---|--------|------------------|
| 27 | Aller sur **/employe/login** | Page connexion employé |
| 28 | Se connecter (compte employé) | Tableau de bord employé |
| 29 | **Changer mot de passe** (bouton ou menu) | Formulaire, succès, reconnexion possible |
| 30 | **Mes patients** | Liste des patients assignés |
| 31 | Ouvrir un **patient** (détail) | Fiche patient, pas d’erreur |
| 32 | **Scanner QR** (si actif) | Page scan, comportement attendu (caméra ou message clair) |
| 33 | **Déconnexion** | Retour page login employé |

---

## 6. Vérifications rapides

- **Console navigateur** (F12 > Console) : pas d’erreur rouge sur les pages testées.
- **Réseau** (F12 > Network) : les appels API renvoient 200 (ou 201, 204) sauf cas attendu (401, 404, etc.).
- **Mobile / responsive** : au moins une vérification sur une largeur réduite (menu, formulaires, tableaux).

---

## 7. En cas de problème

- Erreur **500** : regarder les logs backend (`python manage.py runserver` ou logs Docker).
- Erreur **401 / 403** : vérifier le rôle (superadmin / admin / employé / client) et les permissions.
- **Blanc / crash front** : ouvrir la console (F12), noter le message d’erreur et le fichier/ligne indiqués.
- **Couleurs ou thème** : vérifier que la migration `0030_sitesettings_default_green` est appliquée (`python manage.py migrate`) et que les paramètres dans Admin > Paramètres sont sauvegardés.

---

*Dernière mise à jour : checklist créée après validation des tests automatiques (backend + build frontend).*
