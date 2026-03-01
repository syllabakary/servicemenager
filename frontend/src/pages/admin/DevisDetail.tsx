import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FaSpinner,
  FaEye,
  FaUser,
  FaInfoCircle,
  FaFileInvoice,
  FaArrowLeft,
  FaDollarSign,
  FaPercent,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { useParams, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import { API_URL } from "@/config/api";

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    CONTACTED: { label: "Contacté", className: "bg-blue-100 text-blue-800 border-blue-300" },
    QUOTED: { label: "Devis envoyé", className: "bg-purple-100 text-purple-800 border-purple-300" },
    ACCEPTED: { label: "Accepté", className: "bg-green-100 text-green-800 border-green-300" },
    REJECTED: { label: "Refusé", className: "bg-red-100 text-red-800 border-red-300" },
    COMPLETED: { label: "Terminé", className: "bg-gray-100 text-gray-800 border-gray-300" },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <Badge variant="outline" className={`${config.className} font-medium text-xs px-2 py-0.5`}>
      {config.label}
    </Badge>
  );
}

export default function DevisDetail() {
  const params = useParams();
  const quoteId = params.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [discountValue, setDiscountValue] = useState<string>("");
  const [showSendConfirmDialog, setShowSendConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const canDelete = storedUser.role === "ADMIN" || storedUser.role === "SUPERADMIN";

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/quote-requests/${quoteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      toast({ title: "✅ Devis supprimé", description: "Le devis a été supprimé avec succès.", variant: "default" });
      navigate("/admin/devis");
    },
    onError: () => {
      toast({ title: "❌ Erreur", description: "Impossible de supprimer ce devis.", variant: "destructive" });
    },
  });

  // Récupérer les détails du devis
  const { data: quoteRequest, isLoading } = useQuery({
    queryKey: ["quote-request", quoteId],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/quote-requests/${quoteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!quoteId,
  });

  // Initialiser la valeur de réduction
  useEffect(() => {
    if (quoteRequest?.discount_percentage) {
      setDiscountValue(quoteRequest.discount_percentage);
    }
  }, [quoteRequest]);

  // Mutation pour mettre à jour la réduction
  const updateDiscountMutation = useMutation({
    mutationFn: async (discount: string) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/quote-requests/${quoteId}/`,
        { discount_percentage: discount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-request", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
      toast({
        title: "✅ Réduction appliquée",
        description: `Réduction de ${discountValue}% appliquée avec succès`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Erreur lors de l'application de la réduction",
        variant: "destructive",
      });
    },
  });


  // Calculer le prix après réduction
  const calculateFinalPrice = () => {
    const price = quoteRequest?.calculated_price;
    const basePrice = price ? parseFloat(String(price)) : 0;
    const discount = parseFloat(discountValue || 0);
    if (discount > 0 && basePrice > 0) {
      return basePrice * (1 - discount / 100);
    }
    return basePrice;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <FaSpinner className="w-8 h-8 animate-spin text-site-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quoteRequest) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Devis non trouvé</p>
              <Link href="/admin/devis">
                <Button className="mt-4">Retour à la liste</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <Link href="/admin/devis">
            <Button variant="outline" size="sm" className="gap-2">
              <FaArrowLeft className="w-3.5 h-3.5" />
              Retour à la liste
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getStatusBadge(quoteRequest.status)}
          </div>
        </div>

        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-site-primary to-site-primary/80 text-white rounded-lg p-4 shadow-md"
        >
          <h1 className="text-2xl font-bold">Devis #{quoteRequest.id}</h1>
          <p className="text-white/90 text-sm mt-1">
            Demandé le {new Date(quoteRequest.created_at).toLocaleString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {quoteRequest.quoted_at && (
              <> • Validé le {new Date(quoteRequest.quoted_at).toLocaleString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</>
            )}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4">
            {/* Informations client */}
            <Card className="shadow-md border">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FaUser className="w-4 h-4 text-site-primary" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom complet</p>
                    <p className="text-sm text-gray-900 font-medium">{quoteRequest.client_name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                    <a
                      href={`mailto:${quoteRequest.client_email}`}
                      className="text-sm text-site-primary hover:underline font-medium"
                    >
                      {quoteRequest.client_email}
                    </a>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Téléphone</p>
                    <a
                      href={`tel:${quoteRequest.client_phone}`}
                      className="text-sm text-site-primary hover:underline font-medium"
                    >
                      {quoteRequest.client_phone}
                    </a>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date de demande</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(quoteRequest.created_at).toLocaleString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {quoteRequest.quoted_at && (
                        <div className="mt-2 text-sm text-green-700">
                          <strong>Validé le :</strong> {new Date(quoteRequest.quoted_at).toLocaleString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service et localisation */}
            <Card className="shadow-md border">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FaBriefcase className="w-4 h-4 text-site-primary" />
                  Service et localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service demandé</p>
                    <p className="text-sm text-gray-900 font-medium">{quoteRequest.service_name || "N/A"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <FaMapMarkerAlt className="w-3 h-3" />
                      Localisation
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{quoteRequest.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations supplémentaires */}
            {quoteRequest.additional_info && (
              <Card className="shadow-md border">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FaInfoCircle className="w-4 h-4 text-site-primary" />
                    Informations supplémentaires
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {Object.entries(quoteRequest.additional_info).map(([key, value]: [string, any]) => {
                      if (key === "message" && value) {
                        return (
                          <div key={key}>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Message complémentaire</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-2.5 rounded border">{value}</p>
                          </div>
                        );
                      }
                      if (Array.isArray(value) && value.length > 0) {
                        return (
                          <div key={key}>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{key}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {value.map((item: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-white text-xs py-0.5">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      if (value && typeof value === "string") {
                        return (
                          <div key={key}>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{key}</p>
                            <p className="text-sm text-gray-900 font-medium">{value}</p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Montant total */}
            <Card className="shadow-md border border-site-primary/20">
              <CardHeader className="bg-gradient-to-r from-site-primary/10 to-site-primary/5 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FaDollarSign className="w-4 h-4 text-site-primary" />
                  Montant total
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {(() => {
                    const price = quoteRequest?.calculated_price;
                    const priceValue = price ? parseFloat(String(price)) : 0;
                    
                    if (priceValue > 0) {
                      return (
                        <>
                          <div className="flex items-center justify-between pb-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prix calculé</p>
                            <p className="text-lg font-bold text-gray-900">
                              {priceValue.toFixed(2)} €
                            </p>
                          </div>
                          {parseFloat(discountValue || 0) > 0 && (
                            <>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200 pb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Réduction</p>
                                <p className="text-sm text-red-600 font-semibold">
                                  -{parseFloat(discountValue).toFixed(2)}%
                                </p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t-2 border-site-primary">
                                <p className="text-sm font-bold text-gray-900">Total après réduction</p>
                                <p className="text-xl font-bold text-site-primary">
                                  {calculateFinalPrice().toFixed(2)} €
                                </p>
                              </div>
                            </>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <div className="text-center py-3">
                          <p className="text-xs text-gray-500 mb-1">
                            Aucun prix calculé pour le moment
                          </p>
                          <p className="text-xs text-gray-400">
                            Le prix sera calculé automatiquement
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Appliquer une réduction */}
            <Card className="shadow-md border border-blue-200 bg-blue-50/30">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 py-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FaPercent className="w-4 h-4 text-blue-600" />
                  Appliquer une réduction
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2.5">
                  <div>
                    <Label htmlFor="discount" className="text-xs font-medium text-gray-600 mb-1.5 block">
                      Réduction en pourcentage (%)
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="Ex: 10"
                      className="h-9 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Entrez un pourcentage (ex: 10 pour 10%)
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (discountValue !== quoteRequest.discount_percentage) {
                        updateDiscountMutation.mutate(discountValue);
                      }
                    }}
                    disabled={updateDiscountMutation.isPending || discountValue === quoteRequest.discount_percentage}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    {updateDiscountMutation.isPending ? (
                      <>
                        <FaSpinner className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Application...
                      </>
                    ) : (
                      "Appliquer la réduction"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-md border">
              <CardHeader className="py-3">
                <CardTitle className="text-base font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  onClick={() => setShowSendConfirmDialog(true)}
                  size="sm"
                  className="w-full bg-site-primary hover:bg-site-primary/90 text-white text-sm"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <FaSpinner className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FaEnvelope className="w-3.5 h-3.5 mr-1.5" />
                      Envoyer le devis
                    </>
                  )}
                </Button>
                <a
                  href={`mailto:${quoteRequest.client_email}?subject=Devis pour ${quoteRequest.service_name}`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  <FaEnvelope className="w-3.5 h-3.5" />
                  Ouvrir email
                </a>
                <a
                  href={`tel:${quoteRequest.client_phone}`}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  <FaPhone className="w-3.5 h-3.5" />
                  Appeler
                </a>
                <Button
                  onClick={async () => {
                    const token = localStorage.getItem("access_token");
                    try {
                      const response = await axios.get(
                        `${API_URL}/quote-requests/${quoteRequest.id}/pdf/`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                          responseType: 'blob'
                        }
                      );
                      const blob = new Blob([response.data], { type: 'application/pdf' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `devis-${quoteRequest.id}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      toast({
                        title: "✅ Succès",
                        description: "PDF du devis téléchargé avec succès",
                        variant: "default",
                      });
                    } catch (error: any) {
                      toast({
                        title: "❌ Erreur",
                        description: error.response?.data?.error || "Erreur lors du téléchargement du PDF",
                        variant: "destructive",
                      });
                    }
                  }}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  <FaFileInvoice className="w-3.5 h-3.5 mr-1.5" />
                  Télécharger PDF
                </Button>
                {canDelete && (
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    <FaTrash className="w-3.5 h-3.5 mr-1.5" />
                    Supprimer le devis
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Dialog de confirmation pour l'envoi d'email */}
        <Dialog open={showSendConfirmDialog} onOpenChange={setShowSendConfirmDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaEnvelope className="w-5 h-5 text-site-primary" />
                Confirmer l'envoi du devis
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 pt-2">
                Vous êtes sur le point d'envoyer le devis par email au client.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Détails de l'envoi</p>
                    <div className="space-y-1.5 text-sm text-blue-800">
                      <p><strong>Destinataire:</strong> {quoteRequest?.client_email}</p>
                      <p><strong>Client:</strong> {quoteRequest?.client_name}</p>
                      <p><strong>Devis #:</strong> {quoteRequest?.id}</p>
                      {quoteRequest?.service && (
                        <p><strong>Service:</strong> {typeof quoteRequest.service === 'object' ? quoteRequest.service.name : quoteRequest.service}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Un email avec le devis en PDF sera envoyé à l'adresse email du client.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowSendConfirmDialog(false)}
                disabled={sendingEmail}
                className="text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  setSendingEmail(true);
                  const token = localStorage.getItem("access_token");
                  try {
                    const response = await axios.post(
                      `${API_URL}/quote-requests/${quoteRequest.id}/send_quote/`,
                      {},
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data.success) {
                      setShowSendConfirmDialog(false);
                      queryClient.invalidateQueries({ queryKey: ["quote-request", quoteId] });
                      queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] });
                      toast({
                        title: "✅ Succès",
                        description: response.data.message || "Devis envoyé par email avec succès",
                        variant: "default",
                      });
                    } else {
                      toast({
                        title: "❌ Erreur",
                        description: response.data.message || "Erreur lors de l'envoi du devis",
                        variant: "destructive",
                      });
                    }
                  } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erreur lors de l'envoi du devis";
                    toast({
                      title: "❌ Erreur",
                      description: errorMessage,
                      variant: "destructive",
                    });
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                disabled={sendingEmail}
                className="bg-site-primary hover:bg-site-primary/90 text-white text-sm"
              >
                {sendingEmail ? (
                  <>
                    <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    Confirmer et envoyer
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog suppression */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaTrash className="w-5 h-5 text-red-600" />
                Supprimer le devis
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 pt-2">
                Êtes-vous sûr de vouloir supprimer définitivement ce devis ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-sm">
                Annuler
              </Button>
              <Button
                onClick={() => { setShowDeleteDialog(false); deleteMutation.mutate(); }}
                className="bg-red-600 hover:bg-red-700 text-white text-sm"
                disabled={deleteMutation.isPending}
              >
                <FaTrash className="w-3.5 h-3.5 mr-1.5" />
                Supprimer définitivement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

