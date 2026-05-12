import { useState } from "react";
import { fmtDateTime } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FaEnvelope, FaCheckCircle, FaReply, FaExclamationTriangle, FaTrash, FaUser, FaInbox,
} from "react-icons/fa";
import { API_URL } from "@/config/api";

const STATUS_CFG = {
  NEW:     { label: "Nouveau",  dot: "bg-blue-500",  badge: "bg-blue-50 text-blue-700 border-blue-200",  row: "border-l-4 border-l-blue-400 bg-blue-50/30" },
  READ:    { label: "Lu",       dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-600 border-gray-200", row: "" },
  REPLIED: { label: "Répondu", dot: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200", row: "" },
};

const COUNTERS = [
  { key: "all",     label: "Total",    icon: "📬", bg: "from-gray-500 to-gray-600" },
  { key: "NEW",     label: "Nouveaux", icon: "🔵", bg: "from-blue-500 to-blue-600" },
  { key: "READ",    label: "Lus",      icon: "✅", bg: "from-gray-400 to-gray-500" },
  { key: "REPLIED", label: "Répondus", icon: "💬", bg: "from-green-500 to-green-600" },
];

export default function AdminContactMessages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await axios.patch(`${API_URL}/contact-messages/${id}/`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] }),
    onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" }),
  });

  const deleteMsg = useMutation({
    mutationFn: async (id: number) => { await axios.delete(`${API_URL}/contact-messages/${id}/`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      setDeleteTarget(null);
      setDetailMsg(null);
      toast({ title: "Message supprimé" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer le message.", variant: "destructive" }),
  });

  const messages: any[] = Array.isArray(data) ? data : [];
  const filtered = selectedStatus === "all" ? messages : messages.filter((m) => m.status === selectedStatus);
  const counts: Record<string, number> = {
    all: messages.length,
    NEW: messages.filter((m) => m.status === "NEW").length,
    READ: messages.filter((m) => m.status === "READ").length,
    REPLIED: messages.filter((m) => m.status === "REPLIED").length,
  };

  const openDetail = (msg: any) => {
    if (msg.status === "NEW") updateStatus.mutate({ id: msg.id, status: "READ" });
    setDetailMsg(msg);
  };

  const fmt = (iso: string) => fmtDateTime(iso);

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-site-primary to-site-secondary rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FaEnvelope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Messages de contact</h1>
              <p className="text-white/80 text-sm mt-0.5">Messages reçus via le formulaire public</p>
            </div>
          </div>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {COUNTERS.map((c) => {
            const active = selectedStatus === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedStatus(c.key)}
                className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-200 border-2 ${
                  active
                    ? "border-site-primary bg-white shadow-lg shadow-site-primary/10 scale-[1.02]"
                    : "border-gray-100 bg-white hover:border-site-primary/30 hover:shadow-md"
                }`}
              >
                {active && (
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${c.bg} opacity-10 rounded-bl-full`} />
                )}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
                <p className={`text-3xl font-black mt-1 ${active ? "text-site-primary" : "text-gray-800"}`}>
                  {counts[c.key]}
                </p>
                {c.key === "NEW" && counts.NEW > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Liste */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              {selectedStatus === "all" ? "Tous les messages" : `Messages — ${STATUS_CFG[selectedStatus as keyof typeof STATUS_CFG]?.label}`}
            </h2>
            <span className="text-sm text-gray-400">{filtered.length} message{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400 mt-3">Chargement...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-red-500">
              <FaExclamationTriangle className="w-10 h-10 mx-auto mb-3 opacity-60" />
              <p className="font-semibold">Erreur de chargement</p>
              <p className="text-sm text-gray-400 mt-1">{(error as any)?.response?.data?.detail || "Vérifiez votre connexion."}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FaInbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucun message</p>
              <p className="text-sm mt-1">Aucun message dans cette catégorie</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((msg: any) => {
                const cfg = STATUS_CFG[msg.status as keyof typeof STATUS_CFG] || STATUS_CFG.NEW;
                const isNew = msg.status === "NEW";
                return (
                  <div
                    key={msg.id}
                    onClick={() => openDetail(msg)}
                    className={`group flex items-start gap-4 px-6 py-4 cursor-pointer transition-all duration-150 hover:bg-gray-50 ${cfg.row}`}
                  >
                    {/* Avatar initiales */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      isNew ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-gray-400 to-gray-500"
                    }`}>
                      {initials(msg.name)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-sm font-semibold ${isNew ? "text-gray-900" : "text-gray-700"}`}>
                          {msg.name}
                        </span>
                        <span className="text-xs text-gray-400">{msg.email}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 border font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className={`text-sm truncate mb-0.5 ${isNew ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-gray-400 truncate leading-relaxed">
                        {msg.message}
                      </p>
                    </div>

                    {/* Date + actions rapides */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{fmt(msg.created_at)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {isNew && (
                          <button
                            title="Marquer lu"
                            onClick={() => updateStatus.mutate({ id: msg.id, status: "READ" })}
                            className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors"
                          >
                            <FaCheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          title="Répondre"
                          onClick={() => {
                            updateStatus.mutate({ id: msg.id, status: "REPLIED" });
                            window.location.href = `mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`;
                          }}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                        >
                          <FaReply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => setDeleteTarget(msg)}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog détail */}
      <Dialog open={!!detailMsg} onOpenChange={(open) => !open && setDetailMsg(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
          {detailMsg && (() => {
            const cfg = STATUS_CFG[detailMsg.status as keyof typeof STATUS_CFG] || STATUS_CFG.NEW;
            return (
              <>
                {/* Header coloré */}
                <div className="bg-gradient-to-r from-site-primary to-site-secondary px-6 pt-6 pb-5 flex-shrink-0">
                  <DialogHeader>
                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {initials(detailMsg.name)}
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-white font-bold text-base leading-tight truncate">
                          {detailMsg.subject}
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                          <span className="text-white/80 text-sm font-medium">{detailMsg.name}</span>
                          <span className="text-white/60 text-sm mx-2">·</span>
                          <a href={`mailto:${detailMsg.email}`} className="text-white/80 text-sm hover:text-white underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                            {detailMsg.email}
                          </a>
                          <span className="text-white/60 text-sm mx-2">·</span>
                          <span className="text-white/60 text-xs">{fmt(detailMsg.created_at)}</span>
                        </DialogDescription>
                      </div>
                    </div>
                    <div className="mt-3 ml-14">
                      <Badge className={`text-xs border font-medium ${cfg.badge}`}>{cfg.label}</Badge>
                    </div>
                  </DialogHeader>
                </div>

                {/* Corps message scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <FaEnvelope className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contenu du message</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-7">{detailMsg.message}</p>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
                  {detailMsg.status === "NEW" && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => { updateStatus.mutate({ id: detailMsg.id, status: "READ" }); setDetailMsg({ ...detailMsg, status: "READ" }); }}>
                      <FaCheckCircle className="w-3.5 h-3.5" /> Marquer lu
                    </Button>
                  )}
                  {detailMsg.status === "READ" && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                      onClick={() => { updateStatus.mutate({ id: detailMsg.id, status: "NEW" }); setDetailMsg({ ...detailMsg, status: "NEW" }); }}>
                      <FaUser className="w-3.5 h-3.5" /> Marquer non lu
                    </Button>
                  )}
                  <Button size="sm" className="gap-1.5 bg-site-primary hover:bg-site-primary/90 text-white shadow-sm"
                    onClick={() => {
                      updateStatus.mutate({ id: detailMsg.id, status: "REPLIED" });
                      setDetailMsg({ ...detailMsg, status: "REPLIED" });
                      window.location.href = `mailto:${detailMsg.email}?subject=Re: ${encodeURIComponent(detailMsg.subject)}`;
                    }}>
                    <FaReply className="w-3.5 h-3.5" /> Répondre par email
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 ml-auto"
                    onClick={() => setDeleteTarget(detailMsg)}>
                    <FaTrash className="w-3.5 h-3.5" /> Supprimer
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le message de <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTarget && deleteMsg.mutate(deleteTarget.id)}>
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
