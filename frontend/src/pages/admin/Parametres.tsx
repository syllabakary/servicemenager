import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FaSave, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPalette, FaImage } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Fonction pour normaliser et valider les couleurs hexadécimales
function normalizeHexColor(color: string): string {
  if (!color) return "#000000";
  
  // Supprimer les espaces
  color = color.trim();
  
  // Si la couleur commence par #, la retirer temporairement
  const hasHash = color.startsWith("#");
  if (hasHash) {
    color = color.substring(1);
  }
  
  // Supprimer tous les caractères non hexadécimaux
  color = color.replace(/[^0-9A-Fa-f]/g, "");
  
  // Si la couleur est vide ou invalide, retourner une valeur par défaut
  if (color.length === 0) return "#000000";
  
  // Si la couleur a 3 caractères, les dupliquer (ex: "DC2" -> "DDCC22")
  if (color.length === 3) {
    color = color.split("").map(c => c + c).join("");
  }
  
  // Si la couleur a moins de 6 caractères, compléter avec des zéros
  if (color.length < 6) {
    color = color.padEnd(6, "0");
  }
  
  // Si la couleur a plus de 6 caractères, prendre les 6 premiers
  if (color.length > 6) {
    color = color.substring(0, 6);
  }
  
  // Retourner avec le #
  return "#" + color.toUpperCase();
}

// Fonction pour valider le format hex
function isValidHexColor(color: string): boolean {
  if (!color) return false;
  const normalized = normalizeHexColor(color);
  return /^#[0-9A-F]{6}$/i.test(normalized);
}

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

  // Récupérer les paramètres du site (couleurs et logo)
  const { data: siteSettings, isLoading: siteSettingsLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      try {
        const res = await axios.get(`${API_URL}/site-settings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/admin/login";
          throw error;
        }
        return null;
      }
    },
    retry: false, // Ne pas réessayer en cas d'erreur 401
  });

  const [themeSettings, setThemeSettings] = useState({
    primary_color: "#DC2626",
    secondary_color: "#B91C1C",
    tertiary_color: "#991B1B",
    button_primary_color: "#DC2626",
    button_primary_hover_color: "#B91C1C",
    button_text_color: "#FFFFFF",
    text_primary_color: "#DC2626",
    text_link_color: "#DC2626",
    text_link_hover_color: "#B91C1C",
    site_name: "Services Locaux",
    site_tagline: "Votre partenaire de confiance",
    logo: null as File | null,
    logo_favicon: null as File | null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  useEffect(() => {
    if (siteSettings) {
      // Normaliser toutes les couleurs lors du chargement
      setThemeSettings({
        primary_color: normalizeHexColor(siteSettings.primary_color || "#DC2626"),
        secondary_color: normalizeHexColor(siteSettings.secondary_color || "#B91C1C"),
        tertiary_color: normalizeHexColor(siteSettings.tertiary_color || "#991B1B"),
        button_primary_color: normalizeHexColor(siteSettings.button_primary_color || siteSettings.primary_color || "#DC2626"),
        button_primary_hover_color: normalizeHexColor(siteSettings.button_primary_hover_color || siteSettings.secondary_color || "#B91C1C"),
        button_text_color: normalizeHexColor(siteSettings.button_text_color || "#FFFFFF"),
        text_primary_color: normalizeHexColor(siteSettings.text_primary_color || siteSettings.primary_color || "#DC2626"),
        text_link_color: normalizeHexColor(siteSettings.text_link_color || siteSettings.primary_color || "#DC2626"),
        text_link_hover_color: normalizeHexColor(siteSettings.text_link_hover_color || siteSettings.secondary_color || "#B91C1C"),
        site_name: siteSettings.site_name || "Services Locaux",
        site_tagline: siteSettings.site_tagline || "Votre partenaire de confiance",
        logo: null,
        logo_favicon: null,
      });
      if (siteSettings.logo_url) {
        setLogoPreview(siteSettings.logo_url);
      }
      if (siteSettings.logo_favicon_url) {
        setFaviconPreview(siteSettings.logo_favicon_url);
      }
    }
  }, [siteSettings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThemeSettings({ ...themeSettings, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThemeSettings({ ...themeSettings, logo_favicon: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction helper pour mettre à jour une couleur avec normalisation
  const updateColor = (field: keyof typeof themeSettings, value: string) => {
    const normalized = normalizeHexColor(value);
    setThemeSettings({ ...themeSettings, [field]: normalized });
  };

  const saveThemeMutation = useMutation({
    mutationFn: async (data: typeof themeSettings) => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.");
      }
      
      // Normaliser toutes les couleurs avant l'envoi
      const normalizedData = {
        ...data,
        primary_color: normalizeHexColor(data.primary_color),
        secondary_color: normalizeHexColor(data.secondary_color),
        tertiary_color: normalizeHexColor(data.tertiary_color),
        button_primary_color: normalizeHexColor(data.button_primary_color),
        button_primary_hover_color: normalizeHexColor(data.button_primary_hover_color),
        button_text_color: normalizeHexColor(data.button_text_color),
        text_primary_color: normalizeHexColor(data.text_primary_color),
        text_link_color: normalizeHexColor(data.text_link_color),
        text_link_hover_color: normalizeHexColor(data.text_link_hover_color),
      };
      
      // Valider toutes les couleurs
      const colorFields = [
        'primary_color', 'secondary_color', 'tertiary_color',
        'button_primary_color', 'button_primary_hover_color', 'button_text_color',
        'text_primary_color', 'text_link_color', 'text_link_hover_color'
      ];
      
      for (const field of colorFields) {
        if (!isValidHexColor(normalizedData[field as keyof typeof normalizedData] as string)) {
          throw new Error(`La couleur ${field} n'est pas au format valide. Format attendu: #rrggbb`);
        }
      }
      
      const formData = new FormData();
      formData.append("primary_color", normalizedData.primary_color);
      formData.append("secondary_color", normalizedData.secondary_color);
      formData.append("tertiary_color", normalizedData.tertiary_color);
      formData.append("button_primary_color", normalizedData.button_primary_color);
      formData.append("button_primary_hover_color", normalizedData.button_primary_hover_color);
      formData.append("button_text_color", normalizedData.button_text_color);
      formData.append("text_primary_color", normalizedData.text_primary_color);
      formData.append("text_link_color", normalizedData.text_link_color);
      formData.append("text_link_hover_color", normalizedData.text_link_hover_color);
      formData.append("site_name", normalizedData.site_name);
      formData.append("site_tagline", normalizedData.site_tagline);
      if (data.logo) {
        formData.append("logo", data.logo);
      }
      if (data.logo_favicon) {
        formData.append("logo_favicon", data.logo_favicon);
      }

      try {
        await axios.patch(`${API_URL}/site-settings/1/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
        }
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalider toutes les queries liées aux paramètres du site
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      
      // Forcer le refetch immédiat de toutes les queries actives
      await queryClient.refetchQueries({ 
        queryKey: ["site-settings"],
        type: "active"
      });
      
      // Émettre l'événement personnalisé pour forcer la mise à jour
      window.dispatchEvent(new CustomEvent("site-settings-updated", { 
        detail: { timestamp: Date.now() } 
      }));
      
      // Forcer également un refetch via l'API directement pour être sûr
      setTimeout(async () => {
        try {
          const res = await axios.get(`${API_URL}/site-settings/`);
          const newSettings = res.data;
          
          // Appliquer immédiatement les nouvelles couleurs
          const root = document.documentElement;
          const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            } : null;
          };
          
          const rgbToHsl = (r: number, g: number, b: number) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
              const d = max - min;
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
              }
            }
            return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
          };
          
          const applyColor = (colorValue: string, varName: string) => {
            if (!colorValue) return;
            const rgb = hexToRgb(colorValue);
            if (rgb) {
              const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
              root.style.setProperty(`--site-${varName}`, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
              root.style.setProperty(`--site-${varName}-hex`, colorValue);
            }
          };
          
          applyColor(newSettings.primary_color, "primary");
          applyColor(newSettings.secondary_color, "secondary");
          applyColor(newSettings.tertiary_color, "tertiary");
          applyColor(newSettings.button_primary_color || newSettings.primary_color, "button-primary");
          applyColor(newSettings.button_primary_hover_color || newSettings.secondary_color, "button-primary-hover");
          applyColor(newSettings.button_text_color || "#FFFFFF", "button-text");
          applyColor(newSettings.text_primary_color || newSettings.primary_color, "text-primary");
          applyColor(newSettings.text_link_color || newSettings.primary_color, "text-link");
          applyColor(newSettings.text_link_hover_color || newSettings.secondary_color, "text-link-hover");
        } catch (err) {
          console.error("Erreur lors de la mise à jour des couleurs:", err);
        }
      }, 200);
      
      toast({
        title: "Succès",
        description: "Paramètres du thème enregistrés avec succès ! Les changements sont appliqués immédiatement.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Une erreur s'est produite";
      
      if (error.response?.status === 401) {
        errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 2000);
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    saveThemeMutation.mutate(themeSettings);
  };

  if (footerLoading || locationLoading || siteSettingsLoading) {
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

        {/* Thème et apparence */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FaPalette className="w-6 h-6 text-[#DC2626]" />
              Thème et apparence
            </CardTitle>
            <CardDescription>Modifiez les couleurs du site et le logo</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveTheme} className="space-y-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Nom du site *</Label>
                    <Input
                      id="site-name"
                      value={themeSettings.site_name}
                      onChange={(e) => setThemeSettings({ ...themeSettings, site_name: e.target.value })}
                      required
                      placeholder="Services Locaux"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-tagline">Slogan du site *</Label>
                    <Input
                      id="site-tagline"
                      value={themeSettings.site_tagline}
                      onChange={(e) => setThemeSettings({ ...themeSettings, site_tagline: e.target.value })}
                      required
                      placeholder="Votre partenaire de confiance"
                    />
                  </div>
                </div>
              </div>

              {/* Couleurs principales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Couleurs principales du site</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color" className="flex items-center gap-2">
                      Couleur principale *
                      <span className="text-xs font-normal text-gray-500">(Navigation, titres)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primary-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.primary_color)}
                        onChange={(e) => updateColor("primary_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.primary_color}
                        onChange={(e) => updateColor("primary_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.primary_color) {
                            updateColor("primary_color", normalized);
                          }
                        }}
                        placeholder="#DC2626"
                        className="flex-1"
                        required
                        pattern="^#[0-9A-Fa-f]{6}$"
                        title="Format: #rrggbb (ex: #DC2626)"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-blue-700">Utilisée pour les titres importants, éléments de navigation actifs, icônes et accents visuels sur toutes les pages du site.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color" className="flex items-center gap-2">
                      Couleur secondaire *
                      <span className="text-xs font-normal text-gray-500">(Dégradés, hover)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.secondary_color)}
                        onChange={(e) => updateColor("secondary_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.secondary_color}
                        onChange={(e) => updateColor("secondary_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.secondary_color) {
                            updateColor("secondary_color", normalized);
                          }
                        }}
                        placeholder="#B91C1C"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-blue-700">Utilisée pour les dégradés de fond, effets hover sur les éléments interactifs et transitions de couleur.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tertiary-color" className="flex items-center gap-2">
                      Couleur tertiaire *
                      <span className="text-xs font-normal text-gray-500">(États actifs)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="tertiary-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.tertiary_color)}
                        onChange={(e) => updateColor("tertiary_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.tertiary_color}
                        onChange={(e) => updateColor("tertiary_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.tertiary_color) {
                            updateColor("tertiary_color", normalized);
                          }
                        }}
                        placeholder="#991B1B"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-blue-700">Utilisée pour les états actifs, effets de focus et éléments en surbrillance sur les pages.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Couleurs des boutons */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <FaPalette className="w-5 h-5 text-site-primary" />
                  Couleurs des boutons
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="button-primary-color" className="flex items-center gap-2">
                      Couleur de fond des boutons *
                      <span className="text-xs font-normal text-gray-500">(CTA, actions)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="button-primary-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.button_primary_color)}
                        onChange={(e) => updateColor("button_primary_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.button_primary_color}
                        onChange={(e) => updateColor("button_primary_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.button_primary_color) {
                            updateColor("button_primary_color", normalized);
                          }
                        }}
                        placeholder="#DC2626"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-green-700">Couleur de fond de tous les boutons principaux (CTA, "Réserver maintenant", "Demander un devis", etc.) sur toutes les pages.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="button-primary-hover-color" className="flex items-center gap-2">
                      Couleur hover des boutons *
                      <span className="text-xs font-normal text-gray-500">(Au survol)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="button-primary-hover-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.button_primary_hover_color)}
                        onChange={(e) => updateColor("button_primary_hover_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.button_primary_hover_color}
                        onChange={(e) => updateColor("button_primary_hover_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.button_primary_hover_color) {
                            updateColor("button_primary_hover_color", normalized);
                          }
                        }}
                        placeholder="#B91C1C"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-green-700">Couleur affichée lorsque l'utilisateur survole un bouton principal avec la souris.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="button-text-color" className="flex items-center gap-2">
                      Couleur du texte des boutons *
                      <span className="text-xs font-normal text-gray-500">(Contraste)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="button-text-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.button_text_color)}
                        onChange={(e) => updateColor("button_text_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.button_text_color}
                        onChange={(e) => updateColor("button_text_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.button_text_color) {
                            updateColor("button_text_color", normalized);
                          }
                        }}
                        placeholder="#FFFFFF"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-green-700">Couleur du texte à l'intérieur des boutons. Généralement blanc (#FFFFFF) pour un bon contraste.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Couleurs des textes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <FaPalette className="w-5 h-5 text-site-primary" />
                  Couleurs des textes et liens
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="text-primary-color" className="flex items-center gap-2">
                      Couleur des textes importants *
                      <span className="text-xs font-normal text-gray-500">(Titres, accents)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="text-primary-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.text_primary_color)}
                        onChange={(e) => updateColor("text_primary_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.text_primary_color}
                        onChange={(e) => updateColor("text_primary_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.text_primary_color) {
                            updateColor("text_primary_color", normalized);
                          }
                        }}
                        placeholder="#DC2626"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-purple-700">Couleur utilisée pour les textes importants, titres secondaires et mots-clés en surbrillance dans le contenu.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text-link-color" className="flex items-center gap-2">
                      Couleur des liens *
                      <span className="text-xs font-normal text-gray-500">(Liens cliquables)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="text-link-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.text_link_color)}
                        onChange={(e) => updateColor("text_link_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.text_link_color}
                        onChange={(e) => updateColor("text_link_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.text_link_color) {
                            updateColor("text_link_color", normalized);
                          }
                        }}
                        placeholder="#DC2626"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-purple-700">Couleur de tous les liens cliquables dans le contenu des pages (liens vers services, agences, etc.).</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text-link-hover-color" className="flex items-center gap-2">
                      Couleur hover des liens *
                      <span className="text-xs font-normal text-gray-500">(Au survol)</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="text-link-hover-color"
                        type="color"
                        value={normalizeHexColor(themeSettings.text_link_hover_color)}
                        onChange={(e) => updateColor("text_link_hover_color", e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                        required
                      />
                      <Input
                        type="text"
                        value={themeSettings.text_link_hover_color}
                        onChange={(e) => updateColor("text_link_hover_color", e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeHexColor(e.target.value);
                          if (normalized !== themeSettings.text_link_hover_color) {
                            updateColor("text_link_hover_color", normalized);
                          }
                        }}
                        placeholder="#B91C1C"
                        className="flex-1"
                        required
                      />
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs text-purple-800 font-medium mb-1">💡 Utilisation :</p>
                      <p className="text-xs text-purple-700">Couleur affichée lorsque l'utilisateur survole un lien avec la souris.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo et favicon */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                  <FaImage className="w-5 h-5 text-[#DC2626]" />
                  Logo et favicon
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo du site</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="cursor-pointer"
                    />
                    {logoPreview && (
                      <div className="mt-2">
                        <img
                          src={logoPreview}
                          alt="Aperçu du logo"
                          className="w-full h-32 object-contain rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Format recommandé: PNG, SVG. Taille max: 5MB</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon">Favicon</Label>
                    <Input
                      id="favicon"
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="cursor-pointer"
                    />
                    {faviconPreview && (
                      <div className="mt-2">
                        <img
                          src={faviconPreview}
                          alt="Aperçu du favicon"
                          className="w-16 h-16 object-contain rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Format recommandé: ICO, PNG (16x16 ou 32x32). Taille max: 1MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                  disabled={saveThemeMutation.isPending}
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  {saveThemeMutation.isPending ? "Enregistrement..." : "Enregistrer le thème"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

