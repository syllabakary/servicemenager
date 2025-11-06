import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight, CheckCircle2, Star, MapPin, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/HeroSection";
import { ServiceCard } from "@/components/ServiceCard";
import { AgencyCard } from "@/components/AgencyCard";
import { QuoteForm } from "@/components/QuoteForm";
import type { Service, Agency } from "@shared/schema";

export default function Home() {
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: agencies, isLoading: agenciesLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  return (
    <div className="overflow-hidden bg-background text-foreground">
      {/* === HERO SECTION === */}
      <HeroSection>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-32 bg-gradient-to-b from-primary/10 to-transparent"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Simplifiez votre quotidien <br />
            <span className="text-primary">avec nos services pros</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Des solutions rapides, humaines et locales pour tout ce qui compte dans votre vie.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="#services-section">
              <Button size="lg" className="gap-2 group">
                Explorer nos services
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-primary text-primary hover:bg-primary/10"
              onClick={() => setQuoteFormOpen(true)}
            >
              Demander un devis
            </Button>
          </div>
        </motion.div>
      </HeroSection>

      {/* === SERVICES SECTION === */}
      <section id="services-section" className="py-24 relative bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Nos Services
            </span>
            <h2 className="text-4xl font-bold mb-4">Des prestations sur mesure</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choisissez parmi une sélection variée de services pour chaque besoin du quotidien.
            </p>
          </motion.div>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-card rounded-2xl" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.15 } },
              }}
            >
              {services?.map((service, index) => (
                <motion.div
                  key={service.id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <ServiceCard service={service} delay={index * 0.1} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="text-center mt-16">
            <Link href="/services">
              <Button variant="outline" size="lg" className="gap-2 group">
                Voir tous les services
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* === AGENCIES SECTION === */}
      <section id="agencies-section" className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Nos agences partenaires</h2>
            <p className="text-lg text-muted-foreground">
              Des experts fiables, proches de chez vous.
            </p>
          </motion.div>

          {agenciesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-2xl" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.15 } },
              }}
            >
              {agencies?.slice(0, 3).map((agency, index) => (
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
          )}

          <div className="text-center mt-12">
            <Link href="/agences">
              <Button size="lg" className="gap-2 group">
                Voir toutes les agences
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* === WHY US SECTION === */}
      <section id="why-us" className="py-24 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-4"
          >
            Pourquoi nous choisir ?
          </motion.h2>
          <p className="text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
            Parce que votre satisfaction est notre mission première.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Professionnels qualifiés",
                desc: "Tous nos prestataires sont vérifiés et évalués régulièrement.",
              },
              {
                title: "Disponibilité garantie",
                desc: "Des interventions rapides selon votre emploi du temps.",
              },
              {
                title: "Tarifs transparents",
                desc: "Des devis clairs sans mauvaises surprises.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl shadow-md p-8 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Testimonial mini-quote */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 italic text-muted-foreground flex flex-col items-center"
          >
            <Quote className="w-6 h-6 mb-2 text-primary" />
            “Grâce à eux, j’ai trouvé un service fiable en 24 h — incroyable !”
            <span className="mt-2 text-sm text-primary font-medium">— Awa, Abidjan</span>
          </motion.div>
        </div>
      </section>

      {/* === CTA SECTION === */}
      <section
        id="cta"
        className="py-24 bg-gradient-to-r from-primary to-orange-500 text-primary-foreground text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold mb-4">Prêt à passer à l’action ?</h2>
          <p className="text-lg mb-10 max-w-2xl mx-auto text-primary-foreground/90">
            Un clic suffit pour simplifier votre quotidien et vous libérer du stress.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => setQuoteFormOpen(true)}
            >
              Demander un devis gratuit
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link href="/services">
              <Button
                size="lg"
                variant="outline"
                className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/20"
              >
                Découvrir les services
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* === MODAL DEVIS === */}
      <QuoteForm open={quoteFormOpen} onOpenChange={setQuoteFormOpen} />
    </div>
  );
}
