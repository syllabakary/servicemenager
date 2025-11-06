import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "/Abidjan_agency_storefront_41598fcd.png";

export function HeroSection() {
  const scrollToAgencies = () => {
    const element = document.getElementById("agencies-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToQuote = () => {
    const element = document.getElementById("demander-devis");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            data-testid="text-hero-title"
          >
            Des services de qualité à votre porte
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl"
            data-testid="text-hero-subtitle"
          >
            Trouvez rapidement des professionnels de confiance pour tous vos besoins : 
            ménage, garde d'enfants, jardinage et bien plus encore.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
            data-testid="hero-cta-buttons"
          >
            <Button
              size="lg"
              variant="outline"
              className="bg-white/95 backdrop-blur-sm text-primary border-white hover:bg-white text-base gap-2"
              onClick={scrollToAgencies}
              data-testid="button-hero-find-agency"
            >
              <Search className="w-5 h-5" />
              Trouver une agence
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-primary-foreground/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-base gap-2"
              onClick={scrollToQuote}
              data-testid="button-hero-request-quote"
            >
              Demander un devis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

     <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />


    </div>
  );
}
