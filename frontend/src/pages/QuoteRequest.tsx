import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FaSpinner, FaArrowLeft, FaArrowRight, FaCheckCircle, FaChevronRight, FaChevronDown, FaChevronUp, FaInfoCircle } from "react-icons/fa";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/config/api";

// Schéma de validation pour les coordonnées finales
const contactSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(8, "Le téléphone doit contenir au moins 8 caractères"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Types pour les étapes du formulaire
interface QuoteFormData {
  serviceId?: number | null;
  localisation: string;
  typeAide?: string;
  typeAideAutre?: string;
  sousTypeAide?: string;
  sousTypeAideAutre?: string;
  besoins: string[];
  besoinAutre?: string;
  destinataire?: string;
  contact: ContactFormData;
  customServiceType?: string;
}

// Types d'aide disponibles
const typesAide: Record<string, { label: string; sousTypes?: string[] }> = {
  "Aide aux personnes âgées": {
    label: "Aide aux personnes âgées",
    sousTypes: ["Accompagnement du handicap", "Retour d'hospitalisation", "Maintien à domicile", "Soins à domicile"],
  },
  "Garde d'enfants": {
    label: "Garde d'enfants",
    sousTypes: ["Garde régulière", "Baby-sitting ponctuel", "Aide aux devoirs", "Sortie d'école"],
  },
  "Ménage et entretien": {
    label: "Ménage et entretien",
    sousTypes: ["Ménage régulier", "Ménage ponctuel", "Repassage", "Nettoyage après travaux"],
  },
  "Jardinage": {
    label: "Jardinage",
    sousTypes: ["Entretien régulier", "Aménagement paysager", "Taille et élagage"],
  },
  "Autre": {
    label: "Autre",
  },
};

// Besoins d'aide à domicile
const besoinsAide: string[] = [
  "Toilette",
  "Aide au repas",
  "Livraison de repas",
  "Ménage",
  "Accompagnement quotidien",
  "Soins médicaux",
  "Transport",
  "Courses",
  "Autre",
];

// Destinataires
const destinataires = [
  { value: "moi", label: "Pour vous" },
  { value: "parent", label: "Pour un parent" },
  { value: "autre", label: "Pour quelqu'un d'autre" },
];

export default function QuoteRequest() {
  const { toast } = useToast();
  const [location, setLocationState] = useLocation();
  
  // Récupérer l'étape depuis le localStorage ou utiliser 1 par défaut
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem('quoteRequest_currentStep');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  
  // Sauvegarder l'étape dans le localStorage à chaque changement
  const updateCurrentStep = (step: number) => {
    setCurrentStep(step);
    localStorage.setItem('quoteRequest_currentStep', step.toString());
  };
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState<Partial<QuoteFormData>>({
    besoins: [],
    typeAideAutre: "",
    sousTypeAideAutre: "",
    besoinAutre: "",
    customServiceType: "", // Pour le type de service personnalisé si "Autre" est sélectionné
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ContactFormData | null>(null);

  // Récupérer le service ID depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const serviceIdParam = urlParams.get("service");

  // Récupérer tous les services depuis l'API
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/services/`);
      const services = response.data.results || response.data || [];
      // console.log('Services récupérés:', services);
      return services;
    },
  });

  // S'assurer que servicesData est toujours un tableau
  const services = Array.isArray(servicesData) ? servicesData : [];
  
  // console.log('Services à afficher:', services);

  // Récupérer le service pré-sélectionné
  const selectedService = services.find((s: any) => s.id === parseInt(serviceIdParam || "0"));

  // Récupérer les étapes du formulaire pour le service sélectionné
  const { data: formStepsData, isLoading: isLoadingSteps } = useQuery({
    queryKey: ["quote-form-steps", formData.serviceId],
    queryFn: async () => {
      if (!formData.serviceId) return [];
      const response = await axios.get(`${API_URL}/quote-form-steps/?service=${formData.serviceId}`);
      const steps = response.data.results || response.data || [];
      // console.log('Étapes récupérées depuis l\'API:', steps);
      return steps;
    },
    enabled: !!formData.serviceId,
  });

  // Trier les étapes par ordre et filtrer les actives
  const formSteps = (formStepsData || [])
    .filter((step: any) => step.active)
    .sort((a: any, b: any) => a.order - b.order);

  // Calculer le nombre total d'étapes
  // Structure : Localisation (1) + Service (2) + Sous-services (3, tous affichés ensemble) + Contact (4)
  // Si pas de service sélectionné ou pas de sous-services, on passe directement de Service (2) à Contact (3)
  const totalSteps = (formData.serviceId && formSteps.length > 0) ? 4 : 3; // Localisation + Service + Sous-services + Contact
  
  // Debug: afficher les étapes chargées
  useEffect(() => {
    if (formData.serviceId && formSteps.length > 0) {
      // console.log('Étapes chargées pour le service:', formData.serviceId, formSteps);
      // formSteps.forEach((step: any) => {
      //   console.log(`Étape ${step.order}: ${step.title} (${step.step_type}) - Options:`, step.options?.length || 0);
      // });
    }
  }, [formSteps, formData.serviceId]);

  // Initialiser le service si fourni dans l'URL (mais toujours commencer par l'étape 1 - localisation)
  useEffect(() => {
    if (selectedService && !formData.serviceId) {
      setFormData((prev) => ({ ...prev, serviceId: selectedService.id }));
      // Ne pas sauter l'étape de localisation - l'utilisateur doit toujours renseigner sa localisation en premier
      // L'étape 1 (localisation) sera toujours affichée en premier
    }
  }, [selectedService]);

  // S'assurer que currentStep ne dépasse pas totalSteps
  useEffect(() => {
    if (currentStep > totalSteps && totalSteps > 0) {
      updateCurrentStep(totalSteps);
    }
  }, [totalSteps, currentStep]);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      message: "",
    },
  });

  // Calcul du prix total en additionnant les prix des options sélectionnées
  const calculateTotalPrice = (): number => {
    let total = 0;

    // Si show_pricing est masqué, ne pas calculer de prix du tout
    const selectedService = services.find((s: any) => s.id === formData.serviceId);
    if (selectedService?.show_pricing === false) {
      return 0;
    }

    // Prix de base du service
    if (selectedService?.price_per_hour) {
      total += parseFloat(selectedService.price_per_hour) || 0;
    }

    // Additionner les prix des options sélectionnées
    formSteps.forEach((step: any) => {
      const fieldKey = step.field_key;
      const value = (formData as any)[fieldKey];
      const activeOptions = (step.options || []).filter((opt: any) => opt.active);
      
      if (step.step_type === 'SINGLE_CHOICE' && value) {
        const selectedOption = activeOptions.find((opt: any) => opt.value === value);
        if (selectedOption && selectedOption.price_enabled && selectedOption.price) {
          total += parseFloat(selectedOption.price) || 0;
        }
      } else if (step.step_type === 'MULTIPLE_CHOICE' && Array.isArray(value)) {
        value.forEach((val: string) => {
          const selectedOption = activeOptions.find((opt: any) => opt.value === val);
          if (selectedOption && selectedOption.price_enabled && selectedOption.price) {
            total += parseFloat(selectedOption.price) || 0;
          }
        });
      }
    });
    
    return total;
  };
  
  const totalPrice = calculateTotalPrice();

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Construire additional_info avec les field_key des étapes dynamiques
      const additionalInfo: any = {
        message: data.message,
      };
      
      // Ajouter le type de service personnalisé si "Autre" est sélectionné
      if (!formData.serviceId && formData.customServiceType) {
        additionalInfo.custom_service_type = formData.customServiceType;
      }
      
      // Ajouter les réponses des étapes dynamiques
      formSteps.forEach((step: any) => {
        const fieldKey = step.field_key;
        const value = (formData as any)[fieldKey];
        if (value !== undefined && value !== null && value !== "") {
          additionalInfo[fieldKey] = value;
        }
      });
      
      const fullData = {
        service: formData.serviceId || null,
        location: formData.localisation || "",
        location_lat: null,
        location_lng: null,
        client_name: data.nom,
        client_email: data.email,
        client_phone: data.telephone,
        additional_info: additionalInfo,
        calculated_price: totalPrice > 0 ? totalPrice.toFixed(2) : "0.00", // Envoyer le prix calculé
      };
      const response = await axios.post(`${API_URL}/quote-requests/`, fullData);
      return response.data;
    },
    onSuccess: () => {
      setShowSuccessDialog(true);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    if (!formData.localisation) {
      toast({
        title: "⚠️ Localisation requise",
        description: "Veuillez indiquer votre localisation.",
        variant: "destructive",
      });
      return;
    }
    // Stocker les données et ouvrir le popup de confirmation
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    if (pendingFormData) {
      // Vérifier que si "Autre" est sélectionné, le type de service est renseigné
      if (formData.serviceId === null && formData.customServiceType !== undefined && !formData.customServiceType?.trim()) {
        toast({
          title: "⚠️ Type de service requis",
          description: "Veuillez préciser le type de service personnalisé.",
          variant: "destructive",
        });
        setShowConfirmDialog(false);
        setPendingFormData(null);
        return;
      }
      mutation.mutate(pendingFormData);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    }
  };

  // Navigation entre les étapes
  const nextStep = () => {
    if (currentStep === 2 && !formData.serviceId) {
      // Si on est à l'étape 2 et qu'aucun service n'est sélectionné, passer directement aux coordonnées (étape 3)
      updateCurrentStep(3);
    } else if (currentStep < totalSteps) {
      updateCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      updateCurrentStep(currentStep - 1);
    }
  };

  // Gestion de la sélection des besoins (multi-sélection)
  const toggleBesoin = (besoin: string) => {
    const currentBesoins = formData.besoins || [];
    if (currentBesoins.includes(besoin)) {
      // Si on désélectionne "Autre", on vide aussi le champ texte
      const newBesoins = currentBesoins.filter((b) => b !== besoin);
      setFormData({
        ...formData,
        besoins: newBesoins,
        besoinAutre: besoin === "Autre" ? "" : formData.besoinAutre,
      });
    } else {
      setFormData({
        ...formData,
        besoins: [...currentBesoins, besoin],
        besoinAutre: besoin === "Autre" ? "" : formData.besoinAutre,
      });
    }
  };

  // Vérification si on peut passer à l'étape suivante
  const canProceed = (): boolean => {
    if (currentStep === 1) {
      // Étape localisation - obligatoire
      return !!formData.localisation && formData.localisation.trim().length > 0;
    } else if (currentStep === 2) {
      // Étape sélection du service - optionnel, on peut continuer même sans service
      return true;
    } else if (currentStep === totalSteps) {
      // Dernière étape (contact) - le formulaire gère sa propre validation
      return true;
    } else {
      // Étapes dynamiques - vérifier toutes les étapes obligatoires
      // Si aucun service n'est sélectionné, on peut passer directement aux coordonnées
      if (!formData.serviceId) {
        return true;
      }
      
      const requiredSteps = formSteps.filter((step: any) => step.required);
      
      if (requiredSteps.length === 0) {
        return true; // Aucune étape obligatoire
      }
      
      // Vérifier que toutes les étapes obligatoires ont une réponse
      return requiredSteps.every((step: any) => {
        const fieldKey = step.field_key;
        const value = (formData as any)[fieldKey];
        
        if (step.step_type === 'MULTIPLE_CHOICE') {
          return Array.isArray(value) && value.length > 0;
        } else if (step.step_type === 'TEXT_INPUT') {
          return !!(value && value.trim().length > 0);
        } else {
          return !!value;
        }
      });
    }
  };


  return (
    <div className="min-h-screen bg-white pt-20 overflow-x-hidden w-full max-w-full">
      {/* Header Section */}
      <section className="relative py-8 sm:py-10 md:py-12 lg:py-16 bg-site-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 mb-6 text-white hover:bg-white/20 hover:text-white"
            >
              <FaArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2">
              Demandez votre <span className="text-[#FFD700]">devis gratuit</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6 px-2">
              Répondez à quelques questions pour obtenir un devis personnalisé
            </p>
            
            {/* Progress Bar */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step <= currentStep
                      ? "bg-[#FFD700] w-8"
                      : "bg-white/30 w-2"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-white/80">Étape {currentStep} sur {totalSteps}</p>
            {/* Affichage du prix calculé (seulement si show_pricing actif) */}
            {totalPrice > 0 && formData.serviceId && (() => {
              const sel = services.find((s: any) => s.id === formData.serviceId);
              return sel?.show_pricing !== false;
            })() && (
              <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 inline-block">
                <p className="text-sm text-white/90 mb-1">Prix estimé</p>
                <p className="text-2xl font-bold text-[#FFD700]">
                  {totalPrice.toFixed(2)} €
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-gray-200 shadow-xl bg-white">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {currentStep === 1 && "Où êtes-vous situé ?"}
                  {currentStep === 2 && "Comment pouvons-nous vous aider ?"}
                  {currentStep === 3 && formData.serviceId && formSteps.length > 0 && "Sélectionnez vos sous-services et options"}
                  {((currentStep === 3 && (!formData.serviceId || formSteps.length === 0)) || currentStep === 4) && "Vos coordonnées"}
                </CardTitle>
                <CardDescription className="text-base">
                  {currentStep === 1 && "Indiquez votre localisation pour voir les services disponibles dans votre région"}
                  {currentStep === 2 && "Sélectionnez le service qui vous intéresse (optionnel)"}
                  {currentStep === 3 && formData.serviceId && formSteps.length > 0 && "Cliquez sur chaque sous-service pour voir et sélectionner ses options"}
                  {((currentStep === 3 && (!formData.serviceId || formSteps.length === 0)) || currentStep === 4) && "Indiquez-nous comment vous contacter et c'est terminé !"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* ÉTAPE 1: Localisation avec Google Maps Places */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2 relative">
                      <Label htmlFor="localisation" className="text-base font-semibold text-gray-700">
                        Votre localisation *
                      </Label>
                      <Input
                        id="localisation"
                        value={formData.localisation || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, localisation: e.target.value });
                        }}
                        placeholder="Ex: France, Côte d'Ivoire, Abidjan, Cocody..."
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-gray-500">
                        Indiquez votre ville, région ou pays
                      </p>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 2: Service */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    {isLoadingServices ? (
                      <div className="text-center py-8">
                        <FaSpinner className="w-8 h-8 animate-spin mx-auto mb-4 text-site-primary" />
                        <p className="text-gray-500">Chargement des services...</p>
                      </div>
                    ) : services.length === 0 ? (
                      <div className="text-center py-8 bg-blue-50 border border-blue-200 rounded-lg">
                        <FaInfoCircle className="w-8 h-8 mx-auto mb-4 text-blue-600" />
                        <p className="text-sm text-blue-800 font-semibold mb-2">
                          Aucun service disponible pour le moment
                        </p>
                        <p className="text-xs text-blue-700 mb-3">
                          Vous pouvez continuer sans sélectionner de service pour créer un devis personnalisé.
                        </p>
                        <p className="text-xs text-blue-600">
                          Cliquez sur "Suivant" pour continuer avec vos informations personnelles.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note :</strong> La sélection d'un service est optionnelle. Vous pouvez continuer sans sélectionner de service pour créer un devis personnalisé.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {services.map((service: any) => (
                            <motion.button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, serviceId: service.id, customServiceType: "" });
                              }}
                              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                                formData.serviceId === service.id
                                  ? "border-site-primary bg-site-primary/10 shadow-md"
                                  : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">{service.name}</span>
                                {formData.serviceId === service.id && (
                                  <FaCheckCircle className="w-5 h-5 text-site-primary" />
                                )}
                              </div>
                              {service.short_description && (
                                <p className="text-sm text-gray-600 mt-2">{service.short_description}</p>
                              )}
                            </motion.button>
                          ))}
                          {/* Option "Autre" pour service personnalisé */}
                          <motion.button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, serviceId: null, customServiceType: formData.customServiceType || "" });
                            }}
                            className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                              formData.serviceId === null
                                ? "border-site-primary bg-site-primary/10 shadow-md"
                                : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">Autre</span>
                              {formData.serviceId === null && (
                                <FaCheckCircle className="w-5 h-5 text-site-primary" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">Service personnalisé</p>
                          </motion.button>
                        </div>
                        {/* Champ pour le type de service personnalisé si "Autre" est sélectionné */}
                        {formData.serviceId === null && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 p-4 bg-gray-50 border-2 border-site-primary/30 rounded-lg"
                          >
                            <Label htmlFor="customServiceType" className="text-base font-semibold text-gray-700 mb-2 block">
                              Précisez le type de service *
                            </Label>
                            <Input
                              id="customServiceType"
                              value={formData.customServiceType || ""}
                              onChange={(e) => setFormData({ ...formData, customServiceType: e.target.value })}
                              placeholder="Ex: Rénovation, Déménagement, Événementiel..."
                              className="h-12 text-base"
                              required
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              Décrivez le type de service dont vous avez besoin
                            </p>
                          </motion.div>
                        )}
                        {formData.serviceId && isLoadingSteps && (
                          <div className="text-center py-4">
                            <FaSpinner className="w-6 h-6 animate-spin mx-auto mb-2 text-site-primary" />
                            <p className="text-sm text-gray-500">Chargement des options...</p>
                          </div>
                        )}
                        {formData.serviceId && !isLoadingSteps && formSteps.length === 0 && (
                          <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              Aucune étape configurée pour ce service. Vous pouvez continuer directement aux coordonnées.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ÉTAPES DYNAMIQUES - AFFICHAGE EN LISTE HIÉRARCHIQUE */}
                {currentStep === 3 && formData.serviceId && formSteps.length > 0 && (() => {
                  // console.log('Affichage étape 3:', {
                  //   currentStep,
                  //   totalSteps,
                  //   formStepsLength: formSteps.length,
                  //   serviceId: formData.serviceId,
                  //   isLoadingSteps,
                  //   formStepsData
                  // });
                  
                  if (isLoadingSteps) {
                    return (
                      <div className="text-center py-8">
                        <FaSpinner className="w-8 h-8 animate-spin mx-auto mb-4 text-site-primary" />
                        <p className="text-gray-500">Chargement des sous-services...</p>
                      </div>
                    );
                  }
                  
                  if (formSteps.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Aucun sous-service configuré pour ce service.</p>
                        <p className="text-sm text-gray-400">Vous pouvez continuer directement aux coordonnées.</p>
                      </div>
                    );
                  }
                  
                  // Afficher toutes les étapes en liste avec leurs options
                  return (
                    <div className="space-y-4">
                      <p className="text-gray-700 mb-4">
                        Sélectionnez les sous-services et options qui vous intéressent :
                      </p>
                      {formSteps.map((step: any) => {
                        const fieldKey = step.field_key;
                        // Initialiser à undefined si pas de valeur (pas de sélection par défaut)
                        const currentValue = (formData as any)[fieldKey] !== undefined ? (formData as any)[fieldKey] : undefined;
                        const activeOptions = (step.options || []).filter((opt: any) => opt.active).sort((a: any, b: any) => a.order - b.order);
                        const isExpanded = expandedSteps[step.id] || false;
                        
                        return (
                          <div key={step.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* En-tête de l'étape (sous-service) */}
                            <button
                              type="button"
                              onClick={() => setExpandedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                              className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                            >
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <FaChevronDown className="w-5 h-5 text-site-primary" />
                                ) : (
                                  <FaChevronRight className="w-5 h-5 text-site-primary" />
                                )}
                                <div>
                                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                                  {step.description && (
                                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                  )}
                                </div>
                              </div>
                              {step.required && (
                                <Badge variant="outline" className="text-xs">Obligatoire</Badge>
                              )}
                            </button>
                            
                            {/* Options de l'étape (sous-options) */}
                            {isExpanded && (
                              <div className="p-4 bg-white border-t border-gray-200">
                                {activeOptions.length === 0 ? (
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    Aucune option disponible pour ce sous-service.
                                  </p>
                                ) : (
                                  <div className="space-y-3">
                                    {step.step_type === 'SINGLE_CHOICE' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {activeOptions.map((option: any) => {
                                          // Pour SINGLE_CHOICE : une seule option peut être sélectionnée
                                          // Comparer strictement les valeurs (string ou number)
                                          const isSelected = currentValue !== undefined && String(currentValue) === String(option.value);
                                          return (
                                            <motion.button
                                              key={`${step.id}-${option.id}`}
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // Utiliser la fonction de mise à jour pour éviter les problèmes de référence
                                                // Vérifier directement dans le handler si cette option est sélectionnée
                                                setFormData((prev: any) => {
                                                  const prevValue = prev[fieldKey];
                                                  const currentOptionValue = String(option.value);
                                                  // Si cette option est déjà sélectionnée, on la désélectionne
                                                  if (prevValue !== undefined && String(prevValue) === currentOptionValue) {
                                                    const newData = { ...prev };
                                                    delete newData[fieldKey];
                                                    return newData;
                                                  } else {
                                                    // Sinon, on sélectionne cette option (et désélectionne les autres automatiquement)
                                                    return { ...prev, [fieldKey]: option.value };
                                                  }
                                                });
                                              }}
                                              className={`p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                                                isSelected
                                                  ? "border-site-primary bg-site-primary/10 shadow-md"
                                                  : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                                              }`}
                                              whileHover={{ scale: 1.02 }}
                                              whileTap={{ scale: 0.98 }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                  <span className="font-semibold text-gray-900 block">{option.label}</span>
                                                  {option.price && option.price_enabled && parseFloat(option.price) > 0 && (
                                                    <span className="text-sm text-site-primary font-semibold mt-1 block">
                                                      +{parseFloat(option.price).toFixed(2)} €
                                                    </span>
                                                  )}
                                                </div>
                                                {isSelected && (
                                                  <FaCheckCircle className="w-5 h-5 text-site-primary ml-2" />
                                                )}
                                              </div>
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    )}
                                    
                                    {step.step_type === 'MULTIPLE_CHOICE' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {activeOptions.map((option: any) => {
                                          const selectedValues = Array.isArray(currentValue) ? currentValue : [];
                                          const isSelected = selectedValues.includes(option.value);
                                          return (
                                            <motion.button
                                              key={option.id}
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // Toggle : ajouter si pas sélectionné, retirer si déjà sélectionné
                                                // Utiliser la fonction de mise à jour pour obtenir la valeur actuelle
                                                setFormData((prev: any) => {
                                                  const prevValue = prev[fieldKey];
                                                  const currentValuesArray = Array.isArray(prevValue) ? [...prevValue] : [];
                                                  const isCurrentlySelected = currentValuesArray.includes(option.value);
                                                  const newValues = isCurrentlySelected
                                                    ? currentValuesArray.filter((v: string) => v !== option.value)
                                                    : [...currentValuesArray, option.value];
                                                  // Ne pas stocker un tableau vide, utiliser undefined
                                                  return { ...prev, [fieldKey]: newValues.length > 0 ? newValues : undefined };
                                                });
                                              }}
                                              className={`p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                                                isSelected
                                                  ? "border-site-primary bg-site-primary/10 shadow-md"
                                                  : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                                              }`}
                                              whileHover={{ scale: 1.02 }}
                                              whileTap={{ scale: 0.98 }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                  <span className="font-semibold text-gray-900 block">{option.label}</span>
                                                  {option.price && option.price_enabled && parseFloat(option.price) > 0 && (
                                                    <span className="text-sm text-site-primary font-semibold mt-1 block">
                                                      +{parseFloat(option.price).toFixed(2)} €
                                                    </span>
                                                  )}
                                                </div>
                                                {isSelected && (
                                                  <FaCheckCircle className="w-5 h-5 text-site-primary ml-2" />
                                                )}
                                              </div>
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    )}
                                    
                                    {step.step_type === 'TEXT_INPUT' && (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={currentValue || ""}
                                          onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                          placeholder="Votre réponse..."
                                          rows={4}
                                          className="text-base resize-none"
                                          required={step.required}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Champ texte personnalisé si autorisé */}
                                    {activeOptions.some((opt: any) => opt.allow_custom_text) && currentValue && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mt-4"
                                      >
                                        <Label htmlFor={`${fieldKey}_custom`} className="text-base font-semibold text-gray-700 mb-2 block">
                                          Précisions (optionnel)
                                        </Label>
                                        <Input
                                          id={`${fieldKey}_custom`}
                                          value={(formData as any)[`${fieldKey}_custom`] || ""}
                                          onChange={(e) => setFormData({ ...formData, [`${fieldKey}_custom`]: e.target.value })}
                                          placeholder="Ajoutez des précisions si nécessaire"
                                          className="h-12 text-base"
                                        />
                                      </motion.div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Affichage du prix total calculé */}
                      {totalPrice > 0 && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-site-primary/10 to-site-primary/5 rounded-lg border-2 border-site-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">Prix total estimé</span>
                            <span className="text-2xl font-bold text-site-primary">
                              {totalPrice.toFixed(2)} €
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            * Prix indicatif, le montant final peut varier selon vos besoins spécifiques
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ÉTAPE 3: Type d'aide (ANCIEN - À SUPPRIMER) */}
                {false && currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                      Quel type d'aide souhaitez-vous ?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.keys(typesAide).map((type) => (
                        <motion.button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, typeAide: type, typeAideAutre: "", sousTypeAide: undefined })}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                            formData.typeAide === type
                              ? "border-site-primary bg-site-primary/10 shadow-md"
                              : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{type}</span>
                            {formData.typeAide === type && (
                              <FaCheckCircle className="w-5 h-5 text-site-primary" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {/* Champ de texte pour "Autre" */}
                    {formData.typeAide === "Autre" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <Label htmlFor="typeAideAutre" className="text-base font-semibold text-gray-700 mb-2 block">
                          Précisez le type d'aide *
                        </Label>
                        <Input
                          id="typeAideAutre"
                          value={formData.typeAideAutre || ""}
                          onChange={(e) => setFormData({ ...formData, typeAideAutre: e.target.value })}
                          placeholder="Ex: Assistance administrative, Cours particuliers..."
                          className="h-12 text-base"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ÉTAPE 4: Sous-type d'aide */}
                {currentStep === 4 && formData.typeAide && typesAide[formData.typeAide]?.sousTypes && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {typesAide[formData.typeAide].sousTypes!.map((sousType) => (
                        <motion.button
                          key={sousType}
                          type="button"
                          onClick={() => setFormData({ ...formData, sousTypeAide: sousType, sousTypeAideAutre: "" })}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                            formData.sousTypeAide === sousType
                              ? "border-site-primary bg-site-primary/10 shadow-md"
                              : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{sousType}</span>
                            {formData.sousTypeAide === sousType && (
                              <FaCheckCircle className="w-5 h-5 text-site-primary" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                      {/* Option "Autre" pour les sous-types */}
                      <motion.button
                        type="button"
                        onClick={() => setFormData({ ...formData, sousTypeAide: "Autre", sousTypeAideAutre: "" })}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                          formData.sousTypeAide === "Autre"
                            ? "border-site-primary bg-site-primary/10 shadow-md"
                            : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">Autre</span>
                          {formData.sousTypeAide === "Autre" && (
                            <FaCheckCircle className="w-5 h-5 text-site-primary" />
                          )}
                        </div>
                      </motion.button>
                    </div>
                    {/* Champ de texte pour "Autre" sous-type */}
                    {formData.sousTypeAide === "Autre" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <Label htmlFor="sousTypeAideAutre" className="text-base font-semibold text-gray-700 mb-2 block">
                          Précisez le sous-type d'aide *
                        </Label>
                        <Input
                          id="sousTypeAideAutre"
                          value={formData.sousTypeAideAutre || ""}
                          onChange={(e) => setFormData({ ...formData, sousTypeAideAutre: e.target.value })}
                          placeholder="Ex: Assistance spécifique..."
                          className="h-12 text-base"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ÉTAPE 5: Besoins */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <p className="text-gray-700 mb-4">
                      Sélectionnez tous les besoins qui s'appliquent :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {besoinsAide.map((besoin) => (
                        <motion.button
                          key={besoin}
                          type="button"
                          onClick={() => toggleBesoin(besoin)}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                            formData.besoins?.includes(besoin)
                              ? "border-site-primary bg-site-primary/10 shadow-md"
                              : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{besoin}</span>
                            {formData.besoins?.includes(besoin) && (
                              <FaCheckCircle className="w-5 h-5 text-site-primary" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    {/* Champ de texte pour "Autre" besoin */}
                    {formData.besoins?.includes("Autre") && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <Label htmlFor="besoinAutre" className="text-base font-semibold text-gray-700 mb-2 block">
                          Précisez votre besoin *
                        </Label>
                        <Input
                          id="besoinAutre"
                          value={formData.besoinAutre || ""}
                          onChange={(e) => setFormData({ ...formData, besoinAutre: e.target.value })}
                          placeholder="Ex: Assistance administrative, Accompagnement médical..."
                          className="h-12 text-base"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ÉTAPE 6: Destinataire */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {destinataires.map((dest) => (
                        <motion.button
                          key={dest.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, destinataire: dest.value })}
                          className={`p-6 rounded-lg border-2 transition-all duration-300 text-center ${
                            formData.destinataire === dest.value
                              ? "border-site-primary bg-site-primary/10 shadow-md"
                              : "border-gray-200 hover:border-site-primary/50 hover:bg-site-primary/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold text-gray-900">{dest.label}</span>
                            {formData.destinataire === dest.value && (
                              <FaCheckCircle className="w-5 h-5 text-site-primary" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ÉTAPE FINALE: Coordonnées */}
                {((currentStep === 3 && (!formData.serviceId || formSteps.length === 0)) || currentStep === 4) && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="nom" className="text-base font-semibold text-gray-700">
                        Nom complet *
                      </Label>
                      <Input
                        id="nom"
                        {...register("nom")}
                        placeholder="Votre nom complet"
                        className="h-12 text-base"
                      />
                      {errors.nom && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠</span> {errors.nom.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-semibold text-gray-700">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="votre@email.com"
                        className="h-12 text-base"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠</span> {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-base font-semibold text-gray-700">
                        Téléphone *
                      </Label>
                      <Input
                        id="telephone"
                        type="tel"
                        {...register("telephone")}
                        placeholder="+33 6 12 34 56 78"
                        className="h-12 text-base"
                      />
                      {errors.telephone && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠</span> {errors.telephone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-base font-semibold text-gray-700">
                        Message complémentaire *
                      </Label>
                      <Textarea
                        id="message"
                        {...register("message")}
                        placeholder="Décrivez vos besoins en détail..."
                        rows={6}
                        className="text-base resize-none"
                      />
                      {errors.message && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠</span> {errors.message.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="flex-1 h-12 text-base border-gray-300 hover:bg-gray-50 text-gray-700"
                      >
                        <FaArrowLeft className="w-4 h-4 mr-2" />
                        Précédent
                      </Button>
                      <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-1 h-12 text-base bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2"
                      >
                        {mutation.isPending ? (
                          <>
                            <FaSpinner className="w-5 h-5 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            Confirmer et envoyer
                            <FaChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Navigation (sauf dernière étape qui a son propre formulaire) */}
                {!((currentStep === 3 && (!formData.serviceId || formSteps.length === 0)) || currentStep === 4) && (
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="flex-1 h-12 text-base border-gray-300 hover:bg-gray-50 text-gray-700"
                    >
                      <FaArrowLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="flex-1 h-12 text-base bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                      <FaArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dialog de succès amélioré */}
      {/* Popup de confirmation personnalisé */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg bg-gradient-to-br from-white to-gray-50 border-2 border-site-primary/20 shadow-2xl">
          <div className="flex flex-col items-center text-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-br from-site-primary to-site-button-primary-hover rounded-full flex items-center justify-center mb-4 shadow-lg"
            >
              <FaInfoCircle className="w-8 h-8 text-white" />
            </motion.div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                Confirmer l'envoi du devis
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-700 pt-2 leading-relaxed text-left">
                <div className="space-y-3">
                  <p>Vous êtes sur le point d'envoyer votre demande de devis avec les informations suivantes :</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Localisation :</span>
                      <span className="text-gray-900">{formData.localisation || "Non renseignée"}</span>
                    </div>
                    {formData.serviceId ? (
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Service :</span>
                        <span className="text-gray-900">{services.find((s: any) => s.id === formData.serviceId)?.name || "Service sélectionné"}</span>
                      </div>
                    ) : formData.customServiceType ? (
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Service personnalisé :</span>
                        <span className="text-gray-900">{formData.customServiceType}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Service :</span>
                        <span className="text-gray-500 italic">Aucun service spécifié</span>
                      </div>
                    )}
                    {pendingFormData && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Nom :</span>
                          <span className="text-gray-900">{pendingFormData.nom}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Email :</span>
                          <span className="text-gray-900">{pendingFormData.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Téléphone :</span>
                          <span className="text-gray-900">{pendingFormData.telephone}</span>
                        </div>
                      </>
                    )}
                    {totalPrice > 0 && (
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-900">Prix estimé :</span>
                        <span className="text-xl font-bold text-site-primary">{totalPrice.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Voulez-vous confirmer l'envoi de cette demande ?
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-6 flex gap-3">
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingFormData(null);
              }}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Annuler
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={mutation.isPending}
              className="flex-1 bg-gradient-to-r from-site-button-primary to-site-button-primary-hover hover:from-site-button-primary-hover hover:to-site-button-primary text-site-button-text font-semibold py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {mutation.isPending ? (
                <>
                  <FaSpinner className="w-4 h-4 mr-2 animate-spin inline" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <FaCheckCircle className="w-4 h-4 mr-2 inline" />
                  Confirmer et envoyer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-lg bg-gradient-to-br from-white to-gray-50 border-2 border-site-primary/20 shadow-2xl">
          <div className="flex flex-col items-center text-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
            >
              <FaCheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Demande envoyée avec succès !
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-700 pt-2 leading-relaxed">
                Votre demande de devis a été transmise avec succès. Notre équipe vous contactera rapidement pour discuter de votre projet et vous proposer une solution adaptée à vos besoins.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {totalPrice > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-site-primary/10 to-site-primary/5 rounded-lg border border-site-primary/20 w-full">
                <p className="text-sm text-gray-600 mb-1">Prix estimé de votre demande</p>
                <p className="text-2xl font-bold text-site-primary">
                  {totalPrice.toFixed(2)} €
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction
              onClick={() => {
                reset();
                setFormData({ besoins: [] });
                updateCurrentStep(1);
                localStorage.removeItem('quoteRequest_currentStep');
                setShowSuccessDialog(false);
                setLocationState("/");
              }}
              className="w-full bg-gradient-to-r from-site-button-primary to-site-button-primary-hover hover:from-site-button-primary-hover hover:to-site-button-primary text-site-button-text font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Parfait, merci !
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
