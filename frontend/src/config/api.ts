/**
 * Configuration de l'URL de l'API
 * Détecte automatiquement l'URL en fonction de l'environnement
 */

// Détecter l'URL de l'API automatiquement
function getApiUrl(): string {
  // Si VITE_API_URL est défini dans les variables d'environnement, l'utiliser en priorité
  if (import.meta.env.VITE_API_URL) {
    const viteApiUrl = import.meta.env.VITE_API_URL;
    // Si c'est un chemin relatif (commence par /), l'utiliser tel quel
    // Cela permet d'utiliser le proxy nginx en production
    if (viteApiUrl.startsWith('/')) {
      return viteApiUrl;
    }
    // Sinon, utiliser l'URL complète
    return viteApiUrl;
  }

  // En production, utiliser l'hostname actuel (IP publique ou domaine)
  if (import.meta.env.PROD) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol.slice(0, -1); // Enlever le ':'
    // En production, utiliser le même hostname que le frontend
    return `${protocol}://${hostname}/api`;
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

/** Configure axios: ajouter le token à chaque requête API et tenter un refresh en cas de 401 */
export function setupAxiosAuth(axiosInstance: any) {
  axiosInstance.interceptors.request.use((config: any) => {
    const url = config.url ?? "";
    if (url.startsWith(API_URL) || url.startsWith("/api")) {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (res: any) => res,
    async (err: any) => {
      const original = err.config;

      // Intercepter les 403 permission_denied → émettre un événement global
      if (err?.response?.status === 403) {
        const data = err.response.data;
        if (data?.code === "permission_denied") {
          window.dispatchEvent(new CustomEvent("permission-denied", { detail: data }));
        }
        return Promise.reject(err);
      }

      if (err?.response?.status !== 401 || original?.url?.includes("/token/") || original._retry) {
        return Promise.reject(err);
      }
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) return Promise.reject(err);
      original._retry = true;
      try {
        const { data } = await axiosInstance.post(`${API_URL}/token/refresh/`, { refresh });
        if (data?.access) {
          localStorage.setItem("access_token", data.access);
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${data.access}`;
          return axiosInstance.request(original);
        }
      } catch (_) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
          window.location.href = "/gestion-ease/acces-prive";
        }
      }
      return Promise.reject(err);
    }
  );
}



