import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Contact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message envoyé !",
      description: "Nous vous contacterons dans les plus brefs délais.",
    });

    setLoading(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen pt-16">
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="heading-contact-page">
              Contactez-nous
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-contact-intro">
              Une question ? Un projet ? Notre équipe est à votre écoute
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-contact-form">Envoyez-nous un message</CardTitle>
                  <CardDescription data-testid="text-contact-form-description">
                    Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-contact">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom complet</Label>
                        <Input
                          id="nom"
                          name="nom"
                          placeholder="Votre nom"
                          required
                          data-testid="input-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="votre@email.com"
                          required
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sujet">Sujet</Label>
                      <Input
                        id="sujet"
                        name="sujet"
                        placeholder="Objet de votre message"
                        required
                        data-testid="input-subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Votre message..."
                        rows={6}
                        required
                        data-testid="textarea-message"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2"
                      disabled={loading}
                      data-testid="button-submit"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer le message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle data-testid="heading-contact-info">Nos coordonnées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3" data-testid="contact-info-address">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Adresse
                        </p>
                        <p className="text-base" data-testid="text-contact-address">
                          Plateau, Abidjan
                          <br />
                          Côte d'Ivoire
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3" data-testid="contact-info-phone">
                      <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Téléphone
                        </p>
                        <a
                          href="tel:+2250123456789"
                          className="text-base hover:text-primary transition-colors"
                          data-testid="link-contact-phone"
                        >
                          +225 01 23 45 67 89
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3" data-testid="contact-info-email">
                      <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          Email
                        </p>
                        <a
                          href="mailto:contact@serviceslocaux.ci"
                          className="text-base hover:text-primary transition-colors"
                          data-testid="link-contact-email"
                        >
                          contact@serviceslocaux.ci
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle data-testid="heading-hours">Horaires d'ouverture</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between" data-testid="hours-weekday">
                      <span className="text-muted-foreground">Lundi - Vendredi</span>
                      <span className="font-medium">8h00 - 18h00</span>
                    </div>
                    <div className="flex justify-between" data-testid="hours-saturday">
                      <span className="text-muted-foreground">Samedi</span>
                      <span className="font-medium">9h00 - 14h00</span>
                    </div>
                    <div className="flex justify-between" data-testid="hours-sunday">
                      <span className="text-muted-foreground">Dimanche</span>
                      <span className="font-medium">Fermé</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
