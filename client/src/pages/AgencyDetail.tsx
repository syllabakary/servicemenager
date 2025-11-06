import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Agency } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteForm } from "@/components/QuoteForm";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AgencyDetail() {
  const [, params] = useRoute("/agences/:id");
  const agencyId = params?.id ? parseInt(params.id) : null;
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const { data: agencies, isLoading } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });

  const agency = agencies?.find((a) => a.id === agencyId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">😕 Agence introuvable</h1>
          <p className="text-muted-foreground mb-6">
            L’agence que vous recherchez semble ne plus être disponible.
          </p>
          <Link href="/agences">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* HERO */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          src={agency.image}
          alt={agency.nom}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-10 left-8 md:left-16 text-white drop-shadow-lg">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-3"
          >
            {agency.nom}
          </motion.h1>
          <div className="flex items-center gap-2 text-sm md:text-base font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            {agency.ville}, Côte d’Ivoire
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
        <Link href="/agences">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* INFOS */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    À propos de {agency.nom}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {agency.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* SERVICES */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Services proposés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {agency.services.map((service, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.03 }}
                        className="flex items-center gap-2 p-3 rounded-md bg-secondary hover:bg-primary/10 transition"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">{service}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* CONTACT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:sticky lg:top-24 space-y-4"
          >
            <Card className="shadow-md border border-border/70">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Informations de contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Adresse */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">
                      Adresse
                    </p>
                    <p className="text-base">{agency.ville}, Côte d'Ivoire</p>
                  </div>
                </div>

                {/* Téléphone */}
                {agency.telephone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">
                        Téléphone
                      </p>
                      <a
                        href={`tel:${agency.telephone}`}
                        className="text-base hover:text-primary transition-colors"
                      >
                        {agency.telephone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {agency.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">
                        Email
                      </p>
                      <a
                        href={`mailto:${agency.email}`}
                        className="text-base hover:text-primary transition-colors break-all"
                      >
                        {agency.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Horaires */}
                {agency.horaires && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">
                        Horaires
                      </p>
                      <p className="text-base">{agency.horaires}</p>
                    </div>
                  </div>
                )}

                {/* Bouton */}
                <div className="pt-4 border-t border-border">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setQuoteFormOpen(true)}
                  >
                    Demander un devis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <QuoteForm open={quoteFormOpen} onOpenChange={setQuoteFormOpen} />
    </div>
  );
}
