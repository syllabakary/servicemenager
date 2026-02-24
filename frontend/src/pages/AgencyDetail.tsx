import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaArrowLeft,
  FaCheckCircle,
  FaStar,
  FaBuilding,
  FaUsers,
  FaAward,
  FaRoute,
} from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "@/config/api";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface Agency {
  id: number;
  nom: string;
  description: string;
  ville: string;
  services: string[];
  image: string;
  telephone?: string;
  email?: string;
  horaires?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export default function AgencyDetail() {
  const [, params] = useRoute("/agences/:slug");
  const agencySlug = params?.slug;

  const { data: agencyData, isLoading } = useQuery({
    queryKey: ["agency", agencySlug],
    queryFn: async () => {
      if (!agencySlug) return null;
      const res = await axios.get(`${API_URL}/agencies/`);
      const agencies = res.data.results || [];
      return agencies.find((a: any) => a.slug === agencySlug);
    },
    enabled: !!agencySlug,
  });

  // Mapper les données de l'API
  const agency: Agency | null = agencyData ? {
    id: agencyData.id,
    nom: agencyData.name,
    description: agencyData.details || `${agencyData.name} - Agence située à ${agencyData.city}. ${agencyData.address}`,
    ville: agencyData.city,
    services: agencyData.details 
      ? agencyData.details.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : ["Services divers"],
    image: agencyData.image_url || "./Abidjan_agency_storefront_41598fcd.png", // Utiliser l'image de l'API ou par défaut
    telephone: agencyData.phone,
    email: agencyData.email,
    horaires: "Lun - Ven: 8h - 18h | Sam: 9h - 15h",
    address: agencyData.address,
    latitude: agencyData.latitude,
    longitude: agencyData.longitude,
  } : null;

  // Fonction pour ouvrir Google Maps avec les coordonnées
  const openGoogleMaps = () => {
    if (agency?.latitude && agency?.longitude) {
      // Ouvrir Google Maps avec les coordonnées
      const url = `https://www.google.com/maps?q=${agency.latitude},${agency.longitude}`;
      window.open(url, '_blank');
    } else if (agency?.address) {
      // Si pas de coordonnées GPS, utiliser l'adresse
      const address = encodeURIComponent(`${agency.address}, ${agency.ville}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-site-primary/5 to-white">
        <div className="w-20 h-20 border-4 border-site-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-gradient-to-b from-site-primary/5 to-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">😕 Agence introuvable</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">L'agence que vous recherchez semble ne plus être disponible.</p>
        <Link href="/agences">
          <Button variant="outline" className="gap-2 border-2 border-site-button-outline-border text-site-button-outline-text hover:bg-site-button-outline-hover-bg hover:text-white">
            <FaArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full max-w-full">
      {/* HERO */}
      <div className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] w-full overflow-hidden">
        <motion.div initial={{ scale: 1.05, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }} className="w-full h-full">
          <ImageWithFallback src={agency.image} alt={agency.nom} className="w-full h-full object-cover opacity-30" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-br from-site-primary via-site-secondary to-site-tertiary" />
        
        {/* Breadcrumb et bouton retour en haut */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-20">
          <Link href="/agences">
            <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white hover:text-site-text-link shadow-md text-xs sm:text-sm px-2 sm:px-3">
              <FaArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </Link>
        </div>

        {/* Contenu du hero */}
        <div className="absolute bottom-4 left-3 sm:bottom-6 sm:left-4 md:bottom-10 md:left-8 lg:left-16 text-white z-10 max-w-4xl pr-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-2 sm:mb-3">
            <Badge className="bg-white/20 backdrop-blur-md text-white border-2 border-white/40 px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm">
              <FaBuilding className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
              Agence certifiée
            </Badge>
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-2 sm:mb-3 drop-shadow-2xl leading-tight">
            {agency.nom}
          </motion.h1>
          <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-white/95 mb-2 sm:mb-3">
            Votre partenaire pour un service de qualité
          </motion.h2>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-medium">
            <FaMapMarkerAlt className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400" />
            <span>{agency.ville}, Côte d'Ivoire</span>
          </motion.div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* INFOS */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-5">
            {/* À propos */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card className="border-2 border-site-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-site-primary/5">
                <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 md:px-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-900">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-site-primary/20 to-site-primary/10 flex items-center justify-center border-2 border-site-primary/30">
                      <FaStar className="w-4 h-4 sm:w-5 sm:h-5 text-site-primary" />
                    </div>
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl">À propos de {agency.nom}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 md:px-6 pt-0">
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{agency.description}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Services */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Card className="border-2 border-site-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-site-primary/5">
                <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 md:px-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-900">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-site-primary/20 to-site-primary/10 flex items-center justify-center border-2 border-site-primary/30">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-site-primary" />
                    </div>
                    <span>Services proposés</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 md:px-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {agency.services.map((service, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-site-primary/5 to-site-primary/5 border-2 border-site-primary/20 hover:border-site-primary hover:from-site-primary/15 hover:to-site-primary/10 transition-all duration-300"
                      >
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-site-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">{service}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* CONTACT */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:sticky lg:top-6">
            <Card className="border-2 border-site-primary/20 shadow-xl bg-gradient-to-br from-white to-site-primary/5">
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 md:px-6">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-site-primary/20 to-site-primary/10 flex items-center justify-center border-2 border-site-primary/30">
                    <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-site-primary" />
                  </div>
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-5 md:px-6 pt-0">
                {[
                  { Icon: FaMapMarkerAlt, label: "Adresse", value: agency.address || `${agency.ville}, Côte d'Ivoire` },
                  { Icon: FaPhone, label: "Téléphone", value: agency.telephone, href: agency.telephone ? `tel:${agency.telephone}` : undefined },
                  { Icon: FaEnvelope, label: "Email", value: agency.email, href: agency.email ? `mailto:${agency.email}` : undefined },
                  { Icon: FaClock, label: "Horaires", value: agency.horaires },
                ].filter(item => item.value).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-site-primary/5 to-site-primary/5 border-2 border-site-primary/20 hover:border-site-primary transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-site-primary/20 to-site-primary/10 flex items-center justify-center flex-shrink-0 border border-site-primary/30">
                      <item.Icon className="w-4 h-4 text-site-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-xs md:text-sm text-gray-600 mb-1 uppercase tracking-wide">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-xs sm:text-sm md:text-base font-medium text-site-text-link hover:text-site-text-link-hover transition-colors break-all">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 break-words">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Bouton Voir itinéraire */}
                {(agency.latitude && agency.longitude) || agency.address ? (
                  <div className="pt-2 sm:pt-3 border-t-2 border-site-primary/20">
                    <Button
                      onClick={openGoogleMaps}
                      className="w-full h-10 sm:h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-2"
                      size="lg"
                    >
                      <FaRoute className="w-4 h-4 sm:w-5 sm:h-5" />
                      Voir l'itinéraire sur Google Maps
                    </Button>
                  </div>
                ) : null}

                {/* Bouton devis */}
                <div className="pt-2 sm:pt-3 border-t-2 border-site-primary/20">
                  <Link href="/devis" className="w-full block">
                    <Button className="w-full h-10 sm:h-11 bg-gradient-to-r from-site-button-primary to-site-button-primary-hover hover:from-site-button-primary-hover hover:to-site-button-primary text-site-button-text shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm" size="lg">
                      <FaAward className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      Demander un devis
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
