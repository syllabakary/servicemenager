import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AgencyCard } from "@/components/AgencyCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Sparkles } from "lucide-react";
import type { Agency } from "@shared/schema";

const mockAgencies: Agency[] = [
  {
    id: 1,
    nom: "ProNet Abidjan",
    description: "Experts du nettoyage industriel et résidentiel, disponibles 7j/7 pour vos besoins d’entretien.",
    ville: "Abidjan",
    services: ["Nettoyage", "Désinfection", "Entretien de bureaux"],
    image: "./Abidjan_agency_storefront_41598fcd.png",
  },
  {
    id: 2,
    nom: "Garderie Les Petits Soleils",
    description: "Des nounous expérimentées et bienveillantes pour un accompagnement quotidien à domicile.",
    ville: "Yamoussoukro",
    services: ["Garde d’enfants", "Aide aux devoirs", "Accompagnement scolaire"],
    image: "./Childcare_service_photo_e9f137e4.png",
  },
  {
    id: 3,
    nom: "Green Touch Services",
    description: "Paysagistes professionnels pour jardins, terrasses et espaces verts.",
    ville: "Bouaké",
    services: ["Entretien de jardin", "Élagage", "Aménagement paysager"],
    image: "./Gardening_service_photo_0007b568.png",
  },
  {
    id: 4,
    nom: "Clean & Fresh",
    description: "Une équipe moderne et rapide pour redonner éclat et fraîcheur à vos espaces.",
    ville: "San Pedro",
    services: ["Nettoyage", "Blanchisserie", "Service express"],
    image: "./Childcare_service_photo_e9f137e4.png",
  },
  {
    id: 5,
    nom: "BabyCare Pro",
    description: "Service premium de garde d’enfants à domicile, flexible et sécurisé.",
    ville: "Abidjan",
    services: ["Garde d’enfants", "Soins de nourrissons", "Éveil ludique"],
    image: "./Abidjan_agency_storefront_41598fcd.png",
  },
];

export default function Agencies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedService, setSelectedService] = useState("all");

  const { data: agencies = mockAgencies, isLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
    queryFn: async () => mockAgencies,
  });

  const cities = useMemo(() => Array.from(new Set(agencies.map((a) => a.ville))).sort(), [agencies]);
  const allServices = useMemo(() => {
    const s = new Set<string>();
    agencies.forEach((a) => a.services.forEach((x) => s.add(x)));
    return Array.from(s).sort();
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    return agencies.filter((agency) => {
      const matchesSearch =
        searchTerm === "" ||
        agency.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = selectedCity === "all" || agency.ville === selectedCity;
      const matchesService = selectedService === "all" || agency.services.includes(selectedService);
      return matchesSearch && matchesCity && matchesService;
    });
  }, [agencies, searchTerm, selectedCity, selectedService]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* 🔥 HEADER VISUEL */}
      <section className="relative h-[60vh] flex items-center justify-center text-center overflow-hidden">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-black-to-b from-black/80 via-black/60 to-background/90" />

        {/* Contenu animé */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-3xl px-4 text-white"
        >
          <div className="flex justify-center mb-4">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Nos Agences Partenaires
          </h1>
          <p className="text-lg text-gray-200">
            Explorez les agences de confiance à travers toute la Côte d’Ivoire.  
            Proximité, qualité et savoir-faire local au rendez-vous.
          </p>
        </motion.div>
      </section>

      {/* BARRE DE RECHERCHE */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-10 relative z-20">
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
      </div>

      {/* LISTE DES AGENCES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredAgencies.length > 0 ? (
            <>
              <p className="mb-6 text-muted-foreground text-sm">
                <span className="font-semibold text-foreground">{filteredAgencies.length}</span>{" "}
                {filteredAgencies.length === 1 ? "agence trouvée" : "agences trouvées"}
              </p>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredAgencies.map((agency, i) => (
                  <AgencyCard key={agency.id} agency={agency} delay={i * 0.1} />
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucune agence trouvée</h3>
              <p className="text-muted-foreground mb-4">
                Essaie d’ajuster tes critères ou explore une autre ville.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCity("all");
                  setSelectedService("all");
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Réinitialiser la recherche
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* FOOTER VISUEL */}
      <div className="relative h-24 bg-gradient-to-t from-primary/10 to-transparent" />
    </div>
  );
}
