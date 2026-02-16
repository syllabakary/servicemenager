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
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronRight } from "react-icons/fa";
import axios from "axios";
import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

const STEP_TYPES = [
  { value: "SERVICE_SELECTION", label: "Sélection du service" },
  { value: "LOCATION", label: "Localisation" },
  { value: "SINGLE_CHOICE", label: "Choix unique" },
  { value: "MULTIPLE_CHOICE", label: "Choix multiples" },
  { value: "TEXT_INPUT", label: "Saisie texte" },
  { value: "CONTACT", label: "Coordonnées de contact" },
];

export default function AdminFormulairesDevis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingStep, setEditingStep] = useState<any>(null);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  // Récupérer les services
  const { data: servicesResponse } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Normaliser servicesData pour être sûr que c'est un tableau
  const services = Array.isArray(servicesResponse) 
    ? servicesResponse 
    : (servicesResponse?.results || []);

  // Récupérer les étapes pour le service sélectionné
  const { data: stepsData, isLoading } = useQuery({
    queryKey: ["admin-quote-form-steps", selectedService],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const url = selectedService
        ? `${API_URL}/quote-form-steps/?service=${selectedService}`
        : `${API_URL}/quote-form-steps/`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.results || [];
    },
    enabled: true,
  });

  // Récupérer les options pour une étape
  const fetchOptions = async (stepId: number) => {
    const token = localStorage.getItem("access_token");
    const res = await axios.get(`${API_URL}/quote-form-options/?step=${stepId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.results || [];
  };

  const toggleStepExpanded = (stepId: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const stepMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      if (editingStep && editingStep.id) {
        return axios.patch(
          `${API_URL}/quote-form-steps/${editingStep.id}/`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        return axios.post(
          `${API_URL}/quote-form-steps/`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-form-steps"] });
      setIsStepDialogOpen(false);
      setEditingStep(null);
      toast({
        title: "✅ Succès",
        description: editingStep ? "Étape modifiée avec succès" : "Étape créée avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  const optionMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      if (editingOption && editingOption.id) {
        return axios.patch(
          `${API_URL}/quote-form-options/${editingOption.id}/`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        return axios.post(
          `${API_URL}/quote-form-options/`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-form-steps"] });
      setIsOptionDialogOpen(false);
      setEditingOption(null);
      toast({
        title: "✅ Succès",
        description: editingOption ? "Option modifiée avec succès" : "Option créée avec succès",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/quote-form-steps/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-form-steps"] });
      toast({
        title: "✅ Succès",
        description: "Étape supprimée avec succès",
        variant: "default",
      });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/quote-form-options/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quote-form-steps"] });
      toast({
        title: "✅ Succès",
        description: "Option supprimée avec succès",
        variant: "default",
      });
    },
  });

  const handleEditStep = (step: any) => {
    setEditingStep(step);
    setIsStepDialogOpen(true);
  };

  const handleAddOption = (step: any, parentOption: any = null) => {
    setEditingOption({ step: step.id, parent: parentOption?.id || null });
    setIsOptionDialogOpen(true);
  };

  const handleEditOption = (option: any) => {
    setEditingOption(option);
    setIsOptionDialogOpen(true);
  };

  const handleNewStep = () => {
    if (!selectedService) {
      toast({
        title: "⚠️ Service requis",
        description: "Veuillez d'abord sélectionner un service",
        variant: "destructive",
      });
      return;
    }
    setEditingStep({ service: selectedService });
    setIsStepDialogOpen(true);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#DC2626]">Formulaires de devis</h1>
            <p className="text-gray-600 mt-1">
              Configurez les étapes et options des formulaires de devis pour chaque service
            </p>
          </div>
          <Button
            onClick={handleNewStep}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
          >
            <FaPlus className="mr-2" />
            Nouvelle étape
          </Button>
        </div>

        {/* Sélection du service */}
        <Card>
          <CardHeader>
            <CardTitle>Sélectionner un service</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedService?.toString() || ""}
              onValueChange={(value) => setSelectedService(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Sélectionnez un service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service: any) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Liste des étapes */}
        <Card>
          <CardHeader>
            <CardTitle>
              Étapes du formulaire
              {selectedService && stepsData && ` (${stepsData.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedService ? (
              <p className="text-gray-500 text-center py-8">
                Veuillez sélectionner un service pour voir ses étapes
              </p>
            ) : stepsData?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucune étape configurée pour ce service. Cliquez sur "Nouvelle étape" pour commencer.
              </p>
            ) : (
              <div className="space-y-4">
                {stepsData?.map((step: any) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStepExpanded(step.id)}
                        >
                          {expandedSteps[step.id] ? (
                            <FaChevronDown className="w-4 h-4" />
                          ) : (
                            <FaChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                            <Badge variant={step.active ? "default" : "secondary"}>
                              {step.active ? "Actif" : "Inactif"}
                            </Badge>
                            <Badge variant="outline">Ordre: {step.order}</Badge>
                            <Badge variant="outline">{step.step_type}</Badge>
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Clé: <code className="bg-gray-100 px-1 rounded">{step.field_key}</code>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(step)}
                        >
                          <FaPlus className="mr-1" />
                          Option
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStep(step)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStepMutation.mutate(step.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>

                    {/* Options de l'étape */}
                    {expandedSteps[step.id] && (
                      <div className="mt-4 ml-8 border-t pt-4">
                        <OptionsList
                          stepId={step.id}
                          onEdit={handleEditOption}
                          onDelete={(id) => deleteOptionMutation.mutate(id)}
                          onAddSubOption={handleAddOption}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour créer/modifier une étape */}
        <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStep?.id ? "Modifier l'étape" : "Nouvelle étape"}
              </DialogTitle>
              <DialogDescription>
                Configurez une étape du formulaire de devis
              </DialogDescription>
            </DialogHeader>
            <StepForm
              step={editingStep}
              services={services}
              onSubmit={(data) => stepMutation.mutate(data)}
              onCancel={() => {
                setIsStepDialogOpen(false);
                setEditingStep(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog pour créer/modifier une option */}
        <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOption?.id ? "Modifier l'option" : "Nouvelle option"}
              </DialogTitle>
              <DialogDescription>
                Configurez une option avec son prix
              </DialogDescription>
            </DialogHeader>
            <OptionForm
              option={editingOption}
              steps={stepsData || []}
              onSubmit={(data) => optionMutation.mutate(data)}
              onCancel={() => {
                setIsOptionDialogOpen(false);
                setEditingOption(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Composant pour afficher la liste des options avec hiérarchie infinie
function OptionsList({
  stepId,
  onEdit,
  onDelete,
  onAddSubOption,
  parentId = null,
  level = 0,
}: {
  stepId: number;
  onEdit: (option: any) => void;
  onDelete: (id: number) => void;
  onAddSubOption?: (step: any, parentOption?: any) => void;
  parentId?: number | null;
  level?: number;
}) {
  const [expandedOptions, setExpandedOptions] = useState<Record<number, boolean>>({});
  
  const { data: optionsData, isLoading } = useQuery({
    queryKey: ["admin-quote-form-options", stepId, parentId],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const url = parentId
        ? `${API_URL}/quote-form-options/?step=${stepId}&parent=${parentId}`
        : `${API_URL}/quote-form-options/?step=${stepId}&parent__isnull=true`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.results || res.data || [];
    },
  });

  const options = optionsData || [];

  if (isLoading) {
    return <p className="text-sm text-gray-500">Chargement des options...</p>;
  }

  if (!options || options.length === 0) {
    if (level === 0) {
      return (
        <p className="text-sm text-gray-500">
          Aucune option configurée. Cliquez sur "Option" pour en ajouter une.
        </p>
      );
    }
    return null;
  }

  return (
    <div className={level > 0 ? `ml-6 border-l-2 border-gray-200 pl-4 mt-2` : ""}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={level > 0 ? "w-8" : ""}></TableHead>
            <TableHead>Libellé</TableHead>
            <TableHead>Valeur</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Prix activé</TableHead>
            <TableHead>Ordre</TableHead>
            <TableHead>État</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((option: any) => {
            const hasSubOptions = option.sub_options && option.sub_options.length > 0;
            const isExpanded = expandedOptions[option.id] || false;
            
            return (
              <React.Fragment key={option.id}>
                <TableRow>
                  <TableCell>
                    {hasSubOptions && (
                      <button
                        onClick={() => setExpandedOptions(prev => ({ ...prev, [option.id]: !prev[option.id] }))}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? <FaChevronDown className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {level > 0 && <span className="text-gray-400 mr-2">└─</span>}
                    {option.label}
                  </TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{option.value}</code>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    € {parseFloat(option.price || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {option.price_enabled !== false ? (
                      <Badge variant="default" className="bg-green-500">Oui</Badge>
                    ) : (
                      <Badge variant="secondary">Non</Badge>
                    )}
                  </TableCell>
                  <TableCell>{option.order}</TableCell>
                  <TableCell>
                    {option.active ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onAddSubOption && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddSubOption({ id: stepId }, option)}
                          title="Ajouter une sous-option"
                        >
                          <FaPlus className="w-3 h-3" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => onEdit(option)}>
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(option.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && hasSubOptions && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <OptionsList
                        stepId={stepId}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onAddSubOption={onAddSubOption}
                        parentId={option.id}
                        level={level + 1}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Formulaire pour créer/modifier une étape
function StepForm({
  step,
  services,
  onSubmit,
  onCancel,
}: {
  step: any;
  services: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    service: step?.service || "",
    step_type: step?.step_type || "SINGLE_CHOICE",
    title: step?.title || "",
    description: step?.description || "",
    order: step?.order || 0,
    required: step?.required !== undefined ? step.required : true,
    field_key: step?.field_key || "",
    active: step?.active !== undefined ? step.active : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      service: parseInt(formData.service),
      order: parseInt(formData.order.toString()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="service">Service *</Label>
        <Select
          value={formData.service.toString()}
          onValueChange={(value) => setFormData({ ...formData, service: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id.toString()}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="step_type">Type d'étape *</Label>
        <Select
          value={formData.step_type}
          onValueChange={(value) => setFormData({ ...formData, step_type: value })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STEP_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Quel type d'aide souhaitez-vous ?"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Instructions optionnelles pour cette étape"
        />
      </div>

      <div>
        <Label htmlFor="field_key">Clé du champ *</Label>
        <Input
          id="field_key"
          value={formData.field_key}
          onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
          placeholder="Ex: typeAide, besoins, destinataire"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Cette clé sera utilisée pour stocker la réponse dans la base de données
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="order">Ordre d'affichage *</Label>
          <Input
            id="order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            required
            min="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="required"
            checked={formData.required}
            onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
          />
          <Label htmlFor="required">Obligatoire</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
          <Label htmlFor="active">Actif</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="bg-[#DC2626] hover:bg-[#B91C1C]">
          {step?.id ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
}

// Formulaire pour créer/modifier une option
function OptionForm({
  option,
  steps,
  onSubmit,
  onCancel,
}: {
  option: any;
  steps: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  // Initialiser le champ step correctement
  const getStepId = () => {
    if (!option) return "";
    if (typeof option.step === 'number') return option.step.toString();
    if (typeof option.step === 'object' && option.step?.id) return option.step.id.toString();
    if (typeof option.step === 'string') return option.step;
    return "";
  };

  const getParentId = () => {
    if (!option) return "";
    if (typeof option.parent === 'number') return option.parent.toString();
    if (typeof option.parent === 'object' && option.parent?.id) return option.parent.id.toString();
    if (typeof option.parent === 'string') return option.parent;
    if (option.parent_id) return option.parent_id.toString();
    return "";
  };

  const [formData, setFormData] = useState({
    step: getStepId(),
    parent: getParentId(),
    label: option?.label || "",
    value: option?.value || "",
    price: option?.price || "0.00",
    price_enabled: option?.price_enabled !== undefined ? option.price_enabled : true,
    order: option?.order || 0,
    active: option?.active !== undefined ? option.active : true,
    allow_custom_text: option?.allow_custom_text || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Valider que step est bien rempli
    if (!formData.step || formData.step === "") {
      alert("Veuillez sélectionner une étape");
      return;
    }
    const stepId = typeof formData.step === 'number' ? formData.step : parseInt(formData.step.toString());
    if (isNaN(stepId)) {
      alert("L'étape sélectionnée n'est pas valide");
      return;
    }
    onSubmit({
      ...formData,
      step: stepId,
      parent: formData.parent ? parseInt(formData.parent.toString()) : null,
      price: parseFloat(formData.price.toString()),
      order: parseInt(formData.order.toString()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="option_step">Étape *</Label>
        <Select
          value={formData.step ? formData.step.toString() : ""}
          onValueChange={(value) => setFormData({ ...formData, step: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une étape" />
          </SelectTrigger>
          <SelectContent>
            {steps && steps.length > 0 ? (
              steps.map((step) => (
                <SelectItem key={step.id} value={step.id.toString()}>
                  {step.title} ({step.service_name || step.service})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>Aucune étape disponible</SelectItem>
            )}
          </SelectContent>
        </Select>
        {!formData.step && (
          <p className="text-xs text-red-500 mt-1">Veuillez sélectionner une étape</p>
        )}
      </div>

      {option?.id && (
        <div>
          <Label htmlFor="option_parent">Option parente (optionnel)</Label>
          <Input
            id="option_parent"
            type="number"
            value={formData.parent}
            onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
            placeholder="ID de l'option parente (laisser vide pour une option principale)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Entrez l'ID de l'option parente pour créer une sous-option. Laissez vide pour une option principale.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="option_label">Libellé *</Label>
        <Input
          id="option_label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="Ex: Ménage et entretien"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Texte affiché à l'utilisateur</p>
      </div>

      <div>
        <Label htmlFor="option_value">Valeur *</Label>
        <Input
          id="option_value"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder="Ex: menage"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Valeur stockée dans la base de données</p>
      </div>

      <div>
        <Label htmlFor="option_price">Prix (€) *</Label>
        <Input
          id="option_price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="0.00"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Montant en euros. Le système ajoutera automatiquement "€" devant le montant.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="option_price_enabled"
          checked={formData.price_enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, price_enabled: checked })}
        />
        <Label htmlFor="option_price_enabled">Prix activé</Label>
        <p className="text-xs text-gray-500">
          Si activé, le prix sera ajouté au total. Si désactivé, le prix sera ignoré même s'il est défini.
        </p>
      </div>

      <div>
        <Label htmlFor="option_order">Ordre d'affichage</Label>
        <Input
          id="option_order"
          type="number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          min="0"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="option_active"
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
          <Label htmlFor="option_active">Actif</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="option_allow_custom"
            checked={formData.allow_custom_text}
            onCheckedChange={(checked) => setFormData({ ...formData, allow_custom_text: checked })}
          />
          <Label htmlFor="option_allow_custom">Permettre texte personnalisé</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="bg-[#DC2626] hover:bg-[#B91C1C]">
          {option?.id ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
}

