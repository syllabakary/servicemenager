import React, { useState, useEffect } from "react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaInfoCircle } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

export default function AdminAgences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingAgency, setEditingAgency] = useState<any>(null);
  const [deleteAgencyId, setDeleteAgencyId] = useState<number | null>(null);
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
      await axios.delete(`${API_URL}/agencies/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      setDeleteAgencyId(null);
      toast({ title: "Agence déplacée dans la corbeille" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    },
  });

  const hardDeleteAgencyMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/agencies/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      await axios.delete(`${API_URL}/trash/hard-delete/agences/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      setDeleteAgencyId(null);
      toast({ title: "Agence supprimée définitivement" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer définitivement.", variant: "destructive" });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast({
        title: "Succès",
        description: `Agence ${variables.active ? "activée" : "désactivée"} avec succès`,
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
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
                Gestion des Agences
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">Créez, modifiez et gérez vos agences</p>
            </div>
            <Button 
              onClick={handleNew} 
              className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-site-button-text shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
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
                  {(Array.isArray(data) ? data : data?.results || []).map((agency: any) => (
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
                              setDeleteAgencyId(agency.id);
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
        <DeleteDialog
          open={deleteAgencyId !== null}
          onClose={() => setDeleteAgencyId(null)}
          onTrash={() => deleteAgencyId && deleteMutation.mutate(deleteAgencyId)}
          onHardDelete={() => deleteAgencyId && hardDeleteAgencyMutation.mutate(deleteAgencyId)}
          isPending={deleteMutation.isPending || hardDeleteAgencyMutation.isPending}
          itemLabel="cette agence"
        />
      </div>
    </DashboardLayout>
  );
}

// Fonction pour générer un slug à partir d'un nom
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplace les caractères non alphanumériques par des tirets
    .replace(/(^-|-$)/g, ""); // Supprime les tirets en début et fin
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
  const JOURS = [
    { key: "lundi", label: "Lundi" },
    { key: "mardi", label: "Mardi" },
    { key: "mercredi", label: "Mercredi" },
    { key: "jeudi", label: "Jeudi" },
    { key: "vendredi", label: "Vendredi" },
    { key: "samedi", label: "Samedi" },
    { key: "dimanche", label: "Dimanche" },
  ];

  const defaultOpeningHours = () =>
    Object.fromEntries(
      JOURS.map((j) => [j.key, { open: false, start: "09:00", end: "18:00" }])
    );

  const buildHorairesText = (oh: Record<string, any>) =>
    JOURS.filter((j) => oh[j.key]?.open)
      .map((j) => `${j.label} ${oh[j.key].start}-${oh[j.key].end}`)
      .join(", ") || "";

  const [openingHours, setOpeningHours] = useState<Record<string, any>>(defaultOpeningHours());

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
    horaires: "",
    active: true,
    image: null as File | null,
    services_ids: [] as number[],
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les services
  const { data: servicesData } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      
      // Générer le slug automatiquement si vide
      let slug = data.slug.trim();
      if (!slug && data.name) {
        slug = generateSlug(data.name);
        if (data.city) {
          slug = `${slug}-${generateSlug(data.city)}`;
        }
      }
      
      // Créer FormData pour gérer l'upload d'image
      const formDataToSend = new FormData();
      formDataToSend.append('name', data.name);
      formDataToSend.append('slug', slug || generateSlug(data.name || "agence"));
      formDataToSend.append('address', data.address);
      formDataToSend.append('city', data.city);
      if (data.postal_code) formDataToSend.append('postal_code', data.postal_code);
      if (data.phone) formDataToSend.append('phone', data.phone);
      if (data.email) formDataToSend.append('email', data.email);
      if (data.latitude) formDataToSend.append('latitude', data.latitude);
      if (data.longitude) formDataToSend.append('longitude', data.longitude);
      if (data.details) formDataToSend.append('details', data.details);
      // Générer le texte horaires depuis opening_hours
      const horairesTxt = buildHorairesText(openingHours);
      if (horairesTxt) formDataToSend.append('horaires', horairesTxt);
      formDataToSend.append('opening_hours', JSON.stringify(openingHours));
      formDataToSend.append('active', data.active.toString());
      
      // Ajouter l'image si elle existe
      if (data.image instanceof File) {
        formDataToSend.append('image', data.image);
      }
      
      // Ajouter les services si sélectionnés
      if (data.services_ids && Array.isArray(data.services_ids)) {
        data.services_ids.forEach((serviceId: number) => {
          formDataToSend.append('services_ids', serviceId.toString());
        });
      }
      
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };
      
      if (agency) {
        const res = await axios.patch(`${API_URL}/agencies/${agency.id}/`, formDataToSend, {
          headers,
        });
        return res.data;
      } else {
        const res = await axios.post(`${API_URL}/agencies/`, formDataToSend, {
          headers,
        });
        return res.data;
      }
    },
    onSuccess: (data) => {
      if (data?.image_url) setImagePreview(data.image_url);
      else setImagePreview(null);
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast({
        title: "Succès",
        description: agency ? "Agence modifiée avec succès" : "Agence créée avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.slug?.[0] || "Une erreur s'est produite";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
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
        horaires: agency.horaires || "",
        active: agency.active ?? true,
        image: null,
        services_ids: agency.services_summary ? agency.services_summary.map((s: any) => s.id) : [],
      });
      // Pré-remplir les horaires structurés
      if (agency.opening_hours && typeof agency.opening_hours === 'object') {
        setOpeningHours({ ...defaultOpeningHours(), ...agency.opening_hours });
      } else {
        setOpeningHours(defaultOpeningHours());
      }
      setImagePreview(agency.image_url || null);
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
        horaires: "",
        active: true,
        image: null,
        services_ids: [],
      });
      setOpeningHours(defaultOpeningHours());
      setImagePreview(null);
    }
  }, [agency, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name">Nom de l'agence *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Le nom complet de l'agence tel qu'il apparaîtra sur le site</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData({ 
                      ...formData, 
                      name: newName,
                      // Générer le slug automatiquement si l'utilisateur n'a pas modifié le slug manuellement
                      slug: formData.slug === generateSlug(formData.name) || !formData.slug 
                        ? generateSlug(newName) 
                        : formData.slug
                    });
                  }}
                  required
                  placeholder="Ex: EASE-DOM Clamart"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Identifiant unique dans l'URL (ex: pronet-abidjan). Généré automatiquement si vide</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Généré automatiquement si vide"
                />
                <p className="text-xs text-gray-500">Le slug sera généré automatiquement à partir du nom si laissé vide</p>
              </div>
            </div>
          </div>

          {/* Section: Localisation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Localisation</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="address">Adresse complète *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>L'adresse complète de l'agence (rue, numéro, quartier)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                rows={2}
                placeholder="Ex: Boulevard de la République, Cocody"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="city">Ville *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>La ville où se trouve l'agence</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  placeholder="Ex: Clamart"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Le code postal de l'agence (optionnel)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="Ex: 01 BP 1234"
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="latitude">Latitude GPS</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Coordonnée GPS latitude pour la localisation sur la carte (optionnel)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="Ex: 5.3602164"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="longitude">Longitude GPS</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Coordonnée GPS longitude pour la localisation sur la carte (optionnel)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="Ex: -3.9674371"
                />
              </div>
            </div>
          </div>

          {/* Section: Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Numéro de téléphone de contact de l'agence (optionnel)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: +225 07 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email">Email</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adresse email de contact de l'agence (optionnel)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: contact@agence.ci"
                />
              </div>
            </div>
          </div>

          {/* Section: Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Services proposés</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Services disponibles dans cette agence</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sélectionnez les services proposés par cette agence. Ces services apparaîtront sur la page de détail de l'agence.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {(Array.isArray(servicesData) ? servicesData : servicesData?.results || []).length > 0 ? (
                  (Array.isArray(servicesData) ? servicesData : servicesData?.results || []).map((service: any) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={formData.services_ids.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              services_ids: [...formData.services_ids, service.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              services_ids: formData.services_ids.filter((id) => id !== service.id),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`service-${service.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service.name}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucun service disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Contenu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contenu</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="image">Image de l'agence</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Image principale de l'agence qui sera affichée sur le site (optionnel)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">Format recommandé: JPG, PNG. Taille max: 5MB</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="details">Détails et description *</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Description détaillée de l'agence, ses spécialités, ses horaires, etc.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={5}
                placeholder="Décrivez l'agence, ses spécialités, ses horaires, etc."
                required
              />
              <p className="text-xs text-gray-500">Description complète de l'agence</p>
            </div>

            <div className="space-y-3">
              <Label>Horaires d'ouverture</Label>
              <div className="border rounded-lg p-3 space-y-2">
                {JOURS.map((jour) => (
                  <div key={jour.key} className="flex items-center gap-3">
                    <Checkbox
                      id={`jour-${jour.key}`}
                      checked={openingHours[jour.key]?.open ?? false}
                      onCheckedChange={(checked) =>
                        setOpeningHours((prev) => ({
                          ...prev,
                          [jour.key]: { ...prev[jour.key], open: !!checked },
                        }))
                      }
                    />
                    <Label
                      htmlFor={`jour-${jour.key}`}
                      className="w-24 cursor-pointer text-sm font-medium"
                    >
                      {jour.label}
                    </Label>
                    {openingHours[jour.key]?.open && (
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="time"
                          value={openingHours[jour.key]?.start ?? "09:00"}
                          onChange={(e) =>
                            setOpeningHours((prev) => ({
                              ...prev,
                              [jour.key]: { ...prev[jour.key], start: e.target.value },
                            }))
                          }
                          className="border rounded px-2 py-1 text-sm w-28"
                        />
                        <span className="text-gray-500">—</span>
                        <input
                          type="time"
                          value={openingHours[jour.key]?.end ?? "18:00"}
                          onChange={(e) =>
                            setOpeningHours((prev) => ({
                              ...prev,
                              [jour.key]: { ...prev[jour.key], end: e.target.value },
                            }))
                          }
                          className="border rounded px-2 py-1 text-sm w-28"
                        />
                      </div>
                    )}
                    {!openingHours[jour.key]?.open && (
                      <span className="text-xs text-gray-400 italic">Fermé</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">Cochez les jours d'ouverture et définissez les horaires</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text">
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



