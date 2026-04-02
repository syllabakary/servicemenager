import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FaFileInvoiceDollar, FaFilter, FaTimes, FaSearch, FaUser,
  FaPlus, FaInfoCircle, FaChevronDown, FaChevronRight,
  FaEnvelope, FaCheck, FaFilePdf, FaEdit, FaTrash,
  FaExclamationTriangle, FaPaperPlane,
} from "react-icons/fa";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { usePermissionError, extractPermissionError } from "@/hooks/usePermissionError";
import { useState } from "react";
import { Link } from "wouter";
import { API_URL } from "@/config/api";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  DRAFT:     { label: "Brouillon", badgeClass: "bg-gray-100 text-gray-600 border border-gray-300",         dotClass: "bg-gray-400" },
  SENT:      { label: "Envoyée",   badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",          dotClass: "bg-blue-500" },
  PAID:      { label: "Payée",     badgeClass: "bg-green-50 text-green-700 border border-green-200",       dotClass: "bg-green-500" },
  UNPAID:    { label: "Impayée",   badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",    dotClass: "bg-orange-500" },
  OVERDUE:   { label: "En retard", badgeClass: "bg-red-50 text-red-700 border border-red-200",             dotClass: "bg-red-500" },
  CANCELLED: { label: "Annulée",   badgeClass: "bg-gray-50 text-gray-500 border border-gray-200",          dotClass: "bg-gray-400" },
};

const ALL_STATUSES = [
  { value: "DRAFT",     label: "Brouillon", color: "text-gray-500" },
  { value: "SENT",      label: "Envoyée",   color: "text-blue-600" },
  { value: "PAID",      label: "Payée",     color: "text-green-600" },
  { value: "UNPAID",    label: "Impayée",   color: "text-orange-600" },
  { value: "OVERDUE",   label: "En retard", color: "text-red-600" },
  { value: "CANCELLED", label: "Annulée",   color: "text-gray-500" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, badgeClass: "bg-gray-100 text-gray-600 border border-gray-300", dotClass: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

// ── Dialog création facture ─────────────────────────────────────────────────
function CreateFactureDialog({ open, onClose, devis }: { open: boolean; onClose: () => void; devis: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"devis" | "libre">("devis");
  const [form, setForm] = useState({
    quote_request: "", patient: "", client_name_libre: "",
    subtotal: "", tax_rate: "0", notes: "", payment_terms: "30",
  });

  // Charger les patients pour la facture libre
  const { data: patients } = useQuery({
    queryKey: ["patients-facture"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/patients/?limit=200`, { headers: authHeader() });
      return res.data.results || res.data || [];
    },
  });

  const disponibles = devis.filter((d: any) => !d.invoice);

  const createMutation = useMutation({
    mutationFn: async () => {
      const sub = parseFloat(form.subtotal) || 0;
      const tva = parseFloat(form.tax_rate) || 0;
      const today = new Date().toISOString().split("T")[0];
      const payload: any = {
        subtotal: sub,
        tax_rate: tva,
        notes: form.notes,
        payment_terms: form.payment_terms,
        invoice_date: today,
      };
      if (mode === "devis" && form.quote_request) {
        payload.quote_request = parseInt(form.quote_request);
      } else {
        if (form.patient) payload.patient = parseInt(form.patient);
        if (form.client_name_libre) payload.client_name_libre = form.client_name_libre;
      }
      await axios.post(`${API_URL}/invoices/`, payload, { headers: authHeader() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast({ title: "Facture créée" });
      onClose();
      setForm({ quote_request: "", patient: "", client_name_libre: "", subtotal: "", tax_rate: "0", notes: "", payment_terms: "30" });
      setMode("devis");
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.response?.data?.detail || JSON.stringify(err.response?.data) || "Erreur", variant: "destructive" });
    },
  });

  const selectedDevis = devis.find((d: any) => String(d.id) === form.quote_request);
  const sub = parseFloat(form.subtotal) || 0;
  const tva = parseFloat(form.tax_rate) || 0;

  const handleDevisChange = (id: string) => {
    const d = devis.find((x: any) => String(x.id) === id);
    setForm(f => ({ ...f, quote_request: id, subtotal: d ? String(d.final_price || d.calculated_price || "") : "" }));
  };

  const isValid = form.subtotal && (
    mode === "devis" ? (form.quote_request && form.quote_request !== "none") :
    (form.patient || form.client_name_libre)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaFileInvoiceDollar className="text-site-primary" /> Nouvelle facture
          </DialogTitle>
          <DialogDescription>
            Créez une facture liée à un devis ou directement à un patient.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Choix du mode */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "devis" ? "default" : "outline"}
              size="sm"
              className={mode === "devis" ? "bg-site-primary text-white" : ""}
              onClick={() => setMode("devis")}
            >
              Lié à un devis
            </Button>
            <Button
              type="button"
              variant={mode === "libre" ? "default" : "outline"}
              size="sm"
              className={mode === "libre" ? "bg-site-primary text-white" : ""}
              onClick={() => setMode("libre")}
            >
              Facture libre (sans devis)
            </Button>
          </div>

          {/* Mode devis */}
          {mode === "devis" && (
            <div>
              <Label className="text-sm font-medium">Devis associé *</Label>
              {disponibles.length === 0 ? (
                <p className="text-sm text-orange-500 mt-1">Tous les devis ont déjà une facture.</p>
              ) : (
                <Select value={form.quote_request || "none"} onValueChange={handleDevisChange}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un devis..." /></SelectTrigger>
                  <SelectContent>
                    {disponibles.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        #{d.id} — {d.client_name}{d.service_name ? ` — ${d.service_name}` : ""}
                        {` (${parseFloat(d.final_price ?? d.calculated_price ?? 0).toFixed(2)} €)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedDevis && (
                <p className="text-xs text-gray-500 mt-1">Service : {selectedDevis.service_name || "Non renseigné"}</p>
              )}
            </div>
          )}

          {/* Mode libre */}
          {mode === "libre" && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Patient *</Label>
                <Select value={form.patient || "none"} onValueChange={(v) => setForm(f => ({ ...f, patient: v === "none" ? "" : v, client_name_libre: "" }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un patient..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sélectionner —</SelectItem>
                    {(patients || []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!form.patient && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Ou nom client libre</Label>
                  <Input className="mt-1" value={form.client_name_libre}
                    onChange={(e) => setForm(f => ({ ...f, client_name_libre: e.target.value }))}
                    placeholder="Nom du client..." />
                </div>
              )}
            </div>
          )}

          {/* Montants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Montant HT (€) *</Label>
              <Input type="number" step="0.01" className="mt-1" value={form.subtotal}
                onChange={(e) => setForm(f => ({ ...f, subtotal: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-sm font-medium">TVA (%)</Label>
              <Input type="number" step="0.01" className="mt-1" value={form.tax_rate}
                onChange={(e) => setForm(f => ({ ...f, tax_rate: e.target.value }))} placeholder="0" />
            </div>
          </div>
          {form.subtotal && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600"><span>Sous-total HT</span><span>{sub.toFixed(2)} €</span></div>
              <div className="flex justify-between text-gray-500"><span>TVA ({tva}%)</span><span>{(sub * tva / 100).toFixed(2)} €</span></div>
              <div className="flex justify-between font-bold border-t pt-1 text-site-primary"><span>Total TTC</span><span>{(sub * (1 + tva / 100)).toFixed(2)} €</span></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Délai paiement (jours)</Label>
              <Input type="number" className="mt-1" value={form.payment_terms}
                onChange={(e) => setForm(f => ({ ...f, payment_terms: e.target.value }))} placeholder="30" />
            </div>
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Input className="mt-1" value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
            className="bg-site-primary text-white">
            {createMutation.isPending ? "Création..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog confirmation envoi email ─────────────────────────────────────────
function SendEmailDialog({ inv, open, onClose, onSent }: { inv: any; open: boolean; onClose: () => void; onSent: () => void }) {
  const { toast } = useToast();
  const { showPermissionError } = usePermissionError();
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await axios.post(`${API_URL}/invoices/${inv.id}/send_email/`, {}, { headers: authHeader() });
      toast({ title: "Facture envoyée par email" });
      onSent();
      onClose();
    } catch (err: any) {
      const permErr = extractPermissionError(err);
      if (permErr) { onClose(); showPermissionError(permErr); return; }
      toast({ title: "Erreur envoi", description: err.response?.data?.error || "Erreur", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaEnvelope className="text-site-primary" />
            Envoyer la facture par email
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point d'envoyer la facture au client.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3 space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Facture</span>
              <span className="font-semibold">{inv.invoice_number || `#${inv.id}`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Client</span>
              <span>{inv.client_name || "—"}</span>
            </div>
            {inv.client_email && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Email destinataire</span>
                <span className="text-blue-600">{inv.client_email}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-gray-500 font-medium">Montant TTC</span>
              <span className="font-bold text-site-primary">{parseFloat(inv.total || 0).toFixed(2)} €</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Un PDF de la facture sera automatiquement joint à l'email.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Annuler</Button>
          <Button onClick={handleSend} disabled={sending} className="bg-site-primary text-white flex items-center gap-2">
            <FaPaperPlane className="w-4 h-4" />
            {sending ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog suppression facture ───────────────────────────────────────────────
function DeleteFactureDialog({ inv, open, onClose, onDeleted }: { inv: any; open: boolean; onClose: () => void; onDeleted: () => void }) {
  const { toast } = useToast();
  const { showPermissionError } = usePermissionError();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/invoices/${inv.id}/`, { headers: authHeader() });
      toast({ title: "Facture supprimée" });
      onDeleted();
      onClose();
    } catch (err: any) {
      const permErr = extractPermissionError(err);
      if (permErr) { onClose(); showPermissionError(permErr); return; }
      toast({ title: "Erreur suppression", description: err.response?.data?.detail || "Erreur", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <FaExclamationTriangle className="text-red-500" />
            Supprimer la facture
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. La facture sera définitivement supprimée.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Facture</span>
              <span className="font-semibold">{inv.invoice_number || `#${inv.id}`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Client</span>
              <span>{inv.client_name || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Montant TTC</span>
              <span className="font-bold">{parseFloat(inv.total || 0).toFixed(2)} €</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Annuler</Button>
          <Button onClick={handleDelete} disabled={deleting} variant="destructive" className="flex items-center gap-2">
            <FaTrash className="w-4 h-4" />
            {deleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog modification facture ──────────────────────────────────────────────
function EditFactureDialog({ inv, open, onClose, onUpdated }: { inv: any; open: boolean; onClose: () => void; onUpdated: () => void }) {
  const { toast } = useToast();
  const { showPermissionError } = usePermissionError();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subtotal: String(inv.subtotal || ""),
    tax_rate: String(inv.tax_rate || "0"),
    notes: inv.notes || "",
    payment_terms: inv.payment_terms || "",
    status: inv.status || "DRAFT",
    due_date: inv.due_date || "",
  });

  const sub = parseFloat(form.subtotal) || 0;
  const tva = parseFloat(form.tax_rate) || 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/invoices/${inv.id}/`, {
        subtotal: sub,
        tax_rate: tva,
        tax_amount: sub * tva / 100,
        total: sub * (1 + tva / 100),
        notes: form.notes,
        payment_terms: form.payment_terms,
        status: form.status,
        due_date: form.due_date || null,
      }, { headers: authHeader() });
      toast({ title: "Facture mise à jour" });
      onUpdated();
      onClose();
    } catch (err: any) {
      const permErr = extractPermissionError(err);
      if (permErr) { onClose(); showPermissionError(permErr); return; }
      toast({ title: "Erreur", description: err.response?.data?.detail || JSON.stringify(err.response?.data) || "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaEdit className="text-site-primary" />
            Modifier la facture {inv.invoice_number || `#${inv.id}`}
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de la facture et enregistrez les changements.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Montant HT (€)</Label>
              <Input type="number" step="0.01" className="mt-1" value={form.subtotal}
                onChange={(e) => setForm(f => ({ ...f, subtotal: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">TVA (%)</Label>
              <Input type="number" step="0.01" className="mt-1" value={form.tax_rate}
                onChange={(e) => setForm(f => ({ ...f, tax_rate: e.target.value }))} />
            </div>
          </div>
          {form.subtotal && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600"><span>Sous-total HT</span><span>{sub.toFixed(2)} €</span></div>
              <div className="flex justify-between text-gray-500"><span>TVA ({tva}%)</span><span>{(sub * tva / 100).toFixed(2)} €</span></div>
              <div className="flex justify-between font-bold border-t pt-1 text-site-primary"><span>Total TTC</span><span>{(sub * (1 + tva / 100)).toFixed(2)} €</span></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue>
                    {form.status && STATUS_CONFIG[form.status] && (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[form.status].badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[form.status].dotClass}`} />
                        {STATUS_CONFIG[form.status].label}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s.value]?.dotClass}`} />
                        <span className={s.color}>{s.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Date d'échéance</Label>
              <Input type="date" className="mt-1" value={form.due_date}
                onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Délai de paiement (jours)</Label>
            <Input type="number" className="mt-1" value={form.payment_terms}
              onChange={(e) => setForm(f => ({ ...f, payment_terms: e.target.value }))} placeholder="30" />
          </div>
          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea className="mt-1 resize-none" rows={3} value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-site-primary text-white">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Ligne facture ────────────────────────────────────────────────────────────
function FactureRow({ inv, onUpdate, onDelete }: { inv: any; onUpdate: (id: number, data: any) => void; onDelete: () => void }) {
  const { toast } = useToast();
  const { showPermissionError } = usePermissionError();
  const dateStr = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("fr-FR") : "—";
  const echeance = inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-FR") : "—";
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handlePDF = async () => {
    try {
      const res = await axios.get(`${API_URL}/invoices/${inv.id}/pdf/`, {
        headers: authHeader(),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${inv.invoice_number || inv.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const permErr = extractPermissionError(err);
      if (permErr) { showPermissionError(permErr); return; }
      toast({ title: "Erreur PDF", variant: "destructive" });
    }
  };

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <TableCell className="font-mono text-sm font-medium text-site-primary">{inv.invoice_number || `#${inv.id}`}</TableCell>
        <TableCell className="text-sm">{inv.client_name || "—"}</TableCell>
        <TableCell className="text-sm">
          <Link href={`/admin/devis/${inv.quote_request}`} className="text-blue-600 hover:underline text-xs">
            Devis {inv.quote_request}
          </Link>
        </TableCell>
        <TableCell className="text-sm text-gray-600">{dateStr}</TableCell>
        <TableCell className="text-sm text-gray-600">{echeance}</TableCell>
        <TableCell className="text-sm font-semibold">{parseFloat(inv.total || 0).toFixed(2)} €</TableCell>
        <TableCell>
          <Select value={inv.status || "DRAFT"} onValueChange={(v) => onUpdate(inv.id, { status: v })}>
            <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 w-auto [&>svg]:ml-1">
              <StatusBadge status={inv.status} />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s.value]?.dotClass}`} />
                    <span className={s.color + " font-medium"}>{s.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {/* PDF */}
            <Button size="sm" variant="outline" onClick={handlePDF}
              className="h-7 w-7 p-0" title="Télécharger PDF">
              <FaFilePdf className="w-3 h-3 text-red-500" />
            </Button>
            {/* Envoyer email */}
            <Button size="sm" variant="outline" onClick={() => setShowSendDialog(true)}
              className={`h-7 w-7 p-0 ${["SENT","PAID"].includes(inv.status) ? "border-green-400 bg-green-50 hover:bg-green-100" : "hover:border-blue-300 hover:bg-blue-50"}`}
              title="Envoyer par email">
              <FaEnvelope className={`w-3 h-3 ${["SENT","PAID"].includes(inv.status) ? "text-green-500" : "text-blue-400"}`} />
            </Button>
            {/* Modifier */}
            <Button size="sm" variant="outline" onClick={() => setShowEditDialog(true)}
              className="h-7 w-7 p-0" title="Modifier">
              <FaEdit className="w-3 h-3 text-gray-600" />
            </Button>
            {/* Marquer payée */}
            <Button size="sm" variant={inv.status === "PAID" ? "default" : "outline"}
              className={`h-7 w-7 p-0 ${inv.status === "PAID" ? "bg-green-500 text-white hover:bg-green-600" : ""}`}
              onClick={() => onUpdate(inv.id, { status: "PAID" })}
              title="Marquer comme payée">
              <FaCheck className="w-3 h-3" />
            </Button>
            {/* Supprimer */}
            <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(true)}
              className="h-7 w-7 p-0 hover:bg-red-50 hover:border-red-300" title="Supprimer">
              <FaTrash className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <SendEmailDialog
        inv={inv}
        open={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        onSent={() => onUpdate(inv.id, { status: "SENT" })}
      />
      <DeleteFactureDialog
        inv={inv}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={onDelete}
      />
      {showEditDialog && (
        <EditFactureDialog
          inv={inv}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onUpdated={onDelete}
        />
      )}
    </>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function Factures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<"mensuel" | "liste">("mensuel");
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({ search: "", status: "", dateFrom: "", dateTo: "", numFacture: "" });

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/invoices/`, { headers: authHeader() });
      return res.data;
    },
  });

  const { data: devisData } = useQuery({
    queryKey: ["admin-quote-requests"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/quote-requests/`, { headers: authHeader() });
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await axios.patch(`${API_URL}/invoices/${id}/`, data, { headers: authHeader() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
    },
  });

  const refreshInvoices = () => queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });

  const allInvoices: any[] = invoicesData?.results || invoicesData || [];
  const allDevis: any[] = devisData?.results || devisData || [];
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const filtered = allInvoices.filter((inv: any) => {
    if (filters.numFacture && !inv.invoice_number?.toLowerCase().includes(filters.numFacture.toLowerCase())) return false;
    if (filters.search && !inv.client_name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && inv.status !== filters.status) return false;
    if (filters.dateFrom) { const d = new Date(filters.dateFrom); d.setHours(0,0,0,0); if (new Date(inv.invoice_date) < d) return false; }
    if (filters.dateTo) { const d = new Date(filters.dateTo); d.setHours(23,59,59,999); if (new Date(inv.invoice_date) > d) return false; }
    return true;
  });

  // Grouper par mois/année
  const byMonth: Record<string, any[]> = {};
  filtered.forEach((inv: any) => {
    const d = inv.invoice_date ? new Date(inv.invoice_date) : new Date(inv.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(inv);
  });
  const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));
  const toggleMonth = (key: string) => setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));

  const stats = {
    total: allInvoices.length,
    paid: allInvoices.filter((i: any) => i.status === "PAID").length,
    sent: allInvoices.filter((i: any) => i.status === "SENT").length,
    unpaid: allInvoices.filter((i: any) => i.status === "UNPAID").length,
    overdue: allInvoices.filter((i: any) => i.status === "OVERDUE").length,
    amount: allInvoices.reduce((s: number, i: any) => s + parseFloat(i.total || 0), 0),
    amountPaid: allInvoices.filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + parseFloat(i.total || 0), 0),
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  const TableContent = ({ invoices }: { invoices: any[] }) => (
    invoices.length === 0 ? (
      <div className="text-center py-10 text-gray-500">
        <FaFileInvoiceDollar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p>Aucune facture</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold">N° Facture</TableHead>
              <TableHead className="text-xs font-semibold">Client</TableHead>
              <TableHead className="text-xs font-semibold">Devis</TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Échéance</TableHead>
              <TableHead className="text-xs font-semibold">Montant TTC</TableHead>
              <TableHead className="text-xs font-semibold">Statut</TableHead>
              <TableHead className="text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv: any) => (
              <FactureRow
                key={inv.id}
                inv={inv}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                onDelete={refreshInvoices}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    )
  );

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-site-primary" /> Factures
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Gérez les factures liées aux devis clients</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowCreate(true)} className="bg-site-primary text-white flex items-center gap-2">
                <FaPlus className="w-4 h-4" /> Nouvelle facture
              </Button>
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="flex items-center gap-2">
                <FaFilter className="w-4 h-4" /> Filtres
                {hasActiveFilters && (
                  <span className="bg-site-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1 block">N° Facture</Label>
                  <div className="relative">
                    <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="FACT-2026-001..." value={filters.numFacture}
                      onChange={(e) => setFilters(f => ({ ...f, numFacture: e.target.value }))} className="pl-7 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Client</Label>
                  <div className="relative">
                    <FaUser className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Nom du client..." value={filters.search}
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} className="pl-7 h-9 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Statut</Label>
                  <Select value={filters.status || "all"} onValueChange={(v) => setFilters(f => ({ ...f, status: v === "all" ? "" : v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {ALL_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s.value]?.dotClass}`} />
                            <span className={s.color}>{s.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Date début</Label>
                  <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Date fin</Label>
                  <Input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                {hasActiveFilters && (
                  <p className="text-xs text-gray-600"><FaInfoCircle className="w-3 h-3 inline mr-1" />{filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur {allInvoices.length}</p>
                )}
                <Button onClick={() => setFilters({ search: "", status: "", dateFrom: "", dateTo: "", numFacture: "" })}
                  variant="outline" className="ml-auto h-9 text-sm" disabled={!hasActiveFilters}>
                  <FaTimes className="w-3 h-3 mr-1" /> Réinitialiser
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Envoyées", value: stats.sent, color: "text-blue-600" },
            { label: "Payées", value: stats.paid, color: "text-green-600" },
            { label: "Impayées", value: stats.unpaid, color: "text-orange-600" },
            { label: "En retard", value: stats.overdue, color: "text-red-600" },
            { label: "Montant total", value: `${stats.amount.toFixed(2)} €`, color: "text-gray-700" },
            { label: "Montant encaissé", value: `${stats.amountPaid.toFixed(2)} €`, color: "text-site-primary" },
          ].map((s) => (
            <Card key={s.label} className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-1 px-3 pt-3">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-1 border-b border-gray-200">
          {(["mensuel", "liste"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-site-primary text-site-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab === "mensuel" ? "Vue mensuelle" : "Liste complète"}
            </button>
          ))}
        </div>

        {/* VUE MENSUELLE */}
        {activeTab === "mensuel" && (
          <div className="space-y-3">
            {sortedMonths.length === 0 ? (
              <Card className="bg-white border border-gray-200">
                <CardContent className="py-10 text-center text-gray-500">
                  <FaFileInvoiceDollar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>Aucune facture trouvée</p>
                  <Button onClick={() => setShowCreate(true)} className="mt-4 bg-site-primary text-white">
                    <FaPlus className="w-4 h-4 mr-2" /> Créer une facture
                  </Button>
                </CardContent>
              </Card>
            ) : sortedMonths.map((key) => {
              const [year, month] = key.split("-");
              const monthInvoices = byMonth[key];
              const monthTotal = monthInvoices.reduce((s: number, i: any) => s + parseFloat(i.total || 0), 0);
              const monthPaid = monthInvoices.filter((i: any) => i.status === "PAID").reduce((s: number, i: any) => s + parseFloat(i.total || 0), 0);
              const isExpanded = expandedMonths[key] !== false;

              return (
                <Card key={key} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                  <button onClick={() => toggleMonth(key)} className="w-full text-left">
                    <CardHeader className="py-3 px-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <FaChevronDown className="w-4 h-4 text-gray-400" /> : <FaChevronRight className="w-4 h-4 text-gray-400" />}
                          <div>
                            <CardTitle className="text-base font-semibold text-gray-900">
                              {MONTHS_FR[parseInt(month) - 1]} {year}
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-0.5">{monthInvoices.length} facture{monthInvoices.length > 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-gray-900">{monthTotal.toFixed(2)} €</div>
                          <div className="text-xs text-green-600 font-medium flex items-center gap-1 justify-end">
                            <FaCheck className="w-3 h-3" /> Encaissé : {monthPaid.toFixed(2)} €
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </button>
                  {isExpanded && (
                    <CardContent className="p-0 border-t border-gray-100">
                      <TableContent invoices={monthInvoices} />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* VUE LISTE */}
        {activeTab === "liste" && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-0">
              <TableContent invoices={filtered} />
            </CardContent>
          </Card>
        )}
      </div>

      <CreateFactureDialog open={showCreate} onClose={() => setShowCreate(false)} devis={allDevis} />
    </DashboardLayout>
  );
}
