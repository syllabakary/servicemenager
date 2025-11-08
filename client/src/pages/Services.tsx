import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/QuoteForm";
import {
  Sparkles,
  Baby,
  TreeDeciduous,
  ArrowRight,
  Paintbrush,
  Shield,
  Truck,
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

// 🌟 Données fictives
const mockServices: Service[] = [
  {
    id: 1,
    nom: "Nettoyage résidentiel",
    description:
      "Un service complet pour que votre maison brille du sol au plafond.",
    icone: "Sparkles",
  },
  {
    id: 2,
    nom: "Garde d’enfants à domicile",
    description:
      "Des nounous qualifiées et bienveillantes pour prendre soin de vos petits trésors.",
    icone: "Baby",
  },
  {
    id: 3,
    nom: "Entretien de jardin",
    description:
      "Confiez vos espaces verts à nos experts pour un jardin toujours éclatant.",
    icone: "TreeDeciduous",
  },
  {
    id: 4,
    nom: "Peinture intérieure",
    description:
      "Rafraîchissez votre intérieur avec des finitions modernes et durables.",
    icone: "Paintbrush",
  },
  {
    id: 5,
    nom: "Sécurité & Surveillance",
    description:
      "Protégez votre foyer ou votre entreprise avec nos solutions connectées.",
    icone: "Shield",
  },
  {
    id: 6,
    nom: "Déménagement facile",
    description:
      "Nous prenons soin de vos biens du départ à l’arrivée, sans stress.",
    icone: "Truck",
  },
];

export default function Services() {
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [, setLocation] = useLocation();
  const services = mockServices;

  return (
    <div className="min-h-screen bg-background">
      {/* 🏞️ HEADER AVEC IMAGE */}
      <header className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Image de fond */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
          alt="Services"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dégradé sombre pour lisibilité */}
        <div className="absolute inset-0 bg-black-to-b from-black/60 via-black/40 to-background/80" />

        {/* Texte du header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white px-4 z-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-md">
            Nos Services
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/90">
            Découvrez notre gamme de prestations pensées pour rendre votre vie plus simple, plus sûre et plus agréable.
          </p>
        </motion.div>
      </header>

      {/* 🟧 SECTION 1 — Liste des services */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background via-background/95 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              Des services pensés pour vous
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nous combinons expertise humaine et technologies modernes pour vous offrir des prestations fiables et accessibles.
            </p>
          </motion.div>

          {/* Cartes de services */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
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
            {services.map((service) => {
              const IconComponent =
                iconMap[service.icone as keyof typeof iconMap] || Sparkles;

              return (
                <motion.div
                  key={service.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{
                    scale: 1.04,
                    boxShadow:
                      "0 8px 30px rgba(250, 120, 69, 0.15), 0 0 10px rgba(250, 120, 69, 0.1)",
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 12 }}
                  className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm shadow-md transition-all duration-300 p-8 flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <IconComponent className="w-8 h-8" />
                  </div>

                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    {service.nom}
                  </h3>

                  <p className="text-base text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>

                  <Button
                    variant="ghost"
                    className="mt-3 gap-2 text-primary hover:text-primary/90 hover:bg-primary/10 active:scale-95 transition-transform"
                    onClick={() => setLocation(`/services/${service.id}`)}
                  >
                    Découvrir
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 🟪 SECTION 2 — CTA Devis */}
      <section className="relative py-20 bg-card border-t border-border/40 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(250,120,69,0.1),transparent_70%)]"
          animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Une question sur nos services ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Notre équipe est à votre disposition pour vous accompagner dans
              votre projet.
            </p>
            <Button
              size="lg"
              className="gap-2 hover:scale-105 transition-all duration-300 shadow-md shadow-primary/20"
              onClick={() => setQuoteFormOpen(true)}
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <QuoteForm open={quoteFormOpen} onOpenChange={setQuoteFormOpen} />
    </div>
  );
}
