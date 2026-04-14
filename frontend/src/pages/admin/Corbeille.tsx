import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  FaTrash, FaUndo, FaExclamationTriangle, FaEye,
} from "react-icons/fa";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

const TYPE_LABELS: Record<string, string> = {
  devis:      "Devis",
  factures:   "Factures",
  services:   "Services",
  agences:    "Agences",
  patients:   "Patients",
  scans:      "Scans",
  categories: "Catégories",
  contacts:   "Contacts",
};

const TYPE_COLORS: Record<string, string> = {
  devis:      "bg-blue-100 text-blue-800",
  factures:   "bg-green-100 text-green-800",
  services:   "bg-purple-100 text-purple-800",
  agences:    "bg-yellow-100 text-yellow-800",
  patients:   "bg-pink-100 text-pink-800",
  scans:      "bg-orange-100 text-orange-800",
  categories: "bg-gray-100 text-gray-800",
  contacts:   "bg-teal-100 text-teal-800",
};

// URL de navigation vers la page de détail de chaque type
function getViewUrl(type: string, item: any): string | null {
  switch (type) {
    case "devis":    return `/admin/devis/${item.id}`;
    case "factures": return `/admin/factures`;
    case "services": return `/admin/services`;
    case "agences":  return `/admin/agences`;
    case "patients": return `/admin/patients`;
    case "scans":    return `/admin/scans`;
    case "categories": return `/admin/categories`;
    case "contacts": return null;
    default: return null;
  }
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Corbeille() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeType, setActiveType] = useState<string>("all");
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmItem, setConfirmItem] = useState<{ type: string; id: number; name: string } | null>(null);

  const { data: trashData, isLoading } = useQuery({
    queryKey: ["trash"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/trash/`, { headers: authHeader() });
      return res.data as Record<string, any[]>;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      await axios.post(`${API_URL}/trash/restore/${type}/${id}/`, {}, { headers: authHeader() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast({ title: "Élément restauré avec succès" });
    },
    onError: () => toast({ title: "Erreur lors de la restauration", variant: "destructive" }),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      // POST car DRF ViewSet ne route pas bien DELETE avec url_path paramétré
      await axios.post(`${API_URL}/trash/hard-delete/${type}/${id}/`, {}, { headers: authHeader() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      setConfirmItem(null);
      toast({ title: "Supprimé définitivement" });
    },
    onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
  });

  const restoreAllMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_URL}/trash/restore-all/`, {}, { headers: authHeader() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast({ title: "Tous les éléments ont été restaurés" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const emptyMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_URL}/trash/empty/`, {}, { headers: authHeader() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      setConfirmEmpty(false);
      toast({ title: "Corbeille vidée définitivement" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  // Flatten all items
  const allItems: any[] = [];
  if (trashData) {
    Object.entries(trashData).forEach(([type, items]) => {
      items.forEach(item => allItems.push({ ...item, _trash_type: type }));
    });
  }
  allItems.sort((a, b) =>
    new Date(b._deleted_at || 0).getTime() - new Date(a._deleted_at || 0).getTime()
  );

  const filtered = activeType === "all"
    ? allItems
    : allItems.filter(i => i._trash_type === activeType);

  const totalCount = allItems.length;

  const countByType: Record<string, number> = {};
  allItems.forEach(i => {
    countByType[i._trash_type] = (countByType[i._trash_type] || 0) + 1;
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaTrash className="text-red-500" />
              Corbeille
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} élément{totalCount !== 1 ? "s" : ""} supprimé{totalCount !== 1 ? "s" : ""}
            </p>
          </div>
          {totalCount > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => restoreAllMutation.mutate()}
                disabled={restoreAllMutation.isPending}
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                <FaUndo className="mr-1.5" />
                Tout restaurer
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmEmpty(true)}
              >
                <FaTrash className="mr-1.5" />
                Vider la corbeille
              </Button>
            </div>
          )}
        </div>

        {/* Filtres par type */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveType("all")}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              activeType === "all"
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            Tout ({totalCount})
          </button>
          {Object.entries(TYPE_LABELS).map(([type, label]) => {
            const count = countByType[type] || 0;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  activeType === type
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <FaTrash className="mx-auto text-4xl mb-3 opacity-30" />
              <p className="text-lg font-medium">Corbeille vide</p>
              <p className="text-sm mt-1">Les éléments supprimés apparaîtront ici</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Nom</th>
                    <th className="text-left px-4 py-3 font-medium">Supprimé le</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const viewUrl = getViewUrl(item._trash_type, item);
                    return (
                      <tr
                        key={`${item._trash_type}-${item.id}`}
                        className={`border-b last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item._trash_type] || "bg-gray-100 text-gray-700"}`}>
                            {TYPE_LABELS[item._trash_type] || item._trash_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {item._display_name || `#${item.id}`}
                          <span className="text-gray-400 text-xs ml-2">#{item.id}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(item._deleted_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {viewUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-600 hover:bg-gray-100 text-xs px-2 py-1 h-7"
                                onClick={() => navigate(viewUrl)}
                                title="Voir le détail"
                              >
                                <FaEye className="mr-1" />
                                Voir
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-700 border-green-300 hover:bg-green-50 text-xs px-2 py-1 h-7"
                              onClick={() => restoreMutation.mutate({ type: item._trash_type, id: item.id })}
                              disabled={restoreMutation.isPending}
                            >
                              <FaUndo className="mr-1" />
                              Restaurer
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 text-xs px-2 py-1 h-7"
                              onClick={() => setConfirmItem({ type: item._trash_type, id: item.id, name: item._display_name || `#${item.id}` })}
                            >
                              <FaTrash className="mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Confirmation suppression définitive unitaire */}
        <Dialog open={!!confirmItem} onOpenChange={() => setConfirmItem(null)}>
          <DialogContent aria-describedby="confirm-delete-desc">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <FaExclamationTriangle />
                Suppression définitive
              </DialogTitle>
              <DialogDescription id="confirm-delete-desc">
                Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Supprimer définitivement <strong>{confirmItem?.name}</strong> ?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmItem(null)}>Annuler</Button>
              <Button
                variant="destructive"
                onClick={() => confirmItem && hardDeleteMutation.mutate({ type: confirmItem.type, id: confirmItem.id })}
                disabled={hardDeleteMutation.isPending}
              >
                Supprimer définitivement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation vider la corbeille */}
        <Dialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
          <DialogContent aria-describedby="confirm-empty-desc">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <FaExclamationTriangle />
                Vider la corbeille
              </DialogTitle>
              <DialogDescription id="confirm-empty-desc">
                Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Supprimer définitivement les <strong>{totalCount} éléments</strong> de la corbeille ?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmEmpty(false)}>Annuler</Button>
              <Button
                variant="destructive"
                onClick={() => emptyMutation.mutate()}
                disabled={emptyMutation.isPending}
              >
                Vider définitivement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
