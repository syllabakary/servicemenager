import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  FaUser, FaUsers, FaCheckCircle, FaClock, FaSignOutAlt, FaQrcode, FaList,
  FaCalendarAlt, FaSpinner, FaPhone, FaMapMarkerAlt, FaLock
} from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { API_URL } from "@/config/api";

export default function EmployeDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = React.useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token || storedUser.role !== "EMPLOYE") {
      setLocation("/employe/login");
      return;
    }
    
    setUser(storedUser);
  }, [setLocation]);

  const { data: statistics, isLoading, error: statsError } = useQuery({
    queryKey: ["employe-statistics"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Token manquant");
      }
      const response = await axios.get(`${API_URL}/presences/my_statistics/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    retry: false, // Ne pas réessayer en cas d'erreur 401
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        // Token invalide, rediriger vers la page de connexion
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setLocation("/employe/login");
      }
    },
  });

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    const access = localStorage.getItem("access_token");
    if (refresh && access) {
      try {
        await fetch("/api/logout/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
          body: JSON.stringify({ refresh }),
        });
      } catch {}
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setLocation("/employe/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-20 pb-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-site-section-employe-text">
                Tableau de bord
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-10 h-10 rounded-full bg-site-section-employe-button flex items-center justify-center text-site-button-text font-bold">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div>
                  <p className="text-gray-800 font-semibold text-base sm:text-lg">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Matricule: <span className="font-mono font-semibold text-site-primary">{user.matricule}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setLocation("/employe/scan")}
                className="bg-site-section-employe-button hover:opacity-90 text-site-button-text border-2 border-site-section-employe-button-border shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-base font-semibold"
                size="lg"
              >
                <FaQrcode className="w-5 h-5 mr-2" />
                Scanner QR Code
              </Button>
              <Button
                onClick={() => setLocation("/employe/patients")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-base font-semibold"
                size="lg"
              >
                <FaList className="w-5 h-5 mr-2" />
                Mes Patients
              </Button>
              <Button
                onClick={() => setLocation("/employe/change-password")}
                variant="outline"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-gray-300 px-6 py-6 text-base font-semibold"
                size="lg"
              >
                <FaLock className="w-5 h-5 mr-2" />
                Changer mot de passe
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-6 py-6 text-base font-semibold"
                size="lg"
              >
                <FaSignOutAlt className="w-5 h-5 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {isLoading ? (
          <div className="text-center py-12">
            <FaSpinner className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        ) : statsError ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Erreur lors du chargement des statistiques. Veuillez vous reconnecter.</p>
            <Button onClick={() => setLocation("/employe/login")} variant="outline">
              Se reconnecter
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FaUsers className="w-5 h-5 text-blue-600" />
                    Patients à visiter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">
                    {statistics?.patients_to_visit_count || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Sur {statistics?.total_patients || 0} patients assignés
                  </p>
                  {statistics?.patients_to_visit_count > 0 && (
                    <p className="text-xs text-blue-700 font-medium mt-2">
                      Cliquez sur "Patients à visiter" ci-dessous pour voir les détails
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FaCheckCircle className="w-5 h-5 text-green-600" />
                    Déjà visités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900">
                    {statistics?.patients_visited_today || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {statistics?.total_patients 
                      ? `${Math.round((statistics.patients_visited_today / statistics.total_patients) * 100)}% des patients assignés`
                      : "0% des patients"}
                  </p>
                  {statistics?.patients_visited_today > 0 && (
                    <p className="text-xs text-green-700 font-medium mt-2">
                      Cliquez sur "Patients déjà visités" ci-dessous pour voir les détails
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FaClock className="w-5 h-5 text-purple-600" />
                    Visites aujourd'hui
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900">
                    {statistics?.total_visits_today || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Visites complètes (arrivée + départ)</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <FaCalendarAlt className="w-5 h-5 text-orange-600" />
                    Visites cette semaine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900">
                    {statistics?.total_visits_week || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">7 derniers jours</p>
                </CardContent>
              </Card>
            </div>

            {/* Patients à visiter */}
            {statistics?.patients_to_visit && statistics.patients_to_visit.length > 0 && (
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FaUsers className="w-6 h-6 text-blue-600" />
                    Patients à visiter ({statistics.patients_to_visit.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statistics.patients_to_visit.map((patient: any) => (
                      <div
                        key={patient.id}
                        className="bg-blue-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {patient.first_name} {patient.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Client: {patient.client_name}
                            </p>
                            {patient.phone && (
                              <p className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                                <FaPhone className="w-3 h-3" />
                                {patient.phone}
                              </p>
                            )}
                            {patient.address && (
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <FaMapMarkerAlt className="w-3 h-3" />
                                {patient.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/employe/patient/${patient.id}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        >
                          <FaUser className="w-4 h-4 mr-2" />
                          Voir détails
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Patients déjà visités */}
            {statistics?.patients_visited && statistics.patients_visited.length > 0 && (
              <Card className="shadow-xl border-0 bg-white">
                <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FaCheckCircle className="w-6 h-6 text-green-600" />
                    Patients déjà visités ({statistics.patients_visited.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statistics.patients_visited.map((patient: any) => (
                      <div
                        key={patient.id}
                        className="bg-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {patient.patient_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Client: {patient.client_name}
                            </p>
                            <div className="space-y-1 mb-2">
                              {patient.arrival_time && (
                                <p className="text-xs text-gray-600">
                                  <span className="font-semibold">Arrivée:</span>{" "}
                                  {format(new Date(patient.arrival_time), "dd MMMM yyyy à HH:mm", {
                                    locale: fr,
                                  })}
                                </p>
                              )}
                              {patient.departure_time && (
                                <p className="text-xs text-gray-600">
                                  <span className="font-semibold">Départ:</span>{" "}
                                  {format(new Date(patient.departure_time), "dd MMMM yyyy à HH:mm", {
                                    locale: fr,
                                  })}
                                </p>
                              )}
                              {patient.duration_hours && (
                                <p className="text-xs text-blue-600 font-medium">
                                  <span className="font-semibold">Durée:</span>{" "}
                                  {Math.floor(patient.duration_hours)}h{" "}
                                  {Math.round((patient.duration_hours % 1) * 60)}min
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    patient.progress_percentage === 100
                                      ? "bg-green-500"
                                      : "bg-yellow-500"
                                  }`}
                                  style={{ width: `${patient.progress_percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">
                                {patient.progress_percentage}%
                              </span>
                              <Badge
                                variant={patient.mission_status === "terminée" ? "default" : "secondary"}
                                className={
                                  patient.mission_status === "terminée"
                                    ? "bg-green-500 text-white text-xs"
                                    : "bg-yellow-500 text-white text-xs"
                                }
                              >
                                {patient.mission_status === "terminée" ? "Terminée" : "En cours"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/employe/patient/${patient.id}`)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
                        >
                          <FaUser className="w-4 h-4 mr-2" />
                          Voir détails
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des visites d'aujourd'hui */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaList className="w-6 h-6 text-site-primary" />
                  Visites d'aujourd'hui
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {statistics?.recent_presences && statistics.recent_presences.length > 0 ? (
                  <div className="space-y-4">
                    {statistics.recent_presences.map((visit: any) => (
                      <div
                        key={visit.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="font-bold text-lg text-gray-900">
                                {visit.patient_name}
                              </h3>
                              <Badge
                                variant={visit.status === "ARRIVEE" ? "default" : "secondary"}
                                className={
                                  visit.status === "ARRIVEE"
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                }
                              >
                                {visit.status === "ARRIVEE" ? "Arrivée" : "Départ"}
                              </Badge>
                              {/* Barre de progression */}
                              <div className="flex items-center gap-2 ml-auto">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      visit.progress_percentage === 100
                                        ? "bg-green-500"
                                        : visit.progress_percentage === 50
                                        ? "bg-yellow-500"
                                        : "bg-gray-300"
                                    }`}
                                    style={{ width: `${visit.progress_percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">
                                  {visit.progress_percentage}%
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Client: {visit.client_name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <FaClock className="w-3 h-3" />
                              {format(new Date(visit.scan_time), "dd MMMM yyyy à HH:mm", {
                                locale: fr,
                              })}
                            </p>
                            {visit.duration_hours && (
                              <p className="text-sm text-blue-600 font-medium mt-1">
                                Durée: {Math.floor(visit.duration_hours)}h{" "}
                                {Math.round((visit.duration_hours % 1) * 60)}min
                              </p>
                            )}
                            {/* Message de mission terminée */}
                            {visit.progress_percentage === 100 && (
                              <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-lg">
                                <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                                  <FaCheckCircle className="w-4 h-4" />
                                  Mission terminée pour le patient
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/employe/patient/${visit.patient_id}`)}
                            className="w-full sm:w-auto"
                          >
                            <FaUser className="w-4 h-4 mr-2" />
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FaList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Aucune visite enregistrée aujourd'hui</p>
                    <Button
                      onClick={() => setLocation("/employe/scan")}
                      className="mt-4 bg-site-section-employe-button hover:opacity-90 text-site-button-text border-2 border-site-section-employe-button-border"
                    >
                      <FaQrcode className="w-4 h-4 mr-2" />
                      Commencer à scanner
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

