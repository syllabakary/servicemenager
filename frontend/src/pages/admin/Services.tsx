import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaMinus } from "react-icons/fa";
import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaInfoCircle } from "react-icons/fa";

import { API_URL } from "@/config/api";

export default function AdminServices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingService, setEditingService] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/services/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast({
        title: "✅ Service supprimé",
        description: "Le service a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Impossible de supprimer le service.";
      
      if (error?.response?.status === 401) {
        errorMessage = "Vous n'êtes pas autorisé à supprimer ce service. Veuillez vous reconnecter.";
      } else if (error?.response?.status === 403) {
        errorMessage = "Vous n'avez pas les permissions nécessaires pour supprimer ce service.";
      } else if (error?.response?.status === 404) {
        errorMessage = "Le service n'existe plus.";
      } else if (error?.response?.status === 500) {
        errorMessage = "Erreur serveur. Le service est peut-être utilisé dans des devis, des formulaires ou d'autres éléments.";
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erreur de suppression",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_URL}/services/${id}/`,
        { active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingService(null);
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
                Gestion des Services
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">Créez, modifiez et gérez vos services</p>
            </div>
            <Button 
              onClick={handleNew} 
              className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Nouveau service
            </Button>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-2xl font-bold text-gray-900">Liste des services</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">Nom</TableHead>
                    <TableHead className="font-bold text-gray-900">Slug</TableHead>
                    <TableHead className="font-bold text-gray-900">État</TableHead>
                    <TableHead className="font-bold text-gray-900">Ordre</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.results?.map((service: any) => (
                    <TableRow key={service.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-semibold text-gray-900">{service.name}</TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">{service.slug}</TableCell>
                      <TableCell>
                        <Badge
                          variant={service.active ? "default" : "secondary"}
                          className={`${service.active ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"} text-white font-semibold px-3 py-1 shadow-sm`}
                        >
                          {service.active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{service.order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: service.id,
                                active: !service.active,
                              })
                            }
                            className="hover:bg-gray-100 rounded-lg"
                          >
                            {service.active ? (
                              <FaTimesCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <FaCheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <FaEdit className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                            className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                            disabled={deleteMutation.isPending}
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

        <ServiceDialog
          service={editingService}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-services"] });
          }}
        />
      </div>
    </DashboardLayout>
  );
}

const ICON_OPTIONS = [
  { value: "auto", label: "Auto (selon le nom du service)" },
  { value: "HiSparkles", label: "✨ Étincelles (défaut)" },
  { value: "FaBroom", label: "🧹 Balai (ménage/nettoyage)" },
  { value: "FaBaby", label: "👶 Bébé (garde d'enfants)" },
  { value: "FaTree", label: "🌳 Arbre (jardinage)" },
  { value: "FaPaintBrush", label: "🖌️ Pinceau (peinture)" },
  { value: "FaShieldAlt", label: "🛡️ Bouclier (sécurité)" },
  { value: "FaTruck", label: "🚚 Camion (déménagement)" },
  { value: "FaWrench", label: "🔧 Clé (réparation)" },
  { value: "FaHome", label: "🏠 Maison" },
  { value: "FaTools", label: "🔨 Outils" },
  { value: "FaCar", label: "🚗 Voiture" },
  { value: "FaHeartbeat", label: "❤️ Santé" },
  { value: "FaGraduationCap", label: "🎓 Éducation" },
  { value: "FaDog", label: "🐕 Animal de compagnie" },
  { value: "FaSnowflake", label: "❄️ Climatisation" },
  { value: "FaLightbulb", label: "💡 Électricité" },
  { value: "FaUtensils", label: "🍽️ Cuisine" },
  { value: "FaSwimmingPool", label: "🏊 Piscine" },
  { value: "FaCut", label: "✂️ Coiffure/Esthétique" },
];

function ServiceDialog({
  service,
  open,
  onOpenChange,
  onSuccess,
}: {
  service: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: null as number | null,
    category_name: "",
    short_description: "",
    detailed_description: "",
    active: true,
    order: 0,
    duration: "",
    price_per_hour: "",
    price_label: "",
    currency: "EUR",
    contact_phone: "",
    rating: "",
    review_count: 0,
    show_reviews: true,
    show_faq: true,
    icon: "auto",
    show_icon: true,
    show_pricing: true,
    included_services: [] as string[],
    features: [] as string[],
    guarantees: [] as string[],
    process_steps: [] as any[],
    agencies_ids: [] as number[],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addToNavbar, setAddToNavbar] = useState(true);

  const queryClient = useQueryClient();

  // Récupérer les agences
  const { data: agenciesData } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/agencies/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Récupérer les catégories dans ServiceDialog
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Mutation pour créer une catégorie
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; show_in_navbar: boolean }) => {
      const token = localStorage.getItem("access_token");
      const res = await axios.post(`${API_URL}/categories/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormData({ ...formData, category: newCategory.id, category_name: newCategory.name });
      setShowNewCategoryDialog(false);
      setNewCategoryName("");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      const formDataToSend = new FormData();
      
      // Ajouter tous les champs au FormData
      Object.keys(data).forEach((key) => {
        if (key === 'included_services' || key === 'features' || key === 'guarantees' || key === 'process_steps') {
          // Les champs JSON doivent être convertis en string
          formDataToSend.append(key, JSON.stringify(data[key]));
        } else if (key === 'category' && data[key] !== null) {
          // Le champ category doit être un ID
          formDataToSend.append(key, data[key]);
        } else if (key === 'agencies_ids' && Array.isArray(data[key])) {
          // Les agences doivent être envoyées comme un tableau d'IDs
          data[key].forEach((agencyId: number) => {
            formDataToSend.append('agencies_ids', agencyId.toString());
          });
        } else if (typeof data[key] === 'boolean') {
          // Les booléens doivent être envoyés comme "true"/"false" explicitement
          formDataToSend.append(key, data[key] ? 'true' : 'false');
        } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formDataToSend.append(key, data[key]);
        }
      });
      
      // Ajouter l'image si elle existe
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      if (service) {
        // Update
        const res = await axios.patch(`${API_URL}/services/${service.id}/`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        return res.data;
      } else {
        // Create
        const res = await axios.post(`${API_URL}/services/`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        return res.data;
      }
    },
    onSuccess: (data) => {
      setImageFile(null);
      if (data?.image_url) setImagePreview(data.image_url);
      else setImagePreview(null);
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        slug: service.slug || "",
        category: service.category || null,
        category_name: service.category_name || "",
        short_description: service.short_description || "",
        detailed_description: service.detailed_description || "",
        active: service.active ?? true,
        order: service.order || 0,
        duration: service.duration || "",
        price_per_hour: service.price_per_hour || "",
        price_label: service.price_label || "",
        currency: service.currency || "EUR",
        contact_phone: service.contact_phone || "",
        rating: service.rating || "",
        review_count: service.review_count || 0,
        show_reviews: service.show_reviews !== undefined ? service.show_reviews : true,
        show_faq: service.show_faq !== undefined ? service.show_faq : true,
        icon: service.icon || "auto",
        show_icon: service.show_icon !== undefined ? service.show_icon : true,
        show_pricing: service.show_pricing !== undefined ? service.show_pricing : true,
        included_services: service.included_services || [],
        features: service.features || [],
        guarantees: service.guarantees || [],
        process_steps: service.process_steps || [],
        agencies_ids: service.agencies ? service.agencies.map((a: any) => a.id) : [],
      });
      // Afficher l'image existante si disponible
      if (service.image_url) {
        setImagePreview(service.image_url);
      } else {
        setImagePreview(null);
      }
      setImageFile(null);
    } else {
      setFormData({
        name: "",
        slug: "",
        category: null,
        category_name: "",
        short_description: "",
        detailed_description: "",
        active: true,
        order: 0,
        duration: "",
        price_per_hour: "",
        price_label: "",
        currency: "EUR",
        contact_phone: "",
        rating: "",
        review_count: 0,
        show_reviews: true,
        show_faq: true,
        icon: "auto",
        show_icon: true,
        show_pricing: true,
        included_services: [],
        features: [],
        guarantees: [],
        process_steps: [],
        agencies_ids: [],
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [service, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonctions pour gérer les listes
  const addListItem = (field: 'included_services' | 'features' | 'guarantees', value: string) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value.trim()],
      });
    }
  };

  const removeListItem = (field: 'included_services' | 'features' | 'guarantees', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const updateListItem = (field: 'included_services' | 'features' | 'guarantees', index: number, value: string) => {
    const newList = [...formData[field]];
    newList[index] = value;
    setFormData({
      ...formData,
      [field]: newList,
    });
  };

  // Fonctions pour gérer les étapes du processus
  const addProcessStep = () => {
    setFormData({
      ...formData,
      process_steps: [...formData.process_steps, { step: formData.process_steps.length + 1, title: "", description: "" }],
    });
  };

  const removeProcessStep = (index: number) => {
    setFormData({
      ...formData,
      process_steps: formData.process_steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, step: i + 1 })),
    });
  };

  const updateProcessStep = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...formData.process_steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({
      ...formData,
      process_steps: newSteps,
    });
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      // Ouvrir le dialogue pour créer une nouvelle catégorie
      setShowNewCategoryDialog(true);
    } else {
      setFormData({ ...formData, category: value ? parseInt(value) : null });
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate({
        name: newCategoryName.trim(),
        show_in_navbar: addToNavbar,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Préparer les données pour l'API
    const submitData = {
      ...formData,
      category: formData.category,
      price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
      rating: formData.rating ? parseFloat(formData.rating) : null,
      review_count: formData.review_count || 0,
      // "auto" signifie aucune icône fixée → envoyer null pour laisser l'auto-détection
      icon: formData.icon === "auto" ? null : formData.icon,
    };
    // Retirer category_name qui n'est pas dans le modèle
    delete (submitData as any).category_name;
    saveMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "Modifier le service" : "Nouveau service"}</DialogTitle>
          <DialogDescription>
            {service
              ? "Modifiez les informations du service"
              : "Remplissez les informations pour créer un nouveau service"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>La catégorie détermine comment le service apparaît dans le menu de navigation. Si la catégorie est marquée "Navbar", elle apparaîtra dans le menu principal.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.category?.toString() || ""}
              onValueChange={handleCategoryChange}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.results?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name} {cat.show_in_navbar ? "✓ (Navbar)" : "⚠ (Non affichée)"}
                  </SelectItem>
                ))}
                <SelectItem value="new" className="text-site-primary font-semibold">
                  + Ajouter une nouvelle catégorie
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              La catégorie détermine comment le service apparaît dans le menu de navigation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image du service</Label>
            <div className="space-y-2">
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
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      const input = document.getElementById('image') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Supprimer l'image
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Format recommandé : JPG, PNG. Taille max : 5MB
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="short_description">Description courte *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Description courte qui apparaît sur la page de liste des services (max 500 caractères)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="short_description"
              value={formData.short_description}
              onChange={(e) =>
                setFormData({ ...formData, short_description: e.target.value })
              }
              required
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {formData.short_description.length}/500 caractères
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="detailed_description">Description détaillée *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Description complète qui apparaît sur la page de détail du service</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="detailed_description"
              value={formData.detailed_description}
              onChange={(e) =>
                setFormData({ ...formData, detailed_description: e.target.value })
              }
              required
              rows={4}
            />
          </div>

          {/* Tarification et durée */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Tarification et durée</h3>
              <div className="flex items-center gap-2">
                <Switch
                  id="show_pricing"
                  checked={formData.show_pricing}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_pricing: checked })}
                />
                <Label htmlFor="show_pricing" className="text-sm text-gray-600">
                  {formData.show_pricing ? "Visible sur la page" : "Masquée"}
                </Label>
              </div>
            </div>
            {!formData.show_pricing && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                ⚠️ La tarification sera masquée sur les pages publiques. L'admin fixera le prix dans le panneau devis.
              </p>
            )}
            {formData.show_pricing && <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="duration">Durée</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Durée estimée du service (ex: "2-4 heures", "1 journée")</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="Ex: 2-4 heures"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="price_per_hour">Prix/heure</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Le prix par heure sera affiché avec la devise sélectionnée</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="price_per_hour"
                  type="number"
                  step="0.01"
                  value={formData.price_per_hour}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_hour: e.target.value })
                  }
                  placeholder="25.00"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>La devise sélectionnée sera utilisée pour afficher tous les prix de ce service sur le site</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dollar ($)</SelectItem>
                    <SelectItem value="FCFA">Franc CFA (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="price_label">Label du prix</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Texte personnalisé pour le prix (ex: "À partir de 25€/heure"). Si vide, le prix/heure sera utilisé avec la devise.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="price_label"
                  value={formData.price_label}
                  onChange={(e) =>
                    setFormData({ ...formData, price_label: e.target.value })
                  }
                  placeholder="Ex: À partir de 25€/heure"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contact_phone">Numéro de contact</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Numéro de téléphone spécifique pour ce service. Si vide, le numéro général sera utilisé sur la page de détail.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  placeholder="Ex: +225 01 23 45 67 89"
                />
              </div>
            </div>}
          </div>

          {/* Note et avis */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Note et avis</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ces valeurs sont automatiquement mises à jour quand des clients laissent des avis. Vous pouvez les modifier manuellement si nécessaire.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Note (sur 5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value })
                  }
                  placeholder="4.8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_count">Nombre d'avis</Label>
                <Input
                  id="review_count"
                  type="number"
                  value={formData.review_count}
                  onChange={(e) =>
                    setFormData({ ...formData, review_count: parseInt(e.target.value) || 0 })
                  }
                  placeholder="1245"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Switch
                id="show_reviews"
                checked={formData.show_reviews}
                onCheckedChange={(checked) => setFormData({ ...formData, show_reviews: checked })}
              />
              <Label htmlFor="show_reviews" className="flex items-center gap-2">
                Afficher la section avis sur la page de détail
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Si désactivé, la section avis ne sera pas affichée sur la page de détail du service</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
          </div>

          {/* FAQ */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Questions fréquentes (FAQ)</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Les FAQ sont gérées depuis la page de détail du service. Vous pouvez activer/désactiver leur affichage ici.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show_faq"
                checked={formData.show_faq}
                onCheckedChange={(checked) => setFormData({ ...formData, show_faq: checked })}
              />
              <Label htmlFor="show_faq" className="flex items-center gap-2">
                Afficher la section FAQ sur la page de détail
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Si désactivé, la section FAQ ne sera pas affichée sur la page de détail du service</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
          </div>

          {/* Icône du service */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Icône du service</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="show_icon"
                  checked={formData.show_icon}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_icon: checked })}
                />
                <Label htmlFor="show_icon" className="text-sm text-gray-600">
                  {formData.show_icon ? "Visible" : "Masquée"}
                </Label>
              </div>
            </div>
            {formData.show_icon && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Choisir une icône</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(v) => setFormData({ ...formData, icon: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto (selon le nom du service)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Laissez "Auto" pour détecter automatiquement l'icône selon le nom du service.
                </p>
              </div>
            )}
          </div>

          {/* Agences disponibles */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Agences disponibles</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sélectionnez les agences où ce service est disponible. Les agences sélectionnées apparaîtront sur la page de détail du service.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {agenciesData?.results?.length > 0 ? (
                agenciesData.results.map((agency: any) => (
                  <div key={agency.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`agency-${agency.id}`}
                      checked={(formData.agencies_ids || []).includes(agency.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            agencies_ids: [...(formData.agencies_ids || []), agency.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            agencies_ids: (formData.agencies_ids || []).filter((id) => id !== agency.id),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`agency-${agency.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {agency.name} - {agency.city}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune agence disponible</p>
              )}
            </div>
          </div>

          {/* Prestations incluses */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Prestations incluses</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Liste des prestations incluses dans ce service. Ces informations apparaissent dans l'onglet "Prestations incluses" de la page de détail du service.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              {formData.included_services.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem('included_services', index, e.target.value)}
                    placeholder="Ex: Nettoyage complet des sols"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeListItem('included_services', index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FaMinus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  id="new_included_service"
                  placeholder="Ajouter une prestation..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addListItem('included_services', (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('new_included_service') as HTMLInputElement;
                    if (input) {
                      addListItem('included_services', input.value);
                      input.value = '';
                    }
                  }}
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Caractéristiques</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Points forts et caractéristiques du service affichés avec des checkmarks sur la page de détail.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              {formData.features.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem('features', index, e.target.value)}
                    placeholder="Ex: Produits écologiques certifiés"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeListItem('features', index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FaMinus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  id="new_feature"
                  placeholder="Ajouter une caractéristique..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addListItem('features', (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('new_feature') as HTMLInputElement;
                    if (input) {
                      addListItem('features', input.value);
                      input.value = '';
                    }
                  }}
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Garanties */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Garanties</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Garanties offertes avec ce service. Affichées dans la carte de réservation sur la page de détail.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              {formData.guarantees.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem('guarantees', index, e.target.value)}
                    placeholder="Ex: Réponse sous 24h garantie"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeListItem('guarantees', index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FaMinus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  id="new_guarantee"
                  placeholder="Ajouter une garantie..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addListItem('guarantees', (e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById('new_guarantee') as HTMLInputElement;
                    if (input) {
                      addListItem('guarantees', input.value);
                      input.value = '';
                    }
                  }}
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Étapes du processus */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Étapes du processus</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center">
                    <FaInfoCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Étapes du processus de commande/réservation. Affichées dans l'onglet "Prestations incluses" de la page de détail du service.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-4">
              {formData.process_steps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Étape {step.step || index + 1}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProcessStep(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <FaTrash className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={step.title || ""}
                      onChange={(e) => updateProcessStep(index, 'title', e.target.value)}
                      placeholder="Titre de l'étape (ex: Évaluation gratuite)"
                      className="w-full"
                    />
                    <Textarea
                      value={step.description || ""}
                      onChange={(e) => updateProcessStep(index, 'description', e.target.value)}
                      placeholder="Description de l'étape"
                      rows={2}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addProcessStep}
                className="w-full"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Ajouter une étape
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
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
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">Service actif</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text">
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Dialogue pour créer une nouvelle catégorie */}
      <AlertDialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nouvelle catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Créez une nouvelle catégorie pour ce service
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_category_name">Nom de la catégorie *</Label>
              <Input
                id="new_category_name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Garde d'enfants, Ménage et repassage..."
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="add_to_navbar"
                checked={addToNavbar}
                onCheckedChange={setAddToNavbar}
              />
              <Label htmlFor="add_to_navbar" className="cursor-pointer">
                Afficher cette catégorie dans la navbar
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setNewCategoryName("");
              setAddToNavbar(true);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
            >
              {createCategoryMutation.isPending ? "Création..." : "Créer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

