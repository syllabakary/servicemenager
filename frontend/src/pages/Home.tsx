import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  FaArrowRight, 
  FaCheckCircle, 
  FaStar, 
  FaMapMarkerAlt, 
  FaQuoteLeft,
  FaBaby,
  FaTree,
  FaPaintBrush,
  FaShieldAlt,
  FaTruck,
  FaFileAlt,
  FaUsers,
  FaCog,
  FaHeart,
  FaPhone,
  FaClock,
  FaInfoCircle,
  FaChevronRight,
  FaHandHoldingHeart
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { AgencyCard } from "@/components/AgencyCard";
import { PromotionalBanner } from "@/components/PromotionalBanner";
import heroImage from "/Hero_team_photo_c8870b4f.png";
// Types locaux
interface Service {
  id: number;
  nom: string;
  description: string;
  icone?: string;
}

interface Agency {
  id: number;
  nom: string;
  description: string;
  ville: string;
  services: string[];
  image: string;
}

// Mapping des icônes
const iconMap = {
  Sparkles: HiSparkles,
  Baby: FaBaby,
  TreeDeciduous: FaTree,
  Paintbrush: FaPaintBrush,
  Shield: FaShieldAlt,
  Truck: FaTruck,
};

// Données mockées pour les services
const mockServices: Service[] = [
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

// Données mockées pour les agences
const mockAgencies: Agency[] = [
  {
    id: 1,
    nom: "ProNet Abidjan",
    description: "Experts du nettoyage industriel et résidentiel, disponibles 7j/7 pour vos besoins d'entretien.",
    ville: "Abidjan",
    services: ["Nettoyage", "Désinfection", "Entretien de bureaux"],
    image: "./Abidjan_agency_storefront_41598fcd.png",
  },
  {
    id: 2,
    nom: "Garderie Les Petits Soleils",
    description: "Des nounous expérimentées et bienveillantes pour un accompagnement quotidien à domicile.",
    ville: "Yamoussoukro",
    services: ["Garde d'enfants", "Aide aux devoirs", "Accompagnement scolaire"],
    image: "./Childcare_service_photo_e9f137e4.png",
  },
  {
    id: 3,
    nom: "Green Touch Services",
    description: "Paysagistes professionnels pour jardins, terrasses et espaces verts.",
    ville: "Bouaké",
    services: ["Entretien de jardin", "Élagage", "Aménagement paysager"],
    image: "./Gardening_service_photo_0007b568.png",
  },
  {
    id: 4,
    nom: "Clean & Fresh",
    description: "Une équipe moderne et rapide pour redonner éclat et fraîcheur à vos espaces.",
    ville: "San Pedro",
    services: ["Nettoyage", "Blanchisserie", "Service express"],
    image: "./Professional_cleaning_service_photo_2a582859.png",
  },
  {
    id: 5,
    nom: "BabyCare Pro",
    description: "Service premium de garde d'enfants à domicile, flexible et sécurisé.",
    ville: "Abidjan",
    services: ["Garde d'enfants", "Soins de nourrissons", "Éveil ludique"],
    image: "./Bouaké_agency_storefront_efadb467.png",
  },
];

// Composant pour la section de localisation
function LocationSection() {
  // Récupérer les données de localisation depuis l'API
  const { data: locationData } = useQuery({
    queryKey: ["headquarters_location"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:8000/api/pages/?key=headquarters_location&is_active=true");
        const data = await response.json();
        return data.results?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  // Parser les données JSON ou utiliser les valeurs par défaut
  let locationInfo = {
    title: "Notre siège à Paris",
    subtitle: "Nous sommes basés au cœur de Paris pour mieux vous servir partout en France",
    location: "Paris, France",
    address: "Paris, France",
    description: "Notre équipe est à votre disposition pour répondre à tous vos besoins en services à la personne",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937606!2d2.352221915674389!3d48.85661400000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e1f06e2b70f%3A0x40b82c3688c9460!2sParis%2C%20France!5e0!3m2!1sfr!2sfr!4v1234567890123!5m2!1sfr!2sfr",
  };

  if (locationData?.body) {
    try {
      locationInfo = { ...locationInfo, ...JSON.parse(locationData.body) };
    } catch {
      // Si ce n'est pas du JSON valide, utiliser les valeurs par défaut
    }
  }

  // Extraire le texte du titre pour mettre "siège" en rouge
  const titleText = locationInfo.title;
  const titleParts = titleText.split(/(siège|Siège)/i);
  const hasSiege = titleText.toLowerCase().includes('siège');

  return (
    <section className="py-20 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {hasSiege ? (
              <>
                {titleParts[0]}
                <span className="text-[#DC2626]">{titleParts[1]}</span>
                {titleParts[2]}
              </>
            ) : (
              titleText
            )}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {locationInfo.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
        >
          <div className="relative w-full h-[500px] md:h-[600px]">
            {/* Carte Google Maps */}
            <iframe
              src={locationInfo.mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
            
            {/* Overlay avec informations */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-6 md:p-8">
              <div className="max-w-2xl mx-auto text-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#DC2626] rounded-full flex items-center justify-center flex-shrink-0">
                    <FaMapMarkerAlt className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Siège Social</h3>
                    <p className="text-white/90 mb-1">{locationInfo.location || locationInfo.address}</p>
                    <p className="text-sm text-white/80">
                      {locationInfo.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-600 mb-4">
            Nous intervenons dans toute la France métropolitaine
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Nous contacter
              <FaArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {

  const { data: services = mockServices, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => mockServices,
  });

  const { data: agencies = mockAgencies, isLoading: agenciesLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
    queryFn: async () => mockAgencies,
  });

  return (
    <div className="overflow-x-hidden bg-white text-foreground pt-16 sm:pt-20 w-full max-w-full">
      {/* === PROMOTIONAL BANNER === */}
      <PromotionalBanner />

      {/* === HERO SECTION === */}
      <section className="relative min-h-[500px] sm:min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full py-12 sm:py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-white"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight drop-shadow-lg">
              Nous aimons vous rendre la vie plus <span className="text-yellow-400 relative">
                <span className="relative z-10">facile</span>
                <span className="absolute bottom-0 left-0 right-0 h-2 sm:h-3 bg-yellow-400/20 -z-0"></span>
              </span> !
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4 leading-relaxed text-white/95 drop-shadow-md">
              Ménage, aide à domicile, jardinage, garde d'enfant : depuis <span className="font-bold text-white">+ de 20 ans</span>, 
              nous nous tenons à vos côtés pour <span className="font-semibold text-white">rendre votre quotidien plus serein</span>.
            </p>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-6 sm:mb-8 text-white/90 drop-shadow-sm">
              Retrouvez du temps pour vous grâce aux <strong className="text-white">services à la personne</strong>.
            </p>
            
            {/* Rating */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10 bg-white/10 backdrop-blur-sm rounded-lg px-4 sm:px-6 py-3 sm:py-4 w-full sm:w-fit border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <FaStar key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <FaStar className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400/50 text-yellow-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-white">4.4</span>
                  <span className="text-white/80 text-xs sm:text-sm">sur 5</span>
                </div>
                </div>
              <div className="hidden sm:block h-6 md:h-8 w-px bg-white/30" />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-white">4132</span>
                <span className="text-xs text-white/80">avis authentifiés</span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-5xl">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-100 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-yellow-300 group-hover:scale-110 transition-transform duration-300">
                  <FaHandHoldingHeart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-600" />
                </div>
                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                    Besoin d'un coup de pouce à la maison ?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Demandez votre tarif sur mesure
                  </p>
                </div>
              </div>
              <Link href="/devis" className="w-full block">
                <Button
                  className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white h-10 sm:h-12 text-xs sm:text-sm md:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
                >
                  <span className="hidden sm:inline">Obtenez votre devis personnalisé</span>
                  <span className="sm:hidden">Devis personnalisé</span>
                  <FaArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-100 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-teal-300 group-hover:scale-110 transition-transform duration-300">
                  <FaUsers className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-teal-600" />
                </div>
                <div className="flex-1 pt-0.5 sm:pt-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                    Vous cherchez un métier qui a du sens ?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Nous recrutons près de chez vous
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-10 sm:h-12 text-xs sm:text-sm md:text-base font-semibold border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white transition-all duration-300 group-hover:scale-[1.02]"
              >
                Je postule
                <FaArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === SERVICES SECTION === */}
      <section id="services-section" className="py-12 sm:py-16 md:py-20 bg-gray-50 relative">
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          {/* Header with CTA */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 sm:mb-10 md:mb-12 gap-4">
            <div className="flex-1">
              <p className="text-xs sm:text-sm md:text-base font-semibold text-[#DC2626] uppercase tracking-wide mb-2">
                Découvrez nos services à la personne sur mesure et sans engagement
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                De quoi avez-vous <span className="text-[#DC2626]">besoin</span> ?
              </h2>
            </div>
            <div className="flex-shrink-0 text-left md:text-right">
              <Link href="/devis" className="block">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-[#DC2626] hover:bg-[#B91C1C] text-white mb-2 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Obtenez votre devis personnalisé</span>
                  <span className="sm:hidden">Devis personnalisé</span>
                </Button>
              </Link>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FaInfoCircle className="w-3 h-3" />
                <span>Gratuit et sans engagement</span>
              </div>
            </div>
          </div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-card rounded-2xl" />
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.15 } },
              }}
            >
              {services.slice(0, 3).map((service, index) => {
                const IconComponent = 
                  iconMap[(service.icone || "Sparkles") as keyof typeof iconMap] || HiSparkles;
                return (
                <motion.div
                  key={service.id}
                  className="h-full"
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                    <ServiceCard 
                      service={{ ...service, icone: service.icone || "Sparkles" }} 
                      icon={IconComponent}
                      delay={index * 0.1} 
                    />
                </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun service disponible pour le moment.</p>
            </div>
          )}

          {services && services.length > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-16"
            >
            <Link href="/services">
                <Button 
                  size="lg" 
                  className="gap-2 group px-8 py-6 text-base font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors"
                >
                Voir tous les services
                  <FaArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </Button>
            </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* === AGENCIES SECTION === */}
      <section id="agencies-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trouver mon agence
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des experts fiables, proches de chez vous, prêts à vous accompagner dans tous vos projets.
            </p>
          </motion.div>

          {agenciesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-2xl" />
              ))}
            </div>
          ) : agencies && agencies.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.15 } },
              }}
            >
              {agencies.slice(0, 3).map((agency, index) => (
                <motion.div
                  key={agency.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <AgencyCard agency={agency} delay={index * 0.1} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune agence disponible pour le moment.</p>
            </div>
          )}

          {agencies && agencies.length > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-16"
            >
            <Link href="/agences">
                <Button 
                  size="lg" 
                  className="gap-2 group px-8 py-6 text-base font-semibold bg-[#DC2626] hover:bg-[#B91C1C] text-white transition-colors"
                >
                Voir toutes les agences
                  <FaArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </Button>
            </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* === HOW IT WORKS SECTION === */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20 bg-gray-50 relative">
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Comment ça marche ?
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-4 lg:gap-2">
            {[
              {
                step: "1",
                title: "Prise en compte de vos besoins",
                description: "À la suite de votre demande de devis, le responsable d'agence vous contacte afin de comprendre vos attentes et vos priorités. Un devis personnalisé, gratuit et sans engagement, vous est ensuite proposé.",
              },
              {
                step: "2",
                title: "Sélection de votre intervenant",
                description: "Nous choisissons avec soin l'intervenant à domicile le plus adapté à vos besoins et à votre mode de vie. Vous avez la possibilité de le rencontrer avant le début de ses interventions.",
              },
              {
                step: "3",
                title: "Mise en place du service choisi",
                description: "Votre agence organise la mise en place de votre service à domicile en veillant à ce qu'il corresponde parfaitement à vos attentes, avec toute la flexibilité nécessaire pour s'ajuster au fil du temps.",
              },
              {
                step: "4",
                title: "Accompagnement au quotidien",
                description: "Tout au long de votre contrat, vous bénéficiez d'un interlocuteur dédié au sein de votre agence locale. Des bilans de suivi réguliers sont réalisés pour garantir la qualité et l'efficacité de nos services.",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center w-full md:w-auto">
              <motion.div
                  initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                  className="flex flex-col items-center text-center max-w-[280px] sm:max-w-[300px] md:max-w-[240px] w-full"
              >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#DC2626] rounded-full flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                    <span className="text-xl sm:text-2xl font-bold text-white">{item.step}</span>
                </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 px-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed px-2">{item.description}</p>
              </motion.div>
                {i < 3 && (
                  <FaChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#DC2626] mx-2 hidden md:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link href="/devis">
              <Button
                size="lg"
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Demande de devis
                <FaArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* === TESTIMONIALS SECTION === */}
      <section className="py-20 bg-white relative">
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          transition={{ duration: 0.8 }}
            className="text-center mb-12"
        >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Nos clients retrouvent le <span className="text-[#DC2626] italic font-serif">sourire</span> avec nous
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Avis authentiques</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-900">4.4/5</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Josette M.",
                rating: 5,
                date: "06/10/2025",
                comment: "Cassandra est douce et fait un excellent travail. Je recommande vivement !",
              },
              {
                name: "Philippe P.",
                rating: 5,
                date: "26/09/2025",
                comment: "Service recommandé pour le suivi administratif, la rapidité de mise en place des soins post-hospitalisation et le personnel adapté.",
              },
              {
                name: "Florence C.",
                rating: 5,
                date: "23/09/2025",
                comment: "L'intervenante est compétente, discrète, agréable. Recommandé.",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <FaStar key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{testimonial.rating}/5</span>
                  <span className="text-xs text-gray-500 ml-auto">{testimonial.date}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{testimonial.comment}</p>
                <p className="text-sm font-semibold text-gray-900">— {testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === LOCATION SECTION === */}
      <LocationSection />

    </div>
  );
}
