# Services Locaux – Plateforme de Services Locales

## Aperçu
Ceci est un site professionnel de services locaux qui met en relation les utilisateurs avec des prestataires de services à domicile : nettoyage, garde d’enfants, entretien de jardins, etc. La plateforme permet de découvrir les services, de trouver les agences par ville et de demander des devis en ligne. L’application est moderne, responsive, et met l’accent sur la confiance, le professionnalisme et la simplicité d’utilisation.

## Préférences Utilisateur
- Style de communication préféré : langage simple et accessible au quotidien.

---

## Architecture Système

### Frontend

**Framework & Build System**
- React 18+ avec TypeScript pour un développement de composants typés et sécurisé.  
- Vite comme outil de build et serveur de développement pour un HMR (Hot Module Replacement) rapide.  
- Wouter pour un routage léger côté client, en alternative à React Router.  
- Application SPA (Single Page Application) avec plusieurs routes.  

**Système de Composants UI**
- Shadcn/UI avec primitives Radix UI pour l’accessibilité.  
- Tailwind CSS pour le styling utilitaire avec des tokens personnalisés.  
- Design basé sur la variante Shadcn “New York” avec palette de couleurs personnalisée.  
- Variables CSS pour le theming (mode clair configuré, support du mode sombre prévu).  
- Framer Motion pour les animations et transitions.  

**Gestion d’État & Récupération de Données**
- TanStack Query (React Query) pour la gestion de l’état serveur.  
- Configuration customisée du query client : stale time infini, refetch désactivé.  
- État des formulaires géré avec React Hook Form et validation Zod.  
- État local des composants via hooks React.  

**Principes de Design**
- Mobile-first responsive design  
- Couleur primaire bleu professionnel (#2A63F5)  
- Typographie Poppins/Inter pour un rendu moderne  
- Inspiré de l’esthétique Azaé.com avec approche “warm modernism”  
- Icônes Lucide React pour cohérence graphique  

---

### Backend

**Framework Serveur**
- Express.js pour l’API REST  
- TypeScript pour la sécurité des types sur toute la stack  
- Middleware custom pour logging des requêtes et parsing JSON  
- Mode développement intégré avec Vite middleware pour support SSR  

**Design API**
- Endpoints RESTful orientés ressources :  
  - `GET /api/services` – Liste des services  
  - `GET /api/agencies` – Liste des agences  
  - `GET /api/agencies/:id` – Détails d’une agence  
  - `POST /api/quote-requests` – Soumettre un devis  
- Réponses JSON avec codes HTTP appropriés  
- Validation des entrées API via Zod  

**Couche de Données**
- Drizzle ORM pour abstraction de base de données et requêtes typées  
- PostgreSQL via Neon serverless driver  
- Approche schema-first avec types partagés client/serveur  
- Stockage mémoire (MemStorage) pour développement/test  
- Abstraction de stockage via interface `IStorage` pour changement facile de base de données  

**Schéma de Base de Données**
- `services` : id, nom, description, icône  
- `agencies` : id, nom, ville, tableau services, contact, image  
- `quote_requests` : id, nom, email, service, message, timestamp  

---

## Structure du Projet

**Organisation Monorepo**
- `/client` : Application React frontend  
  - `/src/components` – Composants UI réutilisables  
  - `/src/pages` – Pages basées sur les routes  
  - `/src/lib` – Utilitaires et configurations  
  - `/src/hooks` – Hooks React custom  
- `/server` : Application backend Express  
  - `routes.ts` – Définition des routes API  
  - `storage.ts` – Accès aux données  
  - `vite.ts` – Intégration serveur développement  
- `/shared` : Types et schemas TypeScript partagés  
  - `schema.ts` – Schéma Drizzle + validateurs Zod  
- `/attached_assets` : Assets statiques et images générées  

**Alias de Chemin**
- `@/` → `client/src/`  
- `@shared/` → `shared/`  
- `@assets/` → `attached_assets/`  

---

## Build & Déploiement

**Développement**
- `npm run dev` – Démarre le serveur Express avec middleware Vite  
- HMR pour mises à jour instantanées  
- Vérification TypeScript : `npm run check`  

**Production**
- `npm run build` – Build client (Vite) + serveur (esbuild)  
- Output client : `dist/public/`  
- Output serveur : `dist/index.js` (ESM)  
- Lancement production : `npm start`  

**Gestion Base de Données**
- Drizzle Kit pour migrations  
- `npm run db:push` – Pousse les changements de schéma  
- Fichiers de migration : `/migrations`  

---

## Dépendances Externes

**Base de données**
- PostgreSQL (Neon serverless)  
- Connection via `DATABASE_URL`  
- Drizzle ORM pour requêtes typées et migrations  

**UI & Interactions**
- Radix UI primitives (Dialog, Dropdown, Select…)  
- Lucide React pour icônes  
- Embla Carousel pour carrousels (optionnel)  
- cmdk pour palette de commandes  

**Formulaires**
- React Hook Form pour gestion d’état  
- Zod pour validation runtime  
- @hookform/resolvers pour intégration Zod  

**Outils Dév**
- Plugins Replit spécifiques pour dev environment  
- Overlay d’erreur runtime  
- Cartographer pour intelligence de code  
- Dev banner pour mode développement  

**Dates & Sessions**
- date-fns pour manipulation et formatage  
- connect-pg-simple pour sessions PostgreSQL (routes non implémentées)  

**Styling**
- Tailwind CSS + PostCSS + Autoprefixer  
- class-variance-authority (CVA) pour variantes de composants  
- tailwind-merge & clsx pour composition conditionnelle de classes  
