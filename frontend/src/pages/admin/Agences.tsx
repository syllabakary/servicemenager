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
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
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

const API_URL = "http://localhost:8000/api";

export default function AdminAgences() {
  const queryClient = useQueryClient();
  const [editingAgency, setEditingAgency] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/agencies/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/agencies/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/agencies/${id}/`,
        { active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    },
  });

  const handleEdit = (agency: any) => {
    setEditingAgency(agency);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingAgency(null);
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
                Gestion des Agences
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">Créez, modifiez et gérez vos agences</p>
            </div>
            <Button 
              onClick={handleNew} 
              className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Nouvelle agence
            </Button>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-2xl font-bold text-gray-900">Liste des agences</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">Nom</TableHead>
                    <TableHead className="font-bold text-gray-900">Ville</TableHead>
                    <TableHead className="font-bold text-gray-900">État</TableHead>
                    <TableHead className="font-bold text-gray-900">Coordonnées GPS</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.results?.map((agency: any) => (
                    <TableRow key={agency.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-semibold text-gray-900">{agency.name}</TableCell>
                      <TableCell className="text-gray-700">{agency.city}</TableCell>
                      <TableCell>
                        <Badge
                          variant={agency.active ? "default" : "secondary"}
                          className={`${agency.active ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"} text-white font-semibold px-3 py-1 shadow-sm`}
                        >
                          {agency.active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        {agency.latitude && agency.longitude
                          ? `${agency.latitude}, ${agency.longitude}`
                          : "Non défini"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: agency.id,
                                active: !agency.active,
                              })
                            }
                            className="hover:bg-gray-100 rounded-lg"
                          >
                            {agency.active ? (
                              <FaTimesCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <FaCheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(agency)}
                            className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <FaEdit className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer cette agence ?")) {
                                deleteMutation.mutate(agency.id);
                              }
                            }}
                            className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <FaTrash className="w-5 h-5 text-red-500" />
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

        <AgencyDialog
          agency={editingAgency}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
          }}
        />
      </div>
    </DashboardLayout>
  );
}

function AgencyDialog({
  agency,
  open,
  onOpenChange,
  onSuccess,
}: {
  agency: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    details: "",
    active: true,
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      const payload = {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      };
      if (agency) {
        await axios.patch(`${API_URL}/agencies/${agency.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/agencies/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    },
  });

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        slug: agency.slug || "",
        address: agency.address || "",
        city: agency.city || "",
        postal_code: agency.postal_code || "",
        phone: agency.phone || "",
        email: agency.email || "",
        latitude: agency.latitude?.toString() || "",
        longitude: agency.longitude?.toString() || "",
        details: agency.details || "",
        active: agency.active ?? true,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        address: "",
        city: "",
        postal_code: "",
        phone: "",
        email: "",
        latitude: "",
        longitude: "",
        details: "",
        active: true,
      });
    }
  }, [agency, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agency ? "Modifier l'agence" : "Nouvelle agence"}</DialogTitle>
          <DialogDescription>
            {agency
              ? "Modifiez les informations de l'agence"
              : "Remplissez les informations pour créer une nouvelle agence"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Agence active</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="48.8566"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="2.3522"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Détails</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
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

