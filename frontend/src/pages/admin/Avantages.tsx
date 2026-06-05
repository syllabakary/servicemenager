import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  FaStar,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaUsers,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaAward,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaHeart,
  FaHandHoldingHeart,
  FaUserTie,
} from "react-icons/fa";
import axios from "axios";
import { useState } from "react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { API_URL } from "@/config/api";

const iconMap: Record<string, any> = {
  FaUsers: FaUsers,
  FaShieldAlt: FaShieldAlt,
  FaClock: FaClock,
  FaCheckCircle: FaCheckCircle,
  FaStar: FaStar,
  FaAward: FaAward,
  FaMapMarkerAlt: FaMapMarkerAlt,
  FaPhone: FaPhone,
  FaEnvelope: FaEnvelope,
  FaHeart: FaHeart,
  FaHandHoldingHeart: FaHandHoldingHeart,
  FaUserTie: FaUserTie,
};

const iconOptions = [
  { value: "FaUsers", label: "Utilisateurs" },
  { value: "FaShieldAlt", label: "Bouclier" },
  { value: "FaClock", label: "Horloge" },
  { value: "FaCheckCircle", label: "Coche" },
  { value: "FaStar", label: "Étoile" },
  { value: "FaAward", label: "Récompense" },
  { value: "FaMapMarkerAlt", label: "Localisation" },
  { value: "FaPhone", label: "Téléphone" },
  { value: "FaEnvelope", label: "Email" },
  { value: "FaHeart", label: "Cœur" },
  { value: "FaHandHoldingHeart", label: "Main avec cœur" },
  { value: "FaUserTie", label: "Professionnel" },
];

export default function AdminAvantages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteAdvantageId, setDeleteAdvantageId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "FaUsers",
    order: 0,
    active: true,
  });

  const { data: advantages, isLoading } = useQuery({
    queryKey: ["admin-advantages"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/service-advantages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      const res = await axios.post(`${API_URL}/service-advantages/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advantages"] });
      setIsCreating(false);
      setFormData({ title: "", description: "", icon: "FaUsers", order: 0, active: true });
      toast({
        title: "Succès",
        description: "Avantage créé avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const token = localStorage.getItem("access_token");
      const res = await axios.patch(`${API_URL}/service-advantages/${id}/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advantages"] });
      setEditingId(null);
      toast({
        title: "Succès",
        description: "Avantage mis à jour avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/service-advantages/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advantages"] });
      setDeleteAdvantageId(null);
      toast({ title: "Avantage supprimé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.response?.data?.detail || "Une erreur s'est produite", variant: "destructive" });
    },
  });

  const handleEdit = (advantage: any) => {
    setEditingId(advantage.id);
    setFormData({
      title: advantage.title,
      description: advantage.description,
      icon: advantage.icon,
      order: advantage.order,
      active: advantage.active,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ title: "", description: "", icon: "FaUsers", order: 0, active: true });
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const advantagesList = advantages?.results || advantages || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Avantages des services</h1>
            <p className="text-gray-600 mt-1">
              Gérez les avantages affichés dans la section "Pourquoi choisir nos services ?"
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            Ajouter un avantage
          </Button>
        </div>

        {/* Formulaire de création */}
        {isCreating && (
          <Card className="border-2 border-site-primary">
            <CardHeader>
              <CardTitle>Nouvel avantage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Professionnels certifiés"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icône *</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'avantage..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ordre d'affichage</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>Actif</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.description}
                  className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <FaTimes className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des avantages */}
        <div className="grid grid-cols-1 gap-4">
          {advantagesList.map((advantage: any) => {
            const IconComponent = iconMap[advantage.icon] || FaUsers;
            const isEditing = editingId === advantage.id;

            return (
              <Card key={advantage.id} className={!advantage.active ? "opacity-60" : ""}>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Titre *</Label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Icône *</Label>
                          <Select
                            value={formData.icon}
                            onValueChange={(value) => setFormData({ ...formData, icon: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ordre d'affichage</Label>
                          <Input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Switch
                            checked={formData.active}
                            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                          />
                          <Label>Actif</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmit}
                          disabled={!formData.title || !formData.description}
                          className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
                        >
                          <FaSave className="w-4 h-4 mr-2" />
                          Enregistrer
                        </Button>
                        <Button onClick={handleCancel} variant="outline">
                          <FaTimes className="w-4 h-4 mr-2" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-site-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-site-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{advantage.title}</h3>
                            <p className="text-gray-600 mb-2">{advantage.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Ordre: {advantage.order}</span>
                              <span className={advantage.active ? "text-green-600" : "text-red-600"}>
                                {advantage.active ? "Actif" : "Inactif"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEdit(advantage)}
                              variant="outline"
                              size="sm"
                            >
                              <FaEdit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setDeleteAdvantageId(advantage.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <FaTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {advantagesList.length === 0 && !isCreating && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500">Aucun avantage configuré. Cliquez sur "Ajouter un avantage" pour commencer.</p>
            </CardContent>
          </Card>
        )}
      </div>
      <DeleteDialog
        open={deleteAdvantageId !== null}
        onClose={() => setDeleteAdvantageId(null)}
        onHardDelete={() => deleteAdvantageId && deleteMutation.mutate(deleteAdvantageId)}
        isPending={deleteMutation.isPending}
        itemLabel="cet avantage"
      />
    </DashboardLayout>
  );
}

