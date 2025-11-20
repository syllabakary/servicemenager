import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AgencyCard } from "@/components/AgencyCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FaBuilding, FaUsers, FaStar, FaAward, FaClock, FaMapMarkerAlt, FaArrowRight, FaInfoCircle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

// Interface enrichie pour les agences
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
  note?: number;
  nombreAvis?: number;
  anneeExperience?: number;
  nombreClients?: number;
}

const mockAgencies: Agency[] = [
  {
    id: 1,
    nom: "ProNet Abidjan",
    description: "Experts du nettoyage industriel et résidentiel, disponibles 7j/7 pour vos besoins d'entretien. Notre équipe qualifiée utilise des produits écologiques et des méthodes modernes pour garantir un résultat impeccable.",
    ville: "Abidjan",
    services: ["Nettoyage", "Désinfection", "Entretien de bureaux", "Nettoyage après travaux"],
    image: "./Abidjan_agency_storefront_41598fcd.png",
    telephone: "+225 07 12 34 56 78",
    email: "contact@pronet-abidjan.ci",
    horaires: "Lun - Ven: 8h - 18h | Sam: 9h - 15h",
    note: 4.8,
    nombreAvis: 1245,
    anneeExperience: 12,
    nombreClients: 3500,
  },
  {
    id: 2,
    nom: "Garderie Les Petits Soleils",
    description: "Des nounous expérimentées et bienveillantes pour un accompagnement quotidien à domicile. Nous offrons un service de garde d'enfants de qualité avec des professionnels formés et certifiés.",
    ville: "Yamoussoukro",
    services: ["Garde d'enfants", "Aide aux devoirs", "Accompagnement scolaire", "Activités ludiques"],
    image: "./Childcare_service_photo_e9f137e4.png",
    telephone: "+225 05 98 76 54 32",
    email: "contact@petitssoleils.ci",
    horaires: "Lun - Dim: 6h - 20h",
    note: 4.9,
    nombreAvis: 892,
    anneeExperience: 8,
    nombreClients: 2100,
  },
  {
    id: 3,
    nom: "Green Touch Services",
    description: "Paysagistes professionnels pour jardins, terrasses et espaces verts. Nous créons et entretenons vos espaces verts avec passion et expertise. De la conception à la réalisation, notre équipe vous accompagne.",
    ville: "Bouaké",
    services: ["Entretien de jardin", "Élagage", "Aménagement paysager", "Tonte de pelouse"],
    image: "./Gardening_service_photo_0007b568.png",
    telephone: "+225 01 23 45 67 89",
    email: "info@greentouch.ci",
    horaires: "Lun - Sam: 7h - 17h",
    note: 4.7,
    nombreAvis: 567,
    anneeExperience: 15,
    nombreClients: 1800,
  },
  {
    id: 4,
    nom: "Clean & Fresh",
    description: "Une équipe moderne et rapide pour redonner éclat et fraîcheur à vos espaces. Service express disponible pour vos urgences. Nous utilisons des techniques de pointe et des produits respectueux de l'environnement.",
    ville: "San Pedro",
    services: ["Nettoyage", "Blanchisserie", "Service express", "Nettoyage vitres"],
    image: "./Childcare_service_photo_e9f137e4.png",
    telephone: "+225 09 87 65 43 21",
    email: "contact@cleanfresh.ci",
    horaires: "Lun - Dim: 24h/24",
    note: 4.6,
    nombreAvis: 423,
    anneeExperience: 6,
    nombreClients: 1200,
  },
  {
    id: 5,
    nom: "BabyCare Pro",
    description: "Service premium de garde d'enfants à domicile, flexible et sécurisé. Notre agence propose des services de garde haut de gamme avec des professionnels rigoureusement sélectionnés. Chaque intervenant est formé aux premiers secours.",
    ville: "Abidjan",
    services: ["Garde d'enfants", "Soins de nourrissons", "Éveil ludique", "Garde de nuit"],
    image: "./Abidjan_agency_storefront_41598fcd.png",
    telephone: "+225 07 11 22 33 44",
    email: "info@babycarepro.ci",
    horaires: "Lun - Dim: 24h/24",
    note: 4.9,
    nombreAvis: 678,
    anneeExperience: 10,
    nombreClients: 2500,
  },
];

export default function Agencies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedService, setSelectedService] = useState("all");

  const { data: agencies = mockAgencies, isLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
    queryFn: async () => mockAgencies,
  });

  const cities = useMemo(() => Array.from(new Set(agencies.map((a) => a.ville))).sort(), [agencies]);
  const allServices = useMemo(() => {
    const s = new Set<string>();
    agencies.forEach((a) => a.services.forEach((x) => s.add(x)));
    return Array.from(s).sort();
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    return agencies.filter((agency) => {
      const matchesSearch =
        searchTerm === "" ||
        agency.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.services.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity = selectedCity === "all" || agency.ville === selectedCity;
      const matchesService = selectedService === "all" || agency.services.includes(selectedService);
      return matchesSearch && matchesCity && matchesService;
    });
  }, [agencies, searchTerm, selectedCity, selectedService]);

  // Statistiques
  const stats = useMemo(() => {
    const totalAgencies = agencies.length;
    const avgRating = agencies.reduce((sum, a) => sum + (a.note || 0), 0) / totalAgencies;
    const totalReviews = agencies.reduce((sum, a) => sum + (a.nombreAvis || 0), 0);
    const totalClients = agencies.reduce((sum, a) => sum + (a.nombreClients || 0), 0);
    const totalExperience = agencies.reduce((sum, a) => sum + (a.anneeExperience || 0), 0);
    return { totalAgencies, avgRating, totalReviews, totalClients, totalExperience };
  }, [agencies]);

  return (
    <div className="min-h-screen bg-white pt-20 overflow-x-hidden w-full max-w-full">
      {/* 🔥 HEADER VISUEL */}
      <header className="relative h-[45vh] sm:h-[50vh] md:h-[60vh] lg:h-[65vh] flex items-center justify-center overflow-hidden">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        </div>

        {/* Contenu animé */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white px-3 sm:px-4 z-10 max-w-4xl mx-auto"
        >
          <Badge className="mb-3 sm:mb-4 md:mb-6 bg-white/20 backdrop-blur-md text-white border-2 border-white/40 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold">
            <FaBuilding className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2" />
            Nos Agences
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 drop-shadow-2xl leading-tight px-2">
            Nos Agences <span className="text-yellow-400">Partenaires</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl text-white/95 mb-4 sm:mb-6 md:mb-8 leading-relaxed drop-shadow-md px-2">
            Explorez les agences de confiance à travers toute la Côte d'Ivoire. Proximité, qualité et savoir-faire local au rendez-vous.
          </p>
          <Link href="/devis" className="block px-2">
            <Button
              size="lg"
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xl hover:shadow-2xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Trouver une agence</span>
              <span className="sm:hidden">Trouver</span>
              <FaArrowRight className="ml-1.5 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* 🟧 SECTION 1 — Pourquoi choisir nos agences */}
      <section className="py-12 sm:py-16 md:py-20 bg-white border-b border-gray-200 -mt-4 sm:-mt-6 md:-mt-8 relative z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2">
              Pourquoi choisir nos <span className="text-[#DC2626]">agences</span> ?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Des avantages concrets qui font la différence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {[
              {
                icon: FaAward,
                title: "Agences certifiées",
                description: "Toutes nos agences partenaires sont certifiées et régulièrement évaluées pour garantir la qualité"
              },
              {
                icon: FaMapMarkerAlt,
                title: "Présence nationale",
                description: "Un réseau d'agences réparti dans les principales villes pour vous offrir un service de proximité"
              },
              {
                icon: FaUsers,
                title: "Équipes qualifiées",
                description: "Des professionnels formés et expérimentés sélectionnés pour leur expertise et leur savoir-être"
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border-2 border-gray-100 hover:border-[#DC2626] shadow-md hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 bg-[#DC2626]/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[#DC2626] transition-colors duration-300">
                    <Icon className="w-6 h-6 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7 text-[#DC2626] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🟧 SECTION 2 — Liste des agences avec recherche */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-white relative">
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2">
              Toutes nos agences en <span className="text-[#DC2626]">détail</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
              Découvrez notre réseau d'agences partenaires réparties dans toute la Côte d'Ivoire. Chaque agence est sélectionnée pour sa qualité et son professionnalisme.
            </p>
          </motion.div>

          {/* Barre de recherche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 md:mb-12"
          >
            <div className="max-w-6xl mx-auto -mt-8 md:-mt-10 relative z-20 px-2">
              <SearchBar
                searchTerm={searchTerm}
                selectedCity={selectedCity}
                selectedService={selectedService}
                onSearchChange={setSearchTerm}
                onCityChange={setSelectedCity}
                onServiceChange={setSelectedService}
                cities={cities}
                services={allServices}
              />
            </div>
          </motion.div>

          {/* Liste des agences */}
          <div className="w-full">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-80 md:h-96 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredAgencies.length > 0 ? (
              <>
                <p className="mb-4 md:mb-6 text-gray-600 text-sm md:text-base px-2">
                  <span className="font-bold text-gray-900">{filteredAgencies.length}</span>{" "}
                  {filteredAgencies.length === 1 ? "agence trouvée" : "agences trouvées"}
                </p>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
                >
                  {filteredAgencies.map((agency, i) => (
                    <AgencyCard key={agency.id} agency={agency} delay={i * 0.1} />
                  ))}
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBuilding className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune agence trouvée</h3>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos critères de recherche ou explorez une autre ville.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCity("all");
                    setSelectedService("all");
                  }}
                  className="border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                >
                  Réinitialiser la recherche
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 🟪 SECTION 3 — Pourquoi choisir nos agences */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir nos agences ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des avantages qui font la différence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: FaAward,
                title: "Agences certifiées",
                description: "Toutes nos agences partenaires sont certifiées et régulièrement évaluées pour garantir la qualité de leurs services et le respect des normes.",
              },
              {
                icon: FaMapMarkerAlt,
                title: "Présence nationale",
                description: "Un réseau d'agences réparti dans les principales villes de Côte d'Ivoire pour vous offrir un service de proximité où que vous soyez.",
              },
              {
                icon: FaUsers,
                title: "Équipes qualifiées",
                description: "Des professionnels formés et expérimentés dans chaque agence, sélectionnés pour leur expertise et leur savoir-être.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-[#DC2626]/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#DC2626]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🟪 SECTION 4 — CTA Devis */}
      <section className="relative py-20 bg-[#DC2626] text-white overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
              Besoin d'aide pour choisir une agence ?
            </h2>
            <p className="text-xl text-white/95 mb-10 leading-relaxed max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour vous orienter vers l'agence la plus adaptée à vos besoins. 
              Obtenez un devis personnalisé gratuit et sans engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/devis">
                <Button
                  size="lg"
                  className="bg-white text-[#DC2626] hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all duration-300 px-8 py-6 text-lg font-semibold hover:scale-105"
                >
                  Demander un devis gratuit
                  <FaArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#DC2626] transition-all duration-300 px-8 py-6 text-lg font-semibold"
                onClick={() => window.location.href = "/contact"}
              >
                Nous contacter
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-base text-white/90">
              <FaInfoCircle className="w-5 h-5" />
              <span>Réponse sous 24h • Devis gratuit • Sans engagement</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
