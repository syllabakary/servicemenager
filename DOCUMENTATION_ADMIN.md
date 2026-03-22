# Documentation — Tableau de bord Administrateur

---

## Connexion

Adresse : `/admin/login`
Identifiants : username + mot de passe

---

## 1. Tableau de bord

Vue d'ensemble du site :
- Statistiques globales (services, agences, employés, patients)
- Accès rapide aux sections principales

---

## 2. Employés
`/admin/employes`

- Voir la liste de tous les employés
- Créer un employé (formulaire en 4 étapes : infos personnelles, contact, adresse, emploi)
- Modifier les informations d'un employé
- Supprimer un employé
- Activer ou désactiver un employé
- Réinitialiser le mot de passe d'un employé
- Voir le profil complet avec les patients assignés

---

## 3. Patients
`/admin/patients`

- Voir la liste des patients
- Ajouter un patient (civilité, email, téléphone, localisation)
- Modifier un patient
- Supprimer un patient
- Assigner un ou plusieurs employés à un patient
- Générer et télécharger le QR code du patient (PDF)
- Activer ou désactiver un patient
- Ajouter des notes

---

## 4. Scans (Présences)
`/admin/scans`

- Voir tous les scans (arrivée / départ) des employés
- Filtrer par patient, employé, date, statut
- Modifier un scan (date/heure, statut)
- Supprimer un scan
- Voir les statistiques de présence et les durées

---

## 5. Devis
`/admin/devis`

- Voir tous les devis avec leur statut
- Créer un devis (nouveau client ou patient existant)
- Modifier les prix manuellement (tarif A / tarif B)
- Appliquer des remises
- Envoyer le devis par email au client
- Générer le PDF du devis
- Changer le statut : En attente → Contacté → Devisé → Accepté / Refusé
- Supprimer un devis

---

## 6. Factures
`/admin/factures`

- Voir toutes les factures avec statut et montant
- Créer une facture depuis un devis
- Modifier une facture (montant HT, TVA, conditions de paiement, notes)
- Changer le statut directement dans le tableau :
  Brouillon / Envoyée / Payée / Impayée / En retard / Annulée
- Envoyer la facture par email avec PDF en pièce jointe
- Télécharger le PDF de la facture
- Supprimer une facture
- Statistiques : total, payées, impayées, en retard, montant encaissé

---

## 7. Formulaires de devis
`/admin/formulaires-devis`

- Créer des formulaires de demande de devis par service
- Ajouter des étapes (sélection service, localisation, choix, texte libre, contact)
- Modifier / supprimer des étapes
- Réordonner les étapes

---

## 8. Services
`/admin/services`

- Voir la liste des services
- Créer / modifier / supprimer un service
- Activer ou désactiver un service
- Afficher ou masquer les avis clients pour ce service
- Afficher ou masquer la FAQ pour ce service

---

## 9. Catégories
`/admin/categories`

- Créer / modifier / supprimer des catégories de services
- Choisir l'ordre d'affichage
- Afficher ou masquer dans la barre de navigation

---

## 10. Avantages
`/admin/avantages`

- Ajouter / modifier / supprimer les points forts de l'entreprise
- Choisir une icône parmi celles disponibles
- Ces éléments s'affichent sur le site public

---

## 11. Agences
`/admin/agences`

- Créer / modifier / supprimer des agences
- Gérer les horaires d'ouverture (7 jours)
- Configurer les réseaux sociaux de l'agence
- Uploader un logo
- Activer / désactiver une agence

---

## 12. Page d'accueil
`/admin/hero`

- Modifier le titre, sous-titre et description de la page d'accueil
- Changer l'image de fond

---

## 13. Bannières
`/admin/bannieres`

- Gérer les bannières des pages du site
- Uploader des images
- Activer / désactiver une bannière

---

## 14. Avis clients
`/admin/avis`

- Voir les avis laissés par les clients
- Approuver un avis (visible sur le site)
- Refuser un avis (masqué du site)

---

## 15. Messages de contact
`/admin/contact-messages`

- Voir les messages reçus via le formulaire de contact
- Filtrer par statut : Nouveau / Lu / Répondu
- Marquer comme lu ou répondu
- Supprimer un message

---

## 16. Paramètres
`/admin/parametres`

- Nom de l'entreprise, adresse, téléphone, email
- Couleurs du site (primaire, secondaire, tertiaire)
- Horaires d'ouverture
- Réseaux sociaux
- Configuration SMTP (envoi d'emails)

---

## 17. Changer mot de passe
`/admin/change-password`

- Modifier son propre mot de passe
- Saisir l'ancien mot de passe + nouveau + confirmation

---

*Documentation — 22/03/2026*
