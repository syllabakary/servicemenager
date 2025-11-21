import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaArrowRight, FaCheckCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IconType } from "react-icons";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface ServiceCardProps {
  service: {
    id: number;
    nom: string;
    description: string;
    icone: string;
  };
  icon: IconType;
  delay?: number;
}

export function ServiceCard({ service, icon: Icon, delay = 0 }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Vérifier si le contenu dépasse 3 lignes
  const hasBulletPoints = service.id === 1;
  const bulletPointsCount = hasBulletPoints ? 3 : 0;
  const descriptionLength = service.description.length;
  const shouldTruncate = descriptionLength > 120 || bulletPointsCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 flex flex-col" data-testid={`card-service-${service.id}`}>
        <CardHeader className="text-left relative z-10 pb-3 pt-5 flex-1 flex flex-col">
          <CardTitle className="text-xl font-bold mb-2 text-gray-900" data-testid={`text-service-name-${service.id}`}>
            {service.nom}
          </CardTitle>
          
          <CardDescription 
            className={`text-base mb-3 leading-relaxed text-gray-600 ${!isExpanded && shouldTruncate ? 'line-clamp-3' : ''}`}
            data-testid={`text-service-description-${service.id}`}
          >
            {service.description}
          </CardDescription>
          
          {/* Bullet points for first service */}
          {hasBulletPoints && (
            <ul className={`space-y-1.5 mb-3 ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {[
                "Aides-ménagères qualifiées et valorisées",
                "Prestations 100% personnalisables",
                "Aucune gestion administrative"
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <FaCheckCircle className="w-4 h-4 text-site-primary mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          
          {/* Boutons alignés sur la même ligne */}
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-1.5 text-site-primary hover:text-site-secondary hover:bg-site-primary/5 font-medium p-0 h-auto text-sm"
              >
                {isExpanded ? (
                  <>
                    Voir moins
                    <FaChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Voir plus
                    <FaChevronDown className="w-3 h-3" />
                  </>
                )}
              </Button>
            )}
            
            <Link href="/agences" data-testid={`link-discover-service-${service.id}`}>
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2 group/btn text-site-primary hover:text-site-secondary hover:bg-site-primary/5 font-semibold p-0 h-auto text-sm" 
                data-testid={`button-discover-service-${service.id}`}
              >
                Découvrir le service
                <FaArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        
        {/* Icon in bottom right */}
        <div className="relative mt-auto">
          <div className="absolute bottom-0 right-0 w-14 h-14 bg-site-primary/10 rounded-full flex items-center justify-center" data-testid={`icon-service-${service.id}`}>
            <Icon className="w-7 h-7 text-site-primary" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
