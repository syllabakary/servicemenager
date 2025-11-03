import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
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
    >
      <Card className="h-full hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid={`card-service-${service.id}`}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center" data-testid={`icon-service-${service.id}`}>
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl" data-testid={`text-service-name-${service.id}`}>{service.nom}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CardDescription className="text-base mb-4" data-testid={`text-service-description-${service.id}`}>
            {service.description}
          </CardDescription>
          <Link href="/agences" data-testid={`link-discover-service-${service.id}`}>
            <Button variant="ghost" className="gap-2 group" data-testid={`button-discover-service-${service.id}`}>
              Découvrir
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
