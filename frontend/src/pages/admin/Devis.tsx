import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCalendar,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaEye,
  FaUser,
  FaInfoCircle,
  FaSearch,
  FaFilter,
  FaTimes,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

import { API_URL } from "@/config/api";

// ─── Composant de création de devis ───────────────────────────────────────────
const EMPTY_LINE = { category: "A", label: "", notes: "", hours: "", hourly_rate: "", total: "", total_display: "", is_bold: false, order: 0 };

function CreateDevisDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [clientType, setClientType] = useState<"registered" | "new">("new");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState("");

  const [form, setForm] = useState({
    civility: "",
    client_name: "",
    birth_date: "",
    client_email: "",
    client_phone: "",
    location: "",
    service: "",
    admin_notes: "",
  });

  const [lines, setLines] = useState<any[]>([
    { ...EMPTY_LINE, category: "A", label: "Prestation mensuelle", order: 0 },
    { ...EMPTY_LINE, category: "A", label: "Dimanche et jour Férié", notes: "bonification de 25%", order: 1 },
    { ...EMPTY_LINE, category: "A", label: "Total sans prise en charge", is_bold: true, order: 2 },
    { ...EMPTY_LINE, category: "B", label: "Prestation mensuelle (en semaine)", order: 3 },
    { ...EMPTY_LINE, category: "B", label: "Dimanche et jour Férié", order: 4 },
    { ...EMPTY_LINE, category: "B", label: "Participation du département", order: 5 },
  ]);

  // Chercher patients
  const { data: patientsData } = useQuery({
    queryKey: ["patients-search", patientSearch],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/patients/?search=${patientSearch}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
    enabled: clientType === "registered",
  });

  const { data: servicesData } = useQuery({
    queryKey: ["services-list"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
  });

  // Quand on sélectionne un patient, auto-remplir les champs
  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setForm((f) => ({
      ...f,
      civility: patient.civility || "",
      client_name: `${patient.first_name || ""} ${patient.last_name || ""}`.trim(),
      birth_date: patient.birth_date || "",
      client_email: patient.email || "",
      client_phone: patient.phone || "",
      location: patient.address || "",
    }));
    setPatientSearch(`${patient.first_name} ${patient.last_name}`);
  };

  const updateLine = (index: number, field: string, value: any) => {
    setLines((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const addLine = (category: string) => {
    setLines((prev) => [...prev, { ...EMPTY_LINE, category, order: prev.length }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("access_token");
      // Créer le devis
      const payload: any = {
        ...form,
        status: "PENDING",
        calculated_price: 0,
      };
      if (clientType === "registered" && selectedPatient) {
        payload.patient = selectedPatient.id;
      }
      if (form.service) payload.service = Number(form.service);
      else delete payload.service;

      const res = await axios.post(`${API_URL}/quote-requests/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const quoteId = res.data.id;

      // Créer les lignes
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.label) continue;
        await axios.post(`${API_URL}/quote-lines/`, {
          quote_request: quoteId,
          category: line.category,
          label: line.label,
          notes: line.notes || "",
          hours: line.hours || "",
          hourly_rate: line.hourly_rate ? Number(line.hourly_rate) : null,
          total: line.total ? Number(line.total) : null,
          total_display: line.total_display || "",
          is_bold: line.is_bold,
          order: i,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      return quoteId;
    },
    onSuccess: (quoteId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      toast({ title: "Devis créé", description: "Le devis a été créé avec succès." });
      onClose();
      navigate(`/admin/devis/${quoteId}`);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n");
        toast({ title: "Erreur", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: "Impossible de créer le devis.", variant: "destructive" });
      }
    },
  });

  const catLabel = (cat: string) => cat === "A" ? "A) Sans prise en charge" : "B) Avec prise en charge";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Nouveau devis</DialogTitle>
          <DialogDescription>Créer un devis pour un client enregistré ou non</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 space-y-5 pr-1 py-2">
          {/* Type de client */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant={clientType === "new" ? "default" : "outline"}
              onClick={() => { setClientType("new"); setSelectedPatient(null); }}
              className="flex-1"
            >
              Client non enregistré
            </Button>
            <Button
              type="button"
              variant={clientType === "registered" ? "default" : "outline"}
              onClick={() => setClientType("registered")}
              className="flex-1"
            >
              Client enregistré
            </Button>
          </div>

          {/* Sélecteur patient */}
          {clientType === "registered" && (
            <div className="space-y-2">
              <Label>Rechercher un patient</Label>
              <Input
                placeholder="Nom du patient..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              {patientsData && patientsData.length > 0 && !selectedPatient && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {patientsData.map((p: any) => (
                    <div
                      key={p.id}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-b-0"
                      onClick={() => handleSelectPatient(p)}
                    >
                      {p.first_name} {p.last_name} — {p.email || p.phone || ""}
                    </div>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded px-3 py-2">
                  <FaCheckCircle /> Patient sélectionné : {selectedPatient.first_name} {selectedPatient.last_name}
                  <button className="ml-auto text-gray-500 hover:text-red-500" onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}>
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Infos client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Civilité</Label>
              <Select value={form.civility} onValueChange={(v) => setForm({ ...form, civility: v })}>
                <SelectTrigger><SelectValue placeholder="Civilité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Non précisé</SelectItem>
                  <SelectItem value="M.">Monsieur</SelectItem>
                  <SelectItem value="Mme">Madame</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nom complet *</Label>
              <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Nom et prénom" />
            </div>
            <div>
              <Label>Date de naissance</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="email@exemple.fr" />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="06 00 00 00 00" />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Adresse du client" />
            </div>
            <div className="col-span-2">
              <Label>Service (optionnel)</Label>
              <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun service spécifique</SelectItem>
                  {(servicesData || []).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau tarifaire */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Tableau tarifaire</h3>
            {["A", "B"].map((cat) => (
              <div key={cat} className="mb-4">
                <div className="text-xs font-bold bg-gray-100 px-3 py-2 rounded-t border border-gray-300">
                  {catLabel(cat)}
                </div>
                <div className="border border-t-0 border-gray-300 rounded-b overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-2 py-1.5 w-[25%]">Libellé</th>
                        <th className="text-left px-2 py-1.5 w-[20%]">Notes</th>
                        <th className="text-left px-2 py-1.5 w-[15%]">Heures</th>
                        <th className="text-left px-2 py-1.5 w-[12%]">Tarif/h (€)</th>
                        <th className="text-left px-2 py-1.5 w-[12%]">Total (€)</th>
                        <th className="text-left px-2 py-1.5 w-[12%]">Affichage</th>
                        <th className="px-2 py-1.5 w-[4%]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.filter((l) => l.category === cat).map((line, relIdx) => {
                        const absIdx = lines.indexOf(line);
                        return (
                          <tr key={absIdx} className="border-t border-gray-200">
                            <td className="px-1 py-1">
                              <Input className="h-7 text-xs" value={line.label} onChange={(e) => updateLine(absIdx, "label", e.target.value)} placeholder="Libellé" />
                            </td>
                            <td className="px-1 py-1">
                              <Input className="h-7 text-xs" value={line.notes} onChange={(e) => updateLine(absIdx, "notes", e.target.value)} placeholder="Notes" />
                            </td>
                            <td className="px-1 py-1">
                              <Input className="h-7 text-xs" value={line.hours} onChange={(e) => updateLine(absIdx, "hours", e.target.value)} placeholder="52h/mois" />
                            </td>
                            <td className="px-1 py-1">
                              <Input className="h-7 text-xs" type="number" value={line.hourly_rate} onChange={(e) => updateLine(absIdx, "hourly_rate", e.target.value)} placeholder="25.66" />
                            </td>
                            <td className="px-1 py-1">
                              <Input className="h-7 text-xs" type="number" value={line.total} onChange={(e) => updateLine(absIdx, "total", e.target.value)} placeholder="1334.32" />
                            </td>
                            <td className="px-1 py-1">
                              <Input className="h-7 text-xs" value={line.total_display} onChange={(e) => updateLine(absIdx, "total_display", e.target.value)} placeholder="/" />
                            </td>
                            <td className="px-1 py-1">
                              <button onClick={() => removeLine(absIdx)} className="text-red-400 hover:text-red-600">
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => addLine(cat)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FaPlus className="w-2.5 h-2.5" /> Ajouter une ligne {catLabel(cat).split(")")[0]})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes admin */}
          <div>
            <Label>Notes internes</Label>
            <Textarea value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} placeholder="Notes visibles uniquement par l'administration..." rows={2} />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !form.client_name}
          >
            {createMutation.isPending ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />}
            Créer le devis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function AdminDevis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const canDelete = storedUser.role === "ADMIN" || storedUser.role === "SUPERADMIN";

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/quote-requests/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      setDeleteTarget(null);
      toast({ title: "✅ Devis supprimé", description: "Le devis a été supprimé avec succès.", variant: "default" });
    },
    onError: () => {
      toast({ title: "❌ Erreur", description: "Impossible de supprimer ce devis.", variant: "destructive" });
    },
  });
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    location: "",
    dateFrom: "",
    dateTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-quote-requests"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/quote-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/quote-requests/${id}/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast({
        title: "✅ Succès",
        description: "Statut mis à jour avec succès",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });


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

  const allRequests = data?.results || [];
  
  // Fonction de filtrage
  const filterRequests = (requests: any[]) => {
    return requests.filter((r: any) => {
      // Filtre par nom
      if (filters.name && !r.client_name?.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      
      // Filtre par email
      if (filters.email && !r.client_email?.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }
      
      // Filtre par localisation
      if (filters.location && !r.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      // Filtre par date
      if (filters.dateFrom || filters.dateTo) {
        const requestDate = new Date(r.created_at);
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (requestDate < fromDate) {
            return false;
          }
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (requestDate > toDate) {
            return false;
          }
        }
      }
      
      return true;
    });
  };
  
  const requests = filterRequests(allRequests);
  const pendingRequests = requests.filter((r: any) => r.status === "PENDING");
  const contactedRequests = requests.filter((r: any) => r.status === "CONTACTED");
  const quotedRequests = requests.filter((r: any) => r.status === "QUOTED");
  const otherRequests = requests.filter(
    (r: any) => !["PENDING", "CONTACTED", "QUOTED"].includes(r.status)
  );
  
  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      name: "",
      email: "",
      location: "",
      dateFrom: "",
      dateTo: "",
    });
  };
  
  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filters.name || filters.email || filters.location || filters.dateFrom || filters.dateTo;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: "En attente",
        className: "bg-orange-500 hover:bg-orange-600 text-white",
      },
      CONTACTED: {
        label: "Contacté",
        className: "bg-blue-500 hover:bg-blue-600 text-white",
      },
      QUOTED: {
        label: "Devis envoyé",
        className: "bg-purple-500 hover:bg-purple-600 text-white",
      },
      ACCEPTED: {
        label: "Accepté",
        className: "bg-green-500 hover:bg-green-600 text-white",
      },
      REJECTED: {
        label: "Refusé",
        className: "bg-red-500 hover:bg-red-600 text-white",
      },
      COMPLETED: {
        label: "Terminé",
        className: "bg-gray-500 hover:bg-gray-600 text-white",
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-400 hover:bg-gray-500 text-white",
    };

    return (
      <Badge className={`${config.className} font-medium text-xs px-2 py-0.5`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Gestion des Demandes de Devis
              </h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                Gérez et suivez toutes les demandes de devis des clients
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 bg-site-primary hover:bg-site-primary/90 text-white"
              >
                <FaPlus className="w-4 h-4" />
                Nouveau devis
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FaFilter className="w-4 h-4" />
                Filtres
                {hasActiveFilters && (
                  <span className="bg-site-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {[filters.name, filters.email, filters.location, filters.dateFrom, filters.dateTo].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Section de filtres */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="filter-name" className="text-xs font-medium text-gray-700 mb-1 block">
                    Nom du client
                  </Label>
                  <div className="relative">
                    <FaUser className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="filter-name"
                      placeholder="Rechercher par nom..."
                      value={filters.name}
                      onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="filter-email" className="text-xs font-medium text-gray-700 mb-1 block">
                    Email
                  </Label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="filter-email"
                      placeholder="Rechercher par email..."
                      value={filters.email}
                      onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="filter-location" className="text-xs font-medium text-gray-700 mb-1 block">
                    Localisation
                  </Label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="filter-location"
                      placeholder="Rechercher par localisation..."
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="filter-date-from" className="text-xs font-medium text-gray-700 mb-1 block">
                    Date de début
                  </Label>
                  <div className="relative">
                    <FaCalendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="filter-date-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="filter-date-to" className="text-xs font-medium text-gray-700 mb-1 block">
                    Date de fin
                  </Label>
                  <div className="relative">
                    <FaCalendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="filter-date-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    className="w-full h-9 text-sm"
                    disabled={!hasActiveFilters}
                  >
                    <FaTimes className="w-3 h-3 mr-1" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <FaInfoCircle className="w-3 h-3 inline mr-1" />
                    {requests.length} résultat{requests.length > 1 ? "s" : ""} trouvé{requests.length > 1 ? "s" : ""} sur {allRequests.length} demande{allRequests.length > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-1.5 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {hasActiveFilters ? `${requests.length}/${allRequests.length}` : requests.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-1.5 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-1.5 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Contactés
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{contactedRequests.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-1.5 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Devis envoyés
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{quotedRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Demandes en attente - Version mobile avec cartes */}
        {pendingRequests.length > 0 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 py-2.5 px-3 sm:px-4">
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
                Demandes en attente ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Version mobile: cartes */}
              <div className="block md:hidden divide-y divide-gray-200">
                {pendingRequests.map((request: any) => (
                  <div key={request.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-900 truncate">{request.client_name}</h3>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">{request.service_name}</p>
                        </div>
                        <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0.5 ml-2 flex-shrink-0">En attente</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <FaMapMarkerAlt className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span className="truncate">{request.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaEnvelope className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span className="truncate">{request.client_email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaPhone className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span>{request.client_phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaCalendar className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span>{new Date(request.created_at).toLocaleString("fr-FR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </div>
                        {request.quoted_at && (
                          <div className="flex items-center gap-1.5">
                            <FaCheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="text-xs text-green-700">
                              Validé: {new Date(request.quoted_at).toLocaleString("fr-FR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        <Link href={`/admin/devis/${request.id}`} className="flex-1 min-w-[100px]">
                          <Button size="sm" variant="outline" className="w-full text-xs h-7">
                            <FaEye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                        </Link>
                        <a
                          href={`mailto:${request.client_email}?subject=Devis pour ${request.service_name}`}
                          className="flex-1 min-w-[80px]"
                        >
                          <Button size="sm" className="w-full bg-site-primary hover:bg-site-primary/90 text-xs h-7">
                            <FaEnvelope className="w-3 h-3" />
                          </Button>
                        </a>
                        <a href={`tel:${request.client_phone}`} className="flex-1 min-w-[80px]">
                          <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-xs h-7">
                            <FaPhone className="w-3 h-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Version desktop: tableau */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Client</TableHead>
                      <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Service</TableHead>
                      <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Localisation</TableHead>
                      <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Contact</TableHead>
                      <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Date</TableHead>
                      <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request: any) => (
                      <TableRow key={request.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-xs text-gray-900 px-3 py-2">
                          {request.client_name}
                        </TableCell>
                        <TableCell className="text-xs text-gray-700 px-3 py-2">{request.service_name}</TableCell>
                        <TableCell className="text-xs text-gray-700 px-3 py-2 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <FaMapMarkerAlt className="w-3 h-3 text-site-primary flex-shrink-0" />
                            <span className="truncate">{request.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaEnvelope className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{request.client_email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaPhone className="w-3 h-3 flex-shrink-0" />
                              <span>{request.client_phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 px-3 py-2">
                          <div className="space-y-1">
                            <div>
                              {new Date(request.created_at).toLocaleString("fr-FR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {request.quoted_at && (
                              <div className="text-green-600 text-xs">
                                ✓ Validé: {new Date(request.quoted_at).toLocaleString("fr-FR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Link href={`/admin/devis/${request.id}`}>
                              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                                <FaEye className="w-3 h-3 mr-0.5" />
                                Voir
                              </Button>
                            </Link>
                            <a
                              href={`mailto:${request.client_email}?subject=Devis pour ${request.service_name}`}
                              className="h-6 px-1.5 bg-site-primary text-white rounded hover:bg-site-primary/90 transition-colors text-xs flex items-center justify-center"
                              title="Envoyer un email"
                            >
                              <FaEnvelope className="w-3 h-3" />
                            </a>
                            <a
                              href={`tel:${request.client_phone}`}
                              className="h-6 px-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs flex items-center justify-center"
                              title="Appeler"
                            >
                              <FaPhone className="w-3 h-3" />
                            </a>
                            {canDelete && (
                              <button
                                onClick={() => setDeleteTarget(request)}
                                className="h-6 px-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs flex items-center justify-center"
                                title="Supprimer"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toutes les demandes */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 py-2.5 px-3 sm:px-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">
              Toutes les demandes ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Version mobile: cartes */}
            <div className="block lg:hidden divide-y divide-gray-200">
              {requests.length > 0 ? (
                requests.map((request: any) => (
                  <div key={request.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-500">#{request.id}</span>
                            <h3 className="font-medium text-sm text-gray-900 truncate">{request.client_name}</h3>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">{request.service_name}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0">{getStatusBadge(request.status)}</div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <FaMapMarkerAlt className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span className="truncate">{request.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaEnvelope className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span className="truncate">{request.client_email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaPhone className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span>{request.client_phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaCalendar className="w-3 h-3 text-site-primary flex-shrink-0" />
                          <span>{new Date(request.created_at).toLocaleString("fr-FR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </div>
                        {request.quoted_at && (
                          <div className="flex items-center gap-1.5">
                            <FaCheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="text-xs text-green-700">
                              Validé: {new Date(request.quoted_at).toLocaleString("fr-FR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        <Link href={`/admin/devis/${request.id}`} className="flex-1 min-w-[90px]">
                          <Button size="sm" variant="outline" className="w-full text-xs h-7">
                            <FaEye className="w-3 h-3 mr-0.5" />
                            Voir
                          </Button>
                        </Link>
                        <a
                          href={`mailto:${request.client_email}?subject=Devis pour ${request.service_name}`}
                          className="flex-1 min-w-[70px]"
                        >
                          <Button size="sm" className="w-full bg-site-primary hover:bg-site-primary/90 text-xs h-7">
                            <FaEnvelope className="w-3 h-3" />
                          </Button>
                        </a>
                        <a href={`tel:${request.client_phone}`} className="flex-1 min-w-[70px]">
                          <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-xs h-7">
                            <FaPhone className="w-3 h-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs">
                  Aucune demande de devis pour le moment
                </div>
              )}
            </div>
            {/* Version desktop: tableau */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">ID</TableHead>
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Client</TableHead>
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Service</TableHead>
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Localisation</TableHead>
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Contact</TableHead>
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Statut</TableHead>
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Date</TableHead>
                    <TableHead className="font-medium text-xs text-gray-700 uppercase tracking-wide px-3 py-2">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((request: any) => (
                      <TableRow key={request.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-xs text-gray-500 px-3 py-2">
                          #{request.id}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-gray-900 px-3 py-2">
                          {request.client_name}
                        </TableCell>
                        <TableCell className="text-xs text-gray-700 px-3 py-2">{request.service_name}</TableCell>
                        <TableCell className="text-xs text-gray-700 px-3 py-2 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <FaMapMarkerAlt className="w-3 h-3 text-site-primary flex-shrink-0" />
                            <span className="truncate">{request.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaEnvelope className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{request.client_email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaPhone className="w-3 h-3 flex-shrink-0" />
                              <span>{request.client_phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-xs text-gray-500 px-3 py-2">
                          <div className="space-y-1">
                            <div>
                              {new Date(request.created_at).toLocaleString("fr-FR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {request.quoted_at && (
                              <div className="text-green-600 text-xs">
                                ✓ Validé: {new Date(request.quoted_at).toLocaleString("fr-FR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Link href={`/admin/devis/${request.id}`}>
                              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                                <FaEye className="w-3 h-3 mr-0.5" />
                                Voir
                              </Button>
                            </Link>
                            <a
                              href={`mailto:${request.client_email}?subject=Devis pour ${request.service_name}`}
                              className="h-6 px-1.5 bg-site-primary text-white rounded hover:bg-site-primary/90 transition-colors text-xs flex items-center justify-center"
                              title="Envoyer un email"
                            >
                              <FaEnvelope className="w-3 h-3" />
                            </a>
                            <a
                              href={`tel:${request.client_phone}`}
                              className="h-6 px-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs flex items-center justify-center"
                              title="Appeler"
                            >
                              <FaPhone className="w-3 h-3" />
                            </a>
                            {request.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: "CONTACTED" })}
                                disabled={updateStatusMutation.isPending}
                                className="text-xs h-6 px-2"
                              >
                                Contacté
                              </Button>
                            )}
                            {request.status === "CONTACTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: "QUOTED" })}
                                disabled={updateStatusMutation.isPending}
                                className="text-xs h-6 px-2"
                              >
                                Devis envoyé
                              </Button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteTarget(request)}
                                className="h-6 px-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs flex items-center justify-center"
                                title="Supprimer"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-gray-500 text-xs">
                        Aucune demande de devis pour le moment
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de détails du devis */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Détails de la demande de devis #{selectedRequest?.id}
              </DialogTitle>
              <DialogDescription>
                Informations complètes renseignées par le client
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 mt-4">
                {/* Informations client */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <FaUser className="w-5 h-5 text-site-primary" />
                    Informations client
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Nom complet</p>
                      <p className="text-gray-900">{selectedRequest.client_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                      <p className="text-gray-900">{selectedRequest.client_email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Téléphone</p>
                      <p className="text-gray-900">{selectedRequest.client_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Date de demande</p>
                      <p className="text-gray-900">
                        {new Date(selectedRequest.created_at).toLocaleString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {selectedRequest.quoted_at && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Date de validation du devis</p>
                        <p className="text-gray-900 text-green-700">
                          {new Date(selectedRequest.quoted_at).toLocaleString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service et localisation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <FaBriefcase className="w-5 h-5 text-site-primary" />
                    Service et localisation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Service demandé</p>
                      <p className="text-gray-900">{selectedRequest.service_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        Localisation
                      </p>
                      <p className="text-gray-900">{selectedRequest.location}</p>
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                {selectedRequest.additional_info && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <FaInfoCircle className="w-5 h-5 text-site-primary" />
                      Informations supplémentaires
                    </h3>
                    <div className="space-y-4">
                      {selectedRequest.additional_info.typeAide && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Type d'aide</p>
                          <p className="text-gray-900">{selectedRequest.additional_info.typeAide}</p>
                        </div>
                      )}
                      {selectedRequest.additional_info.sousTypeAide && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Sous-type d'aide</p>
                          <p className="text-gray-900">{selectedRequest.additional_info.sousTypeAide}</p>
                        </div>
                      )}
                      {selectedRequest.additional_info.besoins && selectedRequest.additional_info.besoins.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Besoins sélectionnés</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedRequest.additional_info.besoins.map((besoin: string, index: number) => (
                              <Badge key={index} variant="outline" className="bg-white">
                                {besoin}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedRequest.additional_info.destinataire && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Destinataire</p>
                          <p className="text-gray-900">
                            {selectedRequest.additional_info.destinataire === "moi"
                              ? "Pour vous"
                              : selectedRequest.additional_info.destinataire === "parent"
                              ? "Pour un parent"
                              : "Pour quelqu'un d'autre"}
                          </p>
                        </div>
                      )}
                      {selectedRequest.additional_info.message && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Message complémentaire</p>
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.additional_info.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prix et réduction */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    💰 Montant total
                  </h3>
                  <div className="space-y-3">
                    {selectedRequest.calculated_price && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-600">Prix calculé</p>
                        <p className="text-lg font-bold text-gray-900">
                          € {parseFloat(selectedRequest.calculated_price || 0).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {selectedRequest.discount_percentage && parseFloat(selectedRequest.discount_percentage) > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-600">Réduction</p>
                          <p className="text-sm text-red-600">
                            -{parseFloat(selectedRequest.discount_percentage).toFixed(2)}%
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                          <p className="text-base font-bold text-gray-900">Total après réduction</p>
                          <p className="text-xl font-bold text-site-primary">
                            € {(
                              parseFloat(selectedRequest.calculated_price || 0) * 
                              (1 - parseFloat(selectedRequest.discount_percentage) / 100)
                            ).toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                    {(!selectedRequest.calculated_price || parseFloat(selectedRequest.calculated_price) === 0) && (
                      <p className="text-sm text-gray-500">Aucun prix calculé pour le moment</p>
                    )}
                  </div>
                </div>

                {/* Réduction */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Appliquer une réduction</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">
                        Réduction en pourcentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        defaultValue={selectedRequest.discount_percentage || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-site-primary"
                        placeholder="Ex: 10 pour 10%"
                        onChange={async (e) => {
                          const discount = parseFloat(e.target.value) || 0;
                          const token = localStorage.getItem("access_token");
                          try {
                            await axios.patch(
                              `${API_URL}/quote-requests/${selectedRequest.id}/`,
                              { discount_percentage: discount.toString() },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
                            toast({
                              title: "✅ Réduction appliquée",
                              description: `Réduction de ${discount}% appliquée avec succès`,
                              variant: "default",
                            });
                            // Mettre à jour localement
                            setSelectedRequest({ ...selectedRequest, discount_percentage: discount.toString() });
                          } catch (error: any) {
                            toast({
                              title: "❌ Erreur",
                              description: error.response?.data?.detail || "Erreur lors de l'application de la réduction",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Entrez un pourcentage (ex: 10 pour 10% de réduction)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statut */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Statut</h3>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedRequest.status)}
                    {selectedRequest.admin_notes && (
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Notes admin</p>
                        <p className="text-gray-900">{selectedRequest.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailDialogOpen(false)}
                  >
                    Fermer
                  </Button>
                  <a
                    href={`mailto:${selectedRequest.client_email}?subject=Devis pour ${selectedRequest.service_name}`}
                    className="px-4 py-2 bg-site-button-primary text-site-button-text rounded-lg hover:bg-site-button-primary-hover transition-colors font-semibold flex items-center gap-2"
                  >
                    <FaEnvelope className="w-4 h-4" />
                    Envoyer un email
                  </a>
                  <a
                    href={`tel:${selectedRequest.client_phone}`}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center gap-2"
                  >
                    <FaPhone className="w-4 h-4" />
                    Appeler
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog confirmation suppression */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaTrash className="w-5 h-5 text-red-600" />
                Supprimer le devis
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 pt-2">
                Êtes-vous sûr de vouloir supprimer le devis de <strong>{deleteTarget?.client_name}</strong> ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="text-sm">
                Annuler
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(deleteTarget?.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm"
                disabled={deleteMutation.isPending}
              >
                <FaTrash className="w-3.5 h-3.5 mr-1.5" />
                Supprimer définitivement
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      {/* Dialog de création de devis */}
      <CreateDevisDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />

    </DashboardLayout>
  );
}

