import { useState } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FaComment,
  FaAward,
  FaChartLine,
  FaInfoCircle,
  FaDollarSign,
  FaArrowRight,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const iconMap: Record<string, any> = {
  Sparkles: HiSparkles,
  Baby: FaBaby,
  TreeDeciduous: FaTree,
  Paintbrush: FaPaintBrush,
  Shield: FaShieldAlt,
  Truck: FaTruck,
};

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
  const serviceId = parseInt(params.id || "1");
  const service = mockServiceDetails[serviceId] || mockServiceDetails[1];
  const [activeTab, setActiveTab] = useState<"prestations" | "avis" | "faq">("prestations");

  const Icon = iconMap[service.icone] || HiSparkles;

  // Filtrer les services similaires (exclure le service actuel)
  const similarServices = mockServices.filter(s => s.id !== serviceId).slice(0, 3);

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
              className="gap-2 text-gray-600 hover:text-[#DC2626] hover:bg-[#DC2626]/5"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20">
                <FaChartLine className="w-3 h-3 mr-1" />
                Service populaire
              </Badge>
              
              <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex items-center justify-center rounded-2xl bg-red-50 shadow-lg border border-red-200">
                  <Icon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[#DC2626]" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    {service.nom}
                  </h1>
                  <div className="flex items-center gap-2 text-yellow-500">
                    <FaStar className="w-5 h-5 fill-yellow-400" />
                    <span className="text-lg font-bold text-gray-900">{service.note}</span>
                    <span className="text-gray-600">({service.nombreAvis} avis)</span>
                  </div>
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {service.description}
              </p>

              {/* Quick info cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FaClock className="w-4 h-4 text-[#DC2626]" />
                    <span className="text-sm font-medium">Durée</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{service.duree}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FaDollarSign className="w-4 h-4 text-[#DC2626]" />
                    <span className="text-sm font-medium">Tarif</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{service.prixDetail}</p>
                </div>
              </div>

              {/* Avantages clés */}
              <div className="grid grid-cols-2 gap-3">
                {service.avantages.map((avantage: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <FaCheckCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
                    <span>{avantage}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Booking Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-2xl bg-white overflow-hidden">
                <div className="bg-[#DC2626] p-6 text-white">
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
                      <p className="text-4xl font-bold text-[#DC2626] mb-1">
                        {service.prix}
                      </p>
                      <p className="text-sm text-gray-600">par heure • Devis gratuit</p>
                    </div>

                    <div className="space-y-3">
                      <Link href="/devis">
                        <Button className="w-full h-14 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
                          <FaCalendar className="w-5 h-5 mr-2" />
                          Réserver maintenant
                        </Button>
                      </Link>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <a href="tel:+2250123456789">
                          <Button variant="outline" className="w-full h-12 border-2 border-gray-200 hover:border-[#DC2626] hover:bg-[#DC2626]/5">
                            <FaPhone className="w-4 h-4 mr-2" />
                            Appeler
                          </Button>
                        </a>
                        <Link href="/contact">
                          <Button variant="outline" className="w-full h-12 border-2 border-gray-200 hover:border-[#DC2626] hover:bg-[#DC2626]/5">
                            <FaComment className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Réponse sous 24h garantie</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Devis gratuit et sans engagement</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Satisfait ou remboursé</span>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
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
                  ? "bg-[#DC2626] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Prestations incluses
            </button>
            <button
              onClick={() => setActiveTab("avis")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "avis"
                  ? "bg-[#DC2626] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Avis clients ({service.nombreAvis})
            </button>
            <button
              onClick={() => setActiveTab("faq")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "faq"
                  ? "bg-[#DC2626] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Questions fréquentes
            </button>
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
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Ce qui est inclus
                    </h3>
                    <ul className="space-y-4">
                      {service.prestations.map((prestation: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#DC2626]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FaCheckCircle className="w-4 h-4 text-[#DC2626]" />
                          </div>
                          <span className="text-gray-700 leading-relaxed">{prestation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-lg bg-red-50">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Notre processus
                    </h3>
                    <div className="space-y-6">
                      {service.processus.map((etape: any, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#DC2626] text-white flex items-center justify-center font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">{etape.titre}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {etape.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "avis" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {service.avis.map((avis: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{avis.nom}</p>
                            <p className="text-sm text-gray-500">{avis.date}</p>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(avis.note)].map((_, i) => (
                              <FaStar
                                key={i}
                                className="w-5 h-5 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{avis.commentaire}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "faq" && (
              <div className="max-w-3xl mx-auto space-y-4">
                {service.faq.map((item: any, i: number) => (
                  <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-start gap-3">
                        <FaComment className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-1" />
                        {item.question}
                      </h4>
                      <p className="text-gray-700 leading-relaxed pl-8">{item.reponse}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
          >
            {similarServices.map((similarService, index) => {
              const SimilarIcon = iconMap[similarService.icone as keyof typeof iconMap] || HiSparkles;
              return (
                <motion.div
                  key={similarService.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={`/services/${similarService.id}`}>
                    <Card className="h-full group relative overflow-hidden border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-[#DC2626] transition-all duration-300 bg-white flex flex-col cursor-pointer">
                      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-5 md:px-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#DC2626]/20 to-[#DC2626]/10 flex items-center justify-center border-2 border-[#DC2626]/30 group-hover:bg-[#DC2626] group-hover:border-[#DC2626] transition-all duration-300">
                            <SimilarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#DC2626] group-hover:text-white transition-colors" />
                          </div>
                        </div>
                        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-[#DC2626] transition-colors">
                          {similarService.nom}
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {similarService.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-5 md:px-6 pt-0 pb-4 sm:pb-5 md:pb-6">
                        <div className="flex items-center gap-2 text-[#DC2626] font-semibold group-hover:gap-3 transition-all">
                          <span className="text-sm sm:text-base">Découvrir ce service</span>
                          <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

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
                className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#DC2626] text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 sm:px-8 py-3 sm:py-4"
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