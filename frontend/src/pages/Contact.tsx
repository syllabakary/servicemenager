import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/config/api";
import { formatOpeningHoursGrouped } from "@/lib/openingHours";

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [senderName, setSenderName] = useState("");

  const { data: footerData } = useQuery({
    queryKey: ["footer_info"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/pages/?key=footer_info&is_active=true`);
      const data = await res.json();
      return data.results?.[0] || null;
    },
  });

  const { data: locationData } = useQuery({
    queryKey: ["headquarters_location"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/pages/?key=headquarters_location&is_active=true`);
      const data = await res.json();
      return data.results?.[0] || null;
    },
  });

  let contactInfo = {
    address: "Plateau, Abidjan\nCôte d'Ivoire",
    phone: "+225 01 23 45 67 89",
    email: "contact@serviceslocaux.ci",
  };
  if (footerData?.body) {
    try {
      const parsed = JSON.parse(footerData.body);
      if (parsed.address) contactInfo.address = parsed.address;
      if (parsed.phone) contactInfo.phone = parsed.phone;
      if (parsed.email) contactInfo.email = parsed.email;
    } catch {}
  }

  let openingHours: Record<string, { open?: boolean; start?: string; end?: string }> | null = null;
  if (locationData?.body) {
    try {
      const parsed = JSON.parse(locationData.body);
      if (parsed.openingHours && typeof parsed.openingHours === "object" && !Array.isArray(parsed.openingHours)) {
        openingHours = parsed.openingHours;
      }
    } catch {}
  }
  const hasOpeningHours = openingHours && Object.keys(openingHours).length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("nom") as HTMLInputElement).value;
    const data = {
      name,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("sujet") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      await axios.post(`${API_URL}/contact-messages/`, data);
      setSenderName(name);
      setConfirmOpen(true);
      form.reset();
    } catch {
      // Afficher erreur inline
      alert("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 overflow-x-hidden w-full max-w-full bg-white">
      {/* Popup confirmation personnalisé */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-site-primary to-site-secondary p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FaCheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-1">Message envoyé !</h2>
            <p className="text-white/90 text-sm">Merci pour votre message, {senderName}</p>
          </div>
          <div className="p-6 text-center space-y-4 bg-white">
            <p className="text-gray-700 text-sm leading-relaxed">
              Votre message a bien été reçu. Notre équipe prendra contact avec vous
              dans les <strong>plus brefs délais</strong> afin de vous apporter une réponse personnalisée.
            </p>
            <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
              <FaEnvelope className="w-3 h-3" />
              <span>Un accusé de réception peut vous être envoyé par email</span>
            </div>
            <Button
              onClick={() => setConfirmOpen(false)}
              className="w-full bg-gradient-to-r from-site-button-primary to-site-button-primary-hover text-site-button-text font-semibold shadow hover:shadow-md transition-all"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2" data-testid="heading-contact-page">
              Contactez-nous
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2" data-testid="text-contact-intro">
              Une question ? Un projet ? Notre équipe est à votre écoute
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="border-2 border-gray-200 shadow-xl bg-white">
                <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-site-primary to-site-secondary text-white rounded-t-lg">
                  <CardTitle className="text-white" data-testid="heading-contact-form">Envoyez-nous un message</CardTitle>
                  <CardDescription className="text-white/90" data-testid="text-contact-form-description">
                    Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-contact">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom" className="text-gray-700 font-semibold">Nom complet</Label>
                        <Input
                          id="nom"
                          name="nom"
                          placeholder="Votre nom"
                          required
                          className="border-gray-300 focus:border-site-primary focus:ring-site-primary"
                          data-testid="input-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="votre@email.com"
                          required
                          className="border-gray-300 focus:border-site-primary focus:ring-site-primary"
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sujet" className="text-gray-700 font-semibold">Sujet</Label>
                      <Input
                        id="sujet"
                        name="sujet"
                        placeholder="Objet de votre message"
                        required
                        className="border-gray-300 focus:border-site-primary focus:ring-site-primary"
                        data-testid="input-subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-700 font-semibold">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Votre message..."
                        rows={6}
                        required
                        className="border-gray-300 focus:border-site-primary focus:ring-site-primary"
                        data-testid="textarea-message"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2 bg-gradient-to-r from-site-button-primary to-site-button-primary-hover hover:from-site-button-primary-hover hover:to-site-tertiary text-site-button-text shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={loading}
                      data-testid="button-submit"
                    >
                      <FaPaperPlane className="w-4 h-4" />
                      {loading ? "Envoi en cours..." : "Envoyer le message"}
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
                <Card className="border-2 border-gray-200 shadow-xl bg-white">
                  <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-site-primary to-site-secondary text-white rounded-t-lg">
                    <CardTitle className="text-white" data-testid="heading-contact-info">Nos coordonnées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-start gap-3" data-testid="contact-info-address">
                      <div className="w-10 h-10 rounded-lg bg-site-primary/10 flex items-center justify-center flex-shrink-0">
                        <FaMapMarkerAlt className="w-5 h-5 text-site-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-500 mb-1">
                          Adresse
                        </p>
                        <p className="text-base text-gray-900 whitespace-pre-line" data-testid="text-contact-address">
                          {contactInfo.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3" data-testid="contact-info-phone">
                      <div className="w-10 h-10 rounded-lg bg-site-primary/10 flex items-center justify-center flex-shrink-0">
                        <FaPhone className="w-5 h-5 text-site-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-500 mb-1">
                          Téléphone
                        </p>
                        <a
                          href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                          className="text-base text-gray-900 hover:text-site-text-link transition-colors font-medium"
                          data-testid="link-contact-phone"
                        >
                          {contactInfo.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3" data-testid="contact-info-email">
                      <div className="w-10 h-10 rounded-lg bg-site-primary/10 flex items-center justify-center flex-shrink-0">
                        <FaEnvelope className="w-5 h-5 text-site-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-500 mb-1">
                          Email
                        </p>
                        <a
                          href={`mailto:${contactInfo.email}`}
                          className="text-base text-gray-900 hover:text-site-text-link transition-colors font-medium"
                          data-testid="link-contact-email"
                        >
                          {contactInfo.email}
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
                <Card className="border-2 border-gray-200 shadow-xl bg-white">
                  <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-site-primary to-site-secondary text-white rounded-t-lg">
                    <CardTitle className="text-white" data-testid="heading-hours">Horaires d'ouverture</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-6">
                    {hasOpeningHours ? (
                      formatOpeningHoursGrouped(openingHours!).map((row, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between py-2 border-b border-gray-100 last:border-b-0"
                          data-testid={`hours-${row.label.replace(/\s/g, "-")}`}
                        >
                          <span className="text-gray-600 font-medium">{row.label}</span>
                          <span className="font-semibold text-gray-900">{row.text}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between py-2 border-b border-gray-100" data-testid="hours-weekday">
                          <span className="text-gray-600 font-medium">Lundi - Vendredi</span>
                          <span className="font-semibold text-gray-900">8h00 - 18h00</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100" data-testid="hours-saturday">
                          <span className="text-gray-600 font-medium">Samedi</span>
                          <span className="font-semibold text-gray-900">9h00 - 14h00</span>
                        </div>
                        <div className="flex justify-between py-2" data-testid="hours-sunday">
                          <span className="text-gray-600 font-medium">Dimanche</span>
                          <span className="font-semibold text-gray-900">Fermé</span>
                        </div>
                      </>
                    )}
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
