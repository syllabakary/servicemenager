import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AgencyCard } from "@/components/AgencyCard";
import { useQuery } from "@tanstack/react-query";
import type { Agency } from "@shared/schema";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

export default function Agencies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedService, setSelectedService] = useState("all");

  const { data: agencies, isLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const cities = useMemo(() => {
    if (!agencies) return [];
    return Array.from(new Set(agencies.map((a) => a.ville))).sort();
  }, [agencies]);

  const allServices = useMemo(() => {
    if (!agencies) return [];
    const services = new Set<string>();
    agencies.forEach((agency) => {
      agency.services.forEach((service) => services.add(service));
    });
    return Array.from(services).sort();
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    if (!agencies) return [];

    return agencies.filter((agency) => {
      const matchesSearch =
        searchTerm === "" ||
        agency.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCity = selectedCity === "all" || agency.ville === selectedCity;

      const matchesService =
        selectedService === "all" || agency.services.includes(selectedService);

      return matchesSearch && matchesCity && matchesService;
    });
  }, [agencies, searchTerm, selectedCity, selectedService]);

  return (
    <div className="min-h-screen pt-16">
      <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="heading-agencies-page">
              Nos Agences Partenaires
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-agencies-intro">
              Trouvez l'agence idéale près de chez vous
            </p>
          </motion.div>
        </div>
      </section>

      <SearchBar
        searchTerm={searchTerm}
        selectedCity={selectedCity}
        selectedService={selectedService}
        onSearchChange={setSearchTerm}
        onCityChange={setSelectedCity}
        onServiceChange={setSelectedService}
        cities={cities}
        services={allServices}
      />

      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="agencies-loading">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-card rounded-lg animate-pulse" data-testid={`skeleton-agency-${i}`} />
              ))}
            </div>
          ) : filteredAgencies.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground" data-testid="text-agencies-count">
                  <span className="font-semibold text-foreground" data-testid="text-count-value">{filteredAgencies.length}</span>{" "}
                  {filteredAgencies.length === 1 ? "agence trouvée" : "agences trouvées"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="agencies-grid">
                {filteredAgencies.map((agency, index) => (
                  <AgencyCard key={agency.id} agency={agency} delay={index * 0.05} />
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
              data-testid="agencies-empty-state"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">Aucune agence trouvée</h3>
              <p className="text-muted-foreground" data-testid="text-empty-message">
                Essayez de modifier vos critères de recherche
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
