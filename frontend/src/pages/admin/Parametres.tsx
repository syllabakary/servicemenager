import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FaSave, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

export default function AdminParametres() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les données du footer
  const { data: footerData, isLoading: footerLoading } = useQuery({
    queryKey: ["footer_info"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      try {
        const res = await axios.get(`${API_URL}/pages/?key=footer_info`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.results?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  // Récupérer les données de la localisation
  const { data: locationData, isLoading: locationLoading } = useQuery({
    queryKey: ["headquarters_location"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      try {
        const res = await axios.get(`${API_URL}/pages/?key=headquarters_location`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.results?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  // Parser les données JSON
  const [footerInfo, setFooterInfo] = useState({
    address: "Abidjan, Côte d'Ivoire",
    phone: "+225 01 23 45 67 89",
    email: "contact@serviceslocaux.ci",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    description: "Votre partenaire de confiance pour tous vos besoins de services à domicile.",
    copyright: "Services Locaux",
  });

  const [headquartersInfo, setHeadquartersInfo] = useState({
    title: "Notre siège à Paris",
    subtitle: "Nous sommes basés au cœur de Paris pour mieux vous servir partout en France",
    location: "Paris, France",
    address: "Paris, France",
    description: "Notre équipe est à votre disposition pour répondre à tous vos besoins en services à la personne",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937606!2d2.352221915674389!3d48.85661400000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e1f06e2b70f%3A0x40b82c3688c9460!2sParis%2C%20France!5e0!3m2!1sfr!2sfr!4v1234567890123!5m2!1sfr!2sfr",
  });

  // Fonction pour convertir une URL Google Maps en URL d'embed
  const convertToEmbedUrl = (url: string): string => {
    if (!url || url.trim() === "") return "";
    
    // Si c'est déjà une URL d'embed, la retourner telle quelle
    if (url.includes('maps/embed')) {
      return url;
    }

    // Extraire les coordonnées précises depuis les paramètres !8m2!3d{lat}!4d{lng}
    const preciseCoordMatch = url.match(/!8m2!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (preciseCoordMatch) {
      const lat = preciseCoordMatch[1];
      const lng = preciseCoordMatch[2];
      // Créer l'URL d'embed avec les coordonnées précises
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTAw!5e0!3m2!1sfr!2sfr!4v1234567890123!5m2!1sfr!2sfr`;
    }

    // Extraire les coordonnées de l'URL Google Maps (@lat,lng)
    const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      // Créer l'URL d'embed avec les coordonnées
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTAw!5e0!3m2!1sfr!2sfr!4v1234567890123!5m2!1sfr!2sfr`;
    }

    // Extraire le nom du lieu si disponible (place/...)
    const placeMatch = url.match(/place\/([^/@?]+)/);
    if (placeMatch) {
      const placeName = placeMatch[1].replace(/\+/g, ' ').replace(/,/g, ',');
      // Utiliser l'API de recherche Google Maps pour obtenir les coordonnées
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6U4UZu3x9zY&q=${encodeURIComponent(placeName)}`;
    }

    // Si on ne peut pas convertir, retourner l'URL originale
    return url;
  };

  const handleMapUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const url = e.target.value;
    // Convertir automatiquement si c'est une URL Google Maps normale
    const embedUrl = convertToEmbedUrl(url);
    setHeadquartersInfo({ ...headquartersInfo, mapUrl: embedUrl });
  };

  useEffect(() => {
    if (footerData?.body) {
      try {
        const parsed = JSON.parse(footerData.body);
        setFooterInfo(parsed);
      } catch {
        // Si ce n'est pas du JSON, utiliser les valeurs par défaut
      }
    }
  }, [footerData]);

  useEffect(() => {
    if (locationData?.body) {
      try {
        const parsed = JSON.parse(locationData.body);
        setHeadquartersInfo(parsed);
      } catch {
        // Si ce n'est pas du JSON, utiliser les valeurs par défaut
      }
    }
  }, [locationData]);

  const saveFooterMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const payload = {
        key: "footer_info",
        title: "Informations du footer",
        body: JSON.stringify(data),
        is_active: true,
        order: 0,
      };

      if (footerData) {
        await axios.patch(`${API_URL}/pages/${footerData.key}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/pages/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["footer_info"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast({
        title: "✅ Succès",
        description: "Informations du footer enregistrées avec succès !",
        variant: "success",
      });
    },
    onError: (error: any) => {
      console.error("Erreur:", error);
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite lors de l'enregistrement",
        variant: "destructive",
      });
    },
  });

  const saveLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      // Convertir l'URL en URL d'embed si nécessaire
      const mapUrl = convertToEmbedUrl(data.mapUrl || "");

      const payload = {
        key: "headquarters_location",
        title: "Localisation du siège",
        body: JSON.stringify({ ...data, mapUrl }),
        is_active: true,
        order: 0,
      };

      if (locationData) {
        await axios.patch(`${API_URL}/pages/${locationData.key}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/pages/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["headquarters_location"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      toast({
        title: "✅ Succès",
        description: "Localisation du siège enregistrée avec succès !",
        variant: "success",
      });
    },
    onError: (error: any) => {
      console.error("Erreur:", error);
      toast({
        title: "❌ Erreur",
        description: error.response?.data?.detail || "Une erreur s'est produite lors de l'enregistrement",
        variant: "destructive",
      });
    },
  });

  const handleSaveFooter = (e: React.FormEvent) => {
    e.preventDefault();
    saveFooterMutation.mutate(footerInfo);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    saveLocationMutation.mutate(headquartersInfo);
  };

  if (footerLoading || locationLoading) {
    return (
      <DashboardLayout userRole="ADMIN">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="ADMIN">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#DC2626] to-[#B91C1C] bg-clip-text text-transparent">
            Paramètres du site
          </h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Gérez les informations du footer et la localisation du siège
          </p>
        </div>

        {/* Informations du Footer */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold text-gray-800">Informations du Footer</CardTitle>
            <CardDescription>Modifiez les informations affichées dans le footer du site</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveFooter} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="footer-address">Adresse *</Label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="footer-address"
                      value={footerInfo.address}
                      onChange={(e) => setFooterInfo({ ...footerInfo, address: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-phone">Téléphone *</Label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="footer-phone"
                      value={footerInfo.phone}
                      onChange={(e) => setFooterInfo({ ...footerInfo, phone: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-email">Email *</Label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="footer-email"
                      type="email"
                      value={footerInfo.email}
                      onChange={(e) => setFooterInfo({ ...footerInfo, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-copyright">Copyright *</Label>
                  <Input
                    id="footer-copyright"
                    value={footerInfo.copyright}
                    onChange={(e) => setFooterInfo({ ...footerInfo, copyright: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-description">Description</Label>
                <Textarea
                  id="footer-description"
                  value={footerInfo.description}
                  onChange={(e) => setFooterInfo({ ...footerInfo, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Réseaux sociaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer-facebook">Facebook</Label>
                    <div className="relative">
                      <FaFacebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="footer-facebook"
                        type="url"
                        value={footerInfo.facebook}
                        onChange={(e) => setFooterInfo({ ...footerInfo, facebook: e.target.value })}
                        className="pl-10"
                        placeholder="https://facebook.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-twitter">Twitter</Label>
                    <div className="relative">
                      <FaTwitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="footer-twitter"
                        type="url"
                        value={footerInfo.twitter}
                        onChange={(e) => setFooterInfo({ ...footerInfo, twitter: e.target.value })}
                        className="pl-10"
                        placeholder="https://twitter.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-instagram">Instagram</Label>
                    <div className="relative">
                      <FaInstagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="footer-instagram"
                        type="url"
                        value={footerInfo.instagram}
                        onChange={(e) => setFooterInfo({ ...footerInfo, instagram: e.target.value })}
                        className="pl-10"
                        placeholder="https://instagram.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-linkedin">LinkedIn</Label>
                    <div className="relative">
                      <FaLinkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="footer-linkedin"
                        type="url"
                        value={footerInfo.linkedin}
                        onChange={(e) => setFooterInfo({ ...footerInfo, linkedin: e.target.value })}
                        className="pl-10"
                        placeholder="https://linkedin.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                  disabled={saveFooterMutation.isPending}
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  {saveFooterMutation.isPending ? "Enregistrement..." : "Enregistrer le footer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Localisation du siège */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold text-gray-800">Localisation du siège</CardTitle>
            <CardDescription>Modifiez les informations de la section "Notre siège" sur la page d'accueil</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveLocation} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location-title">Titre *</Label>
                  <Input
                    id="location-title"
                    value={headquartersInfo.title}
                    onChange={(e) => setHeadquartersInfo({ ...headquartersInfo, title: e.target.value })}
                    required
                    placeholder="Notre siège à Paris"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-location">Localisation *</Label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="location-location"
                      value={headquartersInfo.location}
                      onChange={(e) => setHeadquartersInfo({ ...headquartersInfo, location: e.target.value })}
                      className="pl-10"
                      required
                      placeholder="Paris, France"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-subtitle">Sous-titre *</Label>
                <Input
                  id="location-subtitle"
                  value={headquartersInfo.subtitle}
                  onChange={(e) => setHeadquartersInfo({ ...headquartersInfo, subtitle: e.target.value })}
                  required
                  placeholder="Nous sommes basés au cœur de Paris..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-address">Adresse complète</Label>
                <Input
                  id="location-address"
                  value={headquartersInfo.address}
                  onChange={(e) => setHeadquartersInfo({ ...headquartersInfo, address: e.target.value })}
                  placeholder="Paris, France"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-description">Description</Label>
                <Textarea
                  id="location-description"
                  value={headquartersInfo.description}
                  onChange={(e) => setHeadquartersInfo({ ...headquartersInfo, description: e.target.value })}
                  rows={3}
                  placeholder="Notre équipe est à votre disposition..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-map-url">URL de la carte Google Maps *</Label>
                <Textarea
                  id="location-map-url"
                  value={headquartersInfo.mapUrl}
                  onChange={handleMapUrlChange}
                  rows={4}
                  required
                  placeholder="Collez l'URL Google Maps (sera convertie automatiquement en URL d'embed)"
                />
                <p className="text-xs text-gray-500">
                  Vous pouvez coller soit l'URL d'embed (iframe), soit l'URL normale de Google Maps. La conversion se fait automatiquement.
                  <br />
                  <strong>Méthode 1 :</strong> Allez sur Google Maps → Trouvez votre localisation → "Partager" → "Intégrer une carte" → Copiez le src de l'iframe
                  <br />
                  <strong>Méthode 2 :</strong> Collez simplement l'URL de la page Google Maps (sera convertie automatiquement)
                </p>
                {headquartersInfo.mapUrl && !headquartersInfo.mapUrl.includes('maps/embed') && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      ⚠️ L'URL sera convertie automatiquement en URL d'embed lors de l'enregistrement.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                  disabled={saveLocationMutation.isPending}
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  {saveLocationMutation.isPending ? "Enregistrement..." : "Enregistrer la localisation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

