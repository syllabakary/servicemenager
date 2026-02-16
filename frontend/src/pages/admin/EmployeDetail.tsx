import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaBriefcase, FaIdCard, FaCalendar, FaFileAlt, FaStar, FaCog,
  FaBuilding, FaMoneyBillWave, FaCreditCard, FaShieldAlt
} from "react-icons/fa";

const API_URL = "http://localhost:8000/api";

export default function EmployeDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const employeId = params.get("id");

  const { data: employe, isLoading, error } = useQuery({
    queryKey: ["employe-detail", employeId],
    queryFn: async () => {
      if (!employeId) throw new Error("ID employé manquant");
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/users/${employeId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Récupérer le profil employé
      try {
        const profileRes = await axios.get(`${API_URL}/employee-profiles/?user=${employeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = profileRes.data.results?.[0];
        return { ...res.data, employee_profile: profile };
      } catch {
        return { ...res.data, employee_profile: null };
      }
    },
    enabled: !!employeId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employe) {
    return (
      <DashboardLayout>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Erreur lors du chargement de l'employé
            </p>
            <div className="text-center mt-4">
              <Button onClick={() => setLocation("/admin/employes")} variant="outline">
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const profile = employe.employee_profile;
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const getSexeLabel = (sexe: string | null) => {
    if (!sexe) return "-";
    const labels: { [key: string]: string } = {
      M: "Masculin",
      F: "Féminin",
      A: "Autre",
    };
    return labels[sexe] || sexe;
  };

  const getStatutLabel = (statut: string | null) => {
    if (!statut) return "-";
    const labels: { [key: string]: string } = {
      ACTIF: "Actif",
      SUSPENDU: "Suspendu",
      SUPPRIME: "Supprimé",
    };
    return labels[statut] || statut;
  };

  const getTypeContratLabel = (type: string | null) => {
    if (!type) return "-";
    const labels: { [key: string]: string } = {
      CDI: "CDI",
      CDD: "CDD",
      STAGE: "Stage",
      INTERIM: "Intérim",
      PRESTATION: "Contrat de Prestation",
    };
    return labels[type] || type;
  };

  const getTempsTravailLabel = (temps: string | null) => {
    if (!temps) return "-";
    const labels: { [key: string]: string } = {
      PLEIN: "Temps plein",
      PARTIEL: "Temps partiel",
    };
    return labels[temps] || temps;
  };

  const getModePaiementLabel = (mode: string | null) => {
    if (!mode) return "-";
    const labels: { [key: string]: string } = {
      VIREMENT: "Virement bancaire",
      CHEQUE: "Chèque",
      ESPECES: "Espèces",
      AUTRE: "Autre",
    };
    return labels[mode] || mode;
  };

  const getStatutDocumentsLabel = (statut: string | null) => {
    if (!statut) return "-";
    const labels: { [key: string]: string } = {
      SIGNE: "Signé",
      EN_ATTENTE: "En attente",
      REJETE: "Rejeté",
    };
    return labels[statut] || statut;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setLocation("/admin/employes")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#DC2626] to-[#B91C1C] bg-clip-text text-transparent">
                  Fiche Employé
                </h1>
                <p className="text-gray-600 mt-1">
                  {employe.first_name} {employe.last_name}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setLocation(`/admin/employes?edit=${employe.id}`);
              }}
              className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white"
            >
              <FaUser className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations de base */}
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaUser className="w-5 h-5 text-[#DC2626]" />
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <FaIdCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nom d'utilisateur</p>
                  <p className="font-semibold text-gray-900">{employe.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaUser className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-semibold text-gray-900">
                    {employe.first_name} {employe.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaIdCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Matricule</p>
                  <Badge variant="outline" className="font-mono">
                    {employe.matricule || "Non généré"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{employe.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaPhone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-semibold text-gray-900">{employe.phone || "-"}</p>
                </div>
              </div>
              {profile && (
                <>
                  <div className="flex items-center gap-3">
                    <FaUser className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Sexe</p>
                      <p className="font-semibold text-gray-900">{getSexeLabel(profile.sexe)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date de naissance</p>
                      <p className="font-semibold text-gray-900">{formatDate(profile.date_naissance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nationalité</p>
                      <p className="font-semibold text-gray-900">{profile.nationalite || "-"}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Coordonnées */}
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaEnvelope className="w-5 h-5 text-[#DC2626]" />
                Coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {profile ? (
                <>
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email professionnel</p>
                      <p className="font-semibold text-gray-900">{profile.email_professionnel || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email personnel</p>
                      <p className="font-semibold text-gray-900">{profile.email_personnel || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaPhone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone principal</p>
                      <p className="font-semibold text-gray-900">{profile.telephone_principal || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaPhone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone secondaire</p>
                      <p className="font-semibold text-gray-900">{profile.telephone_secondaire || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="font-semibold text-gray-900">
                        {profile.adresse_numero_rue || ""} {profile.adresse_ville || ""}
                        {profile.adresse_code_postal ? ` ${profile.adresse_code_postal}` : ""}
                        {profile.adresse_pays ? `, ${profile.adresse_pays}` : ""}
                      </p>
                      {!profile.adresse_numero_rue && !profile.adresse_ville && (
                        <p className="text-gray-500">-</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune information de contact disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Informations professionnelles */}
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaBriefcase className="w-5 h-5 text-[#DC2626]" />
                Informations professionnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {profile ? (
                <>
                  <div className="flex items-center gap-3">
                    <FaBriefcase className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Poste / Fonction</p>
                      <p className="font-semibold text-gray-900">{profile.poste_fonction || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaBuilding className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Service / Département</p>
                      <p className="font-semibold text-gray-900">{profile.service_departement || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Type de contrat</p>
                      <p className="font-semibold text-gray-900">{getTypeContratLabel(profile.type_contrat)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Temps de travail</p>
                      <p className="font-semibold text-gray-900">{getTempsTravailLabel(profile.temps_travail)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date de début</p>
                      <p className="font-semibold text-gray-900">{formatDate(profile.date_debut_contrat)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCalendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date de fin</p>
                      <p className="font-semibold text-gray-900">{formatDate(profile.date_fin_contrat)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune information professionnelle disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Rémunération et statut */}
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaMoneyBillWave className="w-5 h-5 text-[#DC2626]" />
                Rémunération & Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {profile ? (
                <>
                  <div className="flex items-center gap-3">
                    <FaMoneyBillWave className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Taux horaire</p>
                      <p className="font-semibold text-gray-900">
                        {profile.taux_horaire ? `${profile.taux_horaire} €/h` : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaMoneyBillWave className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Salaire mensuel</p>
                      <p className="font-semibold text-gray-900">
                        {profile.salaire ? `${profile.salaire} €` : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Mode de paiement</p>
                      <p className="font-semibold text-gray-900">{getModePaiementLabel(profile.mode_paiement)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Statut du compte</p>
                      <Badge
                        variant={profile.statut_compte === "ACTIF" ? "default" : "destructive"}
                        className="mt-1"
                      >
                        {getStatutLabel(profile.statut_compte)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Statut des documents</p>
                      <Badge variant="outline" className="mt-1">
                        {getStatutDocumentsLabel(profile.statut_documents)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaIdCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Numéro d'employé interne</p>
                      <p className="font-semibold text-gray-900">{profile.numero_employe_interne || "-"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune information de rémunération disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

