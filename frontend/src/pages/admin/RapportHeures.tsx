import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { API_URL } from "@/config/api";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  FaFilePdf, FaClock, FaUser, FaCalendarAlt,
  FaChevronDown, FaChevronRight, FaEnvelope, FaPaperPlane, FaSearch,
} from "react-icons/fa";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

// Date du 1er du mois courant
function todayStr() { return new Date().toISOString().split("T")[0]; }
function firstOfMonth() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split("T")[0];
}

function SendEmailDialog({ open, onClose, patient, dateDebut, dateFin, patientsDb }: {
  open: boolean; onClose: () => void; patient: any; dateDebut: string; dateFin: string; patientsDb: any[];
}) {
  const { toast } = useToast();
  // Cherche l'email dans le rapport, sinon dans la liste patients de la DB
  const emailFromDb = patientsDb?.find((p: any) => p.id === patient?.patient_id)?.email || "";
  const initialEmail = patient?.patient_email || emailFromDb || "";
  const [email, setEmail] = useState(initialEmail);
  React.useEffect(() => {
    const db = patientsDb?.find((p: any) => p.id === patient?.patient_id)?.email || "";
    setEmail(patient?.patient_email || db || "");
  }, [patient?.patient_id]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${API_URL}/presences/send_monthly_report/`,
        { date_debut: dateDebut, date_fin: dateFin, patient_id: patient.patient_id, email },
        { headers: authHeader() }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast({ title: "Email envoyé", description: data.message });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.response?.data?.error || "Erreur envoi", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaEnvelope className="text-green-600" /> Envoyer le rapport à {patient?.patient_nom}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-gray-500">
            Le rapport PDF de <strong>{patient?.patient_nom}</strong> du <strong>{dateDebut}</strong> au <strong>{dateFin}</strong> sera envoyé par email.
          </p>
          {!initialEmail && (
            <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>Ce patient n'a pas d'email enregistré. Saisissez-le manuellement ci-dessous.</span>
            </div>
          )}
          <div>
            <Label>Email du patient</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" type="email" className="mt-1" />
          </div>
          <div className="bg-blue-50 rounded p-3 text-xs text-blue-700">
            <strong>{patient?.nb_visites} visite(s)</strong> — Total : <strong>{patient?.total_heures_str}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => sendMutation.mutate()} disabled={!email || sendMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <FaPaperPlane className="w-3 h-3" />
            {sendMutation.isPending ? "Envoi..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RapportHeures() {
  const [dateDebut, setDateDebut] = useState(firstOfMonth());
  const [dateFin, setDateFin] = useState(todayStr());
  const [patientFiltre, setPatientFiltre] = useState("all");
  const [openPatients, setOpenPatients] = useState<Record<number, boolean>>({});
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; patient: any }>({ open: false, patient: null });
  const [applied, setApplied] = useState({ dateDebut: firstOfMonth(), dateFin: todayStr(), patient: "all" });

  // Charger les patients pour le filtre
  const { data: patients } = useQuery({
    queryKey: ["patients-list-rapport"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/patients/?limit=200`, { headers: authHeader() });
      return res.data.results || res.data || [];
    },
  });

  // Charger le rapport JSON avec les filtres appliqués
  const { data: rapport, isLoading } = useQuery({
    queryKey: ["rapport-heures", applied.dateDebut, applied.dateFin, applied.patient],
    queryFn: async () => {
      let url = `${API_URL}/presences/monthly_report/?date_debut=${applied.dateDebut}&date_fin=${applied.dateFin}&output=json`;
      if (applied.patient && applied.patient !== "all") url += `&patient=${applied.patient}`;
      const res = await axios.get(url, { headers: authHeader() });
      return res.data;
    },
  });

  const applyFilters = () => {
    setApplied({ dateDebut, dateFin, patient: patientFiltre });
    setOpenPatients({});
  };

  const togglePatient = (id: number) => setOpenPatients((prev) => ({ ...prev, [id]: !prev[id] }));

  const downloadPDF = async (patientId?: number) => {
    let url = `${API_URL}/presences/monthly_report/?date_debut=${applied.dateDebut}&date_fin=${applied.dateFin}&output=pdf`;
    if (patientId) url += `&patient=${patientId}`;
    else if (applied.patient && applied.patient !== "all") url += `&patient=${applied.patient}`;
    const res = await axios.get(url, { headers: authHeader(), responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-heures-${applied.dateDebut}-${applied.dateFin}${patientId ? `-p${patientId}` : ""}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Titre */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapport des heures</h1>
            <p className="text-sm text-gray-500 mt-1">Heures effectuées par patient — téléchargement et envoi email</p>
          </div>
          <Button onClick={() => downloadPDF()} className="bg-red-600 hover:bg-red-700 text-white gap-2">
            <FaFilePdf className="w-4 h-4" /> Télécharger PDF global
          </Button>
        </div>

        {/* Filtres intervalle */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500 font-medium">Date début</Label>
                <input
                  type="date"
                  value={dateDebut}
                  max={dateFin}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="border rounded px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500 font-medium">Date fin</Label>
                <input
                  type="date"
                  value={dateFin}
                  min={dateDebut}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="border rounded px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500 font-medium">Patient</Label>
                <Select value={patientFiltre} onValueChange={setPatientFiltre}>
                  <SelectTrigger className="w-52 h-9">
                    <FaUser className="w-3 h-3 mr-2 text-gray-400" />
                    <SelectValue placeholder="Tous les patients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les patients</SelectItem>
                    {(patients || []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={applyFilters} className="bg-green-600 hover:bg-green-700 text-white gap-2 h-9">
                <FaSearch className="w-3 h-3" /> Extraire
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résumé */}
        {rapport && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500">Période</p>
                <p className="text-sm font-bold text-gray-800">{rapport.mois_label}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500">Patients</p>
                <p className="text-2xl font-bold text-blue-600">{rapport.nb_patients}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500">Visites effectuées</p>
                <p className="text-2xl font-bold text-purple-600">{rapport.nb_visites}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500">Total heures</p>
                <p className="text-2xl font-bold text-orange-600 flex items-center gap-1">
                  <FaClock className="w-4 h-4" />{rapport.total_heures_str}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Détail par patient */}
        {isLoading ? (
          <Card><CardContent className="py-12 text-center text-gray-400">Chargement...</CardContent></Card>
        ) : rapport?.patients_data?.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-gray-400">Aucune donnée pour cette période.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {(rapport?.patients_data || []).map((pat: any) => (
              <Card key={pat.patient_id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors py-3"
                  onClick={() => togglePatient(pat.patient_id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {openPatients[pat.patient_id]
                        ? <FaChevronDown className="w-3 h-3 text-gray-400" />
                        : <FaChevronRight className="w-3 h-3 text-gray-400" />}
                      <FaUser className="w-4 h-4 text-blue-600" />
                      <CardTitle className="text-sm font-semibold text-gray-800">{pat.patient_nom}</CardTitle>
                      {pat.patient_email && <span className="text-xs text-gray-400">{pat.patient_email}</span>}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge variant="outline" className="text-gray-600 text-xs">{pat.employes?.length || 1} employé(s)</Badge>
                      <Badge variant="outline" className="text-gray-600 text-xs">{pat.nb_visites} visite(s)</Badge>
                      <Badge className="bg-green-100 text-green-800 font-bold text-xs">
                        <FaClock className="w-3 h-3 mr-1" />{pat.total_heures_str}
                      </Badge>
                      <Button size="sm" variant="outline"
                        className="gap-1 text-xs border-red-200 text-red-700 hover:bg-red-50 h-7"
                        onClick={() => downloadPDF(pat.patient_id)}>
                        <FaFilePdf className="w-3 h-3" /> PDF
                      </Button>
                      <Button size="sm"
                        className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white h-7"
                        onClick={() => setEmailDialog({ open: true, patient: pat })}>
                        <FaEnvelope className="w-3 h-3" /> Envoyer
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {openPatients[pat.patient_id] && (
                  <CardContent className="p-0">
                    {(pat.employes || []).map((emp: any) => (
                      <div key={emp.employe_id}>
                        <div className="flex items-center justify-between bg-green-50 border-l-4 border-green-600 px-4 py-2">
                          <span className="text-sm font-semibold text-green-800">{emp.employe_nom}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{emp.nb_visites} visite(s)</Badge>
                            <Badge className="bg-green-100 text-green-800 text-xs font-bold">
                              <FaClock className="w-3 h-3 mr-1" />{emp.total_heures_str}
                            </Badge>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-100 text-gray-600">
                                <th className="text-left px-4 py-2 font-medium text-xs">Date</th>
                                <th className="text-left px-4 py-2 font-medium text-xs">Arrivée</th>
                                <th className="text-left px-4 py-2 font-medium text-xs">Départ</th>
                                <th className="text-right px-4 py-2 font-medium text-xs">Durée</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emp.visites.map((v: any, i: number) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="px-4 py-2 text-gray-700 text-xs">{v.date}</td>
                                  <td className="px-4 py-2 text-xs">
                                    {v.heure_arrivee
                                      ? <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">{v.heure_arrivee}</span>
                                      : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-4 py-2 text-xs">
                                    {v.heure_depart
                                      ? <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">{v.heure_depart}</span>
                                      : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-4 py-2 text-right font-semibold text-gray-800 text-xs">{v.duree_str}</td>
                                </tr>
                              ))}
                              <tr className="bg-green-50 border-t border-green-200">
                                <td colSpan={3} className="px-4 py-1.5 text-xs font-bold text-green-700">Sous-total {emp.employe_nom}</td>
                                <td className="px-4 py-1.5 text-right text-xs font-bold text-green-700">{emp.total_heures_str}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-2">
                      <span className="font-bold text-sm">TOTAL {pat.patient_nom}</span>
                      <span className="font-bold text-sm flex items-center gap-1">
                        <FaClock className="w-3 h-3" /> {pat.total_heures_str}
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {emailDialog.open && (
        <SendEmailDialog
          open={emailDialog.open}
          onClose={() => setEmailDialog({ open: false, patient: null })}
          patient={emailDialog.patient}
          dateDebut={applied.dateDebut}
          dateFin={applied.dateFin}
          patientsDb={patients || []}
        />
      )}
    </DashboardLayout>
  );
}
