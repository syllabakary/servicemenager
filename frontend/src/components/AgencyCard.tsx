import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaMapMarkerAlt, FaArrowRight, FaStar, FaClock, FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface Agency {
  id: number;
  nom: string;
  description: string;
  ville: string;
  services: string[];
  image: string;
  note?: number;
  nombreAvis?: number;
  anneeExperience?: number;
  nombreClients?: number;
  horaires?: string;
  slug?: string;
}

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
      whileHover={{ y: -4 }}
    >
      <Card className="h-full flex flex-col group relative overflow-hidden border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:border-site-primary transition-all duration-300 bg-white" data-testid={`card-agency-${agency.id}`}>
        
        <div className="aspect-video w-full overflow-hidden relative">
          <ImageWithFallback
            src={agency.image}
            alt={agency.nom}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            data-testid={`img-agency-${agency.id}`}
          />
          <div className="absolute top-3 right-3">
            <Badge className="gap-1 bg-white/95 backdrop-blur-sm text-site-text-primary border-2 border-site-primary/20 font-semibold shadow-md" data-testid={`badge-city-${agency.id}`}>
              <FaMapMarkerAlt className="w-3.5 h-3.5" />
              {agency.ville}
            </Badge>
          </div>
          {agency.note && agency.nombreAvis && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
              <FaStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-gray-900">{agency.note}</span>
              <span className="text-xs text-gray-600">({agency.nombreAvis})</span>
            </div>
          )}
        </div>
        
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-xl font-bold text-gray-900 mb-2 line-clamp-1" data-testid={`text-agency-name-${agency.id}`}>
            {agency.nom}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 line-clamp-2 leading-relaxed" data-testid={`text-agency-description-${agency.id}`}>
            {agency.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between space-y-3 pb-3">
          {/* Services - version compacte */}
          <div className="flex flex-wrap gap-1.5" data-testid={`services-list-${agency.id}`}>
            {agency.services.slice(0, 2).map((service, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs px-2 py-0.5 border-site-primary/30 bg-site-primary/5 text-site-text-primary font-medium" 
                data-testid={`badge-service-${agency.id}-${index}`}
              >
                {service}
              </Badge>
            ))}
            {agency.services.length > 2 && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0.5 border-site-primary/30 bg-site-primary/10 text-site-text-primary font-semibold" 
                data-testid={`badge-more-services-${agency.id}`}
              >
                +{agency.services.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3 pb-4">
          <Link href={`/agences/${agency.slug || agency.id}`} className="w-full" data-testid={`link-agency-detail-${agency.id}`}>
            <Button 
              className="w-full h-11 gap-2 group/btn bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text shadow-md hover:shadow-lg transition-all duration-300 font-semibold" 
              data-testid={`button-view-agency-${agency.id}`}
            >
              Voir les détails
              <FaArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
