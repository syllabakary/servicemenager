import { HeroSection } from "@/components/HeroSection";
import { ServiceCard } from "@/components/ServiceCard";
import { AgencyCard } from "@/components/AgencyCard";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/QuoteForm";
import { Sparkles, ArrowRight, CheckCircle2, Sparkles as SparklesIcon, Baby, TreeDeciduous } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Service, Agency } from "@shared/schema";
import { motion } from "framer-motion";

const iconMap = {
  Sparkles: SparklesIcon,
  Baby,
  TreeDeciduous,
};

export default function Home() {
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: agencies, isLoading: agenciesLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  return (
    <div className="min-h-screen">
      <HeroSection />

      <section className="py-16 md:py-24" id="services-section">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4" data-testid="badge-services-section">
              <Sparkles className="w-4 h-4" />
              Nos services
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="heading-services">
              Des prestations adaptées à vos besoins
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-services-description">
              Découvrez notre gamme complète de services professionnels pour votre quotidien
            </p>
          </motion.div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="services-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-card rounded-lg animate-pulse" data-testid={`skeleton-service-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.map((service, index) => {
                const IconComponent = iconMap[service.icone as keyof typeof iconMap] || SparklesIcon;
                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    icon={IconComponent}
                    delay={index * 0.1}
                  />
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/services" data-testid="link-all-services">
              <Button variant="outline" size="lg" className="gap-2 group" data-testid="button-view-all-services">
                Voir tous les services
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card" id="agencies-section">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="heading-agencies">
              Nos agences partenaires
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-agencies-description">
              Des professionnels de confiance dans votre ville
            </p>
          </motion.div>

          {agenciesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="agencies-loading-home">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-background rounded-lg animate-pulse" data-testid={`skeleton-agency-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agencies?.slice(0, 3).map((agency, index) => (
                <AgencyCard key={agency.id} agency={agency} delay={index * 0.1} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/agences" data-testid="link-all-agencies">
              <Button size="lg" className="gap-2 group" data-testid="button-view-all-agencies">
                Voir toutes les agences
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24" id="why-us">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="heading-why-choose">
              Pourquoi nous choisir ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-why-description">
              Des services de qualité avec des professionnels vérifiés
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-testid="benefits-grid">
            {[
              {
                title: "Professionnels qualifiés",
                description: "Tous nos prestataires sont soigneusement sélectionnés et formés",
              },
              {
                title: "Disponibilité garantie",
                description: "Interventions rapides selon vos besoins et votre emploi du temps",
              },
              {
                title: "Tarifs transparents",
                description: "Des devis clairs sans frais cachés pour tous nos services",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
                data-testid={`benefit-item-${index}`}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center" data-testid={`icon-benefit-${index}`}>
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2" data-testid={`text-benefit-title-${index}`}>{item.title}</h3>
                <p className="text-muted-foreground" data-testid={`text-benefit-description-${index}`}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary text-primary-foreground" id="demander-devis" data-testid="section-cta">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-cta">
              Prêt à simplifier votre quotidien ?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
              Contactez-nous dès maintenant pour obtenir un devis gratuit et personnalisé
            </p>
            <Button
              size="lg"
              variant="outline"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
              onClick={() => setQuoteFormOpen(true)}
              data-testid="button-cta-quote"
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
