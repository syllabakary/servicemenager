import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/config/api";

export function PromotionalBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Carrousel automatique toutes les 10 secondes
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const bannerText = currentBanner.body || "Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*";

  return (
    <section className="bg-site-banner-bg text-site-banner-text w-full overflow-hidden" style={{ minHeight: '38px' }}>
      <div className="flex items-center h-full min-h-[38px]">

        {/* Texte défilant marquee */}
        <div className="flex-1 overflow-hidden py-2">
          <div
            key={currentIndex}
            className="whitespace-nowrap"
            style={{ animation: "banner-marquee 28s linear infinite", display: "inline-block" }}
          >
            <span className="text-xs sm:text-sm font-medium px-8">{bannerText}</span>
            <span className="text-xs sm:text-sm font-medium px-8">{bannerText}</span>
            <span className="text-xs sm:text-sm font-medium px-8">{bannerText}</span>
          </div>
        </div>

        {/* Bouton fixe à droite */}
        <div className="flex-shrink-0 px-3">
          <Link href="/devis">
            <Button
              size="sm"
              className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text font-semibold text-xs sm:text-sm rounded-none border-0 shadow-none"
            >
              J'en profite !
            </Button>
          </Link>
        </div>
      </div>

      {/* Indicateurs si plusieurs bannières */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-1">
          {banners.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 transition-all duration-300 ${
                index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Bannière ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
