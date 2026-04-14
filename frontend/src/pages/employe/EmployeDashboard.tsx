import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  FaUsers, FaCheckCircle, FaClock, FaCalendarAlt, FaSpinner,
  FaPhone, FaMapMarkerAlt, FaQrcode, FaUser, FaList, FaArrowRight,
} from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { API_URL } from "@/config/api";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { EmployeLayout } from "@/components/employe/EmployeLayout";

export default function EmployeDashboard() {
  const [, setLocation] = useLocation();
  useInactivityLogout(30 * 60 * 1000);
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
      const response = await axios.get(`${API_URL}/presences/my_statistics/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 30000,
    retry: false,
    onError: (error: any) => {
      if (error?.response?.status === 401) {
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
        <FaSpinner className="w-8 h-8 text-site-primary animate-spin" />
      </div>
    );
  }

  const today = format(new Date(), "EEEE d MMMM", { locale: fr });

  return (
    <EmployeLayout user={user} onLogout={handleLogout}>
      <div className="space-y-5 py-5">

        {/* Greeting */}
        <div className="bg-gradient-to-r from-site-primary to-site-secondary rounded-2xl p-5 text-white shadow-lg">
          <p className="text-white/70 text-sm capitalize">{today}</p>
          <h1 className="text-2xl font-bold mt-1">
            Bonjour, {user.first_name} 👋
          </h1>
          <p className="text-white/80 text-sm mt-1">Bonne journée de travail !</p>

          {/* Scanner CTA */}
          <button
            onClick={() => setLocation("/employe/scan")}
            className="mt-4 w-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-semibold transition-all"
          >
            <FaQrcode className="w-5 h-5" />
            Scanner un QR Code
          </button>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="w-7 h-7 text-site-primary animate-spin" />
          </div>
        ) : statsError ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-red-600 text-sm">Erreur de chargement.</p>
            <Button onClick={() => setLocation("/employe/login")} variant="outline" className="mt-3 text-sm">
              Se reconnecter
            </Button>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">À visiter</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FaUsers className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics?.patients_to_visit_count || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">sur {statistics?.total_patients || 0} assignés</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Visités</span>
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                    <FaCheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics?.patients_visited_today || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {statistics?.total_patients
                    ? `${Math.round((statistics.patients_visited_today / statistics.total_patients) * 100)}%`
                    : "0%"} complétés
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Aujourd'hui</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FaClock className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics?.total_visits_today || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">visites complètes</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Cette semaine</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                    <FaCalendarAlt className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics?.total_visits_week || 0}</p>
                <p className="text-xs text-gray-400 mt-0.5">7 derniers jours</p>
              </div>
            </div>

            {/* Patients à visiter */}
            {statistics?.patients_to_visit && statistics.patients_to_visit.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FaUsers className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">À visiter</span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {statistics.patients_to_visit.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setLocation("/employe/patients")}
                    className="text-xs text-site-primary font-medium flex items-center gap-1"
                  >
                    Tout voir <FaArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {statistics.patients_to_visit.slice(0, 3).map((patient: any) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/employe/patient/${patient.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {patient.first_name?.[0]}{patient.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {patient.phone && (
                              <span className="flex items-center gap-1">
                                <FaPhone className="w-2.5 h-2.5" />{patient.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <FaArrowRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visites d'aujourd'hui */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FaList className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">Visites d'aujourd'hui</span>
                </div>
              </div>

              {statistics?.recent_presences && statistics.recent_presences.length > 0 ? (
                <div className="p-3 space-y-2">
                  {statistics.recent_presences.map((visit: any) => {
                    const isArrivee = visit.status === "ARRIVEE";
                    return (
                      <div
                        key={visit.id}
                        onClick={() => setLocation(`/employe/patient/${visit.patient_id}`)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[0.99] active:scale-[0.97] border ${
                          isArrivee
                            ? "bg-green-50 border-green-100"
                            : "bg-red-50 border-red-100"
                        }`}
                      >
                        {/* Status pill */}
                        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white font-bold text-[10px] leading-tight ${
                          isArrivee ? "bg-green-500" : "bg-red-400"
                        }`}>
                          {isArrivee ? "ARR" : "DEP"}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{visit.patient_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-medium ${isArrivee ? "text-green-700" : "text-red-600"}`}>
                              {isArrivee ? "Arrivée" : "Départ"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(visit.scan_time), "HH:mm")}
                            </span>
                            {visit.duration_hours && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                {Math.floor(visit.duration_hours)}h{String(Math.round((visit.duration_hours % 1) * 60)).padStart(2, "0")}
                              </span>
                            )}
                          </div>
                        </div>
                        <FaArrowRight className={`w-3 h-3 flex-shrink-0 ${isArrivee ? "text-green-300" : "text-red-300"}`} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FaList className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-sm">Aucune visite aujourd'hui</p>
                  <button
                    onClick={() => setLocation("/employe/scan")}
                    className="mt-3 inline-flex items-center gap-2 text-sm text-site-primary font-semibold"
                  >
                    <FaQrcode className="w-4 h-4" /> Commencer à scanner
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </EmployeLayout>
  );
}
