import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FaEnvelope, FaCheckCircle, FaReply, FaExclamationTriangle,
  FaTrash, FaChevronDown, FaChevronUp, FaEye,
} from "react-icons/fa";
import { API_URL } from "@/config/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nouveau", color: "bg-blue-100 text-blue-800 border-blue-200" },
  READ: { label: "Lu", color: "bg-gray-100 text-gray-700 border-gray-200" },
  REPLIED: { label: "Répondu", color: "bg-green-100 text-green-800 border-green-200" },
};

export default function AdminContactMessages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailMsg, setDetailMsg] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/contact-messages/`);
      return res.data.results ?? res.data;
    },
    retry: 1,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await axios.patch(`${API_URL}/contact-messages/${id}/`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${API_URL}/contact-messages/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      setDeleteTarget(null);
      setDetailMsg(null);
      toast({ title: "Message supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le message.", variant: "destructive" });
    },
  });

  const messages: any[] = Array.isArray(data) ? data : [];
  const filtered = selectedStatus === "all" ? messages : messages.filter((m) => m.status === selectedStatus);

  const counts = {
    all: messages.length,
    NEW: messages.filter((m) => m.status === "NEW").length,
    READ: messages.filter((m) => m.status === "READ").length,
    REPLIED: messages.filter((m) => m.status === "REPLIED").length,
  };

  const handleRowClick = (msg: any) => {
    // Marquer automatiquement comme lu si NEW
    if (msg.status === "NEW") {
      updateStatusMutation.mutate({ id: msg.id, status: "READ" });
    }
    setDetailMsg(msg);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
            Messages de contact
          </h1>
          <p className="text-gray-600 mt-1">Messages reçus via le formulaire de contact public</p>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { key: "all", label: "Total", count: counts.all, color: "border-gray-200" },
            { key: "NEW", label: "Nouveaux", count: counts.NEW, color: "border-blue-300 text-blue-700" },
            { key: "READ", label: "Lus", count: counts.READ, color: "border-gray-300" },
            { key: "REPLIED", label: "Répondus", count: counts.REPLIED, color: "border-green-300 text-green-700" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedStatus(s.key)}
              className={`bg-white rounded-xl p-4 border-2 text-left transition-all ${s.color} ${selectedStatus === s.key ? "ring-2 ring-site-primary" : "hover:border-site-primary/40"}`}
            >
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.count}</p>
            </button>
          ))}
        </div>

        {/* Liste */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg">
              {selectedStatus === "all" ? "Tous les messages" : `Messages — ${STATUS_LABELS[selectedStatus]?.label}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : isError ? (
              <div className="text-center py-16 text-red-500">
                <FaExclamationTriangle className="w-12 h-12 mx-auto mb-3 opacity-60" />
                <p className="font-semibold">Erreur lors du chargement</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(error as any)?.response?.data?.detail || "Vérifiez que vous êtes connecté en tant qu'admin."}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FaEnvelope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun message</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((msg: any) => {
                  const st = STATUS_LABELS[msg.status] || STATUS_LABELS.NEW;
                  const isExpanded = expandedId === msg.id;
                  const isNew = msg.status === "NEW";

                  return (
                    <div
                      key={msg.id}
                      className={`transition-colors ${isNew ? "bg-blue-50/40" : "hover:bg-gray-50"}`}
                    >
                      {/* Ligne principale — clic pour ouvrir le détail */}
                      <div
                        className="p-5 cursor-pointer"
                        onClick={() => handleRowClick(msg)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {isNew && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                            <span className={`font-semibold text-gray-900 ${isNew ? "font-bold" : ""}`}>{msg.name}</span>
                            <a
                              href={`mailto:${msg.email}`}
                              className="text-sm text-site-text-link hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {msg.email}
                            </a>
                            <Badge className={`text-xs border ${st.color}`}>{st.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                            <button
                              className="text-gray-400 hover:text-gray-600 p-1"
                              onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : msg.id); }}
                              title={isExpanded ? "Réduire" : "Aperçu"}
                            >
                              {isExpanded ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-600 mt-1 truncate">
                          <span className="text-gray-400 mr-1">Sujet :</span>{msg.subject}
                        </p>
                        {!isExpanded && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{msg.message}</p>
                        )}
                      </div>

                      {/* Aperçu inline expandable */}
                      {isExpanded && (
                        <div className="px-5 pb-4 border-t border-gray-100 bg-white">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap pt-3 leading-relaxed">
                            {msg.message}
                          </p>
                          {/* Actions inline */}
                          <div className="flex flex-wrap gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs"
                              onClick={() => handleRowClick(msg)}
                            >
                              <FaEye className="w-3 h-3" />
                              Voir détail
                            </Button>
                            {msg.status !== "READ" && msg.status !== "REPLIED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs"
                                onClick={() => updateStatusMutation.mutate({ id: msg.id, status: "READ" })}
                              >
                                <FaCheckCircle className="w-3 h-3 text-green-600" />
                                Marquer lu
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs"
                              onClick={() => {
                                updateStatusMutation.mutate({ id: msg.id, status: "REPLIED" });
                                window.location.href = `mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`;
                              }}
                            >
                              <FaReply className="w-3 h-3" />
                              Répondre
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs text-red-600 hover:bg-red-50 border-red-200"
                              onClick={() => setDeleteTarget(msg)}
                            >
                              <FaTrash className="w-3 h-3" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog détail message */}
      <Dialog open={!!detailMsg} onOpenChange={(open) => !open && setDetailMsg(null)}>
        <DialogContent className="max-w-2xl">
          {detailMsg && (() => {
            const st = STATUS_LABELS[detailMsg.status] || STATUS_LABELS.NEW;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 flex-wrap">
                    <span>{detailMsg.subject}</span>
                    <Badge className={`text-xs border ${st.color}`}>{st.label}</Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Expéditeur */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm bg-gray-50 rounded-xl p-4">
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">De</span>
                      <p className="font-semibold text-gray-900">{detailMsg.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Email</span>
                      <p>
                        <a href={`mailto:${detailMsg.email}`} className="text-site-text-link hover:underline font-medium">
                          {detailMsg.email}
                        </a>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Date</span>
                      <p className="text-gray-700">{formatDate(detailMsg.created_at)}</p>
                    </div>
                  </div>

                  {/* Corps du message */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Message</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{detailMsg.message}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {detailMsg.status !== "READ" && detailMsg.status !== "REPLIED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: detailMsg.id, status: "READ" });
                          setDetailMsg({ ...detailMsg, status: "READ" });
                        }}
                      >
                        <FaCheckCircle className="w-3.5 h-3.5 text-green-600" />
                        Marquer comme lu
                      </Button>
                    )}
                    {detailMsg.status === "READ" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          updateStatusMutation.mutate({ id: detailMsg.id, status: "NEW" });
                          setDetailMsg({ ...detailMsg, status: "NEW" });
                        }}
                      >
                        <FaEnvelope className="w-3.5 h-3.5 text-blue-600" />
                        Marquer non lu
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="gap-1.5 bg-site-primary hover:bg-site-primary/90 text-white"
                      onClick={() => {
                        updateStatusMutation.mutate({ id: detailMsg.id, status: "REPLIED" });
                        setDetailMsg({ ...detailMsg, status: "REPLIED" });
                        window.location.href = `mailto:${detailMsg.email}?subject=Re: ${encodeURIComponent(detailMsg.subject)}`;
                      }}
                    >
                      <FaReply className="w-3.5 h-3.5" />
                      Répondre par email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-red-600 hover:bg-red-50 border-red-200 ml-auto"
                      onClick={() => setDeleteTarget(detailMsg)}
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* AlertDialog confirmation suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le message de <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) sera définitivement supprimé.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
