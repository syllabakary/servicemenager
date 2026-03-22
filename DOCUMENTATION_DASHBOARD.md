# 📋 Documentation — Tableau de bord

---

## 🔐 Connexion

Il existe **2 portails de connexion** :

- **Administrateur** → `/admin/login` (username + mot de passe)
- **Employé** → `/employe/login` (matricule + mot de passe)

---

## 👥 Rôles et accès

| Rôle | Ce qu'il peut faire |
|---|---|
| **SUPERADMIN** | Tout, y compris gestion des utilisateurs et journal d'activité |
| **ADMIN** | Tout sauf gestion des utilisateurs et journal d'activité |
| **EMPLOYÉ** | Son espace dédié uniquement (patients, scans, dashboard) |
| **CLIENT** | Pages publiques uniquement |

---

---

# 🖥️ ESPACE ADMINISTRATEUR

---

## 1. Tableau de bord
**Accès :** Admin, Superadmin

Vue d'ensemble du site :
- Statistiques globales (services, agences, employés, patients)
- Accès rapide aux sections principales

---

## 2. 👤 Gestion des utilisateurs
**Accès :** Superadmin uniquement  
**URL :** `/admin/utilisateurs`

- Voir tous les comptes (admin, superadmin)
- Créer un nouveau compte admin
- Modifier les informations d'un compte
- Supprimer un compte
- Réinitialiser le mot de passe (envoi automatique par email)

---

## 3. 👷 Employés
**Accès :** Admin, Superadmin  
**URL :** `/admin/employes`

- Voir la liste de tous les employés
- Créer un employé (formulaire en 4 étapes : infos, contact, adresse, emploi)
- Modifier un employé
- Supprimer un employé
- Activer / désactiver un employé
- Voir le profil complet avec patients assignés
- Réinitialiser le mot de passe d'un employé

---

## 4. 🏥 Patients
**Accès :** Admin, Superadmin  
**URL :** `/admin/patients`

- Voir la liste des patients
- Ajouter un patient (avec civilité, email, téléphone, localisation)
- Modifier un patient
- Supprimer un patient
- Assigner un ou plusieurs employés à un patient
- Générer et télécharger le QR code du patient (PDF)
- Activer / désactiver un patient
- Ajouter des notes

---

## 5. 📍 Scans (Présences)
**Accès :** Admin, Superadmin  
**URL :** `/admin/scans`

- Voir tous les scans (arrivée / départ) des employés
- Filtrer par patient, employé, date, statut
- Modifier un scan (date/heure, statut)
- Supprimer un scan
- Voir les statistiques de présence et durées

---

## 6. 📝 Devis
**Accès :** Admin, Superadmin  
**URL :** `/admin/devis`

- Voir tous les devis avec leur statut
- Créer un devis (nouveau client ou patient existant)
- Voir le détail d'un devis
- Modifier les prix manuellement (tarif A / tarif B)
- Appliquer des remises
- Envoyer le devis par email au client
- Générer le PDF du devis
- Changer le statut : En attente → Contacté → Devisé → Accepté / Refusé
- Supprimer un devis

---

## 7. 🧾 Factures
**Accès :** Admin, Superadmin  
**URL :** `/admin/factures`

- Voir toutes les factures avec statut et montant
- Créer une facture depuis un devis
- Modifier une facture (montant HT, TVA, conditions de paiement, notes)
- Changer le statut directement dans le tableau : Brouillon / Envoyée / Payée / Impayée / En retard / Annulée
- Envoyer la facture par email avec PDF en pièce jointe
- Télécharger le PDF de la facture
- Supprimer une facture
- Statistiques : total, payées, impayées, en retard, montant encaissé

---

## 8. 📋 Formulaires de devis
**Accès :** Admin, Superadmin  
**URL :** `/admin/formulaires-devis`

- Créer des formulaires de demande de devis par service
- Ajouter des étapes (sélection service, localisation, choix, texte libre, contact)
- Modifier / supprimer des étapes
- Réordonner les étapes

---

## 9. 🛠️ Services
**Accès :** Admin, Superadmin  
**URL :** `/admin/services`

- Voir la liste des services
- Créer / modifier / supprimer un service
- Activer ou désactiver un service
- Afficher ou masquer les avis clients pour ce service
- Afficher ou masquer la FAQ pour ce service

---

## 10. 🗂️ Catégories
**Accès :** Admin, Superadmin  
**URL :** `/admin/categories`

- Créer / modifier / supprimer des catégories de services
- Choisir l'ordre d'affichage
- Afficher ou masquer dans la barre de navigation

---

## 11. ✅ Avantages
**Accès :** Admin, Superadmin  
**URL :** `/admin/avantages`

- Ajouter / modifier / supprimer les points forts de l'entreprise
- Choisir une icône parmi 12 disponibles
- Ces éléments s'affichent sur le site public

---

## 12. 🏢 Agences
**Accès :** Admin, Superadmin  
**URL :** `/admin/agences`

- Créer / modifier / supprimer des agences
- Gérer les horaires d'ouverture (7 jours)
- Configurer les réseaux sociaux de l'agence
- Uploader un logo
- Activer / désactiver une agence

---

## 13. 🖼️ Page d'accueil (Hero)
**Accès :** Admin, Superadmin  
**URL :** `/admin/hero`

- Modifier le titre, sous-titre et description de la page d'accueil
- Changer l'image de fond

---

## 14. 🎯 Bannières
**Accès :** Admin, Superadmin  
**URL :** `/admin/bannieres`

- Gérer les bannières des pages du site
- Uploader des images
- Activer / désactiver une bannière

---

## 15. ⭐ Avis clients
**Accès :** Admin, Superadmin  
**URL :** `/admin/avis`

- Voir les avis laissés par les clients
- Approuver un avis (visible sur le site)
- Refuser un avis (masqué du site)

---

## 16. 💬 Messages de contact
**Accès :** Admin, Superadmin  
**URL :** `/admin/contact-messages`

- Voir les messages reçus via le formulaire de contact
- Filtrer par statut : Nouveau / Lu / Répondu
- Marquer comme lu ou répondu
- Supprimer un message

---

## 17. ⚙️ Paramètres
**Accès :** Admin, Superadmin  
**URL :** `/admin/parametres`

- Nom de l'entreprise, adresse, téléphone, email
- Couleurs du site (primaire, secondaire, tertiaire)
- Horaires d'ouverture
- Réseaux sociaux
- Configuration SMTP (pour l'envoi d'emails)

---

## 18. 🔒 Journal d'activité
**Accès :** Superadmin uniquement  
**URL :** `/admin/logs`

- Voir toutes les actions effectuées sur le site (créations, modifications, suppressions, connexions, emails envoyés, erreurs)
- Filtrer par niveau (Info, Avertissement, Erreur, Critique)
- Filtrer par type d'action, date, utilisateur
- Voir le détail complet d'une erreur avec la trace technique
- Rafraîchissement automatique toutes les 30 secondes

---

---

# 📱 ESPACE EMPLOYÉ

Accessible depuis `/employe/login` avec le **matricule** et le **mot de passe**.

---

## 1. Tableau de bord employé
**URL :** `/employe/dashboard`

- Statistiques personnelles (patients assignés, heures travaillées, scans du jour)
- Rafraîchissement automatique toutes les 30 secondes
- Accès rapide : Scanner QR, Mes patients, Changer mot de passe

---

## 2. Mes patients
**URL :** `/employe/patients`

- Voir uniquement les patients qui lui sont assignés
- Rechercher un patient
- Voir les informations de contact
- Accéder au détail d'un patient

---

## 3. Détail patient
**URL :** `/employe/patient/:id`

- Voir le profil complet du patient
- Voir l'historique de présences (arrivées / départs)
- Ajouter / modifier des notes sur une présence
- Voir les durées des interventions

---

## 4. Scanner QR
**URL :** `/employe/scan`

- Scanner le QR code du patient avec la caméra
- Ou saisir manuellement le code
- Choisir : Arrivée ou Départ
- Confirmer avec date et heure
- Ajouter un commentaire si besoin

---

## 5. Changer mot de passe
**URL :** `/employe/change-password`

- Modifier son propre mot de passe
- Saisir l'ancien mot de passe + nouveau + confirmation

---

---

*Documentation générée le 22/03/2026*
