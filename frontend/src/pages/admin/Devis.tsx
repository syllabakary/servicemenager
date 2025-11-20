import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  FaTimesCircle,
  FaSpinner,
  FaEye,
  FaUser,
  FaInfoCircle,
} from "react-icons/fa";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const API_URL = "http://localhost:8000/api";

export default function AdminDevis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-quote-requests"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/quote-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/quote-requests/${id}/`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast({
        title: "✅ Succès",
        description: "Statut mis à jour avec succès",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "❌ Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    },
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

  const requests = data?.results || [];
  const pendingRequests = requests.filter((r: any) => r.status === "PENDING");
  const contactedRequests = requests.filter((r: any) => r.status === "CONTACTED");
  const quotedRequests = requests.filter((r: any) => r.status === "QUOTED");
  const otherRequests = requests.filter(
    (r: any) => !["PENDING", "CONTACTED", "QUOTED"].includes(r.status)
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: "En attente",
        className: "bg-orange-500 hover:bg-orange-600 text-white",
      },
      CONTACTED: {
        label: "Contacté",
        className: "bg-blue-500 hover:bg-blue-600 text-white",
      },
      QUOTED: {
        label: "Devis envoyé",
        className: "bg-purple-500 hover:bg-purple-600 text-white",
      },
      ACCEPTED: {
        label: "Accepté",
        className: "bg-green-500 hover:bg-green-600 text-white",
      },
      REJECTED: {
        label: "Refusé",
        className: "bg-red-500 hover:bg-red-600 text-white",
      },
      COMPLETED: {
        label: "Terminé",
        className: "bg-gray-500 hover:bg-gray-600 text-white",
      },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-400 hover:bg-gray-500 text-white",
    };

    return (
      <Badge className={`${config.className} font-semibold px-3 py-1`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#DC2626] to-[#B91C1C] bg-clip-text text-transparent">
            Gestion des Demandes de Devis
          </h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Gérez et suivez toutes les demandes de devis des clients
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase">
                Total de demandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">{requests.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">{pendingRequests.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase">
                Contactés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{contactedRequests.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase">
                Devis envoyés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{quotedRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Demandes en attente */}
        {pendingRequests.length > 0 && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Demandes en attente ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-bold text-gray-900">Client</TableHead>
                      <TableHead className="font-bold text-gray-900">Service</TableHead>
                      <TableHead className="font-bold text-gray-900">Localisation</TableHead>
                      <TableHead className="font-bold text-gray-900">Contact</TableHead>
                      <TableHead className="font-bold text-gray-900">Date</TableHead>
                      <TableHead className="font-bold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request: any) => (
                      <TableRow key={request.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold text-gray-900">
                          {request.client_name}
                        </TableCell>
                        <TableCell className="text-gray-700">{request.service_name}</TableCell>
                        <TableCell className="text-gray-700 max-w-xs truncate">
                          {request.location}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FaEnvelope className="w-3 h-3" />
                              {request.client_email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FaPhone className="w-3 h-3" />
                              {request.client_phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(request.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailDialogOpen(true);
                              }}
                              className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 whitespace-nowrap"
                              title="Voir tous les détails"
                            >
                              <FaEye className="w-3 h-3 mr-1" />
                              Voir plus
                            </Button>
                            <a
                              href={`mailto:${request.client_email}?subject=Devis pour ${request.service_name}`}
                              className="px-3 py-1.5 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm font-semibold flex items-center gap-1 whitespace-nowrap"
                            >
                              <FaEnvelope className="w-3 h-3" />
                              Email
                            </a>
                            <a
                              href={`tel:${request.client_phone}`}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold flex items-center gap-1 whitespace-nowrap"
                            >
                              <FaPhone className="w-3 h-3" />
                              Appeler
                            </a>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: request.id,
                                  status: "CONTACTED",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="text-xs whitespace-nowrap"
                            >
                              {updateStatusMutation.isPending ? (
                                <FaSpinner className="w-3 h-3 animate-spin" />
                              ) : (
                                "Marquer contacté"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toutes les demandes */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Toutes les demandes ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">ID</TableHead>
                    <TableHead className="font-bold text-gray-900">Client</TableHead>
                    <TableHead className="font-bold text-gray-900">Service</TableHead>
                    <TableHead className="font-bold text-gray-900">Localisation</TableHead>
                    <TableHead className="font-bold text-gray-900">Contact</TableHead>
                    <TableHead className="font-bold text-gray-900">Statut</TableHead>
                    <TableHead className="font-bold text-gray-900">Date</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((request: any) => (
                      <TableRow key={request.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold text-gray-900">
                          #{request.id}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {request.client_name}
                        </TableCell>
                        <TableCell className="text-gray-700">{request.service_name}</TableCell>
                        <TableCell className="text-gray-700 max-w-xs">
                          <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="w-3 h-3 text-[#DC2626]" />
                            <span className="truncate">{request.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FaEnvelope className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{request.client_email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FaPhone className="w-3 h-3" />
                              {request.client_phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(request.created_at).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailDialogOpen(true);
                              }}
                              className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 whitespace-nowrap"
                              title="Voir tous les détails"
                            >
                              <FaEye className="w-3 h-3 mr-1" />
                              Voir plus
                            </Button>
                            <a
                              href={`mailto:${request.client_email}?subject=Devis pour ${request.service_name}`}
                              className="px-3 py-1.5 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors text-sm font-semibold flex items-center gap-1 whitespace-nowrap"
                              title="Envoyer un email"
                            >
                              <FaEnvelope className="w-3 h-3" />
                            </a>
                            <a
                              href={`tel:${request.client_phone}`}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold flex items-center gap-1 whitespace-nowrap"
                              title="Appeler"
                            >
                              <FaPhone className="w-3 h-3" />
                            </a>
                            {request.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: request.id,
                                    status: "CONTACTED",
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="text-xs whitespace-nowrap"
                              >
                                Contacté
                              </Button>
                            )}
                            {request.status === "CONTACTED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: request.id,
                                    status: "QUOTED",
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="text-xs whitespace-nowrap"
                              >
                                Devis envoyé
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Aucune demande de devis pour le moment
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de détails du devis */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Détails de la demande de devis #{selectedRequest?.id}
              </DialogTitle>
              <DialogDescription>
                Informations complètes renseignées par le client
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 mt-4">
                {/* Informations client */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <FaUser className="w-5 h-5 text-[#DC2626]" />
                    Informations client
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Nom complet</p>
                      <p className="text-gray-900">{selectedRequest.client_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                      <p className="text-gray-900">{selectedRequest.client_email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Téléphone</p>
                      <p className="text-gray-900">{selectedRequest.client_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Date de demande</p>
                      <p className="text-gray-900">
                        {new Date(selectedRequest.created_at).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service et localisation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <FaBriefcase className="w-5 h-5 text-[#DC2626]" />
                    Service et localisation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Service demandé</p>
                      <p className="text-gray-900">{selectedRequest.service_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        Localisation
                      </p>
                      <p className="text-gray-900">{selectedRequest.location}</p>
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                {selectedRequest.additional_info && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <FaInfoCircle className="w-5 h-5 text-[#DC2626]" />
                      Informations supplémentaires
                    </h3>
                    <div className="space-y-4">
                      {selectedRequest.additional_info.typeAide && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Type d'aide</p>
                          <p className="text-gray-900">{selectedRequest.additional_info.typeAide}</p>
                        </div>
                      )}
                      {selectedRequest.additional_info.sousTypeAide && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Sous-type d'aide</p>
                          <p className="text-gray-900">{selectedRequest.additional_info.sousTypeAide}</p>
                        </div>
                      )}
                      {selectedRequest.additional_info.besoins && selectedRequest.additional_info.besoins.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-2">Besoins sélectionnés</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedRequest.additional_info.besoins.map((besoin: string, index: number) => (
                              <Badge key={index} variant="outline" className="bg-white">
                                {besoin}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedRequest.additional_info.destinataire && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Destinataire</p>
                          <p className="text-gray-900">
                            {selectedRequest.additional_info.destinataire === "moi"
                              ? "Pour vous"
                              : selectedRequest.additional_info.destinataire === "parent"
                              ? "Pour un parent"
                              : "Pour quelqu'un d'autre"}
                          </p>
                        </div>
                      )}
                      {selectedRequest.additional_info.message && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Message complémentaire</p>
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.additional_info.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Statut */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Statut</h3>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedRequest.status)}
                    {selectedRequest.admin_notes && (
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Notes admin</p>
                        <p className="text-gray-900">{selectedRequest.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailDialogOpen(false)}
                  >
                    Fermer
                  </Button>
                  <a
                    href={`mailto:${selectedRequest.client_email}?subject=Devis pour ${selectedRequest.service_name}`}
                    className="px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors font-semibold flex items-center gap-2"
                  >
                    <FaEnvelope className="w-4 h-4" />
                    Envoyer un email
                  </a>
                  <a
                    href={`tel:${selectedRequest.client_phone}`}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center gap-2"
                  >
                    <FaPhone className="w-4 h-4" />
                    Appeler
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

