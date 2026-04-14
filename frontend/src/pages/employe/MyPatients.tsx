import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  FaUser, FaArrowLeft, FaPhone, FaMapMarkerAlt, FaQrcode,
  FaSpinner, FaSignOutAlt, FaEye
} from "react-icons/fa";
import { API_URL } from "@/config/api";

export default function MyPatients() {
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

  const { data: patients, isLoading, error: patientsError } = useQuery({
    queryKey: ["my-assigned-patients"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Token manquant");
      }
      const response = await axios.get(`${API_URL}/patients/my_assigned_patients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!user,
    retry: false,
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
              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={() => setLocation("/employe/dashboard")}
                  variant="outline"
                  size="sm"
                  className="mb-2"
                >
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-site-section-employe-text">
                Mes Patients Assignés
              </h1>
              <p className="text-gray-600 mt-2">
                Liste des patients qui vous ont été assignés par l'administrateur
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <FaSignOutAlt className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Liste des patients */}
        {isLoading ? (
          <div className="text-center py-12">
            <FaSpinner className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des patients...</p>
          </div>
        ) : patients && patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient: any) => (
              <Card
                key={patient.id}
                className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-site-section-employe-button flex items-center justify-center text-site-button-text font-bold text-lg">
                        {patient.first_name?.[0]}{patient.last_name?.[0]}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Client: {patient.client_username || "N/A"}
                        </p>
                      </div>
                    </div>
                    {patient.is_active ? (
                      <Badge className="bg-green-500 text-white">Actif</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">Inactif</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaPhone className="w-4 h-4 text-gray-400" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="line-clamp-2">{patient.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaQrcode className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-xs">{patient.qr_code?.substring(0, 20)}...</span>
                  </div>
                  <Button
                    onClick={() => setLocation(`/employe/patient/${patient.id}`)}
                    className="w-full bg-site-section-employe-button hover:opacity-90 text-site-button-text border-2 border-site-section-employe-button-border mt-4"
                  >
                    <FaEye className="w-4 h-4 mr-2" />
                    Voir les détails
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <FaUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">
                Aucun patient assigné
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Contactez l'administrateur pour vous assigner des patients
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

