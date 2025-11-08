import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Star,
  Clock,
  Sparkles,
  Shield,
  Paintbrush,
  TreeDeciduous,
  Baby,
  Truck
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

// Mapping icônes selon ton service
const iconMap: any = {
  Sparkles,
  Baby,
  TreeDeciduous,
  Paintbrush,
  Shield,
  Truck,
};

export default function ServiceDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const serviceId = params.id;

  // MOCK DATA — à remplacer plus tard avec une API
  const service = {
    id: parseInt(serviceId || "1"),
    nom: "Nettoyage résidentiel",
    icone: "Sparkles",
    description:
      "Un service complet pour que votre maison brille du sol au plafond. Nos professionnels utilisent des produits écologiques et des techniques éprouvées pour un résultat impeccable.",
    prix: "À partir de 50€/heure",
    duree: "2-4 heures",
    prestations: [
      "Nettoyage complet des sols",
      "Dépoussiérage du mobilier",
      "Nettoyage des vitres",
      "Désinfection des surfaces",
      "Cuisine & sanitaires",
      "Remise en ordre générale",
    ],
    avis: [
      { nom: "Marie D.", note: 5, commentaire: "Excellent service, très professionnel !" },
      { nom: "Pierre L.", note: 5, commentaire: "Très satisfait du résultat." },
      { nom: "Sophie M.", note: 4, commentaire: "Bon service, recommande." },
    ],
  };

  const Icon = iconMap[service.icone] || Sparkles;

  return (
    <div className="min-h-screen pt-16 bg-background">
      {/* HEADER */}
      <section className="py-8 bg-card/70 backdrop-blur-md border-b border-border sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/services")}
            className="mb-4 gap-2 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux services
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-start gap-4"
          >
            {/* Icône du service */}
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Icon className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {service.nom}
              </h1>

              <div className="flex flex-wrap gap-5 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Durée : {service.duree}
                </div>

                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  4.8 (127 avis)
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-2 space-y-10">
              {/* DESCRIPTION */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </motion.div>

              {/* PRESTATIONS LIST */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold mb-3">
                  Prestations incluses
                </h2>
                <ul className="space-y-3">
                  {service.prestations.map((prestation, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">{prestation}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* AVIS */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold mb-5">Avis clients</h2>

                <div className="space-y-4">
                  {service.avis.map((avis, i) => (
                    <div
                      key={i}
                      className="border border-border/70 rounded-lg p-4 hover:border-primary/40 transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{avis.nom}</span>
                        <div className="flex">
                          {[...Array(avis.note)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {avis.commentaire}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* SIDEBAR RIGHT */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="bg-card border border-border rounded-xl p-6 shadow-md sticky top-28">
                <h3 className="text-xl font-semibold mb-6">Réserver ce service</h3>

                <div className="space-y-6 mb-6">
                  <div>
                    <p className="text-sm font-medium">Prix</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {service.prix}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Durée estimée</p>
                    <p className="text-muted-foreground">{service.duree}</p>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Demander un devis
                </Button>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Réponse sous 24h garantie
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
