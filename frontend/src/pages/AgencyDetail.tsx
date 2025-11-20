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
} from "react-icons/fa";
import { motion } from "framer-motion";

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
}

const mockAgencies: Agency[] = [
  {
    id: 1,
    nom: "ProNet Abidjan",
    description: "Experts du nettoyage industriel et résidentiel, disponibles 7j/7 pour vos besoins d'entretien. Notre équipe qualifiée utilise des produits écologiques et des méthodes modernes pour garantir un résultat impeccable. Nous intervenons dans les bureaux, maisons, appartements et locaux commerciaux avec un service personnalisé et flexible.",
    ville: "Abidjan",
    services: ["Nettoyage", "Désinfection", "Entretien de bureaux", "Nettoyage après travaux"],
    image: "./Abidjan_agency_storefront_41598fcd.png",
    telephone: "+225 07 12 34 56 78",
    email: "contact@pronet-abidjan.ci",
    horaires: "Lun - Ven: 8h - 18h | Sam: 9h - 15h",
  },
  {
    id: 2,
    nom: "Garderie Les Petits Soleils",
    description: "Des nounous expérimentées et bienveillantes pour un accompagnement quotidien à domicile. Nous offrons un service de garde d'enfants de qualité avec des professionnels formés et certifiés. Notre approche éducative et ludique permet aux enfants de s'épanouir dans un environnement sécurisé et stimulant.",
    ville: "Yamoussoukro",
    services: ["Garde d'enfants", "Aide aux devoirs", "Accompagnement scolaire", "Activités ludiques"],
    image: "./Childcare_service_photo_e9f137e4.png",
    telephone: "+225 05 98 76 54 32",
    email: "contact@petitssoleils.ci",
    horaires: "Lun - Dim: 6h - 20h",
  },
  {
    id: 3,
    nom: "Green Touch Services",
    description: "Paysagistes professionnels pour jardins, terrasses et espaces verts. Nous créons et entretenons vos espaces verts avec passion et expertise. De la conception à la réalisation, notre équipe vous accompagne pour transformer votre extérieur en un véritable havre de paix.",
    ville: "Bouaké",
    services: ["Entretien de jardin", "Élagage", "Aménagement paysager", "Tonte de pelouse"],
    image: "./Gardening_service_photo_0007b568.png",
    telephone: "+225 01 23 45 67 89",
    email: "info@greentouch.ci",
    horaires: "Lun - Sam: 7h - 17h",
  },
];

export default function AgencyDetail() {
  const [, params] = useRoute("/agences/:id");
  const agencyId = params?.id ? parseInt(params.id) : null;

  const { data: agencies = mockAgencies, isLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
    queryFn: async () => mockAgencies,
  });

  const agency = agencies?.find((a) => a.id === agencyId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="w-20 h-20 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-gradient-to-b from-red-50 to-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">😕 Agence introuvable</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">L'agence que vous recherchez semble ne plus être disponible.</p>
        <Link href="/agences">
          <Button variant="outline" className="gap-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white">
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
        <motion.img
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          src={agency.image}
          alt={agency.nom}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626] via-[#B91C1C] to-[#991B1B]" />
        
        {/* Breadcrumb et bouton retour en haut */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-20">
          <Link href="/agences">
            <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white hover:text-[#DC2626] shadow-md text-xs sm:text-sm px-2 sm:px-3">
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
              <Card className="border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-red-50/30">
                <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 md:px-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-900">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#DC2626]/20 to-[#DC2626]/10 flex items-center justify-center border-2 border-[#DC2626]/30">
                      <FaStar className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626]" />
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
              <Card className="border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-red-50/30">
                <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 md:px-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-900">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#DC2626]/20 to-[#DC2626]/10 flex items-center justify-center border-2 border-[#DC2626]/30">
                      <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626]" />
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
                        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 hover:border-[#DC2626] hover:from-red-100 hover:to-red-200 transition-all duration-300"
                      >
                        <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626] flex-shrink-0" />
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
            <Card className="border-2 border-red-200 shadow-xl bg-gradient-to-br from-white to-red-50/30">
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-5 md:px-6">
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#DC2626]/20 to-[#DC2626]/10 flex items-center justify-center border-2 border-[#DC2626]/30">
                    <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626]" />
                  </div>
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-5 md:px-6 pt-0">
                {[
                  { Icon: FaMapMarkerAlt, label: "Adresse", value: `${agency.ville}, Côte d'Ivoire` },
                  { Icon: FaPhone, label: "Téléphone", value: agency.telephone, href: `tel:${agency.telephone}` },
                  { Icon: FaEnvelope, label: "Email", value: agency.email, href: `mailto:${agency.email}` },
                  { Icon: FaClock, label: "Horaires", value: agency.horaires },
                ].filter(item => item.value).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 hover:border-[#DC2626] transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#DC2626]/20 to-[#DC2626]/10 flex items-center justify-center flex-shrink-0 border border-[#DC2626]/30">
                      <item.Icon className="w-4 h-4 text-[#DC2626]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-xs md:text-sm text-gray-600 mb-1 uppercase tracking-wide">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-xs sm:text-sm md:text-base font-medium text-[#DC2626] hover:text-[#B91C1C] transition-colors break-all">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 break-words">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Bouton devis */}
                <div className="pt-2 sm:pt-3 border-t-2 border-red-200">
                  <Link href="/devis" className="w-full block">
                    <Button className="w-full h-10 sm:h-11 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#DC2626] text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm" size="lg">
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
