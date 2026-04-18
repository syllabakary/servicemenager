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
    <section
      className="bg-site-banner-bg text-site-banner-text w-full overflow-hidden"
      style={{ minHeight: "38px" }}
    >
      <div className="flex items-center min-h-[38px]">
        {/* Zone de défilement marquee */}
        <div className="flex-1 overflow-hidden">
          {/* Le wrapper contient 2 copies — on anime de 0 à -50% pour boucler sans coupure */}
          <div
            key={currentIndex}
            className="flex py-2"
            style={{
              width: "max-content",
              animation: "banner-marquee 22s linear infinite",
            }}
          >
            <span className="text-xs sm:text-sm font-medium px-12 whitespace-nowrap">{bannerText}</span>
            <span className="text-xs sm:text-sm font-medium px-12 whitespace-nowrap" aria-hidden>{bannerText}</span>
          </div>
        </div>

        {/* Bouton fixe à droite */}
        <div className="flex-shrink-0 px-3 border-l border-white/20">
          <Link href="/devis">
            <Button
              size="sm"
              className="bg-white hover:bg-white/90 font-semibold text-xs sm:text-sm rounded-none border-0 shadow-none whitespace-nowrap"
              style={{ color: "var(--site-banner-bg-hex, #087A00)" }}
            >
              J'en profite !
            </Button>
          </Link>
        </div>
      </div>

      {/* Points indicateurs si plusieurs bannières */}
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
