/**
 * Hook pour vérifier les permissions d'un admin sur un module.
 * SUPERADMIN a toujours tout. ADMIN doit avoir la permission explicite.
 */
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/config/api";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

// Cache global des permissions chargées pour l'utilisateur courant
export function useMyPermissions() {
  const user = getCurrentUser();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  return useQuery({
    queryKey: ["my-permissions", user?.id],
    queryFn: async () => {
      if (isSuperAdmin) return null; // SUPERADMIN : pas besoin de vérifier
      const res = await axios.get(`${API_URL}/user-permissions/me/`, {
        headers: authHeader(),
      });
      return res.data.permissions as Record<string, boolean>;
    },
    enabled: !!user?.id && !isSuperAdmin,
    staleTime: 60000, // 1 minute de cache
  });
}

export function useModulePermission(module: string, action: string): boolean {
  const user = getCurrentUser();
  const { data: permissions } = useMyPermissions();

  // SUPERADMIN : toujours autorisé
  if (user?.role === "SUPERADMIN") return true;

  // Pas encore chargé : on autorise par défaut (l'API bloquera si besoin)
  if (permissions === undefined) return true;

  const key = `${module}.${action}`;
  // Si la permission n'existe pas en DB → true par défaut (comportement ADMIN par défaut)
  return permissions[key] !== undefined ? permissions[key] : true;
}
