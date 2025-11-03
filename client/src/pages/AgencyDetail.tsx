import { useRoute } from "wouter";
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
} from "lucide-react";
import { Link } from "wouter";
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
      <div className="min-h-screen pt-16" data-testid="agency-detail-loading">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
          <div className="h-96 bg-card rounded-lg animate-pulse" data-testid="skeleton-agency-detail" />
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" data-testid="agency-not-found">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="heading-not-found">Agence non trouvée</h1>
          <Link href="/agences" data-testid="link-back-agencies-notfound">
            <Button variant="outline" data-testid="button-back-agencies">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux agences
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img
          src={agency.image}
          alt={agency.nom}
          className="w-full h-full object-cover"
          data-testid="img-agency-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 -mt-32 relative z-10 pb-12">
        <div className="mb-6">
          <Link href="/agences" data-testid="link-back-to-agencies">
            <Button variant="ghost" className="gap-2 mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              Retour aux agences
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card data-testid="card-agency-info">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <CardTitle className="text-3xl" data-testid="text-agency-name">{agency.nom}</CardTitle>
                    <Badge variant="secondary" className="gap-1 flex-shrink-0" data-testid="badge-agency-city">
                      <MapPin className="w-3 h-3" />
                      {agency.ville}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground leading-relaxed" data-testid="text-agency-description">
                    {agency.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="heading-services-offered">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Services proposés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="services-list-detail">
                    {agency.services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-md bg-secondary"
                        data-testid={`service-item-${index}`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium" data-testid={`text-service-${index}`}>{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:sticky lg:top-24"
            >
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-contact-info-detail">Informations de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3" data-testid="contact-address">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">
                        Adresse
                      </p>
                      <p className="text-base" data-testid="text-address">{agency.ville}, Côte d'Ivoire</p>
                    </div>
                  </div>

                  {agency.telephone && (
                    <div className="flex items-start gap-3" data-testid="contact-phone">
                      <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Téléphone
                        </p>
                        <a
                          href={`tel:${agency.telephone}`}
                          className="text-base hover:text-primary transition-colors"
                          data-testid="link-phone"
                        >
                          {agency.telephone}
                        </a>
                      </div>
                    </div>
                  )}

                  {agency.email && (
                    <div className="flex items-start gap-3" data-testid="contact-email">
                      <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Email
                        </p>
                        <a
                          href={`mailto:${agency.email}`}
                          className="text-base hover:text-primary transition-colors break-all"
                          data-testid="link-email"
                        >
                          {agency.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {agency.horaires && (
                    <div className="flex items-start gap-3" data-testid="contact-hours">
                      <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Horaires
                        </p>
                        <p className="text-base" data-testid="text-hours">{agency.horaires}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setQuoteFormOpen(true)}
                      data-testid="button-request-quote-agency"
                    >
                      Demander un devis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <QuoteForm open={quoteFormOpen} onOpenChange={setQuoteFormOpen} />
    </div>
  );
}
