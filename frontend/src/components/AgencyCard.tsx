import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Star, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

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
      <Card className="h-full flex flex-col group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50" data-testid={`card-agency-${agency.id}`}>
        
        <div className="aspect-video w-full overflow-hidden relative z-10">
          <img
            src={agency.image}
            alt={agency.nom}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            data-testid={`img-agency-${agency.id}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <CardHeader className="gap-1 flex-grow relative z-10">
          <div className="flex items-start justify-between gap-2 mb-3">
            <CardTitle className="text-xl font-bold text-gray-900 flex-1" data-testid={`text-agency-name-${agency.id}`}>
              {agency.nom}
            </CardTitle>
            <Badge variant="secondary" className="gap-1 flex-shrink-0 bg-[#A0522D]/10 text-[#A0522D] border-[#A0522D]/20 font-medium" data-testid={`badge-city-${agency.id}`}>
              <MapPin className="w-3 h-3" />
              {agency.ville}
            </Badge>
          </div>
          
          {/* Note et avis */}
          {agency.note && agency.nombreAvis && (
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full w-fit mb-3">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-900">{agency.note}</span>
              <span className="text-xs text-gray-500">({agency.nombreAvis})</span>
            </div>
          )}
          
          <CardDescription className="text-base line-clamp-2 leading-relaxed text-gray-600" data-testid={`text-agency-description-${agency.id}`}>
            {agency.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          {/* Services */}
          <div className="flex flex-wrap gap-2" data-testid={`services-list-${agency.id}`}>
            {agency.services.slice(0, 3).map((service, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs border-[#A0522D]/20 hover:border-[#A0522D]/40 hover:bg-[#A0522D]/5 transition-colors" 
                data-testid={`badge-service-${agency.id}-${index}`}
              >
                {service}
              </Badge>
            ))}
            {agency.services.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs border-[#A0522D]/20 bg-[#A0522D]/5 text-[#A0522D] font-semibold" 
                data-testid={`badge-more-services-${agency.id}`}
              >
                +{agency.services.length - 3}
              </Badge>
            )}
          </div>

          {/* Informations supplémentaires */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200 text-sm">
            {agency.horaires && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4 text-[#A0522D]" />
                <span className="text-xs">{agency.horaires.split("|")[0].trim()}</span>
              </div>
            )}
            {agency.anneeExperience && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="w-4 h-4 text-[#A0522D]" />
                <span className="text-xs">{agency.anneeExperience} ans</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="relative z-10 pt-4">
          <Link href={`/agences/${agency.id}`} className="w-full" data-testid={`link-agency-detail-${agency.id}`}>
            <Button 
              className="w-full gap-2 group/btn bg-[#A0522D] hover:bg-[#8B4513] text-white shadow-md hover:shadow-lg transition-all duration-300 font-semibold" 
              data-testid={`button-view-agency-${agency.id}`}
            >
              Voir les détails
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
