import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  FaUser, FaPhone, FaMapMarkerAlt, FaClock, FaArrowLeft, FaCalendarAlt,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaComment, FaEdit, FaSave, FaTimes
} from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { API_URL } from "@/config/api";

export default function PatientDetail() {
  const params = useParams();
  const patientId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<any>(null);
  const [editingPresenceId, setEditingPresenceId] = useState<number | null>(null);
  const [editedNotes, setEditedNotes] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token || storedUser.role !== "EMPLOYE") {
      setLocation("/employe/login");
      return;
    }
    
    setUser(storedUser);
  }, [setLocation]);

  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["patient-detail", patientId],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      // Utiliser l'endpoint spécifique pour les employés
      const response = await axios.get(`${API_URL}/patients/${patientId}/my_patient_detail/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!patientId && !!user,
  });

  const { data: presences, isLoading: isLoadingPresences } = useQuery({
    queryKey: ["patient-presences", patientId],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      // Récupérer toutes les présences de cet employé pour ce patient
      const response = await axios.get(`${API_URL}/presences/?patient=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filtrer pour ne garder que les présences de l'employé connecté
      const allPresences = response.data.results || [];
      const userPresences = allPresences.filter((p: any) => p.employe === user?.id);
      return userPresences;
    },
    enabled: !!patientId && !!user,
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ presenceId, notes }: { presenceId: number; notes: string }) => {
      const token = localStorage.getItem("access_token");
      const response = await axios.patch(
        `${API_URL}/presences/${presenceId}/update_notes/`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-presences", patientId] });
      toast({
        title: "Succès",
        description: "Commentaire modifié avec succès",
        variant: "default",
      });
      setEditingPresenceId(null);
      setEditedNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Impossible de modifier le commentaire",
        variant: "destructive",
      });
    },
  });

  const handleEditNotes = (presence: any) => {
    setEditingPresenceId(presence.id);
    setEditedNotes(presence.notes || "");
  };

  const handleSaveNotes = (presenceId: number) => {
    updateNotesMutation.mutate({ presenceId, notes: editedNotes });
  };

  const handleCancelEdit = () => {
    setEditingPresenceId(null);
    setEditedNotes("");
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

  if (isLoadingPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des détails du patient...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600 mb-4">Patient non trouvé</p>
            <Button
              onClick={() => setLocation("/employe/dashboard")}
              className="w-full"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-4 sm:pt-8 pb-4 sm:pb-8 px-3 sm:px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-3 sm:p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Détails du patient</p>
            </div>
            <Button
              onClick={() => setLocation("/employe/dashboard")}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-10"
            >
              <FaArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </div>
        </div>

        {/* Informations du patient */}
        <Card className="shadow-lg sm:shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-site-primary to-site-secondary text-white rounded-t-lg p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              Informations du patient
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Colonne gauche - Informations personnelles */}
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Prénom</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{patient.first_name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Nom</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{patient.last_name}</p>
                    </div>
                  </div>
                  {patient.phone && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1 flex items-center gap-1.5 sm:gap-2">
                        <FaPhone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        Téléphone
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">{patient.phone}</p>
                    </div>
                  )}
                  {patient.address && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1 flex items-center gap-1.5 sm:gap-2">
                        <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        Adresse
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{patient.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite - Informations techniques */}
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200 pb-1">
                    Informations techniques
                  </h3>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">QR Code</p>
                    <Badge variant="outline" className="font-mono text-xs sm:text-sm px-2 py-0.5 sm:px-2.5 sm:py-1 break-all w-full justify-start">
                      {patient.qr_code || "Non généré"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Statut</p>
                    <Badge
                      variant={patient.is_active ? "default" : "secondary"}
                      className={`text-xs sm:text-sm px-2 py-0.5 sm:px-2.5 sm:py-1 ${patient.is_active ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                    >
                      {patient.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historique des visites */}
        <Card className="shadow-lg sm:shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-site-primary" />
              Historique des visites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {isLoadingPresences ? (
              <div className="text-center py-8 sm:py-12">
                <FaSpinner className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-gray-600">Chargement des visites...</p>
              </div>
            ) : presences && presences.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {presences.map((presence: any) => (
                  <div
                    key={presence.id}
                    className={`p-2.5 sm:p-3 md:p-4 rounded-lg border-2 hover:shadow-md transition-shadow ${
                      presence.status === "ARRIVEE"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge
                            variant={presence.status === "ARRIVEE" ? "default" : "secondary"}
                            className={`text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 ${
                              presence.status === "ARRIVEE"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {presence.status === "ARRIVEE" ? (
                              <>
                                <FaCheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                Arrivée
                              </>
                            ) : (
                              <>
                                <FaTimesCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                Départ
                              </>
                            )}
                          </Badge>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1.5 sm:gap-2">
                            <FaClock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="break-words">
                              {format(new Date(presence.scan_time), "dd MMM yyyy à HH:mm", {
                                locale: fr,
                              })}
                            </span>
                          </p>
                        </div>
                        {presence.duration_hours && (
                          <Badge variant="outline" className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 border-blue-300 shrink-0">
                            {Math.floor(presence.duration_hours)}h{" "}
                            {Math.round((presence.duration_hours % 1) * 60)}min
                          </Badge>
                        )}
                      </div>
                      <div
                        className={`mt-1 sm:mt-2 p-2 sm:p-3 rounded-lg border ${
                          presence.status === "ARRIVEE"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-orange-50 border-orange-200"
                        }`}
                      >
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <FaComment
                            className={`w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 ${
                              presence.status === "ARRIVEE"
                                ? "text-yellow-700"
                                : "text-orange-700"
                            }`}
                          />
                            <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                              <p
                                className={`text-xs font-semibold ${
                                  presence.status === "ARRIVEE"
                                    ? "text-yellow-800"
                                    : "text-orange-800"
                                }`}
                              >
                                {presence.status === "ARRIVEE"
                                  ? "Commentaire d'arrivée:"
                                  : "Commentaire de départ:"}
                              </p>
                              {editingPresenceId !== presence.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditNotes(presence)}
                                  className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs shrink-0"
                                >
                                  <FaEdit className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1" />
                                  <span className="hidden sm:inline">{presence.notes ? "Modifier" : "Ajouter"}</span>
                                  <span className="sm:hidden">{presence.notes ? "Mod." : "Aj."}</span>
                                </Button>
                              )}
                            </div>
                            {editingPresenceId === presence.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editedNotes}
                                  onChange={(e) => setEditedNotes(e.target.value)}
                                  placeholder="Ajouter un commentaire..."
                                  className={`min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm ${
                                    presence.status === "ARRIVEE"
                                      ? "bg-white border-yellow-300"
                                      : "bg-white border-orange-300"
                                  }`}
                                />
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveNotes(presence.id)}
                                    disabled={updateNotesMutation.isPending}
                                    className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text text-white text-xs h-7 sm:h-8 px-2 sm:px-3"
                                  >
                                    {updateNotesMutation.isPending ? (
                                      <>
                                        <FaSpinner className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1 animate-spin" />
                                        <span className="hidden sm:inline">Enregistrement...</span>
                                        <span className="sm:hidden">Enreg...</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaSave className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Enregistrer</span>
                                        <span className="sm:hidden">OK</span>
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={updateNotesMutation.isPending}
                                    className="text-xs h-7 sm:h-8 px-2 sm:px-3"
                                  >
                                    <FaTimes className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Annuler</span>
                                    <span className="sm:hidden">Ann.</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p
                                className={`text-xs sm:text-sm break-words ${
                                  presence.status === "ARRIVEE"
                                    ? "text-yellow-900"
                                    : "text-orange-900"
                                }`}
                              >
                                {presence.notes || (
                                  <span className="italic text-gray-500">
                                    Aucun commentaire
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <FaCalendarAlt className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base md:text-lg">Aucune visite enregistrée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

