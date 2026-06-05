import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FaQrcode,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaFilter,
  FaTimes,
  FaCheckCircle,
  FaSignOutAlt,
  FaEdit,
  FaTrash,
  FaArrowRight,
  FaChartBar,
  FaHourglassHalf,
  FaUserClock,
} from "react-icons/fa";
import axios from "axios";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { API_URL } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminScans() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    patient: "",
    employe: "",
    date_debut: "",
    date_fin: "",
    status: "",
  });
  const [editingScan, setEditingScan] = useState<any>(null);
  const [deleteScanId, setDeleteScanId] = useState<number | null>(null);

  // Récupérer les patients pour le filtre
  const { data: patientsData } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/patients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Récupérer les employés pour le filtre
  const { data: employeesData } = useQuery({
    queryKey: ["admin-employees"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/users/?role=EMPLOYE`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Construire les paramètres de requête
  const buildQueryParams = () => {
    const params: any = {};
    if (filters.patient && filters.patient !== "all") params.patient = filters.patient;
    if (filters.employe && filters.employe !== "all") params.employe = filters.employe;
    if (filters.date_debut) params.date_debut = filters.date_debut;
    if (filters.date_fin) params.date_fin = filters.date_fin;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    return params;
  };

  // Récupérer les scans avec filtres
  const { data: scansData, isLoading } = useQuery({
    queryKey: ["admin-scans", filters],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const params = buildQueryParams();
      const res = await axios.get(`${API_URL}/presences/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...params, limit: 10000 },
      });
      return res.data;
    },
  });

  const scans = scansData?.results || scansData || [];

  // Grouper les scans par paires (arrivée-départ)
  const groupedPairs = useMemo(() => {
    // Trier les scans par date (plus récents en haut)
    const sortedScans = [...scans].sort((a, b) => {
      const dateA = a.scan_time ? new Date(a.scan_time).getTime() : 0;
      const dateB = b.scan_time ? new Date(b.scan_time).getTime() : 0;
      return dateB - dateA; // Inversé pour avoir les plus récents en haut
    });

    const pairs: Array<{ arrival: any; departure: any | null; patient: any; employe: any; employe_matricule?: string; date: string }> = [];
    const processed = new Set<number>();

    // Séparer les arrivées et départs
    const arrivals = sortedScans.filter(s => s.status === "ARRIVEE" && !processed.has(s.id));
    const departures = sortedScans.filter(s => s.status === "DEPART" && !processed.has(s.id));

    // Pour chaque arrivée, trouver le départ le plus proche (même patient, même employé, après l'arrivée)
    arrivals.forEach((arrival) => {
      if (processed.has(arrival.id)) return;

      // Chercher le départ le plus proche qui n'est pas déjà utilisé
      const matchingDepartures = departures
        .filter(d => 
          !processed.has(d.id) &&
          d.patient === arrival.patient &&
          d.employe === arrival.employe &&
          d.scan_time &&
          arrival.scan_time &&
          new Date(d.scan_time) >= new Date(arrival.scan_time)
        )
        .sort((a, b) => {
          // Trier par date croissante pour prendre le départ le plus proche de l'arrivée
          const dateA = new Date(a.scan_time).getTime();
          const dateB = new Date(b.scan_time).getTime();
          return dateA - dateB;
        });

      const departure = matchingDepartures[0] || null;

      if (departure) {
        processed.add(arrival.id);
        processed.add(departure.id);
      } else {
        processed.add(arrival.id);
      }

      const date = arrival.scan_time ? fmtDate(arrival.scan_time) : "";
      pairs.push({
        arrival: arrival,
        departure: departure,
        patient: arrival.patient_name || "N/A",
        employe: arrival.employe_username || "N/A",
        employe_matricule: arrival.employe_matricule || "",
        date,
      });
    });

    // Ajouter les départs sans arrivée (cas rare)
    departures.forEach((departure) => {
      if (processed.has(departure.id)) return;
      
      processed.add(departure.id);
      const date = departure.scan_time ? fmtDate(departure.scan_time) : "";
      pairs.push({
        arrival: null,
        departure: departure,
        patient: departure.patient_name || "N/A",
        employe: departure.employe_username || "N/A",
        employe_matricule: departure.employe_matricule || "",
        date,
      });
    });

    // Trier les paires par date de l'arrivée (ou départ si pas d'arrivée) - plus récents en haut
    pairs.sort((a, b) => {
      const dateA = a.arrival?.scan_time || a.departure?.scan_time;
      const dateB = b.arrival?.scan_time || b.departure?.scan_time;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      return timeB - timeA; // Plus récents en haut
    });

    return pairs;
  }, [scans]);

  // Mutation pour mettre à jour un scan
  const updateScanMutation = useMutation({
    mutationFn: async (data: { id: number; scan_time: string; notes?: string }) => {
      const token = localStorage.getItem("access_token");
      const payload: any = {
        scan_time: data.scan_time,
      };
      if (data.notes !== undefined) {
        payload.notes = data.notes;
      }
      const res = await axios.patch(`${API_URL}/presences/${data.id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-scans"] });
      setEditingScan(null);
    },
  });

  // Mutation soft delete → corbeille
  const deleteScanMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/presences/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-scans"] });
      setDeleteScanId(null);
      toast({
        title: "Scan déplacé dans la corbeille",
        description: "Vous pouvez le restaurer ou le supprimer définitivement depuis la corbeille.",
        action: (
          <button
            onClick={() => navigate("/admin/corbeille")}
            className="bg-white text-gray-900 border border-gray-300 rounded px-3 py-1 text-xs font-semibold hover:bg-gray-50"
          >
            Voir la corbeille
          </button>
        ),
        duration: 6000,
      });
    },
  });

  // Mutation suppression définitive (soft delete puis hard delete)
  const hardDeleteScanMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      // 1. Soft delete d'abord
      await axios.delete(`${API_URL}/presences/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 2. Hard delete
      await axios.delete(`${API_URL}/trash/hard-delete/scans/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-scans"] });
      setDeleteScanId(null);
      toast({
        title: "Scan supprimé définitivement",
        description: "Le scan a été supprimé et ne peut plus être récupéré.",
        duration: 4000,
      });
    },
    onError: () => {
      toast({
        title: "❌ Erreur",
        description: "Impossible de supprimer définitivement ce scan.",
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      patient: "",
      employe: "",
      date_debut: "",
      date_fin: "",
      status: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const handleEdit = (scan: any) => {
    setEditingScan({
      ...scan,
      scan_time: scan.scan_time ? new Date(scan.scan_time).toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).slice(0, 16).replace(" ", "T") : "",
    });
  };

  const handleSaveEdit = () => {
    if (editingScan) {
      updateScanMutation.mutate({
        id: editingScan.id,
        scan_time: editingScan.scan_time,
        notes: editingScan.notes || "",
      });
    }
  };

  // Calculer la durée entre arrivée et départ
  const calculateDuration = (arrival: any, departure: any) => {
    if (!arrival?.scan_time || !departure?.scan_time) return null;
    const arrivalTime = new Date(arrival.scan_time).getTime();
    const departureTime = new Date(departure.scan_time).getTime();
    const hours = (departureTime - arrivalTime) / (1000 * 60 * 60);
    return hours;
  };

  // Formater les heures en "Xh YYmin"
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m.toString().padStart(2, "0")}`;
  };

  // Statistiques agrégées des heures
  const hoursStats = useMemo(() => {
    const completedPairs = groupedPairs.filter((p) => p.arrival && p.departure);
    const inProgressPairs = groupedPairs.filter((p) => p.arrival && !p.departure);
    const totalHours = completedPairs.reduce((sum, p) => {
      return sum + (calculateDuration(p.arrival, p.departure) || 0);
    }, 0);

    const byEmployee: Record<string, { hours: number; missions: number }> = {};
    const byPatient: Record<string, { hours: number; missions: number }> = {};

    completedPairs.forEach((p) => {
      const d = calculateDuration(p.arrival, p.departure) || 0;
      if (!byEmployee[p.employe]) byEmployee[p.employe] = { hours: 0, missions: 0 };
      byEmployee[p.employe].hours += d;
      byEmployee[p.employe].missions += 1;
      if (!byPatient[p.patient]) byPatient[p.patient] = { hours: 0, missions: 0 };
      byPatient[p.patient].hours += d;
      byPatient[p.patient].missions += 1;
    });

    return {
      totalHours,
      totalMissions: completedPairs.length,
      inProgressCount: inProgressPairs.length,
      byEmployee: Object.entries(byEmployee).sort((a, b) => b[1].hours - a[1].hours),
      byPatient: Object.entries(byPatient).sort((a, b) => b[1].hours - a[1].hours),
    };
  }, [groupedPairs]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scans</h1>
            <p className="text-gray-600 mt-1">
              Consultez toutes les missions (paires arrivée-départ)
            </p>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FaFilter className="w-5 h-5 text-site-primary" />
                Filtres
              </CardTitle>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtre Patient */}
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select
                  value={filters.patient || "all"}
                  onValueChange={(value) => handleFilterChange("patient", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Tous les patients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les patients</SelectItem>
                    {patientsData?.results?.map((patient: any) => (
                      <SelectItem key={patient.id} value={String(patient.id)}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    )) ||
                      patientsData?.map((patient: any) => (
                        <SelectItem key={patient.id} value={String(patient.id)}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Employé */}
              <div className="space-y-2">
                <Label htmlFor="employe">Employé</Label>
                <Select
                  value={filters.employe || "all"}
                  onValueChange={(value) => handleFilterChange("employe", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="employe">
                    <SelectValue placeholder="Tous les employés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les employés</SelectItem>
                    {employeesData?.results?.map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.username} ({emp.matricule || "N/A"})
                      </SelectItem>
                    )) ||
                      employeesData?.map((emp: any) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.username} ({emp.matricule || "N/A"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Statut */}
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="ARRIVEE">Arrivée</SelectItem>
                    <SelectItem value="DEPART">Départ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Date début */}
              <div className="space-y-2">
                <Label htmlFor="date_debut">Date début</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={filters.date_debut}
                  onChange={(e) => handleFilterChange("date_debut", e.target.value)}
                />
              </div>

              {/* Filtre Date fin */}
              <div className="space-y-2">
                <Label htmlFor="date_fin">Date fin</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={filters.date_fin}
                  onChange={(e) => handleFilterChange("date_fin", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panneau statistiques heures */}
        {groupedPairs.length > 0 && (
          <div className="space-y-4">
            {/* 3 cartes de synthèse */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg flex items-center gap-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <FaCheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Missions terminées</p>
                  <p className="text-3xl font-bold">{hoursStats.totalMissions}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg flex items-center gap-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <FaHourglassHalf className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">En cours</p>
                  <p className="text-3xl font-bold">{hoursStats.inProgressCount}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-site-primary to-site-secondary rounded-2xl p-5 text-white shadow-lg flex items-center gap-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <FaClock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Total heures</p>
                  <p className="text-3xl font-bold">{formatHours(hoursStats.totalHours)}</p>
                </div>
              </div>
            </div>

            {/* Détail par employé (si filtre patient actif ou plusieurs employés) */}
            {hoursStats.byEmployee.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-2">
                  <FaUserClock className="w-4 h-4 text-site-primary" />
                  <h3 className="font-bold text-gray-800 text-base">
                    {filters.patient && filters.patient !== "all"
                      ? "Heures par employé pour ce patient"
                      : filters.employe && filters.employe !== "all"
                      ? "Heures par patient pour cet employé"
                      : "Heures par employé"}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {(filters.employe && filters.employe !== "all"
                    ? hoursStats.byPatient
                    : hoursStats.byEmployee
                  ).map(([name, stats], idx) => {
                    const maxHours = (filters.employe && filters.employe !== "all"
                      ? hoursStats.byPatient
                      : hoursStats.byEmployee)[0]?.[1].hours || 1;
                    const pct = Math.round((stats.hours / maxHours) * 100);
                    const colors = [
                      "from-emerald-400 to-emerald-600",
                      "from-blue-400 to-blue-600",
                      "from-purple-400 to-purple-600",
                      "from-orange-400 to-orange-600",
                      "from-pink-400 to-pink-600",
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-site-primary to-site-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-500">{stats.missions} mission{stats.missions > 1 ? "s" : ""}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${color} text-white`}>
                                {formatHours(stats.hours)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liste des paires (missions) */}
        <Card>
          <CardHeader>
            <CardTitle>
              Missions ({groupedPairs.length} mission{groupedPairs.length > 1 ? "s" : ""}, {scans.length} scan{scans.length > 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : groupedPairs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaQrcode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune mission trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedPairs.map((pair, index) => {
                  const duration = pair.arrival && pair.departure ? calculateDuration(pair.arrival, pair.departure) : null;
                  const isComplete = pair.arrival && pair.departure;

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border shadow-md transition-all hover:shadow-lg ${
                        isComplete
                          ? "bg-gradient-to-br from-green-50 via-white to-blue-50 border-green-200"
                          : "bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-yellow-300"
                      }`}
                    >
                      {/* En-tête de la mission */}
                      <div className="p-2.5 sm:p-3 border-b border-gray-200 bg-white/50 rounded-t-lg">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-site-primary/10 rounded">
                              <FaUser className="w-3.5 h-3.5 text-site-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-gray-900">{pair.employe}</h3>
                              {pair.employe_matricule && (
                                <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 mt-0.5">
                                  {pair.employe_matricule}
                                </Badge>
                              )}
                            </div>
                            <div className="hidden sm:block text-gray-400 text-xs">•</div>
                            <div className="text-xs text-gray-700">
                              <span className="font-medium">Patient:</span>{" "}
                              <span className="font-semibold text-gray-900">{pair.patient}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`text-xs px-2 py-0.5 ${
                                isComplete
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
                              }`}
                            >
                              {isComplete ? "Terminée" : "En cours"}
                            </Badge>
                            {duration !== null && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 py-0.5">
                                <FaClock className="w-2.5 h-2.5 mr-0.5" />
                                {formatHours(duration)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Corps de la mission - Arrivée et Départ côte à côte */}
                      <div className="p-2.5 sm:p-3">
                        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                          {/* Carte Arrivée */}
                          <div
                            className={`rounded border p-2.5 ${
                              pair.arrival
                                ? "bg-gradient-to-br from-green-100 to-green-50 border-green-300 shadow-sm"
                                : "bg-gray-100 border-gray-300 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-green-500 rounded-full">
                                  <FaCheckCircle className="w-3 h-3 text-white" />
                                </div>
                                <h4 className="font-semibold text-xs text-green-800">Arrivée</h4>
                              </div>
                              {pair.arrival && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(pair.arrival)}
                                  className="h-6 w-6 p-0"
                                >
                                  <FaEdit className="w-2.5 h-2.5" />
                                </Button>
                              )}
                            </div>
                            {pair.arrival ? (
                              <>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <FaClock className="w-3 h-3 text-green-700" />
                                    <span className="text-green-800 font-medium">
                                      {fmtDateTime(pair.arrival.scan_time)}
                                    </span>
                                  </div>
                                  {pair.arrival.notes && (
                                    <div className="mt-1.5 p-1.5 bg-yellow-100 rounded border border-yellow-300">
                                      <p className="text-[10px] text-yellow-800 font-medium">Commentaire:</p>
                                      <p className="text-[10px] text-yellow-900">{pair.arrival.notes}</p>
                                    </div>
                                  )}
                                  {(() => {
                                    const lat = pair.arrival?.latitude;
                                    const lng = pair.arrival?.longitude;
                                    // Vérifier si les coordonnées existent et sont valides
                                    const hasValidCoords = lat != null && lng != null && 
                                                          lat !== '' && lng !== '' &&
                                                          !isNaN(Number(lat)) && !isNaN(Number(lng));
                                    
                                    if (hasValidCoords) {
                                      const latNum = Number(lat);
                                      const lngNum = Number(lng);
                                      return (
                                        <div className="mt-1.5 p-1.5 bg-white/70 rounded border border-green-200">
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <FaMapMarkerAlt className="w-2.5 h-2.5 text-green-700" />
                                            <span className="text-[10px] font-semibold text-green-800">GPS</span>
                                          </div>
                                          <p className="text-[10px] font-mono text-green-700 mb-0.5">
                                            {latNum.toFixed(6)}, {lngNum.toFixed(6)}
                                          </p>
                                          <a
                                            href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-green-600 hover:text-green-800 underline"
                                          >
                                            Voir sur Google Maps
                                          </a>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Arrivée non enregistrée</p>
                            )}
                          </div>

                          {/* Flèche de connexion - visible uniquement sur desktop */}
                          <div className="hidden lg:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-1/2 z-10">
                            <div className="bg-white border border-gray-400 rounded-full p-1 shadow-md">
                              <FaArrowRight className="w-3 h-3 text-gray-600" />
                            </div>
                          </div>

                          {/* Carte Départ */}
                          <div
                            className={`rounded border p-2.5 ${
                              pair.departure
                                ? "bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300 shadow-sm"
                                : "bg-gray-100 border-gray-300 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-orange-500 rounded-full">
                                  <FaSignOutAlt className="w-3 h-3 text-white" />
                                </div>
                                <h4 className="font-semibold text-xs text-orange-800">Départ</h4>
                              </div>
                              {pair.departure && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(pair.departure)}
                                  className="h-6 w-6 p-0"
                                >
                                  <FaEdit className="w-2.5 h-2.5" />
                                </Button>
                              )}
                            </div>
                            {pair.departure ? (
                              <>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <FaClock className="w-3 h-3 text-orange-700" />
                                    <span className="text-orange-800 font-medium">
                                      {fmtDateTime(pair.departure.scan_time)}
                                    </span>
                                  </div>
                                  {pair.departure.notes && (
                                    <div className="mt-1.5 p-1.5 bg-yellow-100 rounded border border-yellow-300">
                                      <p className="text-[10px] text-yellow-800 font-medium">Commentaire:</p>
                                      <p className="text-[10px] text-yellow-900">{pair.departure.notes}</p>
                                    </div>
                                  )}
                                  {(() => {
                                    const lat = pair.departure?.latitude;
                                    const lng = pair.departure?.longitude;
                                    // Vérifier si les coordonnées existent et sont valides
                                    const hasValidCoords = lat != null && lng != null && 
                                                          lat !== '' && lng !== '' &&
                                                          !isNaN(Number(lat)) && !isNaN(Number(lng));
                                    
                                    if (hasValidCoords) {
                                      const latNum = Number(lat);
                                      const lngNum = Number(lng);
                                      return (
                                        <div className="mt-1.5 p-1.5 bg-white/70 rounded border border-orange-200">
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <FaMapMarkerAlt className="w-2.5 h-2.5 text-orange-700" />
                                            <span className="text-[10px] font-semibold text-orange-800">GPS</span>
                                          </div>
                                          <p className="text-[10px] font-mono text-orange-700 mb-0.5">
                                            {latNum.toFixed(6)}, {lngNum.toFixed(6)}
                                          </p>
                                          <a
                                            href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-orange-600 hover:text-orange-800 underline"
                                          >
                                            Voir sur Google Maps
                                          </a>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-gray-500 italic">Départ non enregistré</p>
                            )}
                          </div>
                        </div>

                        {/* Actions de suppression */}
                        <div className="mt-2.5 pt-2.5 border-t border-gray-300 flex justify-end gap-1.5">
                          {pair.arrival && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteScanId(pair.arrival.id)}
                              className="flex items-center gap-1.5 text-xs h-7 px-2"
                            >
                              <FaTrash className="w-2.5 h-2.5" />
                              Supprimer arrivée
                            </Button>
                          )}
                          {pair.departure && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteScanId(pair.departure.id)}
                              className="flex items-center gap-1.5 text-xs h-7 px-2"
                            >
                              <FaTrash className="w-2.5 h-2.5" />
                              Supprimer départ
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de modification */}
        <Dialog open={!!editingScan} onOpenChange={(open) => !open && setEditingScan(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le scan</DialogTitle>
              <DialogDescription>
                Modifiez la date/heure et le commentaire de ce scan.
              </DialogDescription>
            </DialogHeader>
            {editingScan && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-scan-time">Date et heure</Label>
                  <Input
                    id="edit-scan-time"
                    type="datetime-local"
                    value={editingScan.scan_time}
                    onChange={(e) => setEditingScan({ ...editingScan, scan_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-scan-notes">Commentaire</Label>
                  <Textarea
                    id="edit-scan-notes"
                    value={editingScan.notes || ""}
                    onChange={(e) => setEditingScan({ ...editingScan, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingScan(null)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateScanMutation.isPending}>
                {updateScanMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={!!deleteScanId} onOpenChange={(open) => !open && setDeleteScanId(null)}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900">Supprimer ce scan ?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-sm text-gray-600 space-y-1 mt-1">
                  <p><span className="font-semibold text-gray-700">Corbeille</span> — récupérable, retiré des exports</p>
                  <p><span className="font-semibold text-gray-700">Définitif</span> — suppression permanente</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 mt-2">
              <div className="flex gap-2 w-full">
                <AlertDialogCancel className="flex-1 m-0">Annuler</AlertDialogCancel>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={deleteScanMutation.isPending || hardDeleteScanMutation.isPending}
                  onClick={() => { if (deleteScanId) deleteScanMutation.mutate(deleteScanId); }}
                >
                  {deleteScanMutation.isPending ? "..." : "Corbeille"}
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleteScanMutation.isPending || hardDeleteScanMutation.isPending}
                  onClick={() => { if (deleteScanId) hardDeleteScanMutation.mutate(deleteScanId); }}
                >
                  {hardDeleteScanMutation.isPending ? "..." : "Supprimer"}
                </Button>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
