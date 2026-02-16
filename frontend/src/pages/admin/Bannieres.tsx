import React, { useState, useEffect } from "react";
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
import { FaPlus, FaEdit, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

export default function AdminBannieres() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/pages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ key, is_active }: { key: string; is_active: boolean }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/pages/${key}/`,
        { is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      queryClient.invalidateQueries({ queryKey: ["home_banner"] }); // Invalider le cache du banner
    },
  });

  const handleEdit = (page: any) => {
    setEditingPage(page);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingPage(null);
    setIsDialogOpen(true);
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#DC2626] to-[#B91C1C] bg-clip-text text-transparent">
                Gestion des Bannières
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">Modifiez le contenu des bannières et pages</p>
            </div>
            <Button 
              onClick={handleNew} 
              className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Nouvelle bannière
            </Button>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-2xl font-bold text-gray-900">Liste des bannières</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">Clé</TableHead>
                    <TableHead className="font-bold text-gray-900">Titre</TableHead>
                    <TableHead className="font-bold text-gray-900">État</TableHead>
                    <TableHead className="font-bold text-gray-900">Ordre</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.results?.map((page: any) => (
                    <TableRow key={page.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 font-mono">{page.key}</TableCell>
                      <TableCell className="text-gray-700">{page.title || "Sans titre"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={page.is_active ? "default" : "secondary"}
                          className={`${page.is_active ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"} text-white font-semibold px-3 py-1 shadow-sm`}
                        >
                          {page.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{page.order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                key: page.key,
                                is_active: !page.is_active,
                              })
                            }
                            className="hover:bg-gray-100 rounded-lg"
                          >
                            {page.is_active ? (
                              <FaTimesCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <FaCheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(page)}
                            className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <FaEdit className="w-5 h-5" />
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

        <PageDialog
          page={editingPage}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
          }}
        />
      </div>
    </DashboardLayout>
  );
}

function PageDialog({
  page,
  open,
  onOpenChange,
  onSuccess,
}: {
  page: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    key: "",
    title: "",
    body: "",
    is_active: true,
    order: 0,
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      try {
        if (page) {
          // Utiliser la clé (key) au lieu de l'ID car lookup_field = 'key' dans le ViewSet
          const response = await axios.patch(`${API_URL}/pages/${page.key}/`, data, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return response.data;
        } else {
          const response = await axios.post(`${API_URL}/pages/`, data, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return response.data;
        }
      } catch (error: any) {
        console.error("Erreur lors de l'enregistrement:", error);
        if (error.response) {
          throw new Error(error.response.data?.detail || error.response.data?.message || "Erreur lors de l'enregistrement");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Enregistrement réussi:", data);
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      // Invalider le cache du banner si c'est le home_banner qui est modifié
      if (page?.key === 'home_banner' || formData.key === 'home_banner') {
        queryClient.invalidateQueries({ queryKey: ["home_banner"] });
      }
      // Fermer le dialog et appeler onSuccess
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Erreur de mutation:", error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || "Une erreur s'est produite lors de l'enregistrement";
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (page) {
      setFormData({
        key: page.key || "",
        title: page.title || "",
        body: page.body || "",
        is_active: page.is_active ?? true,
        order: page.order || 0,
      });
    } else {
      setFormData({
        key: "",
        title: "",
        body: "",
        is_active: true,
        order: 0,
      });
    }
  }, [page, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validation
    if (!formData.key && !page) {
      toast({
        title: "⚠️ Validation requise",
        description: "La clé est obligatoire",
        variant: "destructive",
      });
      return;
    }
    if (!formData.body) {
      toast({
        title: "⚠️ Validation requise",
        description: "Le contenu est obligatoire",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Soumission du formulaire:", formData);
    console.log("Page actuelle:", page);
    
    // Appeler la mutation
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? "Modifier la bannière" : "Nouvelle bannière"}</DialogTitle>
          <DialogDescription>
            {page
              ? "Modifiez le contenu de la bannière"
              : "Remplissez les informations pour créer une nouvelle bannière"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Clé *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                required
                disabled={!!page}
                placeholder="home_banner"
              />
              {page && (
                <p className="text-xs text-gray-500">La clé ne peut pas être modifiée</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Ordre</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Contenu *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
              rows={6}
              placeholder="Texte ou HTML"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Bannière active</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

