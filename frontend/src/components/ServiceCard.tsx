import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface ServiceCardProps {
  service: {
    id: number;
    nom: string;
    description: string;
    icone: string;
  };
  icon: LucideIcon;
  delay?: number;
}

export function ServiceCard({ service, icon: Icon, delay = 0 }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 flex flex-col" data-testid={`card-service-${service.id}`}>
        <CardHeader className="text-left relative z-10 pb-4 flex-1">
          <CardTitle className="text-xl font-bold mb-3 text-gray-900" data-testid={`text-service-name-${service.id}`}>
            {service.nom}
          </CardTitle>
          <CardDescription className="text-base mb-4 leading-relaxed text-gray-600" data-testid={`text-service-description-${service.id}`}>
            {service.description}
          </CardDescription>
          
          {/* Bullet points for first service */}
          {service.id === 1 && (
            <ul className="space-y-2 mb-4">
              {[
                "Aides-ménagères qualifiées et valorisées",
                "Prestations 100% personnalisables",
                "Aucune gestion administrative"
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-[#A0522D] mt-0.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          
          <Link href="/agences" data-testid={`link-discover-service-${service.id}`}>
            <Button 
              variant="ghost" 
              className="gap-2 group/btn text-[#A0522D] hover:text-[#8B4513] hover:bg-[#A0522D]/5 font-semibold p-0 h-auto justify-start" 
              data-testid={`button-discover-service-${service.id}`}
            >
              Découvrir le service
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </CardHeader>
        
        {/* Icon in bottom right */}
        <div className="relative mt-auto">
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center" data-testid={`icon-service-${service.id}`}>
            <Icon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
