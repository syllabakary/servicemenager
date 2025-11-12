import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Phone, Mail, Clock, MapPin, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Schéma de validation pour les coordonnées finales
const contactSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Types pour les étapes du formulaire
interface QuoteFormData {
  localisation: string;
  service: string;
  typeAide: string;
  sousTypeAide?: string;
  besoins: string[];
  destinataire: string;
  contact: ContactFormData;
}

// Services disponibles par région
const servicesByRegion: Record<string, string[]> = {
  "france": ["Ménage", "Mécanique", "Baby-sitting", "Jardinage", "Peinture", "Plomberie", "Électricité", "Repassage"],
  "côte d'ivoire": ["Ménage", "Garde d'enfants", "Jardinage", "Repassage", "Sécurité", "Déménagement", "Peinture"],
  "ivory coast": ["Ménage", "Garde d'enfants", "Jardinage", "Repassage", "Sécurité", "Déménagement", "Peinture"],
  "abidjan": ["Ménage", "Garde d'enfants", "Jardinage", "Repassage", "Sécurité", "Déménagement", "Peinture"],
  "bouaké": ["Ménage", "Garde d'enfants", "Jardinage", "Repassage", "Sécurité", "Déménagement"],
  "yamoussoukro": ["Ménage", "Garde d'enfants", "Jardinage", "Repassage", "Sécurité"],
  "san pedro": ["Ménage", "Garde d'enfants", "Jardinage", "Repassage", "Sécurité"],
  "default": ["Ménage", "Garde d'enfants", "Jardinage", "Repassage", "Peinture", "Sécurité"],
};

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
];

// Destinataires
const destinataires = [
  { value: "moi", label: "Pour vous" },
  { value: "parent", label: "Pour un parent" },
  { value: "autre", label: "Pour quelqu'un d'autre" },
];

export default function QuoteRequest() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<QuoteFormData>>({
    besoins: [],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
        ...data,
        ...formData,
      };
      const response = await apiRequest("POST", "/api/quote-requests", fullData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée !",
        description: "Nous vous contacterons rapidement pour discuter de votre projet.",
      });
      reset();
      setFormData({ besoins: [] });
      setCurrentStep(1);
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data);
  };

  // Fonction pour obtenir les services selon la localisation
  const getServicesForRegion = (localisation: string): string[] => {
    const locLower = localisation.toLowerCase().trim();
    
    // Vérification spécifique pour les villes de Côte d'Ivoire
    if (locLower.includes("abidjan")) {
      return servicesByRegion["abidjan"];
    } else if (locLower.includes("bouaké") || locLower.includes("bouake")) {
      return servicesByRegion["bouaké"];
    } else if (locLower.includes("yamoussoukro")) {
      return servicesByRegion["yamoussoukro"];
    } else if (locLower.includes("san pedro") || locLower.includes("san-pedro")) {
      return servicesByRegion["san pedro"];
    }
    
    // Vérification pour les pays
    if (locLower.includes("france") || locLower.includes("paris") || locLower.includes("lyon") || locLower.includes("marseille")) {
      return servicesByRegion["france"];
    } else if (locLower.includes("côte d'ivoire") || locLower.includes("cote d'ivoire") || locLower.includes("ivory coast") || locLower.includes("ci")) {
      return servicesByRegion["côte d'ivoire"];
    }
    
    // Par défaut, retourner les services génériques
    return servicesByRegion["default"];
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
      setFormData({
        ...formData,
        besoins: currentBesoins.filter((b) => b !== besoin),
      });
    } else {
      setFormData({
        ...formData,
        besoins: [...currentBesoins, besoin],
      });
    }
  };

  // Vérification si on peut passer à l'étape suivante
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!formData.localisation && formData.localisation.trim().length > 0;
      case 2:
        return !!formData.service;
      case 3:
        return !!formData.typeAide;
      case 4:
        // Si le type d'aide a des sous-types, on doit en sélectionner un
        if (formData.typeAide && typesAide[formData.typeAide]?.sousTypes) {
          return !!formData.sousTypeAide;
        }
        return true; // Pas de sous-types, on peut continuer
      case 5:
        return formData.besoins && formData.besoins.length > 0;
      case 6:
        return !!formData.destinataire;
      case 7:
        return true; // Le formulaire de contact gère sa propre validation
      default:
        return false;
    }
  };

  const services = formData.localisation ? getServicesForRegion(formData.localisation) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50/30 pt-20">
      {/* Header Section */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 mb-6 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Demandez votre <span className="text-[#FFD700]">devis gratuit</span>
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-6">
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
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
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
                {/* ÉTAPE 1: Localisation */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="localisation" className="text-base font-semibold text-gray-700">
                        Votre localisation *
                      </Label>
                      <Input
                        id="localisation"
                        value={formData.localisation || ""}
                        onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                        placeholder="Ex: France, Côte d'Ivoire, Abidjan..."
                        className="h-12 text-base"
                      />
                    </div>
                    {formData.localisation && services.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-[#A0522D]/5 rounded-lg border border-[#A0522D]/20"
                      >
                        <p className="text-sm font-semibold text-[#A0522D] mb-2">
                          Services disponibles dans votre région :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {services.map((service) => (
                            <Badge
                              key={service}
                              variant="outline"
                              className="bg-white border-[#A0522D]/30 text-[#A0522D]"
                            >
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ÉTAPE 2: Service */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <motion.button
                          key={service}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, service });
                            // Si le service correspond à un type d'aide, on le pré-remplit
                            if (service === "Garde d'enfants" || service === "Baby-sitting") {
                              setFormData((prev) => ({ ...prev, service, typeAide: "Garde d'enfants" }));
                            } else if (service === "Ménage") {
                              setFormData((prev) => ({ ...prev, service, typeAide: "Ménage et entretien" }));
                            } else {
                              setFormData((prev) => ({ ...prev, service }));
                            }
                          }}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                            formData.service === service
                              ? "border-[#A0522D] bg-[#A0522D]/10 shadow-md"
                              : "border-gray-200 hover:border-[#A0522D]/50 hover:bg-[#A0522D]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{service}</span>
                            {formData.service === service && (
                              <CheckCircle2 className="w-5 h-5 text-[#A0522D]" />
                            )}
                          </div>
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
                          onClick={() => setFormData({ ...formData, typeAide: type, sousTypeAide: undefined })}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                            formData.typeAide === type
                              ? "border-[#A0522D] bg-[#A0522D]/10 shadow-md"
                              : "border-gray-200 hover:border-[#A0522D]/50 hover:bg-[#A0522D]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{type}</span>
                            {formData.typeAide === type && (
                              <CheckCircle2 className="w-5 h-5 text-[#A0522D]" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
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
                          onClick={() => setFormData({ ...formData, sousTypeAide: sousType })}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                            formData.sousTypeAide === sousType
                              ? "border-[#A0522D] bg-[#A0522D]/10 shadow-md"
                              : "border-gray-200 hover:border-[#A0522D]/50 hover:bg-[#A0522D]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{sousType}</span>
                            {formData.sousTypeAide === sousType && (
                              <CheckCircle2 className="w-5 h-5 text-[#A0522D]" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
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
                              ? "border-[#A0522D] bg-[#A0522D]/10 shadow-md"
                              : "border-gray-200 hover:border-[#A0522D]/50 hover:bg-[#A0522D]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{besoin}</span>
                            {formData.besoins?.includes(besoin) && (
                              <CheckCircle2 className="w-5 h-5 text-[#A0522D]" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
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
                              ? "border-[#A0522D] bg-[#A0522D]/10 shadow-md"
                              : "border-gray-200 hover:border-[#A0522D]/50 hover:bg-[#A0522D]/5"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold text-gray-900">{dest.label}</span>
                            {formData.destinataire === dest.value && (
                              <CheckCircle2 className="w-5 h-5 text-[#A0522D]" />
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
                        Téléphone (optionnel)
                      </Label>
                      <Input
                        id="telephone"
                        type="tel"
                        {...register("telephone")}
                        placeholder="+33 6 12 34 56 78"
                        className="h-12 text-base"
                      />
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
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Précédent
                      </Button>
                      <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="flex-1 h-12 text-base bg-[#A0522D] hover:bg-[#8B4513] text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2"
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            Confirmer et envoyer
                            <ChevronRight className="w-5 h-5" />
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
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="flex-1 h-12 text-base bg-[#A0522D] hover:bg-[#8B4513] text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
