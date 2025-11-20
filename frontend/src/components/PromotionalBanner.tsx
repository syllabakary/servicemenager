import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function PromotionalBanner() {
  return (
    <section className="bg-[#DC2626] text-white py-2 sm:py-3">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 sm:gap-4">
          <p className="text-xs sm:text-sm md:text-base font-medium text-center sm:text-left">
            Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*
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

