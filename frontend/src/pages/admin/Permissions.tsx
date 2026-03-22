import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API_URL } from "@/config/api";
import { FaShieldAlt, FaUser, FaCheck, FaTimes, FaSave, FaChevronDown, FaChevronRight } from "react-icons/fa";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

// Modules et actions — ordre d'affichage
const MODULES = [
  { value: "devis",      label: "Devis" },
  { value: "factures",   label: "Factures" },
  { value: "employes",   label: "Employés" },
  { value: "patients",   label: "Patients" },
  { value: "scans",      label: "Scans / Présences" },
  { value: "services",   label: "Services" },
  { value: "categories", label: "Catégories" },
  { value: "avantages",  label: "Avantages" },
  { value: "agences",    label: "Agences" },
  { value: "avis",       label: "Avis clients" },
  { value: "messages",   label: "Messages contact" },
  { value: "bannieres",  label: "Bannières" },
  { value: "hero",       label: "Page d'accueil" },
  { value: "parametres", label: "Paramètres" },
];

const ACTIONS = [
  { value: "view",   label: "Voir" },
  { value: "create", label: "Créer" },
  { value: "update", label: "Modifier" },
  { value: "delete", label: "Supprimer" },
  { value: "email",  label: "Email" },
  { value: "pdf",    label: "PDF" },
];

// Actions disponibles par module (certains modules n'ont pas create/email/pdf)
const MODULE_ACTIONS: Record<string, string[]> = {
  devis:      ["view", "create", "update", "delete", "email", "pdf"],
  factures:   ["view", "create", "update", "delete", "email", "pdf"],
  employes:   ["view", "create", "update", "delete"],
  patients:   ["view", "create", "update", "delete"],
  scans:      ["view", "update", "delete"],
  services:   ["view", "create", "update", "delete"],
  categories: ["view", "create", "update", "delete"],
  avantages:  ["view", "create", "update", "delete"],
  agences:    ["view", "create", "update", "delete"],
  avis:       ["view", "update", "delete"],
  messages:   ["view", "update", "delete"],
  bannieres:  ["view", "create", "update", "delete"],
  hero:       ["view", "update"],
  parametres: ["view", "update"],
};

function permKey(module: string, action: string) {
  return `${module}.${action}`;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  full_name: string;
  permissions: Record<string, boolean>;
}

// Composant ligne de permission pour un utilisateur
function UserPermissionsCard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>(() => {
    // Initialiser avec les permissions existantes ou true par défaut (ADMIN a tout par défaut)
    const p: Record<string, boolean> = {};
    MODULES.forEach(m => {
      (MODULE_ACTIONS[m.value] || []).forEach(a => {
        const key = permKey(m.value, a);
        p[key] = user.permissions[key] !== undefined ? user.permissions[key] : true;
      });
    });
    return p;
  });
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const permissions = Object.entries(localPerms).map(([key, granted]) => {
        const [module, action] = key.split(".");
        return { module, action, granted };
      });
      await axios.post(
        `${API_URL}/user-permissions/${user.id}/bulk-update/`,
        { permissions },
        { headers: authHeader() }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-permissions"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const toggle = (module: string, action: string) => {
    const key = permKey(module, action);
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const grantAll = () => {
    const p = { ...localPerms };
    MODULES.forEach(m => {
      (MODULE_ACTIONS[m.value] || []).forEach(a => {
        p[permKey(m.value, a)] = true;
      });
    });
    setLocalPerms(p);
    setSaved(false);
  };

  const revokeAll = () => {
    const p = { ...localPerms };
    MODULES.forEach(m => {
      (MODULE_ACTIONS[m.value] || []).forEach(a => {
        p[permKey(m.value, a)] = false;
      });
    });
    setLocalPerms(p);
    setSaved(false);
  };

  const totalGranted = Object.values(localPerms).filter(Boolean).length;
  const total = Object.keys(localPerms).length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header utilisateur */}
      <div
        className="flex items-center justify-between px-5 py-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-site-primary/10 flex items-center justify-center">
            <FaUser className="w-4 h-4 text-site-primary" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">{user.full_name}</div>
            <div className="text-xs text-gray-400">{user.username} • {user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-site-primary">{totalGranted}</span>/{total} permissions
          </div>
          <div className={`w-2 h-2 rounded-full ${totalGranted === total ? "bg-green-400" : totalGranted === 0 ? "bg-red-400" : "bg-amber-400"}`} />
          {expanded ? <FaChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <FaChevronRight className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </div>

      {/* Corps dépliable */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {/* Actions rapides */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-white">
            <button
              onClick={grantAll}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors font-medium"
            >
              Tout autoriser
            </button>
            <button
              onClick={revokeAll}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-medium"
            >
              Tout refuser
            </button>
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className={`text-xs flex items-center gap-1.5 ${saved ? "bg-green-600 hover:bg-green-600" : ""}`}
              >
                {saved ? (
                  <><FaCheck className="w-3 h-3" /> Enregistré</>
                ) : (
                  <><FaSave className="w-3 h-3" /> {mutation.isPending ? "Sauvegarde..." : "Enregistrer"}</>
                )}
              </Button>
            </div>
          </div>

          {/* Tableau permissions */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100/60">
                  <th className="text-left px-5 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wide w-48">
                    Module
                  </th>
                  {ACTIONS.map(a => (
                    <th key={a.value} className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wide w-20">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod, idx) => {
                  const availableActions = MODULE_ACTIONS[mod.value] || [];
                  return (
                    <tr key={mod.value} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                      <td className="px-5 py-3 font-medium text-gray-700">
                        {mod.label}
                      </td>
                      {ACTIONS.map(action => {
                        const isAvailable = availableActions.includes(action.value);
                        const key = permKey(mod.value, action.value);
                        const granted = localPerms[key];
                        return (
                          <td key={action.value} className="text-center px-3 py-3">
                            {isAvailable ? (
                              <button
                                onClick={() => toggle(mod.value, action.value)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                  granted
                                    ? "bg-green-100 text-green-600 border border-green-300 hover:bg-green-200"
                                    : "bg-red-50 text-red-400 border border-red-200 hover:bg-red-100"
                                }`}
                                title={`${mod.label} — ${action.label} : ${granted ? "Autorisé" : "Refusé"}`}
                              >
                                {granted
                                  ? <FaCheck className="w-3 h-3" />
                                  : <FaTimes className="w-3 h-3" />
                                }
                              </button>
                            ) : (
                              <span className="text-gray-200 text-lg">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Permissions() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/user-permissions/`, { headers: authHeader() });
      return res.data as User[];
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-site-primary/10 flex items-center justify-center">
            <FaShieldAlt className="w-5 h-5 text-site-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des permissions</h1>
            <p className="text-sm text-gray-500">Définissez les droits de chaque administrateur</p>
          </div>
        </div>

        {/* Légende */}
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-4 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-100 border border-green-300 flex items-center justify-center">
                  <FaCheck className="w-2.5 h-2.5 text-green-600" />
                </div>
                Autorisé — l'admin peut effectuer cette action
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-red-50 border border-red-200 flex items-center justify-center">
                  <FaTimes className="w-2.5 h-2.5 text-red-400" />
                </div>
                Refusé — l'action est bloquée avec message d'erreur
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 text-lg leading-none">—</span>
                Non applicable pour ce module
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des admins */}
        {isLoading && (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        )}
        {isError && (
          <div className="text-center py-12 text-red-500">Erreur lors du chargement des permissions.</div>
        )}
        {data && data.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Aucun administrateur trouvé. Créez d'abord un compte admin.
          </div>
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map(user => (
              <UserPermissionsCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
