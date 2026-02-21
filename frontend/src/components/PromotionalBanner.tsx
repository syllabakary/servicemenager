import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/config/api";

export function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Récupérer toutes les bannières actives depuis l'API
  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["home_banners"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/pages/?is_active=true`);
      const data = await response.json();
      // Trier par ordre et retourner toutes les bannières actives
      return (data.results || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    },
  });

  const banners = bannersData || [];

  // Carrousel automatique : changer de bannière toutes les 10 secondes
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
  }, [banners.length]);

  // Ne rien afficher si aucune bannière active
  if (isLoading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const bannerText = currentBanner.body || "Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*";

  return (
    <section className="bg-site-banner-bg text-site-banner-text py-2 sm:py-3 overflow-x-hidden w-full max-w-full relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 sm:gap-4"
          >
            <p className="text-xs sm:text-sm md:text-base font-medium text-center sm:text-left">
              {bannerText}
            </p>
            <Link href="/devis" className="w-full sm:w-auto">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-site-banner-button text-site-button-text border-2 border-site-banner-button-border hover:opacity-90 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200"
              >
                J'en profite !
              </Button>
            </Link>
          </motion.div>
        </AnimatePresence>
        
        {/* Indicateurs de bannières (si plusieurs) */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {banners.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
                aria-label={`Aller à la bannière ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

