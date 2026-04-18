import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/config/api";

export function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = gauche→droite entrant, -1 = droite→gauche entrant

  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["home_banners"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/pages/?is_active=true`);
      const data = await response.json();
      const SYSTEM_KEYS = ["footer_info", "headquarters_location"];
      return (data.results || [])
        .filter((item: any) => !SYSTEM_KEYS.includes(item.key))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    },
  });

  const banners = bannersData || [];

  // Rotation automatique toutes les 6 secondes
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const bannerText = currentBanner.body || "Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*";

  const goTo = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  return (
    <section className="bg-site-banner-bg text-site-banner-text w-full overflow-hidden" style={{ minHeight: "40px" }}>
      <div className="flex items-center min-h-[40px]">

        {/* Icône/étoile décorative gauche */}
        <div className="flex-shrink-0 pl-3 pr-2 opacity-70 hidden sm:block">
          <span className="text-sm">★</span>
        </div>

        {/* Zone texte avec transition slide */}
        <div className="flex-1 overflow-hidden relative py-2" style={{ minHeight: "36px" }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? "-100%" : "100%", opacity: 0 }}
              transition={{ type: "tween", duration: 0.45, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center"
            >
              {/* Texte qui défile si trop long */}
              <div className="overflow-hidden w-full">
                <div
                  className="whitespace-nowrap text-xs sm:text-sm font-medium"
                  style={{
                    animation: "banner-marquee 20s linear infinite",
                    display: "inline-block",
                  }}
                >
                  <span className="px-8">{bannerText}</span>
                  <span className="px-8" aria-hidden>{bannerText}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicateurs points (si plusieurs bannières) */}
        {banners.length > 1 && (
          <div className="flex-shrink-0 flex items-center gap-1 px-2">
            {banners.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-4 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40"
                }`}
                aria-label={`Bannière ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Séparateur + Bouton CTA */}
        <div className="flex-shrink-0 flex items-center border-l border-white/20 pl-3 pr-3 self-stretch">
          <Link href="/devis">
            <Button
              size="sm"
              className="font-semibold text-xs sm:text-sm rounded-none border-0 shadow-none whitespace-nowrap h-auto py-1 px-3"
              style={{
                backgroundColor: "#ffffff",
                color: "var(--site-banner-bg-hex, #087A00)",
              }}
            >
              J'en profite !
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
