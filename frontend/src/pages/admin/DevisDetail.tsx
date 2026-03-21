import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCalendar,
  FaCheckCircle,
  FaSpinner,
  FaEye,
  FaUser,
  FaInfoCircle,
  FaFileInvoice,
  FaArrowLeft,
  FaDollarSign,
  FaPercent,
  FaTrash,
  FaPlus,
  FaTimes,
  FaSave,
  FaTable,
  FaEdit,
} from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import { API_URL } from "@/config/api";

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    CONTACTED: { label: "Contacté", className: "bg-blue-100 text-blue-800 border-blue-300" },
    QUOTED: { label: "Devis envoyé", className: "bg-purple-100 text-purple-800 border-purple-300" },
    ACCEPTED: { label: "Accepté", className: "bg-green-100 text-green-800 border-green-300" },
    REJECTED: { label: "Refusé", className: "bg-red-100 text-red-800 border-red-300" },
    COMPLETED: { label: "Terminé", className: "bg-gray-100 text-gray-800 border-gray-300" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <Badge variant="outline" className={`${config.className} font-medium text-xs px-2 py-0.5`}>
      {config.label}
    </Badge>
  );
}

export default function DevisDetail() {
  const params = useParams();
  const quoteId = params.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [discountValue, setDiscountValue] = useState<string>("");
  const [manualPriceValue, setManualPriceValue] = useState<string>("");
  const [editingPrice, setEditingPrice] = useState(false);
  const [showSendConfirmDialog, setShowSendConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const canDelete = storedUser.role === "ADMIN" || storedUser.role === "SUPERADMIN";

  // État pour l'édition des infos client
  const [editingClient, setEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState<any>({});

  // État pour les lignes du tableau tarifaire
  const [editingLines, setEditingLines] = useState(false);
  const [lines, setLines] = useState<any[]>([]);
  const [linesLoaded, setLinesLoaded] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/quote-requests/${quoteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      toast({ title: "✅ Devis supprimé", description: "Le devis a été supprimé avec succès.", variant: "default" });
      navigate("/admin/devis");
    },
    onError: () => {
      toast({ title: "❌ Erreur", description: "Impossible de supprimer ce devis.", variant: "destructive" });
    },
  });

  // Récupérer les détails du devis
  const { data: quoteRequest, isLoading } = useQuery({
    queryKey: ["quote-request", quoteId],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/quote-requests/${quoteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!quoteId,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/site-settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Initialiser la valeur de réduction
  useEffect(() => {
    if (quoteRequest?.discount_percentage) {
      setDiscountValue(quoteRequest.discount_percentage);
    }
  }, [quoteRequest]);

  // Mutation pour mettre à jour la réduction
  const updateDiscountMutation = useMutation({
    mutationFn: async (discount: string) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/quote-requests/${quoteId}/`,
        { discount_percentage: discount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-request", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      toast({
        title: "✅ Réduction appliquée",
        description: `Réduction de ${discountValue}% appliquée avec succès`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Erreur lors de l'application de la réduction",
        variant: "destructive",
      });
    },
  });


  // Mutation pour saisir le prix manuellement
  const updatePriceMutation = useMutation({
    mutationFn: async (price: string) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/quote-requests/${quoteId}/`,
        { calculated_price: price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-request", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      toast({
        title: "✅ Prix enregistré",
        description: `Prix de ${manualPriceValue} € enregistré avec succès`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Erreur lors de l'enregistrement du prix",
        variant: "destructive",
      });
    },
  });

  // Initialiser le formulaire client
  useEffect(() => {
    if (quoteRequest && !editingClient) {
      setClientForm({
        civility: quoteRequest.civility || "",
        client_name: quoteRequest.client_name || "",
        birth_date: quoteRequest.birth_date || "",
        client_email: quoteRequest.client_email || "",
        client_phone: quoteRequest.client_phone || "",
        location: quoteRequest.location || "",
        hours_per_month: quoteRequest.hours_per_month || "",
        hourly_rate_client: quoteRequest.hourly_rate_client || "",
        admin_notes: quoteRequest.admin_notes || "",
      });
    }
  }, [quoteRequest]);

  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(`${API_URL}/quote-requests/${quoteId}/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-request", quoteId] });
      setEditingClient(false);
      toast({ title: "✅ Devis mis à jour", description: "Les informations ont été enregistrées." });
    },
    onError: () => {
      toast({ title: "❌ Erreur", description: "Impossible de mettre à jour le devis.", variant: "destructive" });
    },
  });

  // Initialiser les lignes depuis le devis chargé (ou quand on annule l'édition)
  useEffect(() => {
    if (quoteRequest?.lines !== undefined && !linesLoaded) {
      setLines(quoteRequest.lines.map((l: any) => ({
        ...l,
        hours: l.hours !== null && l.hours !== undefined ? String(l.hours).replace(/[^\d.]/g, "") : "",
        hourly_rate: l.hourly_rate !== null && l.hourly_rate !== undefined ? String(l.hourly_rate) : "",
        total: l.total !== null && l.total !== undefined ? String(l.total) : "",
      })));
      setLinesLoaded(true);
    }
  }, [quoteRequest?.lines, linesLoaded]);

  const saveLinesMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("access_token");
      // Supprimer toutes les lignes existantes, puis recréer
      const existing = quoteRequest?.lines || [];
      for (const l of existing) {
        await axios.delete(`${API_URL}/quote-lines/${l.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
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
          is_bold: line.is_bold || false,
          order: i,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["quote-request", quoteId] });
      setLinesLoaded(false);
      setEditingLines(false);
      toast({ title: "Tableau sauvegardé", description: "Les lignes ont été mises à jour." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les lignes.", variant: "destructive" });
    },
  });

  const updateLine = (index: number, field: string, value: any) => {
    setLines((prev) => prev.map((l, i) => {
      if (i !== index) return l;
      const updated = { ...l, [field]: value };
      if (field === "hours" || field === "hourly_rate") {
        const rawH = field === "hours" ? value : updated.hours;
        const h = parseFloat(String(rawH).replace(/[^\d.]/g, "")) || 0;
        const r = parseFloat(field === "hourly_rate" ? value : updated.hourly_rate) || 0;
        if (h > 0 && r > 0) updated.total = (h * r).toFixed(2);
      }
      return updated;
    }));
  };

  const addLine = (category: string) => {
    setLines((prev) => [...prev, { category, label: "", notes: "", hours: "", hourly_rate: "", total: "", total_display: "", is_bold: false, order: prev.length }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculer le prix après réduction
  const calculateFinalPrice = () => {
    const price = quoteRequest?.calculated_price;
    const basePrice = price ? parseFloat(String(price)) : 0;
    const discount = parseFloat(discountValue || "0");
    if (discount > 0 && basePrice > 0) {
      return basePrice * (1 - discount / 100);
    }
    return basePrice;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <FaSpinner className="w-8 h-8 animate-spin text-site-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quoteRequest) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Devis non trouvé</p>
              <Link href="/admin/devis">
                <Button className="mt-4">Retour à la liste</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <Link href="/admin/devis">
            <Button variant="outline" size="sm" className="gap-2">
              <FaArrowLeft className="w-3.5 h-3.5" />
              Retour à la liste
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getStatusBadge(quoteRequest.status)}
          </div>
        </div>

        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-site-primary to-site-primary/80 text-white rounded-lg p-4 shadow-md"
        >
          <h1 className="text-2xl font-bold">Devis #{quoteRequest.id}</h1>
          <p className="text-white/90 text-sm mt-1">
            Demandé le {new Date(quoteRequest.created_at).toLocaleString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {quoteRequest.quoted_at && (
              <> • Validé le {new Date(quoteRequest.quoted_at).toLocaleString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</>
            )}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4">
            {/* Informations client */}
            <Card className="shadow-md border">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <span className="flex items-center gap-2">
                    <FaUser className="w-4 h-4 text-site-primary" />
                    Informations client
                  </span>
                  {!editingClient ? (
                    <button onClick={() => setEditingClient(true)} className="text-xs text-blue-600 hover:text-blue-800 underline font-normal flex items-center gap-1">
                      <FaEdit className="w-3 h-3" /> Modifier
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingClient(false)} className="text-xs text-gray-500 hover:text-gray-700 underline font-normal">Annuler</button>
                      <button
                        onClick={() => updateClientMutation.mutate(clientForm)}
                        disabled={updateClientMutation.isPending}
                        className="text-xs text-green-600 hover:text-green-800 underline font-normal flex items-center gap-1"
                      >
                        {updateClientMutation.isPending ? <FaSpinner className="animate-spin w-3 h-3" /> : <FaSave className="w-3 h-3" />}
                        Sauvegarder
                      </button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {!editingClient ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom complet</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {quoteRequest.civility ? `${quoteRequest.civility} ` : ""}{quoteRequest.client_name}
                      </p>
                    </div>
                    {quoteRequest.birth_date && (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date de naissance</p>
                        <p className="text-sm text-gray-900 font-medium">{new Date(quoteRequest.birth_date).toLocaleDateString("fr-FR")}</p>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                      <a href={`mailto:${quoteRequest.client_email}`} className="text-sm text-site-primary hover:underline font-medium">{quoteRequest.client_email}</a>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Téléphone</p>
                      <a href={`tel:${quoteRequest.client_phone}`} className="text-sm text-site-primary hover:underline font-medium">{quoteRequest.client_phone}</a>
                    </div>
                    {quoteRequest.location && (
                      <div className="space-y-0.5 md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adresse</p>
                        <p className="text-sm text-gray-900 font-medium">{quoteRequest.location}</p>
                      </div>
                    )}
                    {quoteRequest.hours_per_month && (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Heures / mois</p>
                        <p className="text-sm text-gray-900 font-medium">{quoteRequest.hours_per_month} h</p>
                      </div>
                    )}
                    {quoteRequest.hourly_rate_client && (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tarif horaire</p>
                        <p className="text-sm text-gray-900 font-medium">{Number(quoteRequest.hourly_rate_client).toFixed(2)} €/h</p>
                      </div>
                    )}
                    {quoteRequest.admin_notes && (
                      <div className="space-y-0.5 md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes internes</p>
                        <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2">{quoteRequest.admin_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Civilité</Label>
                      <Select value={clientForm.civility || "none"} onValueChange={(v) => setClientForm({ ...clientForm, civility: v === "none" ? "" : v })}>
                        <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Non précisé</SelectItem>
                          <SelectItem value="M.">Monsieur</SelectItem>
                          <SelectItem value="Mme">Madame</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Nom complet *</Label>
                      <Input className="h-8 mt-1 text-xs" value={clientForm.client_name} onChange={(e) => setClientForm({ ...clientForm, client_name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Date de naissance</Label>
                      <Input type="date" className="h-8 mt-1 text-xs" value={clientForm.birth_date} onChange={(e) => setClientForm({ ...clientForm, birth_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Email</Label>
                      <Input type="email" className="h-8 mt-1 text-xs" value={clientForm.client_email} onChange={(e) => setClientForm({ ...clientForm, client_email: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Téléphone</Label>
                      <Input className="h-8 mt-1 text-xs" value={clientForm.client_phone} onChange={(e) => setClientForm({ ...clientForm, client_phone: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Heures / mois</Label>
                      <Input type="number" step="0.5" className="h-8 mt-1 text-xs" value={clientForm.hours_per_month} onChange={(e) => setClientForm({ ...clientForm, hours_per_month: e.target.value })} placeholder="ex: 20" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Tarif horaire (€/h)</Label>
                      <Input type="number" step="0.01" className="h-8 mt-1 text-xs" value={clientForm.hourly_rate_client} onChange={(e) => setClientForm({ ...clientForm, hourly_rate_client: e.target.value })} placeholder="ex: 25.66" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-600">Adresse</Label>
                      <Input className="h-8 mt-1 text-xs" value={clientForm.location} onChange={(e) => setClientForm({ ...clientForm, location: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-600">Notes internes</Label>
                      <Textarea className="mt-1 text-xs" rows={2} value={clientForm.admin_notes} onChange={(e) => setClientForm({ ...clientForm, admin_notes: e.target.value })} placeholder="Notes visibles uniquement par l'admin..." />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {quoteRequest.service_name && (
            <Card className="shadow-md border">
              <CardContent className="p-3 flex items-center gap-2">
                <FaBriefcase className="w-4 h-4 text-site-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Service demandé</p>
                  <p className="text-sm font-semibold text-gray-900">{quoteRequest.service_name}</p>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Tableau tarifaire */}
            <Card className="shadow-md border">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <span className="flex items-center gap-2">
                    <FaTable className="w-4 h-4 text-site-primary" />
                    Tableau tarifaire
                  </span>
                  {!editingLines ? (
                    <button
                      onClick={() => setEditingLines(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline font-normal"
                    >
                      Modifier
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingLines(false); setLinesLoaded(false); }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline font-normal"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveLinesMutation.mutate()}
                        disabled={saveLinesMutation.isPending}
                        className="text-xs text-green-600 hover:text-green-800 underline font-normal flex items-center gap-1"
                      >
                        {saveLinesMutation.isPending ? <FaSpinner className="animate-spin w-3 h-3" /> : <FaSave className="w-3 h-3" />}
                        Sauvegarder
                      </button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {!editingLines ? (
                  /* Affichage lecture seule */
                  lines.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-2 py-1.5 text-left">Libellé</th>
                            <th className="border border-gray-300 px-2 py-1.5 text-center">Heures</th>
                            <th className="border border-gray-300 px-2 py-1.5 text-center">Tarif/h</th>
                            <th className="border border-gray-300 px-2 py-1.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["A", "B"].map((cat) => {
                            const catLines = lines.filter((l) => l.category === cat);
                            if (catLines.length === 0) return null;
                            return [
                              <tr key={`cat-${cat}`} className="bg-gray-50">
                                <td colSpan={4} className="border border-gray-300 px-2 py-1 font-bold text-xs">
                                  {cat === "A" ? "A) Sans prise en charge" : "B) Avec prise en charge (dès réception de la Notification de prise en charge)"}
                                </td>
                              </tr>,
                              ...catLines.map((line: any, i: number) => (
                                <tr key={`${cat}-${i}`} className={line.is_bold ? "font-bold bg-gray-50" : ""}>
                                  <td className="border border-gray-300 px-2 py-1">
                                    {line.label}
                                    {line.notes && <div className="text-gray-500 font-normal italic">{line.notes}</div>}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">{line.hours || "/"}</td>
                                  <td className="border border-gray-300 px-2 py-1 text-center">
                                    {line.hourly_rate ? `${Number(line.hourly_rate).toFixed(2)} €` : "/"}
                                  </td>
                                  <td className="border border-gray-300 px-2 py-1 text-right">
                                    {line.total_display || (line.total ? `${Number(line.total).toFixed(2)} €` : "/")}
                                  </td>
                                </tr>
                              )),
                            ];
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">Aucune ligne — cliquez sur "Modifier" pour ajouter des lignes tarifaires.</p>
                  )
                ) : (
                  /* Mode édition */
                  <div className="space-y-4">
                    {["A", "B"].map((cat) => (
                      <div key={cat}>
                        <div className="text-xs font-bold bg-gray-100 px-3 py-2 rounded-t border border-gray-300">
                          {cat === "A" ? "A) Sans prise en charge" : "B) Avec prise en charge"}
                        </div>
                        <div className="border border-t-0 border-gray-300 rounded-b overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-2 py-1.5 w-[22%]">Libellé</th>
                                <th className="text-left px-2 py-1.5 w-[18%]">Notes</th>
                                <th className="text-left px-2 py-1.5 w-[15%]">Heures</th>
                                <th className="text-left px-2 py-1.5 w-[12%]">Tarif/h</th>
                                <th className="text-left px-2 py-1.5 w-[12%]">Total (€)</th>
                                <th className="text-left px-2 py-1.5 w-[15%]">Affichage</th>
                                <th className="text-left px-2 py-1.5 w-[4%]">G</th>
                                <th className="px-2 py-1.5 w-[2%]"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.filter((l) => l.category === cat).map((line) => {
                                const absIdx = lines.indexOf(line);
                                return (
                                  <tr key={absIdx} className="border-t border-gray-200">
                                    <td className="px-1 py-1">
                                      <Input className="h-7 text-xs" value={line.label} onChange={(e) => updateLine(absIdx, "label", e.target.value)} />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input className="h-7 text-xs" value={line.notes} onChange={(e) => updateLine(absIdx, "notes", e.target.value)} />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input className="h-7 text-xs" value={line.hours} onChange={(e) => updateLine(absIdx, "hours", e.target.value)} placeholder="/" />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input className="h-7 text-xs" type="number" value={line.hourly_rate} onChange={(e) => updateLine(absIdx, "hourly_rate", e.target.value)} />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input className="h-7 text-xs" type="number" value={line.total} onChange={(e) => updateLine(absIdx, "total", e.target.value)} />
                                    </td>
                                    <td className="px-1 py-1">
                                      <Input className="h-7 text-xs" value={line.total_display} onChange={(e) => updateLine(absIdx, "total_display", e.target.value)} placeholder="/" />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                      <input type="checkbox" checked={line.is_bold} onChange={(e) => updateLine(absIdx, "is_bold", e.target.checked)} className="w-3.5 h-3.5" title="Gras" />
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
                              <FaPlus className="w-2.5 h-2.5" /> Ajouter une ligne
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations supplémentaires */}
            {quoteRequest.additional_info && (
              <Card className="shadow-md border">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FaInfoCircle className="w-4 h-4 text-site-primary" />
                    Informations supplémentaires
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {Object.entries(quoteRequest.additional_info).map(([key, value]: [string, any]) => {
                      if (key === "message" && value) {
                        return (
                          <div key={key}>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Message complémentaire</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-2.5 rounded border">{value}</p>
                          </div>
                        );
                      }
                      if (Array.isArray(value) && value.length > 0) {
                        return (
                          <div key={key}>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{key}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {value.map((item: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-white text-xs py-0.5">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      if (value && typeof value === "string") {
                        return (
                          <div key={key}>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{key}</p>
                            <p className="text-sm text-gray-900 font-medium">{value}</p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Informations de paiement */}
            {(siteSettings?.paiement_iban || siteSettings?.paiement_beneficiaire) && (
              <Card className="shadow-md border">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FaDollarSign className="w-4 h-4 text-site-primary" />
                    Informations de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {siteSettings.paiement_beneficiaire && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Bénéficiaire</p>
                        <p className="font-semibold text-gray-900">{siteSettings.paiement_beneficiaire}</p>
                      </div>
                    )}
                    {siteSettings.paiement_banque && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Banque</p>
                        <p className="font-semibold text-gray-900">{siteSettings.paiement_banque}</p>
                      </div>
                    )}
                    {siteSettings.paiement_iban && (
                      <div className="col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">IBAN</p>
                        <p className="font-mono font-semibold text-gray-900">{siteSettings.paiement_iban}</p>
                      </div>
                    )}
                    {siteSettings.paiement_bic && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">BIC</p>
                        <p className="font-semibold text-gray-900">{siteSettings.paiement_bic}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Montant total */}
            <Card className="shadow-md border border-site-primary/20">
              <CardHeader className="bg-gradient-to-r from-site-primary/10 to-site-primary/5 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FaDollarSign className="w-4 h-4 text-site-primary" />
                  Montant total
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {(() => {
                    const price = quoteRequest?.calculated_price;
                    const priceValue = price ? parseFloat(String(price)) : 0;

                    if (priceValue > 0) {
                      return (
                        <>
                          <div className="flex items-center justify-between pb-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prix calculé</p>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-gray-900">
                                {priceValue.toFixed(2)} €
                              </p>
                              <button
                                onClick={() => { setEditingPrice(true); setManualPriceValue(priceValue.toFixed(2)); }}
                                className="text-xs text-amber-600 hover:text-amber-700 underline font-medium"
                              >
                                Modifier
                              </button>
                            </div>
                          </div>
                          {parseFloat(discountValue || "0") > 0 && (
                            <>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200 pb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Réduction</p>
                                <p className="text-sm text-red-600 font-semibold">
                                  -{parseFloat(discountValue).toFixed(2)}%
                                </p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t-2 border-site-primary">
                                <p className="text-sm font-bold text-gray-900">Total après réduction</p>
                                <p className="text-xl font-bold text-site-primary">
                                  {calculateFinalPrice().toFixed(2)} €
                                </p>
                              </div>
                            </>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <div className="text-center py-3">
                          <p className="text-xs text-gray-500 mb-1">
                            Aucun prix calculé pour le moment
                          </p>
                          <p className="text-xs text-gray-400">
                            Le prix sera calculé automatiquement
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Saisir / Modifier le prix manuellement */}
            {(() => {
              const price = quoteRequest?.calculated_price;
              const priceValue = price ? parseFloat(String(price)) : 0;
              if (priceValue > 0 && !editingPrice) return null;
              return (
                <Card className="shadow-md border border-amber-200 bg-amber-50/30">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 py-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <FaDollarSign className="w-4 h-4 text-amber-600" />
                      {editingPrice ? "Modifier le prix" : "Saisir le prix manuellement"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2.5">
                      <p className="text-xs text-amber-700 bg-amber-100 rounded p-2">
                        {editingPrice
                          ? "Corrigez le prix puis cliquez sur Enregistrer."
                          : "Ce service est \"sur devis\". Saisissez le prix à proposer au client."}
                      </p>
                      <div>
                        <Label htmlFor="manualPrice" className="text-xs font-medium text-gray-600 mb-1.5 block">
                          Prix (€)
                        </Label>
                        <Input
                          id="manualPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={manualPriceValue}
                          onChange={(e) => setManualPriceValue(e.target.value)}
                          placeholder="Ex: 150.00"
                          className="h-9 text-sm"
                          autoFocus={editingPrice}
                        />
                      </div>
                      <div className="flex gap-2">
                        {editingPrice && (
                          <Button
                            onClick={() => { setEditingPrice(false); setManualPriceValue(""); }}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-sm"
                          >
                            Annuler
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            if (manualPriceValue) {
                              updatePriceMutation.mutate(manualPriceValue, {
                                onSuccess: () => setEditingPrice(false),
                              });
                            }
                          }}
                          disabled={updatePriceMutation.isPending || !manualPriceValue}
                          size="sm"
                          className={`${editingPrice ? "flex-1" : "w-full"} bg-amber-600 hover:bg-amber-700 text-white text-sm`}
                        >
                          {updatePriceMutation.isPending ? (
                            <>
                              <FaSpinner className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              Enregistrement...
                            </>
                          ) : (
                            "Enregistrer le prix"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Appliquer une réduction (seulement si prix > 0) */}
            {parseFloat(String(quoteRequest?.calculated_price || 0)) > 0 && (
              <Card className="shadow-md border border-blue-200 bg-blue-50/30">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 py-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FaPercent className="w-4 h-4 text-blue-600" />
                    Appliquer une réduction
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2.5">
                    <div>
                      <Label htmlFor="discount" className="text-xs font-medium text-gray-600 mb-1.5 block">
                        Réduction en pourcentage (%)
                      </Label>
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="Ex: 10"
                        className="h-9 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Entrez un pourcentage (ex: 10 pour 10%)
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        if (discountValue !== quoteRequest.discount_percentage) {
                          updateDiscountMutation.mutate(discountValue);
                        }
                      }}
                      disabled={updateDiscountMutation.isPending || discountValue === quoteRequest.discount_percentage}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      {updateDiscountMutation.isPending ? (
                        <>
                          <FaSpinner className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          Application...
                        </>
                      ) : (
                        "Appliquer la réduction"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="shadow-md border">
              <CardHeader className="py-3">
                <CardTitle className="text-base font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  onClick={() => setShowSendConfirmDialog(true)}
                  size="sm"
                  className="w-full bg-site-primary hover:bg-site-primary/90 text-white text-sm"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <FaSpinner className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FaEnvelope className="w-3.5 h-3.5 mr-1.5" />
                      Envoyer le devis
                    </>
                  )}
                </Button>
                <a
                  href={`mailto:${quoteRequest.client_email}?subject=Devis pour ${quoteRequest.service_name}`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  <FaEnvelope className="w-3.5 h-3.5" />
                  Ouvrir email
                </a>
                <a
                  href={`tel:${quoteRequest.client_phone}`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  <FaPhone className="w-3.5 h-3.5" />
                  Appeler
                </a>
                <Button
                  onClick={async () => {
                    const token = localStorage.getItem("access_token");
                    try {
                      const response = await axios.get(
                        `${API_URL}/quote-requests/${quoteRequest.id}/pdf/`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                          responseType: 'blob'
                        }
                      );
                      const blob = new Blob([response.data], { type: 'application/pdf' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `devis-${quoteRequest.id}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      toast({
                        title: "✅ Succès",
                        description: "PDF du devis téléchargé avec succès",
                        variant: "default",
                      });
                    } catch (error: any) {
                      toast({
                        title: "❌ Erreur",
                        description: error.response?.data?.error || "Erreur lors du téléchargement du PDF",
                        variant: "destructive",
                      });
                    }
                  }}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  <FaFileInvoice className="w-3.5 h-3.5 mr-1.5" />
                  Télécharger PDF
                </Button>
                {canDelete && (
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    <FaTrash className="w-3.5 h-3.5 mr-1.5" />
                    Supprimer le devis
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Dialog de confirmation pour l'envoi d'email */}
        <Dialog open={showSendConfirmDialog} onOpenChange={setShowSendConfirmDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaEnvelope className="w-5 h-5 text-site-primary" />
                Confirmer l'envoi du devis
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 pt-2">
                Vous êtes sur le point d'envoyer le devis par email au client.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Détails de l'envoi</p>
                    <div className="space-y-1.5 text-sm text-blue-800">
                      <p><strong>Destinataire:</strong> {quoteRequest?.client_email}</p>
                      <p><strong>Client:</strong> {quoteRequest?.client_name}</p>
                      <p><strong>Devis #:</strong> {quoteRequest?.id}</p>
                      {quoteRequest?.service && (
                        <p><strong>Service:</strong> {typeof quoteRequest.service === 'object' ? quoteRequest.service.name : quoteRequest.service}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Un email avec le devis en PDF sera envoyé à l'adresse email du client.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowSendConfirmDialog(false)}
                disabled={sendingEmail}
                className="text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  setSendingEmail(true);
                  const token = localStorage.getItem("access_token");
                  try {
                    const response = await axios.post(
                      `${API_URL}/quote-requests/${quoteRequest.id}/send_quote/`,
                      {},
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data.success) {
                      setShowSendConfirmDialog(false);
                      queryClient.invalidateQueries({ queryKey: ["quote-request", quoteId] });
                      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
                      toast({
                        title: "✅ Succès",
                        description: response.data.message || "Devis envoyé par email avec succès",
                        variant: "default",
                      });
                    } else {
                      toast({
                        title: "❌ Erreur",
                        description: response.data.message || "Erreur lors de l'envoi du devis",
                        variant: "destructive",
                      });
                    }
                  } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erreur lors de l'envoi du devis";
                    toast({
                      title: "❌ Erreur",
                      description: errorMessage,
                      variant: "destructive",
                    });
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                disabled={sendingEmail}
                className="bg-site-primary hover:bg-site-primary/90 text-white text-sm"
              >
                {sendingEmail ? (
                  <>
                    <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    Confirmer et envoyer
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog suppression */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaTrash className="w-5 h-5 text-red-600" />
                Supprimer le devis
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 pt-2">
                Êtes-vous sûr de vouloir supprimer définitivement ce devis ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-sm">
                Annuler
              </Button>
              <Button
                onClick={() => { setShowDeleteDialog(false); deleteMutation.mutate(); }}
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
    </DashboardLayout>
  );
}

