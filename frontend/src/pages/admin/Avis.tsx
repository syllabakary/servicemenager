import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fmtDate } from "@/lib/utils";
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
import { FaCheckCircle, FaTimesCircle, FaStar, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Supprimer l'avis ?</h3>
            <p className="text-gray-500 mt-1 text-sm">Cette action est irréversible. L'avis sera définitivement supprimé.</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={onConfirm}
            >
              <FaTrash className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAvis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/service-reviews/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/service-reviews/${id}/`,
        { approved: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["service-reviews"] });
      toast({
        title: "✅ Succès",
        description: "Avis approuvé avec succès",
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

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/service-reviews/${id}/`,
        { approved: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["service-reviews"] });
      toast({
        title: "✅ Succès",
        description: "Avis rejeté",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/service-reviews/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["service-reviews"] });
      toast({ title: "✅ Avis supprimé", variant: "default" });
    },
    onError: () => {
      toast({ title: "❌ Erreur", description: "Impossible de supprimer l'avis", variant: "destructive" });
    },
  });

  const toggleDisplayMutation = useMutation({
    mutationFn: async ({ id, display_on_page }: { id: number; display_on_page: boolean }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/service-reviews/${id}/`,
        { display_on_page },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["service-reviews"] });
      toast({
        title: "✅ Succès",
        description: "Affichage de l'avis mis à jour",
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
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  const reviews = data?.results || [];
  const pendingReviews = reviews.filter((r: any) => !r.approved);
  const approvedReviews = reviews.filter((r: any) => r.approved);

  return (
    <DashboardLayout>
      {deleteTargetId !== null && (
        <DeleteConfirmModal
          onConfirm={() => {
            deleteMutation.mutate(deleteTargetId);
            setDeleteTargetId(null);
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
            Gestion des Avis Clients
          </h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Modérez et gérez les avis clients sur vos services
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase">
                Total d'avis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">{reviews.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">{pendingReviews.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase">
                Approuvés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{approvedReviews.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Avis en attente */}
        {pendingReviews.length > 0 && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Avis en attente de modération ({pendingReviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-bold text-gray-900">Client</TableHead>
                      <TableHead className="font-bold text-gray-900">Service</TableHead>
                      <TableHead className="font-bold text-gray-900">Note</TableHead>
                      <TableHead className="font-bold text-gray-900">Commentaire</TableHead>
                      <TableHead className="font-bold text-gray-900">Date</TableHead>
                      <TableHead className="font-bold text-gray-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReviews.map((review: any) => (
                      <TableRow key={review.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold text-gray-900">
                          {review.client_name}
                        </TableCell>
                        <TableCell className="text-gray-700">{review.service_name}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-gray-700 max-w-md truncate">
                          {review.comment}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {fmtDate(review.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveMutation.mutate(review.id)}
                              className="hover:bg-green-50 hover:text-green-600"
                              disabled={approveMutation.isPending}
                              title="Approuver"
                            >
                              <FaCheckCircle className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectMutation.mutate(review.id)}
                              className="hover:bg-orange-50 hover:text-orange-600"
                              disabled={rejectMutation.isPending}
                              title="Rejeter"
                            >
                              <FaTimesCircle className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTargetId(review.id)}
                              className="hover:bg-red-50 hover:text-red-600"
                              disabled={deleteMutation.isPending}
                              title="Supprimer"
                            >
                              <FaTrash className="w-4 h-4" />
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

        {/* Avis approuvés */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Avis approuvés ({approvedReviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">Client</TableHead>
                    <TableHead className="font-bold text-gray-900">Service</TableHead>
                    <TableHead className="font-bold text-gray-900">Note</TableHead>
                    <TableHead className="font-bold text-gray-900">Commentaire</TableHead>
                    <TableHead className="font-bold text-gray-900">Date</TableHead>
                    <TableHead className="font-bold text-gray-900">État</TableHead>
                    <TableHead className="font-bold text-gray-900">Affichage</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedReviews.length > 0 ? (
                    approvedReviews.map((review: any) => (
                      <TableRow key={review.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-semibold text-gray-900">
                          {review.client_name}
                        </TableCell>
                        <TableCell className="text-gray-700">{review.service_name}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-gray-700 max-w-md">{review.comment}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {fmtDate(review.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1 shadow-sm">
                            Approuvé
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={review.display_on_page !== false ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              toggleDisplayMutation.mutate({
                                id: review.id,
                                display_on_page: review.display_on_page === false,
                              })
                            }
                            disabled={toggleDisplayMutation.isPending}
                            className={
                              review.display_on_page !== false
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }
                          >
                            {review.display_on_page !== false ? (
                              <><FaCheckCircle className="w-4 h-4 mr-1" />Affiché</>
                            ) : (
                              <><FaTimesCircle className="w-4 h-4 mr-1" />Masqué</>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTargetId(review.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                            disabled={deleteMutation.isPending}
                            title="Supprimer"
                          >
                            <FaTrash className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun avis approuvé pour le moment
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

