/**
 * Configuration de l'URL de l'API
 * Détecte automatiquement l'URL en fonction de l'environnement
 */

// Détecter l'URL de l'API automatiquement
function getApiUrl(): string {
  // En production, utiliser l'URL de production
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  }

  // En développement, utiliser l'hostname actuel pour le port frontend
  // et déduire l'URL du backend
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Si on est sur localhost, utiliser localhost pour le backend aussi
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Pour les IPs locales (192.168.x.x, 10.x.x.x, 172.x.x.x), FORCER HTTP
  // Le serveur Django de développement ne supporte pas HTTPS
  const isLocalIP = hostname.match(/^(192\.168\.|10\.|172\.)/);
  if (isLocalIP) {
    // Toujours utiliser HTTP pour les IPs locales
    return `http://${hostname}:8000/api`;
  }
  
  // Sinon, utiliser le même hostname que le frontend mais avec le port 8000
  const apiProtocol = protocol.slice(0, -1); // Enlever le ':' à la fin
  return `${apiProtocol}://${hostname}:8000/api`;
}

export const API_URL = getApiUrl();

// Pour le débogage
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
  console.log('Hostname:', window.location.hostname);
  console.log('Protocol:', window.location.protocol);
  console.log('Full URL:', window.location.href);
}



