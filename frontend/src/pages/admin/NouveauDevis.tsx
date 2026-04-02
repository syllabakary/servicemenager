import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaSpinner,
  FaPlus,
  FaTimes,
  FaUser,
  FaEuroSign,
  FaTable,
  FaCreditCard,
} from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { API_URL } from "@/config/api";

const DEFAULT_RATE_A = 25.66;
const DEFAULT_RATE_B = 32.0;

function calcTotal(hours: number, rate: number): number {
  if (!hours || !rate) return 0;
  return parseFloat((hours * rate).toFixed(2));
}

function makeDefaultLines(rateA: number, rateB: number) {
  return [
    {
      category: "A",
      label: "Prestation mensuelle",
      notes: "tous les jours sauf Dimanche",
      hours_nb: "",
      hourly_rate: rateA,
      is_bold: false,
    },
    {
      category: "A",
      label: "Dimanche et jour Férié",
      notes: "bonification de 25%",
      hours_nb: "",
      hourly_rate: rateB,
      is_bold: false,
    },
    {
      category: "A",
      label: "Total sans prise en charge",
      notes: "",
      hours_nb: "",
      hourly_rate: 0,
      is_bold: true,
    },
    {
      category: "B",
      label: "Prestation mensuelle (en semaine)",
      notes: "",
      hours_nb: "",
      hourly_rate: rateA,
      is_bold: false,
    },
    {
      category: "B",
      label: "Dimanche et jour Férié",
      notes: "",
      hours_nb: "",
      hourly_rate: rateB,
      is_bold: false,
    },
    {
      category: "B",
      label: "Participation du département",
      notes: "",
      hours_nb: "",
      hourly_rate: 0,
      is_bold: false,
    },
    {
      category: "B",
      label: "Reste à charge (Avec prise en charge)",
      notes: "",
      hours_nb: "",
      hourly_rate: 0,
      is_bold: true,
    },
  ];
}

export default function NouveauDevis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [clientType, setClientType] = useState<"registered" | "new">("new");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientSearch, setPatientSearch] = useState("");

  const [defaultRateA, setDefaultRateA] = useState(DEFAULT_RATE_A);
  const [defaultRateB, setDefaultRateB] = useState(DEFAULT_RATE_B);

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

  const [lines, setLines] = useState<any[]>(
    makeDefaultLines(DEFAULT_RATE_A, DEFAULT_RATE_B)
  );

  // Auto-calcul à la saisie
  const updateLine = (index: number, field: string, value: any) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        return { ...l, [field]: value };
      })
    );
  };

  // Lignes avec totaux calculés automatiquement
  const linesComputed = lines.map((l, i) => {
    if (l.is_bold && l.category === "A") {
      const total = lines
        .filter((x) => x.category === "A" && !x.is_bold)
        .reduce((s, x) => s + calcTotal(parseFloat(x.hours_nb) || 0, parseFloat(x.hourly_rate) || 0), 0);
      return { ...l, _computed: parseFloat(total.toFixed(2)) };
    }
    if (l.is_bold && l.category === "B") {
      // Reste à charge B = total prestation B - participation département
      const prestLines = lines.filter(
        (x) => x.category === "B" && !x.is_bold && x.label !== "Participation du département"
      );
      const dept = lines.find(
        (x) => x.category === "B" && x.label === "Participation du département"
      );
      const prestTotal = prestLines.reduce(
        (s, x) => s + calcTotal(parseFloat(x.hours_nb) || 0, parseFloat(x.hourly_rate) || 0),
        0
      );
      const deptVal = parseFloat(dept?.hours_nb) || 0;
      return { ...l, _computed: parseFloat(Math.max(0, prestTotal - deptVal).toFixed(2)) };
    }
    return { ...l, _computed: calcTotal(parseFloat(l.hours_nb) || 0, parseFloat(l.hourly_rate) || 0) };
  });

  const addLine = (category: string) => {
    const rate = category === "A" ? defaultRateA : defaultRateB;
    setLines((prev) => {
      // Insérer avant la ligne total/bold de la même catégorie
      const boldIdx = prev.findIndex((l) => l.category === category && l.is_bold);
      const newLine = { category, label: "", notes: "", hours_nb: "", hourly_rate: rate, is_bold: false };
      if (boldIdx === -1) return [...prev, newLine];
      const copy = [...prev];
      copy.splice(boldIdx, 0, newLine);
      return copy;
    });
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const applyDefaultRates = () => {
    setLines(makeDefaultLines(defaultRateA, defaultRateB));
  };

  const totalA = linesComputed
    .filter((l) => l.category === "A" && l.is_bold)
    .reduce((s, l) => s + (l._computed || 0), 0);

  const { data: patientsData } = useQuery({
    queryKey: ["patients-search", patientSearch],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/patients/?search=${patientSearch}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
    enabled: clientType === "registered" && patientSearch.length > 1,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["services-list"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-devis"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/site-settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data) ? res.data[0] : res.data;
    },
  });

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("access_token");
      const payload: any = {
        ...form,
        status: "PENDING",
        calculated_price: totalA,
      };
      if (clientType === "registered" && selectedPatient) payload.patient = selectedPatient.id;
      if (form.service) payload.service = Number(form.service);
      else delete payload.service;

      const res = await axios.post(`${API_URL}/quote-requests/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const quoteId = res.data.id;

      for (let i = 0; i < linesComputed.length; i++) {
        const line = linesComputed[i];
        if (!line.label && !line.is_bold) continue;
        await axios.post(
          `${API_URL}/quote-lines/`,
          {
            quote_request: quoteId,
            category: line.category,
            label: line.label,
            notes: line.notes || "",
            hours: line.hours_nb ? `${line.hours_nb} h/mois` : "",
            hourly_rate: !line.is_bold && line.hourly_rate ? Number(line.hourly_rate) : null,
            total: line._computed || null,
            total_display: "",
            is_bold: line.is_bold,
            order: i,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      return quoteId;
    },
    onSuccess: (quoteId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      toast({ title: "Devis créé avec succès" });
      navigate(`/admin/devis/${quoteId}`);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg =
        data && typeof data === "object"
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Impossible de créer le devis.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    },
  });

  const renderTable = (cat: "A" | "B") => {
    const catLines = linesComputed
      .map((l, i) => ({ ...l, _idx: i }))
      .filter((l) => l.category === cat);

    const title =
      cat === "A"
        ? "A) Sans prise en charge"
        : "B) Avec prise en charge (dès réception de la notification)";

    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className={`px-5 py-3 font-bold text-sm text-white ${cat === "A" ? "bg-site-primary" : "bg-emerald-700"}`}>
          {title}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-600 w-[30%]">Libellé</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-[20%]">Notes</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-[15%]">Nb heures/mois</th>
                <th className="text-center px-3 py-2.5 font-semibold text-gray-600 w-[15%]">Tarif/h (€)</th>
                <th className="text-right px-4 py-2.5 font-semibold text-site-primary w-[14%]">Total (€)</th>
                <th className="w-[6%]"></th>
              </tr>
            </thead>
            <tbody>
              {catLines.map((line) => {
                const idx = line._idx;
                const computed = line._computed || 0;
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-100 ${
                      line.is_bold
                        ? "bg-site-primary/5 font-bold"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Libellé */}
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 text-sm border-gray-200 focus:border-site-primary"
                        value={line.label}
                        onChange={(e) => updateLine(idx, "label", e.target.value)}
                        placeholder="Libellé de la ligne"
                        readOnly={line.is_bold}
                      />
                    </td>
                    {/* Notes */}
                    <td className="px-2 py-2">
                      {line.is_bold ? (
                        <span className="text-gray-400 text-xs px-2">—</span>
                      ) : (
                        <Input
                          className="h-8 text-sm border-gray-200"
                          value={line.notes}
                          onChange={(e) => updateLine(idx, "notes", e.target.value)}
                          placeholder="Précision..."
                        />
                      )}
                    </td>
                    {/* Heures */}
                    <td className="px-2 py-2">
                      {line.is_bold ? (
                        <div className="text-center font-bold text-site-primary">
                          {lines
                            .filter((x) => x.category === cat && !x.is_bold)
                            .reduce((s, x) => s + (parseFloat(x.hours_nb) || 0), 0)}{" "}
                          h
                        </div>
                      ) : line.label === "Participation du département" ? (
                        <div className="text-center text-gray-400 text-xs">—</div>
                      ) : (
                        <Input
                          className="h-8 text-sm text-center border-gray-200 focus:border-site-primary"
                          type="number"
                          min="0"
                          step="0.5"
                          value={line.hours_nb}
                          onChange={(e) => updateLine(idx, "hours_nb", e.target.value)}
                          placeholder="0"
                        />
                      )}
                    </td>
                    {/* Tarif/h */}
                    <td className="px-2 py-2">
                      {line.is_bold ? (
                        <div className="text-center text-gray-400">—</div>
                      ) : line.label === "Participation du département" ? (
                        <div className="text-center text-xs text-gray-500 px-2">Montant fixe (€)</div>
                      ) : (
                        <Input
                          className="h-8 text-sm text-center border-gray-200 focus:border-site-primary"
                          type="number"
                          step="0.01"
                          value={line.hourly_rate}
                          onChange={(e) => updateLine(idx, "hourly_rate", e.target.value)}
                          placeholder="0.00"
                        />
                      )}
                    </td>
                    {/* Total */}
                    <td className="px-3 py-2 text-right">
                      {line.label === "Participation du département" ? (
                        <Input
                          className="h-8 text-sm text-right border-gray-200 focus:border-site-primary w-28 ml-auto"
                          type="number"
                          step="0.01"
                          value={line.hours_nb}
                          onChange={(e) => updateLine(idx, "hours_nb", e.target.value)}
                          placeholder="0.00"
                        />
                      ) : (
                        <span
                          className={`font-bold text-sm ${
                            computed > 0 ? "text-site-primary" : "text-gray-300"
                          }`}
                        >
                          {computed > 0 ? `${computed.toFixed(2)} €` : "—"}
                        </span>
                      )}
                    </td>
                    {/* Supprimer */}
                    <td className="px-2 py-2 text-center">
                      {!line.is_bold && (
                        <button
                          onClick={() => removeLine(idx)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <FaTimes className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => addLine(cat)}
            className="text-sm text-site-primary hover:text-site-primary/80 flex items-center gap-1.5 font-medium"
          >
            <FaPlus className="w-3 h-3" /> Ajouter une ligne
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/devis">
              <button className="text-gray-500 hover:text-gray-800 transition-colors p-1">
                <FaArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouveau devis</h1>
              <p className="text-sm text-gray-500">Créer un devis pour un client enregistré ou non</p>
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !form.client_name}
            className="bg-site-primary hover:bg-site-primary/90 text-white px-6"
          >
            {createMutation.isPending ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaPlus className="mr-2" />
            )}
            Créer le devis
          </Button>
        </div>

        {/* ── Étape 1 : Client ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <span className="w-6 h-6 bg-site-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <FaUser className="w-4 h-4 text-site-primary" />
              Informations client
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">

            {/* Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => { setClientType("new"); setSelectedPatient(null); }}
                className={`py-1.5 px-5 rounded-md text-sm font-medium transition-all ${
                  clientType === "new" ? "bg-white text-site-primary shadow font-semibold" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Client non enregistré
              </button>
              <button
                type="button"
                onClick={() => setClientType("registered")}
                className={`py-1.5 px-5 rounded-md text-sm font-medium transition-all ${
                  clientType === "registered" ? "bg-white text-site-primary shadow font-semibold" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Client enregistré
              </button>
            </div>

            {/* Recherche patient */}
            {clientType === "registered" && (
              <div className="space-y-2 bg-green-50 border border-green-200 rounded-lg p-3">
                <Label className="text-green-800 font-medium text-sm">Rechercher un patient</Label>
                <Input
                  placeholder="Tapez au moins 2 caractères..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); }}
                  className="border-green-300 focus:border-green-500 bg-white"
                />
                {patientsData && patientsData.length > 0 && !selectedPatient && (
                  <div className="border border-green-200 rounded-md max-h-44 overflow-y-auto bg-white shadow-sm">
                    {patientsData.map((p: any) => (
                      <div
                        key={p.id}
                        className="px-3 py-2.5 hover:bg-green-50 cursor-pointer text-sm border-b last:border-b-0 flex justify-between items-center"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <span className="font-medium">{p.civility} {p.first_name} {p.last_name}</span>
                        <span className="text-gray-400 text-xs">{p.email || p.phone || ""}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 rounded-md px-3 py-2 border border-green-300">
                    <FaCheckCircle className="text-green-600 flex-shrink-0" />
                    <span className="font-medium">{selectedPatient.civility} {selectedPatient.first_name} {selectedPatient.last_name}</span>
                    <button
                      className="ml-auto text-gray-400 hover:text-red-500"
                      onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Champs client */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600 font-medium">Civilité</Label>
                <Select
                  value={form.civility || "none"}
                  onValueChange={(v) => setForm({ ...form, civility: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Civilité" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non précisé</SelectItem>
                    <SelectItem value="M.">Monsieur</SelectItem>
                    <SelectItem value="Mme">Madame</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-gray-600 font-medium">Nom complet *</Label>
                <Input
                  className="h-9 mt-1"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="Nom et prénom"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Date de naissance</Label>
                <Input
                  className="h-9 mt-1"
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Email</Label>
                <Input
                  className="h-9 mt-1"
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  placeholder="email@exemple.fr"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Téléphone</Label>
                <Input
                  className="h-9 mt-1"
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                  placeholder="06 00 00 00 00"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-gray-600 font-medium">Adresse</Label>
                <Input
                  className="h-9 mt-1"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Adresse du client"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Service (optionnel)</Label>
                <Select
                  value={form.service || "none"}
                  onValueChange={(v) => setForm({ ...form, service: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Service..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun service</SelectItem>
                    {(servicesData || []).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Étape 2 : Tarifs ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <span className="w-6 h-6 bg-site-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <FaEuroSign className="w-4 h-4 text-site-primary" />
              Tarifs horaires par défaut
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <Label className="text-xs text-gray-600 font-medium">Tarif semaine (€/h)</Label>
                <Input
                  className="h-9 mt-1"
                  type="number"
                  step="0.01"
                  value={defaultRateA}
                  onChange={(e) => setDefaultRateA(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-medium">Tarif Dimanche / Férié (€/h)</Label>
                <Input
                  className="h-9 mt-1"
                  type="number"
                  step="0.01"
                  value={defaultRateB}
                  onChange={(e) => setDefaultRateB(parseFloat(e.target.value) || 0)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 border-site-primary text-site-primary hover:bg-site-primary hover:text-white"
                onClick={applyDefaultRates}
              >
                Réinitialiser le tableau
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Le total s'affiche automatiquement : <strong>Nb heures × Tarif/h</strong>. Vous pouvez ajuster le tarif ligne par ligne.
            </p>
          </CardContent>
        </Card>

        {/* ── Étape 3 : Tableau tarifaire ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <span className="w-6 h-6 bg-site-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <FaTable className="w-4 h-4 text-site-primary" />
              Tableau tarifaire mensuel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {renderTable("A")}
            {renderTable("B")}

            {/* Résumé */}
            {totalA > 0 && (
              <div className="flex items-center justify-between bg-site-primary text-white rounded-xl px-6 py-4">
                <div>
                  <p className="text-sm font-medium opacity-90">Reste mensuel à charge du client</p>
                  <p className="text-xs opacity-70">Y compris dimanches et jours fériés (Section A)</p>
                </div>
                <span className="text-3xl font-bold">{totalA.toFixed(2)} €</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Informations de paiement ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <span className="w-6 h-6 bg-site-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <FaCreditCard className="w-4 h-4 text-site-primary" />
              Informations de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-site-primary text-white">
                    <th className="text-left px-4 py-2.5 font-semibold w-1/2">Champ</th>
                    <th className="text-left px-4 py-2.5 font-semibold w-1/2">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Nom de l'entreprise", value: siteSettings?.paiement_beneficiaire || "EASE-DOM" },
                    { label: "IBAN de l'entreprise", value: siteSettings?.paiement_iban || "FR38 3000 2005 1000 0000 9774 Z35" },
                    { label: "Banque de l'entreprise", value: siteSettings?.paiement_banque || "LCL" },
                    { label: "Code BIC", value: siteSettings?.paiement_bic || "CRLYFRPP" },
                    { label: "SIRET", value: siteSettings?.siret || "—" },
                    { label: "Code APE/NAF", value: siteSettings?.code_ape || "—" },
                    { label: "N° TVA", value: siteSettings?.num_tva || "—" },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 text-gray-600 font-medium border-b border-gray-100">{row.label}</td>
                      <td className="px-4 py-2 text-gray-900 font-semibold border-b border-gray-100">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
                Ces informations sont modifiables dans <strong>Paramètres → Informations légales</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Notes internes ── */}
        <Card>
          <CardContent className="pt-4">
            <Label className="text-xs text-gray-600 font-medium">Notes internes (non visibles par le client)</Label>
            <Textarea
              className="mt-2"
              value={form.admin_notes}
              onChange={(e) => setForm({ ...form, admin_notes: e.target.value })}
              placeholder="Informations réservées à l'administration..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Bouton bas de page */}
        <div className="flex justify-end gap-3 pb-8">
          <Link href="/admin/devis">
            <Button variant="outline">Annuler</Button>
          </Link>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !form.client_name}
            className="bg-site-primary hover:bg-site-primary/90 text-white px-8"
          >
            {createMutation.isPending ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaPlus className="mr-2" />
            )}
            Créer le devis
          </Button>
        </div>

      </div>
    </DashboardLayout>
  );
}
