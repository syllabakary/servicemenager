import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/QuoteForm";
import { Sparkles, Baby, TreeDeciduous, ArrowRight, Paintbrush, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Service } from "@shared/schema";

const iconMap = {
  Sparkles,
  Baby,
  TreeDeciduous,
  Paintbrush,
  Shield,
  Truck,
};

// 🧩 Données fictives améliorées pour le dev (6 services)
const mockServices: Service[] = [
  {
    id: 1,
    nom: "Nettoyage résidentiel",
    description: "Un service complet pour que votre maison brille du sol au plafond.",
    icone: "Sparkles",
  },
  {
    id: 2,
    nom: "Garde d’enfants à domicile",
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
    description: "Nous prenons soin de vos biens du départ à l’arrivée, sans stress.",
    icone: "Truck",
  },
];

export default function Services() {
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const services = mockServices; // 🔥 données locales pour le dev
  const isLoading = false; // désactive le loading pendant le dev

  return (
    <div className="min-h-screen pt-16 bg-background">
      {/* 🟧 SECTION 1 — Liste des services */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="heading-services-page">
              Nos Services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-services-intro">
              Des prestations locales, fiables et humaines — pour simplifier votre quotidien.
            </p>
          </motion.div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-testid="services-loading-page"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-card rounded-xl animate-pulse"
                  data-testid={`skeleton-service-page-${i}`}
                />
              ))}
            </div>
          ) : (
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
              {services.map((service, index) => {
                const IconComponent =
                  iconMap[service.icone as keyof typeof iconMap] || Sparkles;
                return (
                  <motion.div
                    key={service.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-md hover:shadow-lg hover:border-primary/40 transition-all"
                  >
                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {service.nom}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {service.description}
                      </p>
                      <Button
                        variant="ghost"
                        className="mt-3 gap-2 text-primary hover:text-primary/90 hover:bg-primary/10"
                      >
                        Découvrir
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* 🟪 SECTION 2 — CTA Devis */}
      <section className="py-20 bg-card border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              data-testid="heading-services-cta"
            >
              Une question sur nos services ?
            </h2>
            <p
              className="text-lg text-muted-foreground mb-8"
              data-testid="text-services-cta"
            >
              Notre équipe est à votre disposition pour vous accompagner dans
              votre projet.
            </p>
            <Button
              size="lg"
              className="gap-2 hover:scale-105 transition-all duration-300 shadow-md shadow-primary/20"
              onClick={() => setQuoteFormOpen(true)}
              data-testid="button-services-quote"
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 🧾 FORMULAIRE DEVIS */}
      <QuoteForm open={quoteFormOpen} onOpenChange={setQuoteFormOpen} />
    </div>
  );
}
