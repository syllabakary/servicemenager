import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AgencyCard } from "@/components/AgencyCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Users, Star, Award, Clock, MapPin, ArrowRight, Info } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      {/* 🔥 HEADER VISUEL */}
      <header className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B4513]/80 via-[#A0522D]/70 to-[#8B4513]/80" />
        </div>

        {/* Contenu animé */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white px-4 z-10 max-w-4xl mx-auto"
        >
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Building2 className="w-3 h-3 mr-1" />
            Nos Agences
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Nos Agences Partenaires
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/95 mb-6">
            Explorez les agences de confiance à travers toute la Côte d'Ivoire. Proximité, qualité et savoir-faire local au rendez-vous.
          </p>
          <Link href="/devis">
            <Button
              size="lg"
              className="bg-white text-[#A0522D] hover:bg-gray-100 shadow-lg"
            >
              Trouver une agence
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* 🟧 SECTION 1 — Statistiques */}
      <section className="py-12 bg-gradient-to-r from-[#A0522D]/10 via-orange-50/50 to-[#A0522D]/10 border-b border-[#A0522D]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-md text-center"
            >
              <div className="w-12 h-12 bg-[#A0522D]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-[#A0522D]" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalAgencies}</div>
              <div className="text-sm text-gray-600">Agences partenaires</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-md text-center"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Note moyenne</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-md text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalReviews.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Avis clients</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-md text-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalClients.toLocaleString()}+</div>
              <div className="text-sm text-gray-600">Clients satisfaits</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-md text-center"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalExperience}</div>
              <div className="text-sm text-gray-600">Années d'expérience</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🟧 SECTION 2 — Liste des agences avec recherche */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white via-gray-50/30 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#A0522D]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Toutes nos agences en détail
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez notre réseau d'agences partenaires réparties dans toute la Côte d'Ivoire. Chaque agence est sélectionnée pour sa qualité et son professionnalisme.
            </p>
          </motion.div>

          {/* Barre de recherche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="max-w-6xl mx-auto -mt-10 relative z-20">
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
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredAgencies.length > 0 ? (
              <>
                <p className="mb-6 text-gray-600 text-sm">
                  <span className="font-semibold text-gray-900">{filteredAgencies.length}</span>{" "}
                  {filteredAgencies.length === 1 ? "agence trouvée" : "agences trouvées"}
                </p>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
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
                  <Building2 className="w-10 h-10 text-gray-400" />
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
                  className="border-2 border-[#A0522D] text-[#A0522D] hover:bg-[#A0522D] hover:text-white"
                >
                  Réinitialiser la recherche
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 🟪 SECTION 3 — Pourquoi choisir nos agences */}
      <section className="py-20 bg-gradient-to-br from-[#A0522D]/5 via-white to-orange-50/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
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
                icon: Award,
                title: "Agences certifiées",
                description: "Toutes nos agences partenaires sont certifiées et régulièrement évaluées pour garantir la qualité de leurs services et le respect des normes.",
              },
              {
                icon: MapPin,
                title: "Présence nationale",
                description: "Un réseau d'agences réparti dans les principales villes de Côte d'Ivoire pour vous offrir un service de proximité où que vous soyez.",
              },
              {
                icon: Users,
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
                  <div className="w-12 h-12 bg-[#A0522D]/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#A0522D]" />
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
      <section className="relative py-20 bg-gradient-to-r from-[#A0522D] to-[#8B4513] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Besoin d'aide pour choisir une agence ?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Notre équipe est à votre disposition pour vous orienter vers l'agence la plus adaptée à vos besoins. 
              Obtenez un devis personnalisé gratuit et sans engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/devis">
                <Button
                  size="lg"
                  className="bg-white text-[#A0522D] hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all"
                >
                  Demander un devis gratuit
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
                onClick={() => window.location.href = "/contact"}
              >
                Nous contacter
              </Button>
            </div>
            <p className="text-sm text-white/80 mt-4">
              <Info className="w-4 h-4 inline mr-1" />
              Réponse sous 24h • Devis gratuit • Sans engagement
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
