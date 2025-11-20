import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export function PromotionalBanner() {
  // Récupérer le banner depuis l'API
  const { data: bannerData, isLoading } = useQuery({
    queryKey: ["home_banner"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/pages/?key=home_banner&is_active=true");
      const data = await response.json();
      // Retourner le premier résultat s'il existe
      return data.results?.[0] || null;
    },
  });

  // Ne rien afficher si le banner n'est pas actif ou n'existe pas
  if (isLoading || !bannerData || !bannerData.is_active) {
    return null;
  }

  // Utiliser le texte du body ou un texte par défaut
  const bannerText = bannerData.body || "Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*";

  return (
    <section className="bg-[#DC2626] text-white py-2 sm:py-3 overflow-x-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 sm:gap-4">
          <p className="text-xs sm:text-sm md:text-base font-medium text-center sm:text-left">
            {bannerText}
          </p>
          <Link href="/devis" className="w-full sm:w-auto">
            <Button
              size="sm"
              className="w-full sm:w-auto bg-white text-[#DC2626] hover:bg-gray-100 font-semibold text-xs sm:text-sm"
            >
              J'en profite !
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

