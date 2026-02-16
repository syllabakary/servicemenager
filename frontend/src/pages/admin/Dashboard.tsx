import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FaBriefcase,
  FaBuilding,
  FaFileAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaCommentDots,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
  FaCog,
  FaQrcode,
  FaClock,
  FaUser,
} from "react-icons/fa";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation pour activer/désactiver l'affichage des avis
  const toggleShowReviewsMutation = useMutation({
    mutationFn: async ({ serviceId, show_reviews, serviceName }: { serviceId: number; show_reviews: boolean; serviceName: string }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/services/${serviceId}/`,
        { show_reviews },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { show_reviews, serviceName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({
        title: "Succès",
        description: `Affichage des avis ${data.show_reviews ? "activé" : "désactivé"} pour le service "${data.serviceName}"`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  // Mutation pour activer/désactiver l'affichage des FAQ
  const toggleShowFaqMutation = useMutation({
    mutationFn: async ({ serviceId, show_faq, serviceName }: { serviceId: number; show_faq: boolean; serviceName: string }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/services/${serviceId}/`,
        { show_faq },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { show_faq, serviceName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({
        title: "Succès",
        description: `Affichage des FAQ ${data.show_faq ? "activé" : "désactivé"} pour le service "${data.serviceName}"`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: agencies } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/agencies/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: pages } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/pages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/service-reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: faqs } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/service-faqs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: quoteRequests } = useQuery({
    queryKey: ["admin-quote-requests"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/quote-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Présences en temps réel
  const { data: presencesRealtime } = useQuery({
    queryKey: ["admin-presences-realtime"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/presences/realtime/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const stats = [
    {
      title: "Services",
      value: services?.count || 0,
      active: services?.results?.filter((s: any) => s.active).length || 0,
      icon: FaBriefcase,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Agences",
      value: agencies?.count || 0,
      active: agencies?.results?.filter((a: any) => a.active).length || 0,
      icon: FaBuilding,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Bannières",
      value: pages?.count || 0,
      active: pages?.results?.filter((p: any) => p.is_active).length || 0,
      icon: FaFileAlt,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Avis clients",
      value: reviews?.count || 0,
      active: reviews?.results?.filter((r: any) => r.approved).length || 0,
      icon: FaStar,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      title: "Demandes de devis",
      value: quoteRequests?.count || 0,
      active: quoteRequests?.results?.filter((r: any) => r.status === "PENDING").length || 0,
      icon: FaCalendar,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#DC2626] to-[#B91C1C] bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Vue d'ensemble de votre administration</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.slice(0, 4).map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-bl-full opacity-50"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <FaCheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-gray-700 font-medium">{stat.active} actif(s)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaTimesCircle className="w-3 h-3 text-red-500" />
                      <span className="text-gray-700 font-medium">
                        {stat.value - stat.active} inactif(s)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Présences en temps réel */}
        {presencesRealtime && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaQrcode className="w-6 h-6 text-[#DC2626]" />
                Présences en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total scans</p>
                      <p className="text-2xl font-bold text-blue-900">{presencesRealtime.total_scans || 0}</p>
                    </div>
                    <FaQrcode className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Arrivées</p>
                      <p className="text-2xl font-bold text-green-900">{presencesRealtime.arrivals || 0}</p>
                    </div>
                    <FaCheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Départs</p>
                      <p className="text-2xl font-bold text-red-900">{presencesRealtime.departures || 0}</p>
                    </div>
                    <FaTimesCircle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>
              
              {presencesRealtime.active_employees && presencesRealtime.active_employees.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Employés actuellement en mission</h3>
                  {presencesRealtime.active_employees.map((active: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#DC2626] transition-colors bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FaUser className="w-5 h-5 text-[#DC2626]" />
                            <h4 className="font-semibold text-gray-900">{active.employe}</h4>
                            <Badge variant="outline" className="font-mono text-xs">
                              {active.employe_matricule}
                            </Badge>
                          </div>
                          <p className="text-gray-700 text-sm mb-1">
                            <strong>Patient:</strong> {active.patient}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <FaClock className="w-3 h-3" />
                              Arrivée: {new Date(active.arrival_time).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaClock className="w-3 h-3" />
                              Durée: {active.duration_hours?.toFixed(2) || 0}h
                            </span>
                          </div>
                          <div className="mt-2 space-y-2">
                            <h5 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                              <FaMapMarkerAlt className="w-3 h-3 text-gray-600" />
                              Localisation GPS
                            </h5>
                            {(active?.arrival_latitude && active?.arrival_longitude) ? (
                              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <FaMapMarkerAlt className="w-3 h-3 text-blue-600" />
                                  <strong className="text-blue-800">Arrivée</strong>
                                </div>
                                <p className="text-blue-700 font-mono mb-1 break-all">
                                  {active.arrival_latitude.toFixed(6)}, {active.arrival_longitude.toFixed(6)}
                                </p>
                                <a
                                  href={`https://www.google.com/maps?q=${active.arrival_latitude},${active.arrival_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                                >
                                  Voir sur Google Maps
                                </a>
                              </div>
                            ) : (
                              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                                  <strong className="text-gray-500">Arrivée</strong>
                                </div>
                                <p className="text-gray-400 italic">Localisation non disponible</p>
                              </div>
                            )}
                          </div>
                          {active?.arrival_notes && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <strong className="text-yellow-800">Commentaire arrivée:</strong>
                              <p className="text-yellow-700 mt-1">{active.arrival_notes}</p>
                            </div>
                          )}
                        </div>
                        <Badge className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1">
                          En cours
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {(!presencesRealtime.active_employees || presencesRealtime.active_employees.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FaQrcode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun employé en mission actuellement</p>
                </div>
              )}

              {/* Missions terminées */}
              {presencesRealtime.completed_missions && presencesRealtime.completed_missions.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Missions terminées aujourd'hui</h3>
                  {presencesRealtime.completed_missions.map((mission: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 sm:p-5 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Colonne gauche - Informations principales */}
                        <div className="flex-1 space-y-3">
                          {/* En-tête employé et patient */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{mission.employe}</h4>
                              <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                                {mission.employe_matricule}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="font-medium">Patient:</span>
                              <span className="font-semibold">{mission.patient}</span>
                            </div>
                          </div>

                          {/* Horaires et durée */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                              <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <div>
                                <span className="text-gray-500">Arrivée:</span>
                                <span className="font-semibold text-gray-900 ml-1">
                                  {new Date(mission.arrival_time).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                            {mission.departure_time && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                                <div>
                                  <span className="text-gray-500">Départ:</span>
                                  <span className="font-semibold text-gray-900 ml-1">
                                    {new Date(mission.departure_time).toLocaleTimeString("fr-FR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}
                            {mission.duration_hours && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                <FaClock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                                <div>
                                  <span className="text-blue-700">Durée:</span>
                                  <span className="font-semibold text-blue-900 ml-1">
                                    {mission.duration_hours?.toFixed(2) || 0}h
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Localisations GPS */}
                          <div className="space-y-2">
                            <h5 className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                              Localisations GPS
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                              {(mission?.arrival_latitude && mission?.arrival_longitude) ? (
                                <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                                    <strong className="text-blue-800 text-xs sm:text-sm">Arrivée</strong>
                                  </div>
                                  <p className="text-blue-700 text-xs font-mono mb-1.5 break-all">
                                    {mission.arrival_latitude.toFixed(6)}, {mission.arrival_longitude.toFixed(6)}
                                  </p>
                                  <a
                                    href={`https://www.google.com/maps?q=${mission.arrival_latitude},${mission.arrival_longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline text-xs inline-flex items-center gap-1"
                                  >
                                    Voir sur Google Maps
                                  </a>
                                </div>
                              ) : (
                                <div className="p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                    <strong className="text-gray-500 text-xs sm:text-sm">Arrivée</strong>
                                  </div>
                                  <p className="text-gray-400 text-xs italic">Localisation non disponible</p>
                                </div>
                              )}
                              {(mission?.departure_latitude && mission?.departure_longitude) ? (
                                <div className="p-2.5 sm:p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                                    <strong className="text-purple-800 text-xs sm:text-sm">Départ</strong>
                                  </div>
                                  <p className="text-purple-700 text-xs font-mono mb-1.5 break-all">
                                    {mission.departure_latitude.toFixed(6)}, {mission.departure_longitude.toFixed(6)}
                                  </p>
                                  <a
                                    href={`https://www.google.com/maps?q=${mission.departure_latitude},${mission.departure_longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 underline text-xs inline-flex items-center gap-1"
                                  >
                                    Voir sur Google Maps
                                  </a>
                                </div>
                              ) : (
                                <div className="p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                    <strong className="text-gray-500 text-xs sm:text-sm">Départ</strong>
                                  </div>
                                  <p className="text-gray-400 text-xs italic">Localisation non disponible</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Commentaires */}
                          {(mission?.arrival_notes || mission?.departure_notes) && (
                            <div className="space-y-2">
                              {mission?.arrival_notes && (
                                <div className="p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <strong className="text-yellow-800 text-xs sm:text-sm block mb-1">Commentaire arrivée:</strong>
                                  <p className="text-yellow-700 text-xs sm:text-sm">{mission.arrival_notes}</p>
                                </div>
                              )}
                              {mission?.departure_notes && (
                                <div className="p-2.5 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <strong className="text-orange-800 text-xs sm:text-sm block mb-1">Commentaire départ:</strong>
                                  <p className="text-orange-700 text-xs sm:text-sm">{mission.departure_notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Colonne droite - Badge statut */}
                        <div className="flex lg:flex-col items-center lg:items-end gap-2 lg:gap-0">
                          <Badge className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-3 py-1.5 text-xs sm:text-sm shrink-0">
                            Terminée
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-900">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/services"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaBriefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les services</h3>
                <p className="text-sm text-gray-600">Ajouter, modifier, activer</p>
              </Link>
              <Link
                href="/admin/agences"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaBuilding className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les agences</h3>
                <p className="text-sm text-gray-600">Ajouter, modifier, activer</p>
              </Link>
              <Link
                href="/admin/bannieres"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaFileAlt className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les bannières</h3>
                <p className="text-sm text-gray-600">Modifier le contenu</p>
              </Link>
              <Link
                href="/admin/utilisateurs"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaUsers className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les utilisateurs</h3>
                <p className="text-sm text-gray-600">Créer des admins</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Avis en attente de modération */}
        {reviews && reviews.results && reviews.results.filter((r: any) => !r.approved).length > 0 && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaCommentDots className="w-6 h-6 text-[#DC2626]" />
                Avis en attente de modération
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {reviews.results
                  .filter((r: any) => !r.approved)
                  .slice(0, 5)
                  .map((review: any) => (
                    <div
                      key={review.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#DC2626] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{review.client_name}</h4>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {review.service_name}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2 line-clamp-2">{review.comment}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <Link
                          href="/admin/avis"
                          className="ml-4 px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm font-semibold whitespace-nowrap"
                        >
                          Modérer
                        </Link>
                      </div>
                    </div>
                  ))}
                {reviews.results.filter((r: any) => !r.approved).length > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/admin/avis"
                      className="text-[#DC2626] hover:text-[#B91C1C] font-semibold text-sm"
                    >
                      Voir tous les avis en attente ({reviews.results.filter((r: any) => !r.approved).length})
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services avec contrôle d'affichage avis/FAQ */}
        {services && services.results && services.results.length > 0 && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaCog className="w-6 h-6 text-[#DC2626]" />
                Contrôle d'affichage des avis et FAQ par service
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {services.results.slice(0, 10).map((service: any) => (
                  <div
                    key={service.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#DC2626] transition-all duration-200 bg-white"
                  >
                    <h4 className="font-bold text-lg text-gray-900 mb-4">{service.name}</h4>
                    <div className="flex items-center gap-4">
                      {/* Contrôle affichage avis */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-1">
                        <div className="flex items-center gap-2 flex-1">
                          <FaStar className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-700">Afficher les avis</span>
                        </div>
                        <Button
                          variant={service.show_reviews !== false ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            toggleShowReviewsMutation.mutate({
                              serviceId: service.id,
                              show_reviews: service.show_reviews === false,
                              serviceName: service.name,
                            })
                          }
                          disabled={toggleShowReviewsMutation.isPending}
                          className={`whitespace-nowrap ${
                            service.show_reviews !== false
                              ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300"
                          }`}
                        >
                          {service.show_reviews !== false ? (
                            <>
                              <FaCheckCircle className="w-4 h-4 mr-1" />
                              Activé
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="w-4 h-4 mr-1" />
                              Désactivé
                            </>
                          )}
                        </Button>
                      </div>
                      {/* Contrôle affichage FAQ */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-1">
                        <div className="flex items-center gap-2 flex-1">
                          <FaFileAlt className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-700">Afficher les FAQ</span>
                        </div>
                        <Button
                          variant={service.show_faq !== false ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            toggleShowFaqMutation.mutate({
                              serviceId: service.id,
                              show_faq: service.show_faq === false,
                              serviceName: service.name,
                            })
                          }
                          disabled={toggleShowFaqMutation.isPending}
                          className={`whitespace-nowrap ${
                            service.show_faq !== false
                              ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300"
                          }`}
                        >
                          {service.show_faq !== false ? (
                            <>
                              <FaCheckCircle className="w-4 h-4 mr-1" />
                              Activé
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="w-4 h-4 mr-1" />
                              Désactivé
                            </>
                          )}
                        </Button>
                      </div>
                      {/* Bouton Modifier */}
                      <Link
                        href="/admin/services"
                        className="px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm font-semibold whitespace-nowrap h-fit"
                      >
                        Modifier
                      </Link>
                    </div>
                  </div>
                ))}
                {services.results.length > 10 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/admin/services"
                      className="text-[#DC2626] hover:text-[#B91C1C] font-semibold text-sm"
                    >
                      Voir tous les services ({services.results.length})
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demandes de devis récentes */}
        {quoteRequests && quoteRequests.results && quoteRequests.results.length > 0 && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaCalendar className="w-6 h-6 text-[#DC2626]" />
                Demandes de devis récentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {quoteRequests.results
                  .slice(0, 5)
                  .map((request: any) => (
                    <div
                      key={request.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#DC2626] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{request.client_name}</h4>
                            <Badge
                              variant={
                                request.status === "PENDING"
                                  ? "default"
                                  : request.status === "CONTACTED"
                                  ? "default"
                                  : "secondary"
                              }
                              className={`${
                                request.status === "PENDING"
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : request.status === "CONTACTED"
                                  ? "bg-blue-500 hover:bg-blue-600"
                                  : request.status === "QUOTED"
                                  ? "bg-purple-500 hover:bg-purple-600"
                                  : request.status === "ACCEPTED"
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-gray-400 hover:bg-gray-500"
                              } text-white font-semibold px-2 py-0.5 text-xs`}
                            >
                              {request.status_display}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <FaBriefcase className="w-4 h-4 text-[#DC2626]" />
                              <span>{request.service_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="w-4 h-4 text-[#DC2626]" />
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaEnvelope className="w-4 h-4 text-[#DC2626]" />
                              <span>{request.client_email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaPhone className="w-4 h-4 text-[#DC2626]" />
                              <span>{request.client_phone}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 mt-2 block">
                            {new Date(request.created_at).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <a
                            href={`mailto:${request.client_email}?subject=Devis pour ${request.service_name}`}
                            className="px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm font-semibold whitespace-nowrap flex items-center gap-2"
                          >
                            <FaEnvelope className="w-4 h-4" />
                            Email
                          </a>
                          <a
                            href={`tel:${request.client_phone}`}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold whitespace-nowrap flex items-center gap-2"
                          >
                            <FaPhone className="w-4 h-4" />
                            Appeler
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                {quoteRequests.results.length > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/admin/quote-requests"
                      className="text-[#DC2626] hover:text-[#B91C1C] font-semibold text-sm"
                    >
                      Voir toutes les demandes ({quoteRequests.results.length})
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ récentes */}
        {faqs && faqs.results && faqs.results.length > 0 && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaFileAlt className="w-6 h-6 text-[#DC2626]" />
                Questions fréquentes récentes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {faqs.results
                  .slice(0, 5)
                  .map((faq: any) => (
                    <div
                      key={faq.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#DC2626] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{faq.service_name}</h4>
                            <Badge
                              variant={faq.active ? "default" : "secondary"}
                              className={`${faq.active ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"} text-white font-semibold px-2 py-0.5 text-xs`}
                            >
                              {faq.active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <p className="text-gray-700 text-sm font-medium mb-1">{faq.question}</p>
                          <p className="text-gray-600 text-sm line-clamp-2">{faq.answer}</p>
                        </div>
                        <Link
                          href="/admin/services"
                          className="ml-4 px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm font-semibold whitespace-nowrap"
                        >
                          Gérer
                        </Link>
                      </div>
                    </div>
                  ))}
                {faqs.results.length > 5 && (
                  <div className="text-center pt-2">
                    <Link
                      href="/admin/services"
                      className="text-[#DC2626] hover:text-[#B91C1C] font-semibold text-sm"
                    >
                      Voir toutes les FAQ ({faqs.results.length})
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

