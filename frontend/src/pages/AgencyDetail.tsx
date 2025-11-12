import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Star,
  Building2,
  Users,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";

// Type local pour éviter les dépendances
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

// Données mockées pour les agences
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
  {
    id: 4,
    nom: "Clean & Fresh",
    description: "Une équipe moderne et rapide pour redonner éclat et fraîcheur à vos espaces. Service express disponible pour vos urgences. Nous utilisons des techniques de pointe et des produits respectueux de l'environnement pour garantir un nettoyage efficace et durable.",
    ville: "San Pedro",
    services: ["Nettoyage", "Blanchisserie", "Service express", "Nettoyage vitres"],
    image: "./Childcare_service_photo_e9f137e4.png",
    telephone: "+225 09 87 65 43 21",
    email: "contact@cleanfresh.ci",
    horaires: "Lun - Dim: 24h/24",
  },
  {
    id: 5,
    nom: "BabyCare Pro",
    description: "Service premium de garde d'enfants à domicile, flexible et sécurisé. Notre agence propose des services de garde haut de gamme avec des professionnels rigoureusement sélectionnés. Chaque intervenant est formé aux premiers secours et à la pédagogie positive.",
    ville: "Abidjan",
    services: ["Garde d'enfants", "Soins de nourrissons", "Éveil ludique", "Garde de nuit"],
    image: "./Abidjan_agency_storefront_41598fcd.png",
    telephone: "+225 07 11 22 33 44",
    email: "info@babycarepro.ci",
    horaires: "Lun - Dim: 24h/24",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="w-20 h-20 border-4 border-[#A0522D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-center px-6 bg-gradient-to-b from-gray-50 to-white">
        <div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900">😕 Agence introuvable</h1>
          <p className="text-gray-600 mb-6">
            L'agence que vous recherchez semble ne plus être disponible.
          </p>
          <Link href="/agences">
            <Button variant="outline" className="gap-2 border-[#A0522D] text-[#A0522D] hover:bg-[#A0522D] hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50/30">
      {/* HERO */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          src={agency.image}
          alt={agency.nom}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#8B4513]/90 via-[#A0522D]/70 to-transparent" />
        <div className="absolute bottom-10 left-8 md:left-16 text-white drop-shadow-2xl">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-4">
              <Building2 className="w-3 h-3 mr-1" />
              Agence certifiée
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
          >
            {agency.nom}
          </motion.h1>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 text-base md:text-lg font-medium"
          >
            <MapPin className="w-5 h-5 text-[#FFD700]" />
            <span>{agency.ville}, Côte d'Ivoire</span>
          </motion.div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
        <Link href="/agences">
          <Button variant="ghost" size="sm" className="gap-2 mb-6 text-gray-700 hover:text-[#A0522D] hover:bg-[#A0522D]/10">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* INFOS */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-gray-900">
                    <div className="w-12 h-12 rounded-lg bg-[#A0522D]/10 flex items-center justify-center">
                      <Star className="w-6 h-6 text-[#A0522D]" />
                    </div>
                    À propos de {agency.nom}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                    {agency.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* SERVICES */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-3 text-gray-900">
                    <div className="w-12 h-12 rounded-lg bg-[#A0522D]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-[#A0522D]" />
                    </div>
                    Services proposés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {agency.services.map((service, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#A0522D]/5 to-orange-50/50 hover:from-[#A0522D]/10 hover:to-orange-50/70 transition-all duration-300 border border-[#A0522D]/10 hover:border-[#A0522D]/30"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#A0522D] flex-shrink-0" />
                        <span className="text-sm md:text-base font-semibold text-gray-800">{service}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* CONTACT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:sticky lg:top-24 space-y-4"
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-3 text-gray-900">
                  <div className="w-12 h-12 rounded-lg bg-[#A0522D]/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#A0522D]" />
                  </div>
                  Informations de contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Adresse */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-[#A0522D]/5 to-orange-50/50 border border-[#A0522D]/10">
                  <div className="w-10 h-10 rounded-lg bg-[#A0522D]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#A0522D]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-500 mb-1 uppercase tracking-wide">
                      Adresse
                    </p>
                    <p className="text-base font-medium text-gray-900">{agency.ville}, Côte d'Ivoire</p>
                  </div>
                </div>

                {/* Téléphone */}
                {agency.telephone && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-[#A0522D]/5 to-orange-50/50 border border-[#A0522D]/10">
                    <div className="w-10 h-10 rounded-lg bg-[#A0522D]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#A0522D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-500 mb-1 uppercase tracking-wide">
                        Téléphone
                      </p>
                      <a
                        href={`tel:${agency.telephone}`}
                        className="text-base font-medium text-[#A0522D] hover:text-[#8B4513] transition-colors"
                      >
                        {agency.telephone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {agency.email && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-[#A0522D]/5 to-orange-50/50 border border-[#A0522D]/10">
                    <div className="w-10 h-10 rounded-lg bg-[#A0522D]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#A0522D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-500 mb-1 uppercase tracking-wide">
                        Email
                      </p>
                      <a
                        href={`mailto:${agency.email}`}
                        className="text-base font-medium text-[#A0522D] hover:text-[#8B4513] transition-colors break-all"
                      >
                        {agency.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Horaires */}
                {agency.horaires && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-[#A0522D]/5 to-orange-50/50 border border-[#A0522D]/10">
                    <div className="w-10 h-10 rounded-lg bg-[#A0522D]/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#A0522D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-500 mb-1 uppercase tracking-wide">
                        Horaires
                      </p>
                      <p className="text-base font-medium text-gray-900">{agency.horaires}</p>
                    </div>
                  </div>
                )}

                {/* Bouton */}
                <div className="pt-4 border-t border-gray-200">
                  <Link href="/devis" className="w-full">
                  <Button
                      className="w-full bg-[#A0522D] hover:bg-[#8B4513] text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    size="lg"
                  >
                      <Award className="w-5 h-5 mr-2" />
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
