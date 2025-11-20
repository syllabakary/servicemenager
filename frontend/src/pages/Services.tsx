import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FaArrowRight,
  FaBaby,
  FaTree,
  FaPaintBrush,
  FaShieldAlt,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaStar,
  FaInfoCircle,
  FaSearch,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { motion } from "framer-motion";

// 🧩 Type de service
interface Service {
  id: number;
  nom: string;
  description: string;
  icone: string;
}

// 🧠 Mapping des icônes
const iconMap = {
  Sparkles: HiSparkles,
  Baby: FaBaby,
  TreeDeciduous: FaTree,
  Paintbrush: FaPaintBrush,
  Shield: FaShieldAlt,
  Truck: FaTruck,
};

// 🌟 Données fictives enrichies
const mockServices: (Service & {
  avantages: string[];
  duree: string;
  prix: string;
  note: number;
  nombreAvis: number;
})[] = [
  {
    id: 1,
    nom: "Nettoyage résidentiel",
    description:
      "Un service complet pour que votre maison brille du sol au plafond. Nos professionnels utilisent des produits écologiques et des techniques éprouvées.",
    icone: "Sparkles",
    avantages: [
      "Aides-ménagères qualifiées et valorisées",
      "Prestations 100% personnalisables",
      "Aucune gestion administrative",
      "Produits écologiques certifiés"
    ],
    duree: "2-4 heures",
    prix: "À partir de 25€/heure",
    note: 4.8,
    nombreAvis: 1245,
  },
  {
    id: 2,
    nom: "Garde d'enfants à domicile",
    description:
      "Des nounous qualifiées et bienveillantes pour prendre soin de vos petits trésors. Service flexible adapté à vos horaires.",
    icone: "Baby",
    avantages: [
      "Nounous certifiées et expérimentées",
      "Flexibilité des horaires",
      "Activités d'éveil ludiques",
      "Suivi personnalisé de l'enfant"
    ],
    duree: "Sur mesure",
    prix: "À partir de 20€/heure",
    note: 4.9,
    nombreAvis: 892,
  },
  {
    id: 3,
    nom: "Entretien de jardin",
    description:
      "Confiez vos espaces verts à nos experts pour un jardin toujours éclatant. Taille, tonte, plantation et aménagement.",
    icone: "TreeDeciduous",
    avantages: [
      "Paysagistes professionnels",
      "Entretien régulier ou ponctuel",
      "Conseils personnalisés",
      "Matériel professionnel inclus"
    ],
    duree: "1-3 heures",
    prix: "À partir de 30€/heure",
    note: 4.7,
    nombreAvis: 567,
  },
  {
    id: 4,
    nom: "Peinture intérieure",
    description:
      "Rafraîchissez votre intérieur avec des finitions modernes et durables. Peintres professionnels pour un résultat impeccable.",
    icone: "Paintbrush",
    avantages: [
      "Peintres certifiés",
      "Finitions de qualité",
      "Peintures écologiques disponibles",
      "Protection des meubles incluse"
    ],
    duree: "1-3 jours",
    prix: "À partir de 35€/m²",
    note: 4.6,
    nombreAvis: 423,
  },
  {
    id: 5,
    nom: "Sécurité & Surveillance",
    description:
      "Protégez votre foyer ou votre entreprise avec nos solutions connectées. Installation et maintenance professionnelles.",
    icone: "Shield",
    avantages: [
      "Systèmes connectés modernes",
      "Installation professionnelle",
      "Maintenance incluse",
      "Support 24/7"
    ],
    duree: "Installation 2-4h",
    prix: "À partir de 150€/mois",
    note: 4.8,
    nombreAvis: 312,
  },
  {
    id: 6,
    nom: "Déménagement facile",
    description:
      "Nous prenons soin de vos biens du départ à l'arrivée, sans stress. Équipe expérimentée et matériel adapté.",
    icone: "Truck",
    avantages: [
      "Équipe expérimentée",
      "Matériel professionnel",
      "Assurance incluse",
      "Déménagement complet"
    ],
    duree: "1 journée",
    prix: "À partir de 500€",
    note: 4.9,
    nombreAvis: 678,
  },
];

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtrer les services
  const filteredServices = useMemo(() => {
    let filtered = [...mockServices];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.nom.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.avantages.some((av) => av.toLowerCase().includes(query))
      );
    }

    // Filtre par note minimale
    if (minRating !== null) {
      filtered = filtered.filter((service) => service.note >= minRating);
    }

    return filtered;
  }, [searchQuery, minRating]);

  // Statistiques
  const stats = useMemo(() => {
    const totalServices = mockServices.length;
    const avgRating =
      mockServices.reduce((sum, s) => sum + s.note, 0) / totalServices;
    const totalReviews = mockServices.reduce((sum, s) => sum + s.nombreAvis, 0);
    return { totalServices, avgRating, totalReviews };
  }, []);

  return (
    <div className="min-h-screen bg-white pt-20 overflow-x-hidden w-full max-w-full">
      {/* 🏞️ HEADER AVEC IMAGE */}
      <header className="relative h-[45vh] sm:h-[50vh] md:h-[60vh] lg:h-[65vh] flex items-center justify-center overflow-hidden">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        </div>

        {/* Texte du header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white px-3 sm:px-4 z-10 max-w-4xl mx-auto"
        >
          <Badge className="mb-3 sm:mb-4 md:mb-6 bg-white/20 backdrop-blur-md text-white border-2 border-white/40 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold">
            <HiSparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2" />
            Nos Services
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 drop-shadow-2xl leading-tight px-2">
            Des services pensés pour <span className="text-yellow-400">vous</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl text-white/95 mb-4 sm:mb-6 md:mb-8 leading-relaxed drop-shadow-md px-2">
            Découvrez notre gamme de prestations pensées pour rendre votre vie plus simple, plus sûre et plus agréable.
          </p>
          <Link href="/devis" className="block px-2">
            <Button
              size="lg"
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xl hover:shadow-2xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-lg font-semibold transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Obtenir un devis gratuit</span>
              <span className="sm:hidden">Devis gratuit</span>
              <FaArrowRight className="ml-1.5 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* 🟧 SECTION 1 — Pourquoi nous choisir */}
      <section className="py-12 sm:py-16 md:py-20 bg-white border-b border-gray-200 -mt-4 sm:-mt-6 md:-mt-8 relative z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2">
              Pourquoi choisir nos <span className="text-[#DC2626]">services</span> ?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Des avantages concrets qui font la différence au quotidien
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {[
              {
                icon: FaShieldAlt,
                title: "Professionnels certifiés",
                description: "Tous nos intervenants sont sélectionnés, formés et régulièrement évalués"
              },
              {
                icon: FaCheckCircle,
                title: "Satisfaction garantie",
                description: "100% de satisfaction ou remboursement garanti sur tous nos services"
              },
              {
                icon: FaClock,
                title: "Disponibilité 7j/7",
                description: "Des services adaptés à vos horaires, même en urgence"
              },
              {
                icon: HiSparkles,
                title: "Tarifs transparents",
                description: "Pas de surprise, des devis clairs et détaillés sans frais cachés"
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

      {/* 🟧 SECTION 2 — Liste des services avec recherche */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-white relative">
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2">
              Tous nos services en <span className="text-[#DC2626]">détail</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Nous combinons expertise humaine et technologies modernes pour vous offrir des prestations fiables et accessibles.
            </p>
          </motion.div>

          {/* Barre de recherche et filtres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-gray-100 hover:border-[#DC2626]/30 transition-all duration-300">
              {/* Barre de recherche principale */}
              <div className="relative mb-4 sm:mb-6">
                <FaSearch className="absolute left-3 sm:left-4 md:left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#DC2626]" />
                <Input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 md:pl-14 pr-10 sm:pr-12 md:pr-14 h-12 sm:h-14 md:h-16 text-sm sm:text-base border-2 border-gray-200 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 rounded-xl shadow-sm hover:border-[#DC2626]/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>

              {/* Bouton filtres */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 border-2 border-gray-200 hover:border-[#DC2626] text-xs sm:text-sm w-full sm:w-auto"
                >
                  <FaFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Filtres
                  {minRating !== null && (
                    <Badge className="ml-1 sm:ml-2 bg-[#DC2626] text-white text-xs">{minRating}+ ⭐</Badge>
                  )}
                </Button>
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
                  {filteredServices.length} service{filteredServices.length > 1 ? "s" : ""} trouvé{filteredServices.length > 1 ? "s" : ""}
                </div>
              </div>

              {/* Panneau de filtres */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Note minimale
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[4.5, 4.0, 3.5, null].map((rating) => (
                          <Button
                            key={rating ?? "all"}
                            variant={minRating === rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMinRating(rating)}
                            className={
                              minRating === rating
                                ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                                : "border-gray-200 hover:border-[#DC2626]"
                            }
                          >
                            {rating ? `${rating}+ ⭐` : "Toutes"}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {(minRating !== null || searchQuery) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMinRating(null);
                          setSearchQuery("");
                        }}
                        className="text-[#DC2626] hover:text-[#B91C1C]"
                      >
                        <FaTimes className="w-4 h-4 mr-2" />
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Message si aucun résultat */}
          {filteredServices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Aucun service trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                Essayez de modifier vos critères de recherche ou vos filtres.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setMinRating(null);
                }}
                className="border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
              >
                Réinitialiser la recherche
              </Button>
            </motion.div>
          ) : (
            /* Cartes de services enrichies */
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {filteredServices.map((service) => {
              const IconComponent =
                iconMap[service.icone as keyof typeof iconMap] || HiSparkles;

              return (
                <motion.div
                  key={service.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 150, damping: 12 }}
                >
                  <Card className="h-full min-h-[420px] group relative overflow-hidden border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-[#DC2626] transition-all duration-300 bg-white flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 sm:gap-0">
                        <div className="w-16 h-16 rounded-xl bg-[#DC2626]/10 flex items-center justify-center group-hover:bg-[#DC2626] transition-all duration-300 flex-shrink-0 border-2 border-[#DC2626]/20 group-hover:border-[#DC2626]">
                          <IconComponent className="w-8 h-8 text-[#DC2626] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full self-start sm:self-center">
                          <FaStar className="w-4 h-4 fill-[#DC2626] text-[#DC2626]" />
                          <span className="text-sm font-bold text-gray-900">{service.note}</span>
                          <span className="text-xs text-gray-500">({service.nombreAvis})</span>
                        </div>
                      </div>

                      <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                        {service.nom}
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600 leading-relaxed">
                        {service.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 justify-between space-y-5">
                      {/* Avantages */}
                      <div className="space-y-3">
                        {service.avantages.slice(0, 3).map((avantage, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                            <FaCheckCircle className="w-5 h-5 text-[#DC2626] mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{avantage}</span>
                          </div>
                        ))}
                      </div>

                      {/* Informations pratiques */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-5 border-t-2 border-gray-100 text-sm">
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                          <FaClock className="w-5 h-5 text-[#DC2626]" />
                          <span>{service.duree}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-[#DC2626]">
                          <FaInfoCircle className="w-5 h-5" />
                          <span>{service.prix}</span>
                        </div>
                      </div>

                      {/* Bouton */}
                      <Button
                        className="w-full mt-6 h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
                        onClick={() => setLocation(`/services/${service.id}`)}
                      >
                        Voir les détails
                        <FaArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>

                </motion.div>
              );
            })}
            </motion.div>
          )}
        </div>
      </section>

      {/* 🟪 SECTION 3 — Pourquoi nous choisir */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir nos services ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des avantages qui font la différence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: FaUsers,
                title: "Professionnels certifiés",
                description: "Tous nos intervenants sont sélectionnés, formés et régulièrement évalués pour garantir la qualité de nos services.",
              },
              {
                icon: FaShieldAlt,
                title: "Assurance et garantie",
                description: "Vos biens et votre tranquillité sont protégés par nos assurances et nos garanties de satisfaction.",
              },
              {
                icon: FaClock,
                title: "Disponibilité flexible",
                description: "Des services adaptés à vos horaires, disponibles même en urgence pour certains services.",
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
      <section className="relative py-24 bg-[#DC2626] text-white overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
              Une question sur nos services ?
            </h2>
            <p className="text-xl text-white/95 mb-10 leading-relaxed max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour vous accompagner dans votre projet. 
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
                onClick={() => setLocation("/contact")}
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
