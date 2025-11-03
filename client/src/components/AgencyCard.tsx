import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Agency } from "@shared/schema";

interface AgencyCardProps {
  agency: Agency;
  delay?: number;
}

export function AgencyCard({ agency, delay = 0 }: AgencyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="h-full flex flex-col hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden" data-testid={`card-agency-${agency.id}`}>
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={agency.image}
            alt={agency.nom}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            data-testid={`img-agency-${agency.id}`}
          />
        </div>
        
        <CardHeader className="gap-1 flex-grow">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-xl" data-testid={`text-agency-name-${agency.id}`}>{agency.nom}</CardTitle>
            <Badge variant="secondary" className="gap-1 flex-shrink-0" data-testid={`badge-city-${agency.id}`}>
              <MapPin className="w-3 h-3" />
              {agency.ville}
            </Badge>
          </div>
          <CardDescription className="text-base line-clamp-2" data-testid={`text-agency-description-${agency.id}`}>
            {agency.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2" data-testid={`services-list-${agency.id}`}>
            {agency.services.slice(0, 3).map((service, index) => (
              <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-service-${agency.id}-${index}`}>
                {service}
              </Badge>
            ))}
            {agency.services.length > 3 && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-more-services-${agency.id}`}>
                +{agency.services.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Link href={`/agences/${agency.id}`} className="w-full" data-testid={`link-agency-detail-${agency.id}`}>
            <Button className="w-full gap-2 group" data-testid={`button-view-agency-${agency.id}`}>
              Voir les détails
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
