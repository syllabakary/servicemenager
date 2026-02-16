import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Vérifier si on est sur HTTPS avec une IP locale et rediriger vers HTTP
// Le serveur Django de développement ne supporte pas HTTPS
// Ne rediriger QUE si on est vraiment sur une IP locale (pas un domaine)
const hostname = window.location.hostname;
const protocol = window.location.protocol;
const isLocalIP = hostname.match(/^(192\.168\.|10\.|172\.|127\.0\.0\.1|localhost)$/);

// Si on est sur HTTPS avec une IP locale (pas un domaine), rediriger immédiatement
// Ne pas rediriger si c'est un domaine (comme ease-dom.fr, viaduc, etc.)
if (isLocalIP && protocol === 'https:') {
  // Rediriger vers HTTP - utiliser replace pour éviter d'ajouter à l'historique
  const httpUrl = window.location.href.replace('https://', 'http://');
  console.warn('⚠️ Redirection HTTPS -> HTTP pour IP locale:', httpUrl);
  console.warn('Le serveur Django de développement ne supporte que HTTP');
  // Utiliser location.href au lieu de replace pour forcer le rechargement
  window.location.href = httpUrl;
  // Ne pas continuer l'exécution
  throw new Error('Redirection en cours...');
}

// Rendre l'application normalement
createRoot(document.getElementById("root")!).render(<App />);
