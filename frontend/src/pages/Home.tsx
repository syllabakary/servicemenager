import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  MapPin, 
  Quote,
  Baby,
  TreeDeciduous,
  Paintbrush,
  Shield,
  Truck,
  FileText,
  Users,
  Settings,
  Heart,
  Phone,
  Clock,
  Info,
  ChevronRight,
  HandHeart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { AgencyCard } from "@/components/AgencyCard";
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
  Sparkles,
  Baby,
  TreeDeciduous,
  Paintbrush,
  Shield,
  Truck,
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
    <div className="overflow-hidden bg-gradient-to-b from-gray-50 to-white text-foreground">
      {/* === PROMOTIONAL BANNER === */}
      <section className="bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513] text-white py-3 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm md:text-base font-medium">
              Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*
            </p>
            <Link href="/devis">
              <Button
                size="sm"
                className="bg-white text-[#A0522D] hover:bg-gray-100 font-semibold"
              >
                J'en profite !
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* === HERO SECTION === */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-white"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Nous aimons vous rendre la vie plus <span className="text-[#FFD700]">facile</span> !
            </h1>
            <p className="text-lg md:text-xl mb-6 leading-relaxed">
              Ménage, aide à domicile, jardinage, garde d'enfant : depuis + de 20 ans, 
              nous nous tenons à vos côtés pour <span className="font-semibold">rendre votre quotidien plus serein</span>.
            </p>
            <p className="text-base md:text-lg mb-8">
              Retrouvez du temps pour vous grâce aux <strong>services à la personne</strong>.
            </p>
            
            {/* Rating */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />
                </div>
                <span className="text-2xl font-bold">4.4</span>
                <span className="text-white/80">sur 5</span>
              </div>
              <div className="h-6 w-px bg-white/30" />
              <span className="text-sm text-white/90">
                <strong>4132</strong> avis authentifiés
              </span>
            </div>
          </motion.div>

          {/* Interactive Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-5xl">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-lg shadow-xl p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <HandHeart className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Besoin d'un coup de pouce à la maison ?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Demandez votre tarif sur mesure
                  </p>
                </div>
              </div>
              <Link href="/devis" className="w-full">
                <Button
                  className="w-full bg-[#A0522D] hover:bg-[#8B4513] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Obtenez votre devis personnalisé
                </Button>
              </Link>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white rounded-lg shadow-xl p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Vous cherchez un métier qui a du sens ?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Nous recrutons près de chez vous
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                Je postule
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === SERVICES SECTION === */}
      <section id="services-section" className="py-20 bg-gradient-to-b from-blue-50/40 via-white to-gray-50/30 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#A0522D]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          {/* Header with CTA */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-4">
            <div className="flex-1">
              <p className="text-sm md:text-base font-semibold text-[#A0522D] uppercase tracking-wide mb-2">
                Découvrez nos services à la personne sur mesure et sans engagement
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                De quoi avez-vous <span className="text-[#A0522D]">besoin</span> ?
              </h2>
            </div>
            <div className="flex-shrink-0 text-right">
              <Link href="/devis">
                <Button
                  size="lg"
                  className="bg-[#A0522D] hover:bg-[#8B4513] text-white mb-2 shadow-lg hover:shadow-xl transition-all"
                >
                  Obtenez votre devis personnalisé
                </Button>
              </Link>
              <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                <Info className="w-3 h-3" />
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.15 } },
              }}
            >
              {services.slice(0, 3).map((service, index) => {
                const IconComponent = 
                  iconMap[(service.icone || "Sparkles") as keyof typeof iconMap] || Sparkles;
                return (
                <motion.div
                  key={service.id}
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
                  className="gap-2 group px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-[#A0522D] to-[#8B4513] hover:from-[#8B4513] hover:to-[#A0522D] text-white"
                >
                Voir tous les services
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </Button>
            </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* === AGENCIES SECTION === */}
      <section id="agencies-section" className="py-20 bg-gradient-to-b from-gray-50/50 via-white to-blue-50/30">
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
                  className="gap-2 group px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-[#A0522D] to-[#8B4513] hover:from-[#8B4513] hover:to-[#A0522D] text-white"
                >
                Voir toutes les agences
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </Button>
            </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* === HOW IT WORKS SECTION === */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,146,60,0.08),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
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
              <div key={i} className="flex items-center w-full md:w-auto">
              <motion.div
                  initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                  className="flex flex-col items-center text-center max-w-[240px]"
              >
                  <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
                {i < 3 && (
                  <ChevronRight className="w-6 h-6 text-[#A0522D] mx-2 hidden md:block flex-shrink-0" />
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
                className="bg-[#A0522D] hover:bg-[#8B4513] text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Demande de devis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* === TESTIMONIALS SECTION === */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-purple-50/30 to-blue-50/40 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          transition={{ duration: 0.8 }}
            className="text-center mb-12"
        >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Nos clients retrouvent le <span className="text-[#A0522D] italic font-serif">sourire</span> avec nous
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Avis authentiques</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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

    </div>
  );
}
