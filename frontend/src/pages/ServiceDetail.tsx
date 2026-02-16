import { useState } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  FaArrowLeft,
  FaStar,
  FaClock,
  FaShieldAlt,
  FaPaintBrush,
  FaTree,
  FaBaby,
  FaTruck,
  FaCheckCircle,
  FaUsers,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaCommentDots,
  FaAward,
  FaChartLine,
  FaInfoCircle,
  FaDollarSign,
  FaArrowRight,
  FaBroom,
  FaWrench,
  FaCar,
  FaHome,
  FaTools,
  FaHammer,
  FaCog,
  FaLaptop,
  FaGraduationCap,
  FaUtensils,
  FaDumbbell,
  FaMusic,
  FaDog,
  FaHeartbeat,
  FaTooth,
  FaCut,
  FaSwimmingPool,
  FaSnowflake,
  FaLightbulb,
  FaPlane,
  FaShip,
  FaBicycle,
  FaMotorcycle,
  FaBuilding,
  FaBriefcase,
  FaHandHoldingHeart,
  FaUserTie,
  FaChalkboardTeacher,
  FaLaptopCode,
  FaCamera,
  FaVideo,
  FaMicrophone,
  FaGamepad,
  FaBook,
  FaShoppingCart,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/config/api";

const iconMap: Record<string, any> = {
  Sparkles: HiSparkles,
  Baby: FaBaby,
  TreeDeciduous: FaTree,
  Paintbrush: FaPaintBrush,
  Shield: FaShieldAlt,
  Truck: FaTruck,
  Broom: FaBroom,
  Wrench: FaWrench,
  Car: FaCar,
  Home: FaHome,
  Tools: FaTools,
  Hammer: FaHammer,
  Cog: FaCog,
  Laptop: FaLaptop,
  GraduationCap: FaGraduationCap,
  Utensils: FaUtensils,
  Dumbbell: FaDumbbell,
  Music: FaMusic,
  Dog: FaDog,
  Heartbeat: FaHeartbeat,
  Tooth: FaTooth,
  Cut: FaCut,
  SwimmingPool: FaSwimmingPool,
  Snowflake: FaSnowflake,
  Lightbulb: FaLightbulb,
  Plane: FaPlane,
  Ship: FaShip,
  Bicycle: FaBicycle,
  Motorcycle: FaMotorcycle,
  Building: FaBuilding,
  Briefcase: FaBriefcase,
  HandHoldingHeart: FaHandHoldingHeart,
  UserTie: FaUserTie,
  ChalkboardTeacher: FaChalkboardTeacher,
  LaptopCode: FaLaptopCode,
  Camera: FaCamera,
  Video: FaVideo,
  Microphone: FaMicrophone,
  Gamepad: FaGamepad,
  Book: FaBook,
  ShoppingCart: FaShoppingCart,
};

// 🔍 Mapping des mots-clés vers les icônes
const keywordIconMap: Array<{ keywords: string[]; icon: any }> = [
  // Ménage et nettoyage
  { keywords: ['ménage', 'menage', 'nettoyage', 'nettoyer', 'ménagère', 'menagere', 'aspirateur', 'aspirateuse', 'repassage', 'repasser', 'lavage', 'laver', 'vitres', 'fenêtres', 'fenetres', 'sol', 'solage', 'balai', 'serpillère', 'serpillere'], icon: FaBroom },
  
  // Garde d'enfants
  { keywords: ['enfant', 'enfants', 'bébé', 'bebe', 'baby', 'nounou', 'nounous', 'garde', 'babysitting', 'babysitter', 'crèche', 'creche', 'puericulture', 'puériculture'], icon: FaBaby },
  
  // Jardinage
  { keywords: ['jardin', 'jardinage', 'jardiner', 'pelouse', 'tonte', 'tondre', 'taille', 'tailler', 'arbres', 'arbuste', 'fleurs', 'fleur', 'plante', 'plantation', 'paysagiste', 'paysage', 'gazon', 'verdure'], icon: FaTree },
  
  // Peinture
  { keywords: ['peinture', 'peindre', 'peintre', 'pinceau', 'rouleau', 'enduit', 'enduire', 'façade', 'facade', 'mur', 'murs', 'décoration', 'decoration', 'décorateur', 'decorateur'], icon: FaPaintBrush },
  
  // Sécurité
  { keywords: ['sécurité', 'securite', 'sécurisation', 'securisation', 'surveillance', 'alarme', 'caméra', 'camera', 'vigilance', 'protection', 'protéger', 'protéger', 'gardiennage', 'garde', 'sécuritaire'], icon: FaShieldAlt },
  
  // Déménagement
  { keywords: ['déménagement', 'demenagement', 'déménager', 'demenager', 'transport', 'transporter', 'camion', 'cartons', 'carton', 'emballage', 'emballer', 'livraison', 'livrer', 'colis'], icon: FaTruck },
  
  // Mécanique
  { keywords: ['mécanique', 'mecanique', 'mécanicien', 'mecanicien', 'réparation', 'reparation', 'réparer', 'reparer', 'garage', 'voiture', 'automobile', 'moteur', 'moteurs', 'entretien auto', 'vidange', 'pneu', 'pneus', 'frein', 'freins'], icon: FaWrench },
  
  // Automobile
  { keywords: ['auto', 'automobile', 'voiture', 'véhicule', 'vehicule', 'conduite', 'chauffeur', 'taxi', 'uber', 'location voiture'], icon: FaCar },
  
  // Bricolage
  { keywords: ['bricolage', 'bricoler', 'bricoleur', 'réparation', 'reparation', 'réparer', 'reparer', 'outil', 'outils', 'perceuse', 'visseuse', 'scie', 'marteau', 'clou', 'vis'], icon: FaTools },
  
  // Plomberie
  { keywords: ['plomberie', 'plombier', 'eau', 'robinet', 'robinets', 'canalisation', 'canalisations', 'fuite', 'fuites', 'chauffe-eau', 'chauffe eau', 'sanitaire', 'sanitaires', 'douche', 'bain', 'lavabo'], icon: FaWrench },
  
  // Électricité
  { keywords: ['électricité', 'electricite', 'électricien', 'electricien', 'électrique', 'electrique', 'éclairage', 'eclairage', 'ampoule', 'ampoules', 'lumière', 'lumiere', 'interrupteur', 'interrupteurs', 'prise', 'prises', 'tableau électrique'], icon: FaLightbulb },
  
  // Chauffage
  { keywords: ['chauffage', 'chauffer', 'chaudière', 'chaudiere', 'radiateur', 'radiateurs', 'chauffagiste', 'climatisation', 'climatiseur', 'ventilation', 'ventilateur'], icon: FaSnowflake },
  
  // Informatique
  { keywords: ['informatique', 'ordinateur', 'ordinateurs', 'pc', 'laptop', 'portable', 'réparation pc', 'reparation pc', 'dépannage informatique', 'depannage informatique', 'installation', 'logiciel', 'logiciels', 'système', 'systeme', 'windows', 'mac', 'linux'], icon: FaLaptop },
  
  // Programmation
  { keywords: ['programmation', 'programmer', 'développement', 'developpement', 'développeur', 'developpeur', 'code', 'coding', 'web', 'site', 'application', 'app', 'mobile', 'android', 'ios', 'javascript', 'python', 'java'], icon: FaLaptopCode },
  
  // Enseignement
  { keywords: ['cours', 'enseignement', 'enseigner', 'professeur', 'prof', 'professeur particulier', 'soutien scolaire', 'aide aux devoirs', 'devoirs', 'mathématiques', 'mathematiques', 'français', 'francais', 'anglais', 'langue', 'langues', 'formation', 'apprendre'], icon: FaChalkboardTeacher },
  
  // Cuisine
  { keywords: ['cuisine', 'cuisiner', 'cuisinier', 'chef', 'repas', 'cooking', 'recette', 'recettes', 'restaurant', 'traiteur', 'catering', 'service traiteur'], icon: FaUtensils },
  
  // Sport
  { keywords: ['sport', 'sportif', 'fitness', 'gym', 'musculation', 'entraînement', 'entrainement', 'coach', 'coaching', 'salle de sport', 'yoga', 'pilates', 'course', 'running', 'vélo', 'velo', 'natation'], icon: FaDumbbell },
  
  // Musique
  { keywords: ['musique', 'musical', 'instrument', 'instruments', 'piano', 'guitare', 'violon', 'cours de musique', 'professeur de musique', 'musicien', 'chanteur', 'chant'], icon: FaMusic },
  
  // Animaux
  { keywords: ['animal', 'animaux', 'chien', 'chiens', 'chat', 'chats', 'vétérinaire', 'veterinaire', 'veto', 'promenade', 'promener', 'garde animal', 'pension', 'toilettage', 'toiletter'], icon: FaDog },
  
  // Santé
  { keywords: ['santé', 'sante', 'médecin', 'medecin', 'infirmier', 'infirmière', 'infirmiere', 'soins', 'soigner', 'aide soignant', 'aide-soignant', 'auxiliaire', 'hospitalier', 'médical', 'medical', 'santé à domicile'], icon: FaHeartbeat },
  
  // Dentaire
  { keywords: ['dent', 'dents', 'dentaire', 'dentiste', 'hygiène dentaire', 'hygiene dentaire', 'blanchiment', 'orthodontie'], icon: FaTooth },
  
  // Coiffure
  { keywords: ['coiffure', 'coiffeur', 'coiffeuse', 'salon', 'coupe', 'couper', 'cheveux', 'cheveu', 'coloration', 'mèche', 'meche', 'balayage', 'brushing', 'permanente'], icon: FaCut },
  
  // Piscine
  { keywords: ['piscine', 'piscines', 'nettoyage piscine', 'entretien piscine', 'bassin', 'spa', 'jacuzzi', 'hammam'], icon: FaSwimmingPool },
  
  // Voyage
  { keywords: ['voyage', 'voyager', 'avion', 'vol', 'vols', 'aéroport', 'aeroport', 'tourisme', 'touriste', 'vacances'], icon: FaPlane },
  
  // Bateau
  { keywords: ['bateau', 'bateaux', 'navire', 'maritime', 'marin', 'navigation', 'port', 'voilier', 'yacht'], icon: FaShip },
  
  // Vélo
  { keywords: ['vélo', 'velo', 'vélos', 'velos', 'bicyclette', 'bicyclettes', 'cyclisme', 'cycliste', 'réparation vélo', 'reparation velo'], icon: FaBicycle },
  
  // Moto
  { keywords: ['moto', 'motos', 'motocyclette', 'motard', 'scooter', 'scooters', 'réparation moto', 'reparation moto'], icon: FaMotorcycle },
  
  // Immobilier
  { keywords: ['immobilier', 'immobilier', 'maison', 'maisons', 'appartement', 'appartements', 'location', 'louer', 'vente', 'vendre', 'agent immobilier', 'agence immobilière', 'agence immobiliere'], icon: FaBuilding },
  
  // Bureautique
  { keywords: ['bureau', 'bureaux', 'secrétaire', 'secretaire', 'assistant', 'assistante', 'secrétariat', 'secretariat', 'comptabilité', 'comptabilite', 'comptable', 'administration'], icon: FaBriefcase },
  
  // Aide à domicile
  { keywords: ['aide à domicile', 'aide a domicile', 'aide domicile', 'accompagnement', 'accompagner', 'personne âgée', 'personne agee', 'senior', 'seniors', 'maintien à domicile', 'maintien a domicile'], icon: FaHandHoldingHeart },
  
  // Services professionnels
  { keywords: ['professionnel', 'professionnels', 'expert', 'experts', 'conseil', 'conseiller', 'consultant', 'consultants', 'service professionnel'], icon: FaUserTie },
  
  // Photographie
  { keywords: ['photo', 'photos', 'photographie', 'photographe', 'photographe', 'shooting', 'mariage', 'portrait', 'événement', 'evenement'], icon: FaCamera },
  
  // Vidéo
  { keywords: ['vidéo', 'video', 'vidéos', 'videos', 'caméraman', 'cameraman', 'tournage', 'montage', 'film', 'films', 'cinéma', 'cinema'], icon: FaVideo },
  
  // Audio
  { keywords: ['audio', 'son', 'sons', 'enregistrement', 'studio', 'micro', 'microphone', 'podcast', 'radio'], icon: FaMicrophone },
  
  // Jeux
  { keywords: ['jeu', 'jeux', 'gaming', 'gamer', 'console', 'consoles', 'playstation', 'xbox', 'nintendo', 'esport', 'e-sport'], icon: FaGamepad },
  
  // Livres
  { keywords: ['livre', 'livres', 'bibliothèque', 'bibliotheque', 'lecture', 'lire', 'écrivain', 'ecrivain', 'auteur', 'auteurs', 'librairie'], icon: FaBook },
  
  // Shopping
  { keywords: ['achat', 'achats', 'shopping', 'courses', 'course', 'magasin', 'magasins', 'commerce', 'commerçant', 'commercant', 'boutique', 'boutiques'], icon: FaShoppingCart },
];

// 🎯 Fonction pour détecter l'icône appropriée selon les mots-clés
function getServiceIcon(serviceName: string, serviceDescription: string = ''): any {
  const text = `${serviceName} ${serviceDescription}`.toLowerCase();
  
  // Parcourir les mappings de mots-clés
  for (const mapping of keywordIconMap) {
    if (mapping.keywords.some(keyword => text.includes(keyword))) {
      return mapping.icon;
    }
  }
  
  // Si aucun mot-clé n'est trouvé, retourner l'icône par défaut
  return HiSparkles;
}

// Données mockées pour les services
const mockServices = [
  {
    id: 1,
    nom: "Nettoyage résidentiel",
    description: "Un service complet pour que votre maison brille du sol au plafond.",
    icone: "Sparkles",
  },
  {
    id: 2,
    nom: "Garde d'enfants à domicile",
    description: "Des nounous qualifiées et bienveillantes pour prendre soin de vos petits trésors.",
    icone: "Baby",
  },
  {
    id: 3,
    nom: "Entretien de jardin",
    description: "Confiez vos espaces verts à nos experts pour un jardin toujours éclatant.",
    icone: "TreeDeciduous",
  },
  {
    id: 4,
    nom: "Peinture intérieure",
    description: "Rafraîchissez votre intérieur avec des finitions modernes et durables.",
    icone: "Paintbrush",
  },
  {
    id: 5,
    nom: "Sécurité & Surveillance",
    description: "Protégez votre foyer ou votre entreprise avec nos solutions connectées.",
    icone: "Shield",
  },
  {
    id: 6,
    nom: "Déménagement facile",
    description: "Nous prenons soin de vos biens du départ à l'arrivée, sans stress.",
    icone: "Truck",
  },
];

// Mock data enrichi
const mockServiceDetails: Record<number, any> = {
  1: {
    id: 1,
    nom: "Nettoyage résidentiel",
    icone: "Sparkles",
    description:
      "Un service complet pour que votre maison brille du sol au plafond. Nos professionnels utilisent des produits écologiques et des techniques éprouvées pour un résultat impeccable. Chaque intervention est personnalisée selon vos besoins spécifiques.",
    prix: "À partir de 25€",
    prixDetail: "25€/heure",
    duree: "2-4 heures",
    note: 4.8,
    nombreAvis: 1245,
    prestations: [
      "Nettoyage complet des sols (aspiration, lavage)",
      "Dépoussiérage approfondi du mobilier",
      "Nettoyage des vitres intérieures",
      "Désinfection complète des surfaces",
      "Nettoyage cuisine & sanitaires",
      "Remise en ordre générale",
    ],
    avantages: [
      "Produits écologiques certifiés",
      "Personnel formé et équipé",
      "Satisfaction garantie",
      "Assurance tous risques",
    ],
    processus: [
      {
        titre: "Évaluation gratuite",
        description: "Nous évaluons vos besoins et vous proposons un devis personnalisé",
      },
      {
        titre: "Planification",
        description: "Choisissez la date et l'heure qui vous conviennent le mieux",
      },
      {
        titre: "Intervention",
        description: "Nos professionnels interviennent avec leur matériel",
      },
      {
        titre: "Satisfaction",
        description: "Contrôle qualité et garantie satisfaction à 100%",
      },
    ],
    avis: [
      { nom: "Marie D.", note: 5, commentaire: "Excellent service, très professionnel ! Ma maison n'a jamais été aussi propre.", date: "Il y a 2 jours" },
      { nom: "Pierre L.", note: 5, commentaire: "Très satisfait du résultat. Personnel ponctuel et efficace.", date: "Il y a 1 semaine" },
      { nom: "Sophie M.", note: 4, commentaire: "Bon service, je recommande. Petit bémol sur l'horaire mais sinon parfait.", date: "Il y a 2 semaines" },
      { nom: "Jean R.", note: 5, commentaire: "Impeccable ! Les produits écologiques sont un vrai plus.", date: "Il y a 3 semaines" },
    ],
    faq: [
      {
        question: "Dois-je fournir les produits de nettoyage ?",
        reponse: "Non, nos professionnels apportent tous les produits et équipements nécessaires.",
      },
      {
        question: "Puis-je être présent pendant le nettoyage ?",
        reponse: "Oui, vous pouvez être présent ou nous confier vos clés en toute sécurité.",
      },
    ],
  },
};

export default function ServiceDetail() {
  const params = useParams();
  const serviceSlug = params.id;
  const [activeTab, setActiveTab] = useState<"prestations" | "avis" | "faq">("prestations");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    client_name: "",
    client_email: "",
    rating: 5,
    comment: "",
  });

  // Récupérer le service depuis l'API
  const { data: service, isLoading } = useQuery({
    queryKey: ["service", serviceSlug],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/services/?slug=${serviceSlug}`);
      const data = await response.json();
      return data.results?.[0] || null;
    },
    enabled: !!serviceSlug,
  });

  // Récupérer les avis approuvés
  const { data: reviews = [] } = useQuery({
    queryKey: ["service-reviews", service?.id],
    queryFn: async () => {
      if (!service?.id) return [];
      const response = await fetch(`${API_URL}/service-reviews/?service=${service.id}&approved=true`);
      const data = await response.json();
      // Filtrer les avis qui doivent être affichés (display_on_page !== false)
      return (data.results || []).filter((review: any) => review.display_on_page !== false);
    },
    enabled: !!service?.id,
  });

  // Récupérer les FAQ actives
  const { data: faqs = [] } = useQuery({
    queryKey: ["service-faqs", service?.id],
    queryFn: async () => {
      if (!service?.id) return [];
      const response = await fetch(`${API_URL}/service-faqs/?service=${service.id}&active=true`);
      const data = await response.json();
      return data.results || [];
    },
    enabled: !!service?.id,
  });

  // Mutation pour créer un avis
  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_URL}/service-reviews/`, {
        ...data,
        service: service?.id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-reviews", service?.id] });
      queryClient.invalidateQueries({ queryKey: ["service", serviceSlug] });
      toast({
        title: "✅ Merci !",
        description: "Votre avis a été soumis et sera examiné avant publication.",
        variant: "success",
      });
      setShowReviewForm(false);
      setReviewForm({ client_name: "", client_email: "", rating: 5, comment: "" });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.client_name || !reviewForm.comment) {
      toast({
        title: "⚠️ Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate(reviewForm);
  };

  // Récupérer les services similaires
  const { data: similarServicesData } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/services/?active=true`);
      const data = await response.json();
      return data.results || [];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service non trouvé</h1>
          <Link href="/services">
            <Button>Retour aux services</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Déterminer l'icône du service selon les mots-clés
  const Icon = getServiceIcon(
    service.name || '',
    `${service.short_description || ''} ${service.detailed_description || ''}`
  );
  const similarServices = (similarServicesData || [])
    .filter((s: any) => s.id !== service.id && s.active)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full max-w-full">
      {/* HEADER STICKY */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
            <Link href="/services">
              <Button
                variant="ghost"
              className="gap-2 text-gray-600 hover:text-site-text-link hover:bg-site-primary/5"
              >
              <FaArrowLeft className="w-4 h-4" />
                Retour aux services
              </Button>
            </Link>
        </div>
      </motion.header>

      {/* HERO SECTION */}
      <section className="relative py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Image du service en haut si disponible */}
          {service.image_url && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 sm:mb-12"
            >
              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-site-primary/10 text-site-text-primary border-site-primary/20">
                <FaChartLine className="w-3 h-3 mr-1" />
                Service populaire
              </Badge>
              
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                {!service.image_url && (
                  <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex items-center justify-center rounded-2xl bg-red-50 shadow-lg border border-red-200">
                    <Icon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-site-primary" />
                </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h1>
                  {service.rating && (
                  <div className="flex items-center gap-2 text-yellow-500">
                      <FaStar className="w-5 h-5 fill-site-primary text-site-primary" />
                      <span className="text-lg font-bold text-gray-900">{service.rating}</span>
                      {service.review_count > 0 && (
                        <span className="text-gray-600">({service.review_count} avis)</span>
                      )}
                  </div>
                  )}
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {service.detailed_description || service.short_description}
              </p>

              {/* Quick info cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {service.duration && (
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <FaClock className="w-4 h-4 text-site-primary" />
                    <span className="text-sm font-medium">Durée</span>
                  </div>
                    <p className="text-lg font-bold text-gray-900">{service.duration}</p>
                </div>
                )}
                {(service.price_label || service.price_per_hour) && (
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <FaDollarSign className="w-4 h-4 text-site-primary" />
                    <span className="text-sm font-medium">Tarif</span>
                  </div>
                    <p className="text-lg font-bold text-gray-900">
                      {service.price_label || (service.price_per_hour ? `À partir de ${service.price_per_hour}${service.currency === 'EUR' ? '€' : service.currency === 'USD' ? '$' : ' FCFA'}/heure` : "")}
                    </p>
                </div>
                )}
              </div>

              {/* Caractéristiques */}
              {service.features && service.features.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                  {service.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <FaCheckCircle className="w-4 h-4 text-site-primary flex-shrink-0" />
                      <span>{feature}</span>
                  </div>
                ))}
              </div>
              )}
            </motion.div>

            {/* Right: Booking Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-2xl bg-white overflow-hidden">
                <div className="bg-site-button-primary p-6 text-site-button-text">
                  <h3 className="text-2xl font-bold mb-2">Réservez maintenant</h3>
                  <p className="text-white/90">Obtenez un devis gratuit et personnalisé</p>
                </div>
                
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-sm text-gray-600 font-medium">À partir de</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Meilleur prix
                        </Badge>
                      </div>
                      <p className="text-4xl font-bold text-site-text-primary mb-1">
                        {service.price_label || (service.price_per_hour ? `À partir de ${service.price_per_hour}${service.currency === 'EUR' ? '€' : service.currency === 'USD' ? '$' : ' FCFA'}` : "Sur devis")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {service.price_per_hour ? "par heure • " : ""}Devis gratuit
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Link href={`/devis?service=${service.id}`}>
                        <Button className="w-full h-14 bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
                          <FaCalendar className="w-5 h-5 mr-2" />
                        Réserver maintenant
                      </Button>
                      </Link>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <a href={`tel:${service.contact_phone || '+2250123456789'}`}>
                          <Button variant="outline" className="w-full h-12 border-2 border-gray-200 hover:border-site-primary hover:bg-site-primary/5">
                            <FaPhone className="w-4 h-4 mr-2" />
                          Appeler
                        </Button>
                        </a>
                        <Link href="/contact">
                          <Button variant="outline" className="w-full h-12 border-2 border-gray-200 hover:border-site-primary hover:bg-site-primary/5">
                            <FaCommentDots className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {service.guarantees && service.guarantees.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                      {service.guarantees.map((guarantee: string, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-sm text-gray-600 mb-3 last:mb-0">
                          <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span>{guarantee}</span>
                    </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="w-5 h-5 text-site-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Besoin d'aide ?
                        </p>
                        <p className="text-sm text-gray-600">
                          Notre équipe est disponible 7j/7 pour répondre à vos questions.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT - TABS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-3 mb-8 border-b border-gray-200 pb-4">
            <button
              onClick={() => setActiveTab("prestations")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "prestations"
                  ? "bg-site-button-primary text-site-button-text shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Prestations incluses
            </button>
            {service.show_reviews !== false && (
            <button
              onClick={() => setActiveTab("avis")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "avis"
                    ? "bg-site-button-primary text-site-button-text shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
                Avis clients {service.review_count > 0 && `(${service.review_count})`}
            </button>
            )}
            {service.show_faq !== false && (
            <button
              onClick={() => setActiveTab("faq")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "faq"
                    ? "bg-site-button-primary text-site-button-text shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Questions fréquentes
            </button>
            )}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {activeTab === "prestations" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {service.included_services && service.included_services.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Ce qui est inclus
                    </h3>
                    <ul className="space-y-4">
                        {service.included_services.map((prestation: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-site-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FaCheckCircle className="w-4 h-4 text-site-primary" />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{prestation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                )}

                {service.process_steps && service.process_steps.length > 0 && (
                  <Card className="border border-gray-200 shadow-lg bg-red-50">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Notre processus
                    </h3>
                    <div className="space-y-6">
                        {service.process_steps.map((etape: any, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-site-button-primary text-site-button-text flex items-center justify-center font-bold flex-shrink-0">
                              {etape.step || index + 1}
                          </div>
                          <div>
                              <h4 className="font-bold text-gray-900 mb-1">{etape.title || etape.titre}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {etape.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                )}
              </div>
            )}

            {activeTab === "avis" && service.show_reviews !== false && (
              <div className="space-y-8">
                {/* Formulaire d'avis */}
                <Card className="border-2 border-red-100 bg-red-50/30">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Laissez votre avis
                    </CardTitle>
                    <CardDescription>
                      Partagez votre expérience avec ce service
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!showReviewForm ? (
                      <Button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
                      >
                        Écrire un avis
                      </Button>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="client_name">Nom *</Label>
                            <Input
                              id="client_name"
                              value={reviewForm.client_name}
                              onChange={(e) => setReviewForm({ ...reviewForm, client_name: e.target.value })}
                              required
                              placeholder="Votre nom"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="client_email">Email</Label>
                            <Input
                              id="client_email"
                              type="email"
                              value={reviewForm.client_email}
                              onChange={(e) => setReviewForm({ ...reviewForm, client_email: e.target.value })}
                              placeholder="votre@email.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Note *</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                className="focus:outline-none"
                              >
                                <FaStar
                                  className={`w-8 h-8 ${
                                    star <= reviewForm.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  } transition-colors`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comment">Commentaire *</Label>
                          <Textarea
                            id="comment"
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            required
                            rows={4}
                            placeholder="Partagez votre expérience..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            disabled={createReviewMutation.isPending}
                            className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
                          >
                            {createReviewMutation.isPending ? "Envoi..." : "Envoyer l'avis"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewForm({ client_name: "", client_email: "", rating: 5, comment: "" });
                            }}
                  >
                            Annuler
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>

                {/* Liste des avis */}
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {reviews.length} avis client{reviews.length > 1 ? "s" : ""}
                    </h3>
                    {reviews.map((review: any) => (
                      <Card key={review.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                              <h4 className="font-bold text-gray-900 mb-1">{review.client_name}</h4>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                              />
                            ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                          </div>
                        </div>
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaStar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900 mb-2">Aucun avis pour le moment</p>
                    <p className="text-gray-600">Soyez le premier à laisser un avis sur ce service</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "faq" && service.show_faq !== false && (
              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.length > 0 ? (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Questions fréquentes
                    </h3>
                    <div className="space-y-4">
                      {faqs.map((faq: any, index: number) => (
                        <Card key={faq.id} className="border border-gray-200 hover:border-site-primary transition-colors">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-site-button-primary text-site-button-text flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              {faq.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-gray-700 leading-relaxed pl-9">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaInfoCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-900 mb-2">Questions fréquentes</p>
                    <p className="text-gray-600 mb-4">Aucune question fréquente disponible pour le moment</p>
                    <Link href="/contact">
                      <Button variant="outline">
                        Nous contacter
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Section Agences disponibles */}
      {service?.agencies && service.agencies.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Disponible dans nos agences
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Ce service est disponible dans les agences suivantes
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.agencies.map((agency: any) => (
                <motion.div
                  key={agency.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Link href={`/agences/${agency.slug}`}>
                    <Card className="h-full group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-site-primary cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-site-primary/20 to-site-primary/10 flex items-center justify-center flex-shrink-0 border border-site-primary/30">
                            <FaMapMarkerAlt className="w-6 h-6 text-site-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-site-text-link transition-colors">
                              {agency.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              <FaMapMarkerAlt className="w-3 h-3 inline mr-1" />
                              {agency.city}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-site-primary text-site-text-link hover:bg-site-button-primary hover:text-site-button-text"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/agences/${agency.slug}`;
                              }}
                            >
                              Voir l'agence
                              <FaArrowRight className="w-3 h-3 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SERVICES SIMILAIRES */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-red-50/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Découvrez nos autres services
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Explorez notre gamme complète de services pour répondre à tous vos besoins
            </p>
          </motion.div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 ${
                similarServices.length === 2 ? 'max-w-4xl' : 'max-w-6xl'
              } w-full`}
            >
              {similarServices.length > 0 ? (
                similarServices.map((similarService: any, index: number) => {
                  const SimilarIcon = getServiceIcon(
                    similarService.name || '',
                    `${similarService.short_description || ''} ${similarService.detailed_description || ''}`
                  );
                  return (
                    <motion.div
                      key={similarService.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                      className={`${similarServices.length === 2 ? 'w-full sm:w-[calc(50%-1rem)] md:w-[calc(50%-1.5rem)]' : 'w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]'} max-w-sm`}
                    >
                      <Link href={`/services/${similarService.slug}`} className="block h-full">
                        <Card className="h-full group relative overflow-hidden border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-site-primary transition-all duration-300 bg-white flex flex-col cursor-pointer">
                          {/* Image du service similaire */}
                          {similarService.image_url ? (
                            <div className="w-full h-40 overflow-hidden bg-gray-100">
                              <img
                                src={similarService.image_url}
                                alt={similarService.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-site-primary/10 to-site-primary/5 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-xl bg-site-primary/20 flex items-center justify-center">
                                <SimilarIcon className="w-8 h-8 text-site-primary" />
                              </div>
                            </div>
                          )}
                          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-5 md:px-6">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              {!similarService.image_url && (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-site-primary/20 to-site-primary/10 flex items-center justify-center border-2 border-site-primary/30 group-hover:bg-site-button-primary group-hover:border-site-button-primary transition-all duration-300">
                                  <SimilarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-site-primary group-hover:text-site-button-text transition-colors" />
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-site-text-link transition-colors">
                              {similarService.name}
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                              {similarService.short_description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="px-4 sm:px-5 md:px-6 pt-0 pb-4 sm:pb-5 md:pb-6">
                            <div className="flex items-center gap-2 text-site-text-link font-semibold group-hover:gap-3 transition-all">
                              <span className="text-sm sm:text-base">Découvrir ce service</span>
                              <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <div className="w-full text-center py-12">
                  <p className="text-gray-600">Aucun autre service disponible pour le moment</p>
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-8 sm:mt-10 md:mt-12"
          >
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-site-button-primary to-site-button-primary-hover hover:from-site-button-primary-hover hover:to-site-button-primary text-site-button-text shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 sm:px-8 py-3 sm:py-4"
              >
                Voir tous les services
                <FaArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    
    </div>
  );
}