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
import { FaSpinner, FaArrowLeft, FaArrowRight, FaCheckCircle, FaChevronRight } from "react-icons/fa";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

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
  serviceId?: number;
  localisation: string;
  typeAide?: string;
  typeAideAutre?: string;
  sousTypeAide?: string;
  sousTypeAideAutre?: string;
  besoins: string[];
  besoinAutre?: string;
  destinataire?: string;
  contact: ContactFormData;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<QuoteFormData>>({
    besoins: [],
    typeAideAutre: "",
    sousTypeAideAutre: "",
    besoinAutre: "",
  });

  // Récupérer le service ID depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const serviceIdParam = urlParams.get("service");

  // Récupérer tous les services depuis l'API
  const { data: servicesData } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/services/`);
      return response.data.results || [];
    },
  });

  // Récupérer le service pré-sélectionné
  const selectedService = servicesData?.find((s: any) => s.id === parseInt(serviceIdParam || "0"));

  // Initialiser le service si fourni dans l'URL
  useEffect(() => {
    if (selectedService && !formData.serviceId) {
      setFormData((prev) => ({ ...prev, serviceId: selectedService.id }));
      // Passer directement à l'étape 2 si le service est déjà sélectionné
      if (currentStep === 1) {
        setCurrentStep(2);
      }
    }
  }, [selectedService]);


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

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const fullData = {
        service: formData.serviceId,
        location: formData.localisation || "",
        location_lat: null,
        location_lng: null,
        client_name: data.nom,
        client_email: data.email,
        client_phone: data.telephone,
        additional_info: {
          typeAide: formData.typeAide === "Autre" ? formData.typeAideAutre : formData.typeAide,
          typeAideOriginal: formData.typeAide,
          sousTypeAide: formData.sousTypeAide === "Autre" ? formData.sousTypeAideAutre : formData.sousTypeAide,
          sousTypeAideOriginal: formData.sousTypeAide,
          besoins: formData.besoins?.map(b => b === "Autre" ? formData.besoinAutre || "Autre" : b) || [],
          besoinAutre: formData.besoinAutre,
          destinataire: formData.destinataire,
          message: data.message,
        },
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
    if (!formData.serviceId) {
      toast({
        title: "⚠️ Service requis",
        description: "Veuillez sélectionner un service.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.localisation) {
      toast({
        title: "⚠️ Localisation requise",
        description: "Veuillez indiquer votre localisation.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(data);
  };

  // Navigation entre les étapes
  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
    switch (currentStep) {
      case 1:
        return !!formData.localisation && formData.localisation.trim().length > 0;
      case 2:
        return !!formData.serviceId;
      case 3:
        // Si "Autre" est sélectionné, on doit avoir un texte
        if (formData.typeAide === "Autre") {
          return !!(formData.typeAideAutre && formData.typeAideAutre.trim().length > 0);
        }
        return !!formData.typeAide;
      case 4:
        // Si le type d'aide a des sous-types, on doit en sélectionner un
        if (formData.typeAide && typesAide[formData.typeAide]?.sousTypes) {
          // Si "Autre" est sélectionné comme sous-type, on doit avoir un texte
          if (formData.sousTypeAide === "Autre") {
            return !!(formData.sousTypeAideAutre && formData.sousTypeAideAutre.trim().length > 0);
          }
          return !!formData.sousTypeAide;
        }
        return true; // Pas de sous-types, on peut continuer
      case 5:
        // Si "Autre" est dans les besoins, on doit avoir un texte
        if (formData.besoins && formData.besoins.includes("Autre")) {
          return !!(formData.besoinAutre && formData.besoinAutre.trim().length > 0);
        }
        return !!(formData.besoins && formData.besoins.length > 0);
      case 6:
        return !!formData.destinataire;
      case 7:
        return true; // Le formulaire de contact gère sa propre validation
      default:
        return false;
    }
  };

  const services = servicesData || [];

  return (
    <div className="min-h-screen bg-white pt-20 overflow-x-hidden w-full max-w-full">
      {/* Header Section */}
      <section className="relative py-8 sm:py-10 md:py-12 lg:py-16 bg-[#DC2626] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 mb-6 text-white hover:bg-white/20"
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
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
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
            <p className="text-sm text-white/80">Étape {currentStep} sur 7</p>
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
                  {currentStep === 3 && "Votre situation"}
                  {currentStep === 4 && "Quel type d'aide souhaitez-vous ?"}
                  {currentStep === 5 && "Quels sont vos besoins d'aide à domicile ?"}
                  {currentStep === 6 && "À qui est destinée notre aide ?"}
                  {currentStep === 7 && "Vos coordonnées"}
                </CardTitle>
                <CardDescription className="text-base">
                  {currentStep === 1 && "Indiquez votre localisation pour voir les services disponibles dans votre région"}
                  {currentStep === 2 && "Sélectionnez le service qui vous intéresse"}
                  {currentStep === 3 && "Parlez-nous un peu de vous ! Ces informations nous serviront à affiner votre devis."}
                  {currentStep === 4 && "Choisissez le type d'aide qui correspond à vos besoins"}
                  {currentStep === 5 && "Sélectionnez tous les besoins qui s'appliquent à votre situation"}
                  {currentStep === 6 && "Indiquez pour qui vous faites cette demande"}
                  {currentStep === 7 && "Indiquez-nous comment vous contacter et c'est terminé !"}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {services.map((service: any) => (
                        <motion.button
                          key={service.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, serviceId: service.id })}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                            formData.serviceId === service.id
                              ? "border-[#DC2626] bg-[#DC2626]/10 shadow-md"
                              : "border-gray-200 hover:border-[#DC2626]/50 hover:bg-[#DC2626]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{service.name}</span>
                            {formData.serviceId === service.id && (
                              <FaCheckCircle className="w-5 h-5 text-[#DC2626]" />
                            )}
                          </div>
                          {service.short_description && (
                            <p className="text-sm text-gray-600 mt-2">{service.short_description}</p>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3: Type d'aide */}
                {currentStep === 3 && (
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
                              ? "border-[#DC2626] bg-[#DC2626]/10 shadow-md"
                              : "border-gray-200 hover:border-[#DC2626]/50 hover:bg-[#DC2626]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{type}</span>
                            {formData.typeAide === type && (
                              <FaCheckCircle className="w-5 h-5 text-[#DC2626]" />
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
                              ? "border-[#DC2626] bg-[#DC2626]/10 shadow-md"
                              : "border-gray-200 hover:border-[#DC2626]/50 hover:bg-[#DC2626]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{sousType}</span>
                            {formData.sousTypeAide === sousType && (
                              <FaCheckCircle className="w-5 h-5 text-[#DC2626]" />
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
                            ? "border-[#DC2626] bg-[#DC2626]/10 shadow-md"
                            : "border-gray-200 hover:border-[#DC2626]/50 hover:bg-[#DC2626]/5"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">Autre</span>
                          {formData.sousTypeAide === "Autre" && (
                            <FaCheckCircle className="w-5 h-5 text-[#DC2626]" />
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
                              ? "border-[#DC2626] bg-[#DC2626]/10 shadow-md"
                              : "border-gray-200 hover:border-[#DC2626]/50 hover:bg-[#DC2626]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{besoin}</span>
                            {formData.besoins?.includes(besoin) && (
                              <FaCheckCircle className="w-5 h-5 text-[#DC2626]" />
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
                              ? "border-[#DC2626] bg-[#DC2626]/10 shadow-md"
                              : "border-gray-200 hover:border-[#DC2626]/50 hover:bg-[#DC2626]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold text-gray-900">{dest.label}</span>
                            {formData.destinataire === dest.value && (
                              <FaCheckCircle className="w-5 h-5 text-[#DC2626]" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ÉTAPE 7: Coordonnées */}
                {currentStep === 7 && (
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
                        className="flex-1 h-12 text-base border-gray-300 hover:bg-gray-50"
                      >
                        <FaArrowLeft className="w-4 h-4 mr-2" />
                        Précédent
                      </Button>
                      <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-1 h-12 text-base bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2"
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

                {/* Navigation (sauf étape 7 qui a son propre formulaire) */}
                {currentStep !== 7 && (
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="flex-1 h-12 text-base border-gray-300 hover:bg-gray-50"
                    >
                      <FaArrowLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="flex-1 h-12 text-base bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Dialog de succès */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-900">
              Demande envoyée avec succès
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700 pt-2">
              Votre demande de devis a été transmise avec succès. Notre équipe vous contactera rapidement pour discuter de votre projet et vous proposer une solution adaptée à vos besoins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                reset();
                setFormData({ besoins: [] });
                setCurrentStep(1);
                setShowSuccessDialog(false);
                setLocationState("/");
              }}
              className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold"
            >
              D'accord
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
