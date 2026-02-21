# Personnalisation du thème (couleurs et style)

Toutes les couleurs et styles listés ci-dessous sont **dynamiques** : ils sont gérés depuis l’interface **Admin → Paramètres → Thème et apparence** et s’appliquent en même temps aux **3 interfaces** (client, admin, employé). Aucune couleur n’est en dur dans le code.

---

## 1. Informations générales

| Paramètre   | Variable / usage                    | Où c’est utilisé                          |
|------------|--------------------------------------|-------------------------------------------|
| Nom du site | `site_name`                         | Navbar (site public), sidebar admin, emails, PDF |
| Slogan     | `site_tagline`                      | Navbar (site public), emails, PDF        |

---

## 2. Couleurs principales du site

| Paramètre              | Variable CSS (ex.)        | Utilisation |
|------------------------|---------------------------|-------------|
| Couleur principale     | `--site-primary-hex`      | Titres, navigation active, icônes, accents (client, admin, employé). |
| Couleur secondaire     | `--site-secondary-hex`    | Dégradés, hover, transitions. |
| Couleur tertiaire      | `--site-tertiary-hex`     | États actifs, focus, surbrillance. |

**Classes Tailwind :** `text-site-primary`, `bg-site-primary`, `border-site-primary`, `from-site-primary`, `to-site-secondary`, etc.

---

## 3. Couleurs des boutons

| Paramètre                | Variable CSS (ex.)                  | Utilisation |
|--------------------------|-------------------------------------|-------------|
| Fond des boutons         | `--site-button-primary-hex`         | Tous les boutons principaux (CTA, actions) sur les 3 interfaces. |
| Hover des boutons        | `--site-button-primary-hover-hex`   | Survol des boutons principaux. |
| Texte des boutons        | `--site-button-text-hex`            | Texte à l’intérieur des boutons (souvent blanc). |

**Classes Tailwind :** `bg-site-button-primary`, `hover:bg-site-button-primary-hover`, `text-site-button-text`.

---

## 4. Bordures des boutons

| Paramètre              | Variable CSS (ex.)                | Utilisation |
|------------------------|-----------------------------------|-------------|
| Couleur de la bordure  | `--site-button-border-hex`        | Bordure des boutons principaux (vide = pas de bordure). |
| Épaisseur (px)         | `--site-button-border-width`      | 0 = pas de bordure. |
| Rayon des coins        | `--site-button-border-radius`     | Ex. `0.375rem`, `0.5rem`, `9999px` (pilule). |

Appliqué automatiquement aux éléments avec `bg-site-button-primary` (voir `index.css`).

---

## 5. Couleurs des textes et liens

| Paramètre          | Variable CSS (ex.)              | Utilisation |
|--------------------|----------------------------------|-------------|
| Textes importants  | `--site-text-primary-hex`        | Titres, accents dans le contenu. |
| Liens              | `--site-text-link-hex`           | Liens cliquables. |
| Hover des liens    | `--site-text-link-hover-hex`     | Survol des liens. |

**Classes Tailwind :** `text-site-text-primary`, `text-site-text-link`, `hover:text-site-text-link-hover`.

---

## 6. Bannière (bandeau promo)

| Paramètre     | Variable CSS (ex.)        | Utilisation |
|---------------|----------------------------|-------------|
| Fond          | `--site-banner-bg-hex`     | Fond du bandeau promotionnel en haut du site client. |
| Texte         | `--site-banner-text-hex`   | Texte du bandeau. |

**Classes Tailwind :** `bg-site-banner-bg`, `text-site-banner-text`.

---

## 7. Footer

| Paramètre        | Variable CSS (ex.)             | Utilisation |
|------------------|--------------------------------|-------------|
| Fond             | `--site-footer-bg-hex`          | Fond du pied de page. |
| Texte            | `--site-footer-text-hex`        | Texte principal du footer. |
| Liens / icônes   | `--site-footer-link-hex`        | Liens et icônes. |
| Hover des liens  | `--site-footer-link-hover-hex`  | Survol des liens du footer. |
| Bordures         | `--site-footer-border-hex`      | Bordures et séparateurs du footer. |

**Classes Tailwind :** `bg-site-footer-bg`, `text-site-footer-text`, `text-site-footer-link`, `hover:text-site-footer-link-hover`, `border-site-footer-border`.

---

## 8. Couleurs du nom et slogan (navbar)

| Paramètre | Variable CSS (ex.) | Utilisation |
|-----------|--------------------|-------------|
| Couleur 1 du nom | `--site-name-part1-hex` | Première partie du nom (ex. « Services »). |
| Couleur 2 du nom | `--site-name-part2-hex` | Deuxième partie du nom (ex. « Locaux »). |
| Couleur du slogan | `--site-tagline-hex` | Tagline sous le nom (ex. « Votre partenaire de confiance »). |

**Classes Tailwind :** `text-site-name-part1`, `text-site-name-part2`, `text-site-tagline`.

---

## 9. Boutons outline (ex. Connexion)

| Paramètre | Variable CSS (ex.) | Utilisation |
|-----------|--------------------|-------------|
| Bordure | `--site-button-outline-border-hex` | Bordure des boutons type Connexion. |
| Texte | `--site-button-outline-text-hex` | Couleur du texte. |
| Fond au survol | `--site-button-outline-hover-bg-hex` | Fond au survol (texte en blanc). |

**Classes Tailwind :** `border-site-button-outline-border`, `text-site-button-outline-text`, `hover:bg-site-button-outline-hover-bg`.

---

## 10. Logo et favicon

- **Logo du site** : affiché dans la Navbar (site public) et dans les emails/PDF si configuré.
- **Favicon** : icône de l’onglet du navigateur.

---

## Où les variables sont appliquées

- **SiteTheme** (`frontend/src/components/SiteTheme.tsx`) : charge les paramètres via l’API `site-settings/` et définit les variables CSS sur `document.documentElement`. Ce composant est monté une fois dans `App.tsx`, donc les variables sont actives sur **tout le site** (client, admin, employé).
- **Tailwind** (`tailwind.config.ts`) : les couleurs `site.*` pointent vers ces variables (ex. `var(--site-primary-hex, #DC2626)`).
- **Admin** : page **Paramètres → Thème et apparence** pour modifier tous les champs ci-dessus ; un seul enregistrement met à jour les 3 interfaces.

---

## Bonnes pratiques

- Ne pas mettre de couleurs en dur (ex. `#DC2626`, `red-600`) dans les composants : utiliser les classes `site-*` ou les variables CSS.
- Pour un nouveau bloc de style (ex. carte, bandeau), ajouter les champs nécessaires dans **SiteSettings** (backend), les exposer dans l’API et dans **Parametres**, puis les appliquer dans **SiteTheme** et utiliser les classes Tailwind correspondantes.
