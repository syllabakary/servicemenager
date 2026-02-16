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
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { API_URL } from "@/config/api";

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/categories/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const toggleNavbarMutation = useMutation({
    mutationFn: async ({ id, show_in_navbar }: { id: number; show_in_navbar: boolean }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/categories/${id}/`,
        { show_in_navbar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["navbar"] });
    },
  });

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      deleteMutation.mutate(id);
    }
  };

  const categories = data?.results || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Catégories</h1>
            <p className="text-gray-600 mt-1">
              Gérez les catégories de services. Les catégories actives apparaissent dans la navbar.
            </p>
          </div>
          <Button
            onClick={handleNew}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white w-full sm:w-auto"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            Nouvelle catégorie
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Ordre</TableHead>
                      <TableHead>Navbar</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          Aucune catégorie trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.order}</TableCell>
                          <TableCell>
                            <Badge
                              variant={category.show_in_navbar ? "default" : "secondary"}
                              className={
                                category.show_in_navbar
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }
                            >
                              {category.show_in_navbar ? (
                                <>
                                  <FaCheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <FaTimesCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleNavbarMutation.mutate({
                                    id: category.id,
                                    show_in_navbar: !category.show_in_navbar,
                                  })
                                }
                                className={
                                  category.show_in_navbar
                                    ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                }
                              >
                                {category.show_in_navbar ? (
                                  <>
                                    <FaTimesCircle className="w-4 h-4 mr-1" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <FaCheckCircle className="w-4 h-4 mr-1" />
                                    Activer
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(category)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <FaEdit className="w-4 h-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(category.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <FaTrash className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <CategoryDialog
          category={editingCategory}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["navbar"] });
          }}
        />
      </div>
    </DashboardLayout>
  );
}

function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: {
  category: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    show_in_navbar: true,
    order: 0,
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      if (category) {
        await axios.patch(`${API_URL}/categories/${category.id}/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/categories/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["navbar"] });
    },
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        show_in_navbar: category.show_in_navbar ?? true,
        order: category.order || 0,
      });
    } else {
      setFormData({
        name: "",
        show_in_navbar: true,
        order: 0,
      });
    }
  }, [category, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Modifiez les informations de la catégorie"
              : "Remplissez les informations pour créer une nouvelle catégorie"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Garde d'enfants, Ménage et repassage..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">Ordre d'affichage</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="show_in_navbar"
                checked={formData.show_in_navbar}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_in_navbar: checked })
                }
              />
              <Label htmlFor="show_in_navbar" className="cursor-pointer">
                Afficher dans la navbar
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-[#DC2626] hover:bg-[#B91C1C]">
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

