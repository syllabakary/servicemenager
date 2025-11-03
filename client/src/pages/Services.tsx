import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/QuoteForm";
import { Sparkles, Baby, TreeDeciduous, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";
import { motion } from "framer-motion";

const iconMap = {
  Sparkles,
  Baby,
  TreeDeciduous,
};

export default function Services() {
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  return (
    <div className="min-h-screen pt-16">
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="heading-services-page">
              Nos Services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-services-intro">
              Découvrez notre gamme complète de services professionnels pour améliorer votre quotidien
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="services-loading-page">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-card rounded-lg animate-pulse" data-testid={`skeleton-service-page-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.map((service, index) => {
                const IconComponent = iconMap[service.icone as keyof typeof iconMap] || Sparkles;
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
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="heading-services-cta">
              Une question sur nos services ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8" data-testid="text-services-cta">
              Notre équipe est à votre disposition pour vous accompagner dans votre projet
            </p>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setQuoteFormOpen(true)}
              data-testid="button-services-quote"
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
