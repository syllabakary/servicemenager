import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Baby,
  TreeDeciduous,
  ArrowRight,
  Paintbrush,
  Shield,
  Truck,
  CheckCircle2,
  Clock,
  Users,
  Star,
  Info,
  Search,
  Filter,
  X,
} from "lucide-react";
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
  Sparkles,
  Baby,
  TreeDeciduous,
  Paintbrush,
  Shield,
  Truck,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      {/* 🏞️ HEADER AVEC IMAGE */}
      <header className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B4513]/80 via-[#A0522D]/70 to-[#8B4513]/80" />
        </div>

        {/* Texte du header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white px-4 z-10 max-w-4xl mx-auto"
        >
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 mr-1" />
            Nos Services
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Des services pensés pour vous
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/95 mb-6">
            Découvrez notre gamme de prestations pensées pour rendre votre vie plus simple, plus sûre et plus agréable.
          </p>
          <Link href="/devis">
            <Button
              size="lg"
              className="bg-white text-[#A0522D] hover:bg-gray-100 shadow-lg"
            >
              Obtenir un devis gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* 🟧 SECTION 1 — Statistiques */}
      <section className="py-12 bg-gradient-to-r from-[#A0522D]/10 via-orange-50/50 to-[#A0522D]/10 border-b border-[#A0522D]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-md text-center"
            >
              <div className="w-12 h-12 bg-[#A0522D]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-[#A0522D]" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalServices}</div>
              <div className="text-sm text-gray-600">Services disponibles</div>
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
          </div>
        </div>
      </section>

      {/* 🟧 SECTION 2 — Liste des services avec recherche */}
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
              Tous nos services en détail
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              {/* Barre de recherche principale */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un service (ex: ménage, jardinage, garde d'enfants...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 h-14 text-base border-2 border-gray-200 focus:border-[#A0522D] rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Bouton filtres */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 border-2 border-gray-200 hover:border-[#A0522D]"
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                  {minRating !== null && (
                    <Badge className="ml-2 bg-[#A0522D] text-white">{minRating}+ ⭐</Badge>
                  )}
                </Button>
                <div className="text-sm text-gray-600">
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
                                ? "bg-[#A0522D] text-white hover:bg-[#8B4513]"
                                : "border-gray-200 hover:border-[#A0522D]"
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
                        className="text-[#A0522D] hover:text-[#8B4513]"
                      >
                        <X className="w-4 h-4 mr-2" />
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
                <Search className="w-10 h-10 text-gray-400" />
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
                className="border-2 border-[#A0522D] text-[#A0522D] hover:bg-[#A0522D] hover:text-white"
              >
                Réinitialiser la recherche
              </Button>
            </motion.div>
          ) : (
            /* Cartes de services enrichies */
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                iconMap[service.icone as keyof typeof iconMap] || Sparkles;

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
                  <Card className="h-full group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-lg bg-[#A0522D]/10 flex items-center justify-center group-hover:bg-[#A0522D]/15 transition-colors">
                          <IconComponent className="w-7 h-7 text-[#A0522D]" />
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold text-gray-900">{service.note}</span>
                          <span className="text-xs text-gray-500">({service.nombreAvis})</span>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {service.nom}
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600 leading-relaxed">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Avantages */}
                      <div className="space-y-2">
                        {service.avantages.slice(0, 3).map((avantage, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-[#A0522D] mt-0.5 flex-shrink-0" />
                            <span>{avantage}</span>
                          </div>
                        ))}
                      </div>

                      {/* Informations pratiques */}
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-[#A0522D]" />
                          <span>{service.duree}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-[#A0522D]">
                          <Info className="w-4 h-4" />
                          <span>{service.prix}</span>
                        </div>
                      </div>

                      {/* Bouton */}
                      <Button
                        variant="ghost"
                        className="w-full gap-2 text-[#A0522D] hover:text-[#8B4513] hover:bg-[#A0522D]/5 font-semibold mt-4"
                        onClick={() => setLocation(`/services/${service.id}`)}
                      >
                        Voir les détails
                        <ArrowRight className="w-4 h-4" />
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
              Pourquoi choisir nos services ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des avantages qui font la différence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Users,
                title: "Professionnels certifiés",
                description: "Tous nos intervenants sont sélectionnés, formés et régulièrement évalués pour garantir la qualité de nos services.",
              },
              {
                icon: Shield,
                title: "Assurance et garantie",
                description: "Vos biens et votre tranquillité sont protégés par nos assurances et nos garanties de satisfaction.",
              },
              {
                icon: Clock,
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
              Une question sur nos services ?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Notre équipe est à votre disposition pour vous accompagner dans votre projet. 
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
                onClick={() => setLocation("/contact")}
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
