import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FaSave, FaMapMarkerAlt, FaClock, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPalette, FaImage, FaChevronDown } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { API_URL } from "@/config/api";

/** Horaires d'ouverture par jour (admin + affichage site) */
export type OpeningHoursDay = { open: boolean; start: string; end: string };
export type OpeningHoursRecord = Record<string, OpeningHoursDay>;

const OPENING_HOURS_DAYS: { key: keyof OpeningHoursRecord; label: string }[] = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

const DEFAULT_OPENING_HOURS: OpeningHoursRecord = {
  lundi:    { open: true,  start: "09:00", end: "18:00" },
  mardi:    { open: true,  start: "09:00", end: "18:00" },
  mercredi: { open: true,  start: "09:00", end: "18:00" },
  jeudi:    { open: true,  start: "09:00", end: "18:00" },
  vendredi: { open: true,  start: "09:00", end: "18:00" },
  samedi:   { open: true,  start: "09:00", end: "12:00" },
  dimanche: { open: false, start: "",     end: "" },
};

function normalizeOpeningHours(value: unknown): OpeningHoursRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const out = { ...DEFAULT_OPENING_HOURS };
    OPENING_HOURS_DAYS.forEach(({ key }) => {
      const d = o[key];
      if (d && typeof d === "object" && !Array.isArray(d) && "open" in d) {
        const day = d as { open?: boolean; start?: string; end?: string };
        out[key] = {
          open: !!day.open,
          start: typeof day.start === "string" ? day.start : DEFAULT_OPENING_HOURS[key].start,
          end:   typeof day.end   === "string" ? day.end   : DEFAULT_OPENING_HOURS[key].end,
        };
      }
    });
    return out;
  }
  return { ...DEFAULT_OPENING_HOURS };
}

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
    address: "Clamart, France",
    phone: "+225 01 23 45 67 89",
    mobile: "",
    email: "contact@serviceslocaux.ci",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    description: "Votre partenaire de confiance pour tous vos besoins de services à domicile.",
    copyright: "EASE - DOM",
  });

  const [headquartersInfo, setHeadquartersInfo] = useState({
    title: "Notre siège à Paris",
    subtitle: "Nous sommes basés au cœur de Paris pour mieux vous servir partout en France",
    location: "Paris, France",
    address: "Paris, France",
    description: "Notre équipe est à votre disposition pour répondre à tous vos besoins en services à la personne",
    openingHours: { ...DEFAULT_OPENING_HOURS } as OpeningHoursRecord,
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

  const updateOpeningHoursDay = (day: keyof OpeningHoursRecord, upd: Partial<OpeningHoursDay>) => {
    const current = typeof headquartersInfo.openingHours === "object" && headquartersInfo.openingHours
      ? headquartersInfo.openingHours
      : DEFAULT_OPENING_HOURS;
    const dayData = current[day] ?? DEFAULT_OPENING_HOURS[day];
    setHeadquartersInfo({
      ...headquartersInfo,
      openingHours: {
        ...current,
        [day]: { ...dayData, ...upd },
      },
    });
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
        setHeadquartersInfo({
          ...parsed,
          openingHours: normalizeOpeningHours(parsed.openingHours),
        });
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
          window.location.href = "/gestion-ease/acces-prive";
          throw error;
        }
        return null;
      }
    },
    retry: false, // Ne pas réessayer en cas d'erreur 401
    staleTime: 0, // Toujours considérer les données comme périmées
    refetchOnMount: "always", // Recharger à chaque ouverture de la page Paramètres
  });

  const [themeSettings, setThemeSettings] = useState({
    primary_color: "#087A00",
    secondary_color: "#066300",
    tertiary_color: "#044000",
    button_primary_color: "#087A00",
    button_primary_hover_color: "#066300",
    button_text_color: "#FFFFFF",
    text_primary_color: "#087A00",
    text_link_color: "#087A00",
    text_link_hover_color: "#066300",
    banner_bg_color: "#087A00",
    banner_text_color: "#FFFFFF",
    footer_bg_color: "#F0FDF4",
    footer_text_color: "#374151",
    footer_link_color: "#087A00",
    footer_link_hover_color: "#066300",
    footer_border_color: "#BBF7D0",
    button_border_color: "",
    button_border_width: 0,
    button_border_radius: "0.375rem",
    button_outline_border_color: "#087A00",
    button_outline_text_color: "#087A00",
    button_outline_hover_bg_color: "#087A00",
    site_name_part1_color: "#111827",
    site_name_part2_color: "#087A00",
    site_tagline_color: "#6B7280",
    site_name: "EASE - DOM",
    site_tagline: "Votre partenaire de confiance",
    banner_button_color: "#087A00",
    banner_button_border_color: "",
    services_bg_color: "#087A00",
    services_text_color: "#FFFFFF",
    services_button_color: "#087A00",
    services_button_border_color: "",
    agencies_bg_color: "#087A00",
    agencies_text_color: "#FFFFFF",
    agencies_button_color: "#087A00",
    agencies_button_border_color: "",
    employe_bg_color: "#087A00",
    employe_text_color: "#FFFFFF",
    employe_button_color: "#087A00",
    employe_button_border_color: "",
    admin_login_bg_color: "#087A00",
    admin_login_text_color: "#FFFFFF",
    admin_login_button_color: "#087A00",
    admin_login_button_border_color: "",
    employe_login_bg_color: "#087A00",
    employe_login_text_color: "#FFFFFF",
    employe_login_button_color: "#087A00",
    employe_login_button_border_color: "",
    logo_area_bg_color: "",
    logo_area_text_color: "",
    devis_pdf_primary_color: "#087A00",
    logo: null as File | null,
    logo_favicon: null as File | null,
    logo_signature: null as File | null,
  });

  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_use_tls: true,
    smtp_use_ssl: false,
    smtp_username: "",
    smtp_password: "",
  });

  const [legalSettings, setLegalSettings] = useState({
    siret: "",
    code_ape: "",
    num_tva: "",
    forme_juridique: "",
    rcs_ville: "",
    mention_tva: "TVA non applicable selon l'article 293 B du Code Général des Impôts",
    mention_bon_pour_accord: "Si accord, le devis suivant devra être retourné signé avec la mention « Bon pour accord » et constituera une annexe au contrat signé ultérieurement.",
    paiement_beneficiaire: "EASE-DOM",
    paiement_iban: "FR38 3000 2005 1000 0000 9774 Z35",
    paiement_banque: "LCL",
    paiement_bic: "CRLYFRPP",
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [logoSignaturePreview, setLogoSignaturePreview] = useState<string | null>(null);
  const [themeSectionsOpen, setThemeSectionsOpen] = useState<Record<string, boolean>>({
    "Informations générales": true,
    "Couleurs du nom et slogan": true,
    "Couleurs principales": true,
    "Couleurs des boutons": true,
    "Textes et liens": true,
    "Bannière": true,
    "Footer": true,
    "Bordures des boutons": true,
    "Boutons outline": true,
    "Couleurs par section": true,
    "Logo, Devis et PDF": true,
    "Logo et favicon": true,
  });

  useEffect(() => {
    if (siteSettings) {
      // Normaliser toutes les couleurs lors du chargement
      setThemeSettings({
        primary_color: normalizeHexColor(siteSettings.primary_color || "#087A00"),
        secondary_color: normalizeHexColor(siteSettings.secondary_color || "#066300"),
        tertiary_color: normalizeHexColor(siteSettings.tertiary_color || "#044000"),
        button_primary_color: normalizeHexColor(siteSettings.button_primary_color || siteSettings.primary_color || "#087A00"),
        button_primary_hover_color: normalizeHexColor(siteSettings.button_primary_hover_color || siteSettings.secondary_color || "#066300"),
        button_text_color: normalizeHexColor(siteSettings.button_text_color || "#FFFFFF"),
        text_primary_color: normalizeHexColor(siteSettings.text_primary_color || siteSettings.primary_color || "#087A00"),
        text_link_color: normalizeHexColor(siteSettings.text_link_color || siteSettings.primary_color || "#087A00"),
        text_link_hover_color: normalizeHexColor(siteSettings.text_link_hover_color || siteSettings.secondary_color || "#066300"),
        banner_bg_color: normalizeHexColor(siteSettings.banner_bg_color || siteSettings.primary_color || "#087A00"),
        banner_text_color: normalizeHexColor(siteSettings.banner_text_color || "#FFFFFF"),
        footer_bg_color: normalizeHexColor(siteSettings.footer_bg_color || "#F0FDF4"),
        footer_text_color: normalizeHexColor(siteSettings.footer_text_color || "#374151"),
        footer_link_color: normalizeHexColor(siteSettings.footer_link_color || siteSettings.primary_color || "#087A00"),
        footer_link_hover_color: normalizeHexColor(siteSettings.footer_link_hover_color || siteSettings.secondary_color || "#066300"),
        footer_border_color: normalizeHexColor(siteSettings.footer_border_color || "#BBF7D0"),
        button_border_color: siteSettings.button_border_color ? normalizeHexColor(siteSettings.button_border_color) : "",
        button_border_width: typeof siteSettings.button_border_width === "number" ? siteSettings.button_border_width : 0,
        button_border_radius: siteSettings.button_border_radius || "0.375rem",
        button_outline_border_color: normalizeHexColor(siteSettings.button_outline_border_color || siteSettings.primary_color || "#087A00"),
        button_outline_text_color: normalizeHexColor(siteSettings.button_outline_text_color || siteSettings.primary_color || "#087A00"),
        button_outline_hover_bg_color: normalizeHexColor(siteSettings.button_outline_hover_bg_color || siteSettings.primary_color || "#087A00"),
        site_name_part1_color: normalizeHexColor(siteSettings.site_name_part1_color || "#111827"),
        site_name_part2_color: normalizeHexColor(siteSettings.site_name_part2_color || siteSettings.primary_color || "#087A00"),
        site_tagline_color: normalizeHexColor(siteSettings.site_tagline_color || "#6B7280"),
        site_name: siteSettings.site_name || "EASE - DOM",
        site_tagline: siteSettings.site_tagline || "Votre partenaire de confiance",
        banner_button_color: siteSettings.banner_button_color ? normalizeHexColor(siteSettings.banner_button_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        banner_button_border_color: siteSettings.banner_button_border_color ? normalizeHexColor(siteSettings.banner_button_border_color) : "",
        services_bg_color: siteSettings.services_bg_color ? normalizeHexColor(siteSettings.services_bg_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        services_text_color: siteSettings.services_text_color ? normalizeHexColor(siteSettings.services_text_color) : "#FFFFFF",
        services_button_color: siteSettings.services_button_color ? normalizeHexColor(siteSettings.services_button_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        services_button_border_color: siteSettings.services_button_border_color ? normalizeHexColor(siteSettings.services_button_border_color) : "",
        agencies_bg_color: siteSettings.agencies_bg_color ? normalizeHexColor(siteSettings.agencies_bg_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        agencies_text_color: siteSettings.agencies_text_color ? normalizeHexColor(siteSettings.agencies_text_color) : "#FFFFFF",
        agencies_button_color: siteSettings.agencies_button_color ? normalizeHexColor(siteSettings.agencies_button_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        agencies_button_border_color: siteSettings.agencies_button_border_color ? normalizeHexColor(siteSettings.agencies_button_border_color) : "",
        employe_bg_color: siteSettings.employe_bg_color ? normalizeHexColor(siteSettings.employe_bg_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        employe_text_color: siteSettings.employe_text_color ? normalizeHexColor(siteSettings.employe_text_color) : "#FFFFFF",
        employe_button_color: siteSettings.employe_button_color ? normalizeHexColor(siteSettings.employe_button_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        employe_button_border_color: siteSettings.employe_button_border_color ? normalizeHexColor(siteSettings.employe_button_border_color) : "",
        admin_login_bg_color: siteSettings.admin_login_bg_color ? normalizeHexColor(siteSettings.admin_login_bg_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        admin_login_text_color: siteSettings.admin_login_text_color ? normalizeHexColor(siteSettings.admin_login_text_color) : "#FFFFFF",
        admin_login_button_color: siteSettings.admin_login_button_color ? normalizeHexColor(siteSettings.admin_login_button_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        admin_login_button_border_color: siteSettings.admin_login_button_border_color ? normalizeHexColor(siteSettings.admin_login_button_border_color) : "",
        employe_login_bg_color: siteSettings.employe_login_bg_color ? normalizeHexColor(siteSettings.employe_login_bg_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        employe_login_text_color: siteSettings.employe_login_text_color ? normalizeHexColor(siteSettings.employe_login_text_color) : "#FFFFFF",
        employe_login_button_color: siteSettings.employe_login_button_color ? normalizeHexColor(siteSettings.employe_login_button_color) : (siteSettings.primary_color ? normalizeHexColor(siteSettings.primary_color) : "#087A00"),
        employe_login_button_border_color: siteSettings.employe_login_button_border_color ? normalizeHexColor(siteSettings.employe_login_button_border_color) : "",
        logo_area_bg_color: siteSettings.logo_area_bg_color ? normalizeHexColor(siteSettings.logo_area_bg_color) : "",
        logo_area_text_color: siteSettings.logo_area_text_color ? normalizeHexColor(siteSettings.logo_area_text_color) : "",
        devis_pdf_primary_color: normalizeHexColor(siteSettings.devis_pdf_primary_color || siteSettings.primary_color || "#087A00"),
        logo: null,
        logo_favicon: null,
        logo_signature: null,
      });
      if (siteSettings.logo_url) {
        setLogoPreview(siteSettings.logo_url);
      }
      if (siteSettings.logo_favicon_url) {
        setFaviconPreview(siteSettings.logo_favicon_url);
      }
      if (siteSettings.logo_signature_url) {
        setLogoSignaturePreview(siteSettings.logo_signature_url);
      }
      // Charger les paramètres SMTP
      if (siteSettings) {
        setSmtpSettings({
          smtp_host: siteSettings.smtp_host || "",
          smtp_port: siteSettings.smtp_port || 587,
          smtp_use_tls: siteSettings.smtp_use_tls !== undefined ? siteSettings.smtp_use_tls : true,
          smtp_use_ssl: siteSettings.smtp_use_ssl || false,
          smtp_username: siteSettings.smtp_username || "",
          smtp_password: siteSettings.smtp_password || "",
        });
        // Charger les paramètres légaux et de paiement
        setLegalSettings({
          siret: siteSettings.siret || "",
          code_ape: siteSettings.code_ape || "",
          num_tva: siteSettings.num_tva || "",
          forme_juridique: siteSettings.forme_juridique || "",
          rcs_ville: siteSettings.rcs_ville || "",
          mention_tva: siteSettings.mention_tva || "TVA non applicable selon l'article 293 B du Code Général des Impôts",
          mention_bon_pour_accord: siteSettings.mention_bon_pour_accord || "Si accord, le devis suivant devra être retourné signé avec la mention « Bon pour accord » et constituera une annexe au contrat signé ultérieurement.",
          paiement_beneficiaire: siteSettings.paiement_beneficiaire || "EASE-DOM",
          paiement_iban: siteSettings.paiement_iban || "FR38 3000 2005 1000 0000 9774 Z35",
          paiement_banque: siteSettings.paiement_banque || "LCL",
          paiement_bic: siteSettings.paiement_bic || "CRLYFRPP",
        });
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

  const handleLogoSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThemeSettings({ ...themeSettings, logo_signature: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoSignaturePreview(reader.result as string);
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
        banner_bg_color: normalizeHexColor(data.banner_bg_color),
        banner_text_color: normalizeHexColor(data.banner_text_color),
        footer_bg_color: normalizeHexColor(data.footer_bg_color),
        footer_text_color: normalizeHexColor(data.footer_text_color),
        footer_link_color: normalizeHexColor(data.footer_link_color),
        footer_link_hover_color: normalizeHexColor(data.footer_link_hover_color),
        footer_border_color: normalizeHexColor(data.footer_border_color),
        button_border_color: data.button_border_color ? normalizeHexColor(data.button_border_color) : "",
        button_outline_border_color: normalizeHexColor(data.button_outline_border_color),
        button_outline_text_color: normalizeHexColor(data.button_outline_text_color),
        button_outline_hover_bg_color: normalizeHexColor(data.button_outline_hover_bg_color),
        site_name_part1_color: normalizeHexColor(data.site_name_part1_color),
        site_name_part2_color: normalizeHexColor(data.site_name_part2_color),
        site_tagline_color: normalizeHexColor(data.site_tagline_color),
        banner_button_color: data.banner_button_color ? normalizeHexColor(data.banner_button_color) : "",
        banner_button_border_color: data.banner_button_border_color ? normalizeHexColor(data.banner_button_border_color) : "",
        services_bg_color: data.services_bg_color ? normalizeHexColor(data.services_bg_color) : "",
        services_text_color: data.services_text_color ? normalizeHexColor(data.services_text_color) : "",
        services_button_color: data.services_button_color ? normalizeHexColor(data.services_button_color) : "",
        services_button_border_color: data.services_button_border_color ? normalizeHexColor(data.services_button_border_color) : "",
        agencies_bg_color: data.agencies_bg_color ? normalizeHexColor(data.agencies_bg_color) : "",
        agencies_text_color: data.agencies_text_color ? normalizeHexColor(data.agencies_text_color) : "",
        agencies_button_color: data.agencies_button_color ? normalizeHexColor(data.agencies_button_color) : "",
        agencies_button_border_color: data.agencies_button_border_color ? normalizeHexColor(data.agencies_button_border_color) : "",
        employe_bg_color: data.employe_bg_color ? normalizeHexColor(data.employe_bg_color) : "",
        employe_text_color: data.employe_text_color ? normalizeHexColor(data.employe_text_color) : "",
        employe_button_color: data.employe_button_color ? normalizeHexColor(data.employe_button_color) : "",
        employe_button_border_color: data.employe_button_border_color ? normalizeHexColor(data.employe_button_border_color) : "",
        admin_login_bg_color: data.admin_login_bg_color ? normalizeHexColor(data.admin_login_bg_color) : "",
        admin_login_text_color: data.admin_login_text_color ? normalizeHexColor(data.admin_login_text_color) : "",
        admin_login_button_color: data.admin_login_button_color ? normalizeHexColor(data.admin_login_button_color) : "",
        admin_login_button_border_color: data.admin_login_button_border_color ? normalizeHexColor(data.admin_login_button_border_color) : "",
        employe_login_bg_color: data.employe_login_bg_color ? normalizeHexColor(data.employe_login_bg_color) : "",
        employe_login_text_color: data.employe_login_text_color ? normalizeHexColor(data.employe_login_text_color) : "",
        employe_login_button_color: data.employe_login_button_color ? normalizeHexColor(data.employe_login_button_color) : "",
        employe_login_button_border_color: data.employe_login_button_border_color ? normalizeHexColor(data.employe_login_button_border_color) : "",
        logo_area_bg_color: data.logo_area_bg_color ? normalizeHexColor(data.logo_area_bg_color) : "",
        logo_area_text_color: data.logo_area_text_color ? normalizeHexColor(data.logo_area_text_color) : "",
        devis_pdf_primary_color: normalizeHexColor(data.devis_pdf_primary_color || data.primary_color || "#087A00"),
      };
      
      // Valider toutes les couleurs (hex) quand elles sont renseignées
      const colorFields = [
        'primary_color', 'secondary_color', 'tertiary_color',
        'button_primary_color', 'button_primary_hover_color', 'button_text_color',
        'text_primary_color', 'text_link_color', 'text_link_hover_color',
        'banner_bg_color', 'banner_text_color', 'banner_button_color', 'banner_button_border_color',
        'footer_bg_color', 'footer_text_color', 'footer_link_color',
        'footer_link_hover_color', 'footer_border_color',
        'button_outline_border_color', 'button_outline_text_color', 'button_outline_hover_bg_color',
        'site_name_part1_color', 'site_name_part2_color', 'site_tagline_color',
        'services_bg_color', 'services_text_color', 'services_button_color', 'services_button_border_color',
        'agencies_bg_color', 'agencies_text_color', 'agencies_button_color', 'agencies_button_border_color',
        'employe_bg_color', 'employe_text_color', 'employe_button_color', 'employe_button_border_color',
        'admin_login_bg_color', 'admin_login_text_color', 'admin_login_button_color', 'admin_login_button_border_color',
        'employe_login_bg_color', 'employe_login_text_color', 'employe_login_button_color', 'employe_login_button_border_color',
        'logo_area_bg_color', 'logo_area_text_color', 'devis_pdf_primary_color',
      ];
      
      for (const field of colorFields) {
        const val = normalizedData[field as keyof typeof normalizedData];
        if (val != null && val !== "" && typeof val === "string" && !isValidHexColor(val)) {
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
      formData.append("banner_bg_color", normalizedData.banner_bg_color);
      formData.append("banner_text_color", normalizedData.banner_text_color);
      formData.append("footer_bg_color", normalizedData.footer_bg_color);
      formData.append("footer_text_color", normalizedData.footer_text_color);
      formData.append("footer_link_color", normalizedData.footer_link_color);
      formData.append("footer_link_hover_color", normalizedData.footer_link_hover_color);
      formData.append("footer_border_color", normalizedData.footer_border_color);
      formData.append("button_border_color", normalizedData.button_border_color || "");
      formData.append("button_border_width", String(normalizedData.button_border_width ?? 0));
      formData.append("button_border_radius", normalizedData.button_border_radius || "0.375rem");
      formData.append("button_outline_border_color", normalizedData.button_outline_border_color);
      formData.append("button_outline_text_color", normalizedData.button_outline_text_color);
      formData.append("button_outline_hover_bg_color", normalizedData.button_outline_hover_bg_color);
      formData.append("site_name_part1_color", normalizedData.site_name_part1_color);
      formData.append("site_name_part2_color", normalizedData.site_name_part2_color);
      formData.append("site_tagline_color", normalizedData.site_tagline_color);
      formData.append("banner_button_color", normalizedData.banner_button_color ?? "");
      formData.append("banner_button_border_color", normalizedData.banner_button_border_color ?? "");
      formData.append("services_bg_color", normalizedData.services_bg_color ?? "");
      formData.append("services_text_color", normalizedData.services_text_color ?? "");
      formData.append("services_button_color", normalizedData.services_button_color ?? "");
      formData.append("services_button_border_color", normalizedData.services_button_border_color ?? "");
      formData.append("agencies_bg_color", normalizedData.agencies_bg_color ?? "");
      formData.append("agencies_text_color", normalizedData.agencies_text_color ?? "");
      formData.append("agencies_button_color", normalizedData.agencies_button_color ?? "");
      formData.append("agencies_button_border_color", normalizedData.agencies_button_border_color ?? "");
      formData.append("employe_bg_color", normalizedData.employe_bg_color ?? "");
      formData.append("employe_text_color", normalizedData.employe_text_color ?? "");
      formData.append("employe_button_color", normalizedData.employe_button_color ?? "");
      formData.append("employe_button_border_color", normalizedData.employe_button_border_color ?? "");
      formData.append("admin_login_bg_color", normalizedData.admin_login_bg_color ?? "");
      formData.append("admin_login_text_color", normalizedData.admin_login_text_color ?? "");
      formData.append("admin_login_button_color", normalizedData.admin_login_button_color ?? "");
      formData.append("admin_login_button_border_color", normalizedData.admin_login_button_border_color ?? "");
      formData.append("employe_login_bg_color", normalizedData.employe_login_bg_color ?? "");
      formData.append("employe_login_text_color", normalizedData.employe_login_text_color ?? "");
      formData.append("employe_login_button_color", normalizedData.employe_login_button_color ?? "");
      formData.append("employe_login_button_border_color", normalizedData.employe_login_button_border_color ?? "");
      formData.append("site_name", normalizedData.site_name);
      formData.append("site_tagline", normalizedData.site_tagline);
      formData.append("logo_area_bg_color", normalizedData.logo_area_bg_color ?? "");
      formData.append("logo_area_text_color", normalizedData.logo_area_text_color ?? "");
      formData.append("devis_pdf_primary_color", normalizedData.devis_pdf_primary_color ?? "#087A00");
      if (data.logo) {
        formData.append("logo", data.logo);
      }
      if (data.logo_favicon) {
        formData.append("logo_favicon", data.logo_favicon);
      }
      if (data.logo_signature) {
        formData.append("logo_signature", data.logo_signature);
      }

      // Ajouter les paramètres SMTP
      formData.append("smtp_host", smtpSettings.smtp_host || "");
      formData.append("smtp_port", smtpSettings.smtp_port.toString());
      formData.append("smtp_use_tls", smtpSettings.smtp_use_tls.toString());
      formData.append("smtp_use_ssl", smtpSettings.smtp_use_ssl.toString());
      formData.append("smtp_username", smtpSettings.smtp_username || "");
      formData.append("smtp_password", smtpSettings.smtp_password || "");

      try {
        // Ne pas définir Content-Type : le navigateur doit l'ajouter avec le boundary
        // pour que le serveur reçoive correctement les fichiers (logo, logo_favicon).
        await axios.patch(`${API_URL}/site-settings/1/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
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
          
          // Mettre à jour les paramètres SMTP avec les nouvelles valeurs
          if (newSettings) {
            setSmtpSettings({
              smtp_host: newSettings.smtp_host || "",
              smtp_port: newSettings.smtp_port || 587,
              smtp_use_tls: newSettings.smtp_use_tls !== undefined ? newSettings.smtp_use_tls : true,
              smtp_use_ssl: newSettings.smtp_use_ssl || false,
              smtp_username: newSettings.smtp_username || "",
              smtp_password: newSettings.smtp_password || "",
            });
          }
          
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
        } catch {
          // silence
        }
      }, 200);
      
      toast({
        title: "✅ Succès",
        description: "Paramètres du thème et configuration SMTP enregistrés avec succès ! Les changements sont appliqués immédiatement.",
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
          window.location.href = "/gestion-ease/acces-prive";
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

  // Mutation séparée pour sauvegarder uniquement les paramètres SMTP
  const saveSmtpMutation = useMutation({
    mutationFn: async (data: typeof smtpSettings) => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.");
      }
      
      const formData = new FormData();
      // Ajouter les paramètres SMTP
      formData.append("smtp_host", data.smtp_host || "");
      formData.append("smtp_port", data.smtp_port.toString());
      formData.append("smtp_use_tls", data.smtp_use_tls.toString());
      formData.append("smtp_use_ssl", data.smtp_use_ssl.toString());
      formData.append("smtp_username", data.smtp_username || "");
      formData.append("smtp_password", data.smtp_password || "");

      try {
        await axios.patch(`${API_URL}/site-settings/1/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
        }
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalider et refetch les paramètres du site
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      await queryClient.refetchQueries({ 
        queryKey: ["site-settings"],
        type: "active"
      });
      
      // Mettre à jour les paramètres SMTP avec les nouvelles valeurs
      setTimeout(async () => {
        try {
          const res = await axios.get(`${API_URL}/site-settings/`);
          const newSettings = res.data;
          
          if (newSettings) {
            setSmtpSettings({
              smtp_host: newSettings.smtp_host || "",
              smtp_port: newSettings.smtp_port || 587,
              smtp_use_tls: newSettings.smtp_use_tls !== undefined ? newSettings.smtp_use_tls : true,
              smtp_use_ssl: newSettings.smtp_use_ssl || false,
              smtp_username: newSettings.smtp_username || "",
              smtp_password: newSettings.smtp_password || "",
            });
          }
        } catch {
          // silence
        }
      }, 200);
      
      toast({
        title: "✅ Succès",
        description: "Configuration SMTP enregistrée avec succès !",
        variant: "default",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Une erreur s'est produite lors de l'enregistrement";
      
      if (error.response?.status === 401) {
        errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setTimeout(() => {
          window.location.href = "/gestion-ease/acces-prive";
        }, 2000);
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    saveSmtpMutation.mutate(smtpSettings);
  };

  const saveLegalMutation = useMutation({
    mutationFn: async (data: typeof legalSettings) => {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, v || ""));
      await axios.patch(`${API_URL}/site-settings/1/`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-devis"] });
      toast({ title: "✅ Succès", description: "Informations légales et de paiement enregistrées !" });
    },
    onError: () => {
      toast({ title: "❌ Erreur", description: "Erreur lors de l'enregistrement.", variant: "destructive" });
    },
  });

  const handleSaveLegal = (e: React.FormEvent) => {
    e.preventDefault();
    saveLegalMutation.mutate(legalSettings);
  };

  if (footerLoading || locationLoading || siteSettingsLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
            Paramètres du site
          </h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">
            Gérez les informations du footer et la localisation du siège
          </p>
        </div>

        {/* ── APERÇU LIVE STICKY ── toujours visible pendant l'édition */}
        <div className="sticky top-2 z-40">
          <div className="rounded-xl overflow-hidden border-2 border-site-primary/30 shadow-lg bg-white">
            {/* Barre titre */}
            <div className="bg-gradient-to-r from-site-primary to-site-secondary px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0"></span>
              <span className="text-white text-xs font-semibold">Aperçu en temps réel — mis à jour à chaque changement</span>
            </div>
            {/* Mini navbar */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100"
              style={{ backgroundColor: themeSettings.logo_area_bg_color || '#ffffff' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-7 h-7 rounded object-contain flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeSettings.primary_color }}>
                    <span className="text-white text-xs font-bold">L</span>
                  </div>
                )}
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-sm font-bold truncate">
                    <span style={{ color: themeSettings.site_name_part1_color }}>
                      {(themeSettings.site_name || "EASE - DOM").split(" ")[0]}
                    </span>
                    {(themeSettings.site_name || "EASE - DOM").includes(" ") && (
                      <span style={{ color: themeSettings.site_name_part2_color }}>
                        {" "}{(themeSettings.site_name || "EASE - DOM").split(" ").slice(1).join(" ")}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] truncate" style={{ color: themeSettings.site_tagline_color }}>
                    {themeSettings.site_tagline || "Votre partenaire de confiance"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-xs px-2.5 py-1 font-medium border"
                  style={{
                    borderColor: themeSettings.button_outline_border_color,
                    color: themeSettings.button_outline_text_color,
                    borderRadius: themeSettings.button_border_radius,
                  }}
                >
                  Connexion
                </span>
                <span
                  className="text-xs px-2.5 py-1 font-semibold"
                  style={{
                    backgroundColor: themeSettings.button_primary_color,
                    color: themeSettings.button_text_color,
                    borderRadius: themeSettings.button_border_radius,
                  }}
                >
                  Demander un devis
                </span>
              </div>
            </div>
            {/* Mini bannière */}
            <div
              className="flex items-center justify-between px-4 py-1.5 gap-3"
              style={{ backgroundColor: themeSettings.banner_bg_color }}
            >
              <span className="text-xs font-medium truncate" style={{ color: themeSettings.banner_text_color }}>
                ★ Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*
              </span>
              <span
                className="text-xs px-2 py-0.5 font-semibold flex-shrink-0"
                style={{
                  backgroundColor: themeSettings.button_primary_color,
                  color: themeSettings.button_text_color,
                }}
              >
                J'en profite !
              </span>
            </div>
            {/* Palette couleurs */}
            <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex flex-wrap gap-3 items-center">
              {[
                { label: "Primaire", val: themeSettings.primary_color },
                { label: "Secondaire", val: themeSettings.secondary_color },
                { label: "Bouton", val: themeSettings.button_primary_color },
                { label: "Texte btn", val: themeSettings.button_text_color },
                { label: "Bannière", val: themeSettings.banner_bg_color },
                { label: "Footer", val: themeSettings.footer_bg_color },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-sm border border-gray-200 shadow-sm" style={{ backgroundColor: val }} />
                  <span className="text-[11px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
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
                  <Label htmlFor="footer-phone">Téléphone fixe *</Label>
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
                  <Label htmlFor="footer-mobile">Mobile</Label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="footer-mobile"
                      value={footerInfo.mobile || ""}
                      onChange={(e) => setFooterInfo({ ...footerInfo, mobile: e.target.value })}
                      className="pl-10"
                      placeholder="+33 6 ..."
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
                  className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
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

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FaClock className="w-4 h-4 text-gray-500" />
                  Horaires d&apos;ouverture
                </Label>
                <p className="text-xs text-gray-500 mb-2">
                  Cochez &quot;Ouvert&quot; et renseignez les heures pour chaque jour. Affiché dans la section &quot;Notre siège&quot; sur la page d&apos;accueil.
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-3 p-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
                    <span>Jour</span>
                    <span className="text-center">Ouvert</span>
                    <span>Heure début</span>
                    <span>Heure fin</span>
                  </div>
                  {OPENING_HOURS_DAYS.map(({ key, label }) => {
                    const hours = (typeof headquartersInfo.openingHours === "object" && headquartersInfo.openingHours
                      ? headquartersInfo.openingHours
                      : DEFAULT_OPENING_HOURS)[key] ?? DEFAULT_OPENING_HOURS[key];
                    const isOpen = !!hours?.open;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "grid grid-cols-[1fr_auto_1fr_1fr] gap-3 p-3 items-center border-b last:border-b-0 text-sm",
                          !isOpen && "bg-gray-50/50"
                        )}
                      >
                        <span className="font-medium text-gray-800">{label}</span>
                        <div className="flex justify-center">
                          <Checkbox
                            id={`opening-${key}`}
                            checked={isOpen}
                            onCheckedChange={(checked) => updateOpeningHoursDay(key, { open: !!checked })}
                          />
                        </div>
                        <Input
                          type="time"
                          value={hours?.start ?? ""}
                          disabled={!isOpen}
                          onChange={(e) => updateOpeningHoursDay(key, { start: e.target.value })}
                          className="w-full"
                        />
                        <Input
                          type="time"
                          value={hours?.end ?? ""}
                          disabled={!isOpen}
                          onChange={(e) => updateOpeningHoursDay(key, { end: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    );
                  })}
                </div>
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
                  className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
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
        <Card className="shadow-xl border-2 border-site-primary/20 bg-gradient-to-br from-white via-white to-site-primary/5 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-site-primary/10 bg-gradient-to-r from-site-primary/10 via-site-secondary/5 to-transparent py-6 px-6">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-site-primary/15 text-site-primary shadow-sm">
                <FaPalette className="w-6 h-6" />
              </span>
              Thème et apparence
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1.5">Modifiez les couleurs du site, le nom, le slogan et le logo</CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSaveTheme} className="space-y-1">
              {/* Informations générales */}
              <Collapsible className="group" open={themeSectionsOpen["Informations générales"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Informations générales": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Informations générales</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
                {/* Preview Navbar */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 border-b font-medium">👁 Aperçu — Barre de navigation</div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                    <div className="flex items-center gap-2">
                      {logoPreview ? <img src={logoPreview} className="w-7 h-7 rounded object-contain" /> : <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: themeSettings.primary_color }}><span className="text-white text-xs font-bold">L</span></div>}
                      <div>
                        <div className="text-sm font-bold leading-tight">
                          <span style={{ color: themeSettings.site_name_part1_color }}>{(themeSettings.site_name || "EASE - DOM").split(" ")[0]}</span>
                          {" "}<span style={{ color: themeSettings.site_name_part2_color }}>{(themeSettings.site_name || "EASE - DOM").split(" ").slice(1).join(" ")}</span>
                        </div>
                        <div className="text-[11px]" style={{ color: themeSettings.site_tagline_color }}>{themeSettings.site_tagline || "Votre partenaire de confiance"}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-1" style={{ border: `1.5px solid ${themeSettings.button_outline_border_color}`, color: themeSettings.button_outline_text_color, borderRadius: themeSettings.button_border_radius }}>Connexion</span>
                      <span className="text-xs px-2 py-1 font-semibold" style={{ backgroundColor: themeSettings.button_primary_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius }}>Demander un devis</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Nom du site *</Label>
                    <Input
                      id="site-name"
                      value={themeSettings.site_name}
                      onChange={(e) => setThemeSettings({ ...themeSettings, site_name: e.target.value })}
                      required
                      placeholder="EASE - DOM"
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
                </CollapsibleContent>
              </Collapsible>

              {/* Couleurs du nom et slogan (navbar) */}
              <Collapsible className="group" open={themeSectionsOpen["Couleurs du nom et slogan"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Couleurs du nom et slogan": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Couleurs du nom et slogan</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", themeSectionsOpen["Couleurs du nom et slogan"] && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
                {/* Preview nom + slogan navbar */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 border-b font-medium">👁 Aperçu — Logo & Nom dans la navbar</div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white">
                    {logoPreview ? <img src={logoPreview} className="w-8 h-8 rounded object-contain" /> : <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: themeSettings.primary_color }}><span className="text-white text-xs font-bold">L</span></div>}
                    <div>
                      <div className="text-base font-bold">
                        <span style={{ color: themeSettings.site_name_part1_color }}>{(themeSettings.site_name || "EASE - DOM").split(" ")[0]}</span>
                        {" "}<span style={{ color: themeSettings.site_name_part2_color }}>{(themeSettings.site_name || "EASE - DOM").split(" ").slice(1).join(" ")}</span>
                      </div>
                      <div className="text-xs" style={{ color: themeSettings.site_tagline_color }}>{themeSettings.site_tagline || "Votre partenaire de confiance"}</div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Appliqué au nom du site et au slogan dans la barre de navigation (ex. &quot;Services&quot; + &quot;Locaux&quot;, &quot;Votre partenaire de confiance&quot;).</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Couleur 1 du nom (1ère partie) *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.site_name_part1_color)} onChange={(e) => updateColor("site_name_part1_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.site_name_part1_color} onChange={(e) => updateColor("site_name_part1_color", e.target.value)} placeholder="#111827" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Ex. &quot;Services&quot;.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur 2 du nom (2e partie) *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.site_name_part2_color)} onChange={(e) => updateColor("site_name_part2_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.site_name_part2_color} onChange={(e) => updateColor("site_name_part2_color", e.target.value)} placeholder="#087A00" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Ex. &quot;Locaux&quot;.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur du slogan (tagline) *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.site_tagline_color)} onChange={(e) => updateColor("site_tagline_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.site_tagline_color} onChange={(e) => updateColor("site_tagline_color", e.target.value)} placeholder="#6B7280" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Ex. &quot;Votre partenaire de confiance&quot;.</p>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Couleurs principales */}
              <Collapsible className="group" open={themeSectionsOpen["Couleurs principales"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Couleurs principales": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Couleurs principales du site</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
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
                        placeholder="#087A00"
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
                        placeholder="#066300"
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
                        placeholder="#044000"
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
                {/* Preview couleurs principales + sidebar mobile */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 border-b font-medium">👁 Aperçu — Couleurs principales &amp; menu mobile (sidebar)</div>
                  <div className="flex gap-0">
                    {/* Mini sidebar mobile */}
                    <div className="w-36 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${themeSettings.primary_color}, ${themeSettings.secondary_color})` }}>
                      <div className="px-3 py-2 border-b border-white/20">
                        <div className="text-white text-xs font-bold">{(themeSettings.site_name || "EASE - DOM").split(" ")[0]} <span className="opacity-70">{(themeSettings.site_name || "EASE - DOM").split(" ").slice(1).join(" ")}</span></div>
                      </div>
                      {["Accueil", "Services", "Agences", "Contact"].map(item => (
                        <div key={item} className="flex items-center gap-2 px-3 py-1.5 text-white/90 text-xs hover:bg-white/10">{item}</div>
                      ))}
                      <div className="px-3 py-2 mt-1 border-t border-white/20 space-y-1">
                        <div className="text-xs py-1 text-center border border-white/40 text-white/90 rounded-sm">Connexion</div>
                        <div className="text-xs py-1 text-center font-semibold rounded-sm" style={{ backgroundColor: themeSettings.button_primary_color, color: themeSettings.button_text_color }}>Devis</div>
                      </div>
                    </div>
                    {/* Mini page */}
                    <div className="flex-1 bg-white p-3 space-y-2">
                      <div className="h-10 rounded flex items-center px-3" style={{ background: `linear-gradient(to right, ${themeSettings.primary_color}, ${themeSettings.secondary_color})` }}>
                        <span className="text-white text-xs font-bold">Section principale</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeSettings.primary_color }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeSettings.secondary_color }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeSettings.tertiary_color }} />
                      </div>
                    </div>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Couleurs des boutons */}
              <Collapsible className="group" open={themeSectionsOpen["Couleurs des boutons"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Couleurs des boutons": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FaPalette className="w-5 h-5 text-site-primary" />
                    Couleurs des boutons
                  </h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
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
                        placeholder="#087A00"
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
                        placeholder="#066300"
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
                {/* Preview boutons */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 border-b font-medium">👁 Aperçu — Boutons</div>
                  <div className="flex flex-wrap gap-3 px-4 py-4 bg-white items-center">
                    <button className="px-4 py-2 text-sm font-semibold" style={{ backgroundColor: themeSettings.button_primary_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius, border: themeSettings.button_border_width ? `${themeSettings.button_border_width}px solid ${themeSettings.button_border_color}` : 'none' }}>
                      Demander un devis
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold" style={{ backgroundColor: themeSettings.button_primary_hover_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius }}>
                      Au survol (hover)
                    </button>
                    <button className="px-4 py-2 text-sm font-medium" style={{ border: `2px solid ${themeSettings.button_outline_border_color}`, color: themeSettings.button_outline_text_color, borderRadius: themeSettings.button_border_radius, background: 'transparent' }}>
                      Connexion (outline)
                    </button>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Couleurs des textes */}
              <Collapsible className="group" open={themeSectionsOpen["Textes et liens"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Textes et liens": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FaPalette className="w-5 h-5 text-site-primary" />
                    Couleurs des textes et liens
                  </h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
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
                        placeholder="#087A00"
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
                        placeholder="#087A00"
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
                        placeholder="#066300"
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
                </CollapsibleContent>
              </Collapsible>

              {/* Bannière (bandeau promo) */}
              <Collapsible className="group" open={themeSectionsOpen["Bannière"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Bannière": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Couleurs de la bannière</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-gray-600">Bandeau promotionnel en haut du site (client). Appliqué aussi comme référence sur les 3 interfaces.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Couleur de fond de la bannière *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.banner_bg_color)} onChange={(e) => updateColor("banner_bg_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.banner_bg_color} onChange={(e) => updateColor("banner_bg_color", e.target.value)} placeholder="#087A00" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Fond du bandeau (ex. promo, annonces).</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur du texte de la bannière *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.banner_text_color)} onChange={(e) => updateColor("banner_text_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.banner_text_color} onChange={(e) => updateColor("banner_text_color", e.target.value)} placeholder="#FFFFFF" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Texte du bandeau.</p>
                  </div>
                </div>
                {/* Preview bannière */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 border-b font-medium">👁 Aperçu — Bandeau promotionnel</div>
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: themeSettings.banner_bg_color }}>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: themeSettings.banner_text_color }}>
                      ★ Réduisez votre facture de moitié avec l'avance immédiate de crédit d'impôt*
                    </span>
                    <span className="text-xs px-3 py-1 font-semibold flex-shrink-0 ml-3" style={{ backgroundColor: themeSettings.button_primary_color, color: themeSettings.button_text_color }}>
                      J'en profite !
                    </span>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Footer */}
              <Collapsible className="group" open={themeSectionsOpen["Footer"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Footer": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Couleurs du footer</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-gray-600">Pied de page du site client (et cohérence sur les 3 interfaces).</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Fond du footer *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.footer_bg_color)} onChange={(e) => updateColor("footer_bg_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.footer_bg_color} onChange={(e) => updateColor("footer_bg_color", e.target.value)} placeholder="#F0FDF4" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Texte du footer *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.footer_text_color)} onChange={(e) => updateColor("footer_text_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.footer_text_color} onChange={(e) => updateColor("footer_text_color", e.target.value)} placeholder="#374151" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Liens et icônes *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.footer_link_color)} onChange={(e) => updateColor("footer_link_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.footer_link_color} onChange={(e) => updateColor("footer_link_color", e.target.value)} placeholder="#087A00" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Liens au survol *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.footer_link_hover_color)} onChange={(e) => updateColor("footer_link_hover_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.footer_link_hover_color} onChange={(e) => updateColor("footer_link_hover_color", e.target.value)} placeholder="#066300" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bordures du footer *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.footer_border_color)} onChange={(e) => updateColor("footer_border_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.footer_border_color} onChange={(e) => updateColor("footer_border_color", e.target.value)} placeholder="#BBF7D0" className="flex-1" />
                    </div>
                  </div>
                </div>
                {/* Preview footer */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="text-xs text-gray-500 px-3 py-1 bg-gray-100 border-b font-medium">👁 Aperçu — Footer</div>
                  <div className="px-4 py-3" style={{ backgroundColor: themeSettings.footer_bg_color, borderTop: `2px solid ${themeSettings.footer_border_color}` }}>
                    <div className="text-sm font-bold mb-1" style={{ color: themeSettings.footer_text_color }}>{themeSettings.site_name || "EASE - DOM"}</div>
                    <div className="flex gap-4 text-xs">
                      <span style={{ color: themeSettings.footer_link_color }}>Services</span>
                      <span style={{ color: themeSettings.footer_link_color }}>Agences</span>
                      <span style={{ color: themeSettings.footer_link_color }}>Contact</span>
                    </div>
                    <div className="text-[11px] mt-2" style={{ color: themeSettings.footer_text_color, opacity: 0.7 }}>
                      © 2024 {themeSettings.site_name || "EASE - DOM"}. Tous droits réservés.
                    </div>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Bordures des boutons */}
              <Collapsible className="group" open={themeSectionsOpen["Bordures des boutons"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Bordures des boutons": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Bordures des boutons</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-gray-600">Appliqué aux boutons principaux sur les 3 interfaces (client, admin, employé). Laisser vide ou 0 pour aucune bordure.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Couleur de la bordure</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={themeSettings.button_border_color || "#087A00"} onChange={(e) => setThemeSettings({ ...themeSettings, button_border_color: normalizeHexColor(e.target.value) })} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.button_border_color} onChange={(e) => setThemeSettings({ ...themeSettings, button_border_color: e.target.value })} placeholder="Vide = pas de bordure" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Épaisseur (px)</Label>
                    <Input type="number" min={0} max={8} value={themeSettings.button_border_width} onChange={(e) => setThemeSettings({ ...themeSettings, button_border_width: parseInt(e.target.value, 10) || 0 })} />
                    <p className="text-xs text-gray-500">0 = pas de bordure.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Rayon des coins</Label>
                    <Input type="text" value={themeSettings.button_border_radius} onChange={(e) => setThemeSettings({ ...themeSettings, button_border_radius: e.target.value })} placeholder="0.375rem" />
                    <p className="text-xs text-gray-500">Ex: 0.375rem, 0.5rem, 9999px (pilule).</p>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Boutons outline (ex. Connexion) */}
              <Collapsible className="group" open={themeSectionsOpen["Boutons outline"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Boutons outline": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Boutons outline (ex. Connexion)</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-gray-600">Couleurs des boutons à bordure (Connexion, liens secondaires). Même bordure et rayon que les boutons principaux si besoin.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Couleur bordure *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.button_outline_border_color)} onChange={(e) => updateColor("button_outline_border_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.button_outline_border_color} onChange={(e) => updateColor("button_outline_border_color", e.target.value)} placeholder="#087A00" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur du texte *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.button_outline_text_color)} onChange={(e) => updateColor("button_outline_text_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.button_outline_text_color} onChange={(e) => updateColor("button_outline_text_color", e.target.value)} placeholder="#087A00" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur fond au survol *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.button_outline_hover_bg_color)} onChange={(e) => updateColor("button_outline_hover_bg_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.button_outline_hover_bg_color} onChange={(e) => updateColor("button_outline_hover_bg_color", e.target.value)} placeholder="#087A00" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Le texte devient blanc au survol.</p>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Couleurs par section (fond, texte, bouton, bordure) */}
              <Collapsible className="group" open={themeSectionsOpen["Couleurs par section"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Couleurs par section": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Couleurs par section</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
              <div className="space-y-6 pt-2 pb-4">
                <p className="text-sm text-gray-600">Pour chaque zone : fond, texte, couleur du bouton et bordure du bouton. Vide = utilisation des couleurs principales.</p>

                {/* Bannière */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <h4 className="font-medium text-gray-800">Bannière (bandeau promo)</h4>
                  <div className="rounded overflow-hidden border border-gray-200 mt-2">
                    <div className="text-[11px] text-gray-400 px-2 py-0.5 bg-gray-100 border-b">👁 Aperçu</div>
                    <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: themeSettings.banner_bg_color }}>
                      <span className="text-xs" style={{ color: themeSettings.banner_text_color }}>★ Réduisez votre facture — avance crédit d'impôt*</span>
                      <span className="text-[11px] px-2 py-0.5 ml-2 flex-shrink-0" style={{ backgroundColor: themeSettings.button_primary_color, color: themeSettings.button_text_color }}>J'en profite !</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Fond</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.banner_bg_color} onChange={(e) => updateColor("banner_bg_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.banner_bg_color} onChange={(e) => updateColor("banner_bg_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texte</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.banner_text_color} onChange={(e) => updateColor("banner_text_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.banner_text_color} onChange={(e) => updateColor("banner_text_color", e.target.value)} placeholder="#FFFFFF" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.banner_button_color} onChange={(e) => updateColor("banner_button_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.banner_button_color} onChange={(e) => updateColor("banner_button_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bordure bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.banner_button_border_color || "#087A00"} onChange={(e) => updateColor("banner_button_border_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.banner_button_border_color} onChange={(e) => setThemeSettings({ ...themeSettings, banner_button_border_color: e.target.value })} placeholder="Vide" className="flex-1 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Services */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <h4 className="font-medium text-gray-800">Section Services (page Services)</h4>
                  <div className="rounded overflow-hidden border border-gray-200">
                    <div className="text-[11px] text-gray-400 px-2 py-0.5 bg-gray-100 border-b">👁 Aperçu</div>
                    <div className="px-3 py-2" style={{ backgroundColor: themeSettings.services_bg_color }}>
                      <div className="text-sm font-bold mb-1" style={{ color: themeSettings.services_text_color }}>Nos Services</div>
                      <button className="text-xs px-3 py-1" style={{ backgroundColor: themeSettings.services_button_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius }}>Voir les services</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Fond</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.services_bg_color} onChange={(e) => updateColor("services_bg_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.services_bg_color} onChange={(e) => updateColor("services_bg_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texte</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.services_text_color} onChange={(e) => updateColor("services_text_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.services_text_color} onChange={(e) => updateColor("services_text_color", e.target.value)} placeholder="#FFFFFF" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.services_button_color} onChange={(e) => updateColor("services_button_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.services_button_color} onChange={(e) => updateColor("services_button_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bordure bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.services_button_border_color || "#087A00"} onChange={(e) => updateColor("services_button_border_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.services_button_border_color} onChange={(e) => setThemeSettings({ ...themeSettings, services_button_border_color: e.target.value })} placeholder="Vide" className="flex-1 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Agences */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <h4 className="font-medium text-gray-800">Section Agences (page Agences)</h4>
                  <div className="rounded overflow-hidden border border-gray-200">
                    <div className="text-[11px] text-gray-400 px-2 py-0.5 bg-gray-100 border-b">👁 Aperçu</div>
                    <div className="px-3 py-2" style={{ backgroundColor: themeSettings.agencies_bg_color }}>
                      <div className="text-sm font-bold mb-1" style={{ color: themeSettings.agencies_text_color }}>Nos Agences</div>
                      <button className="text-xs px-3 py-1" style={{ backgroundColor: themeSettings.agencies_button_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius }}>Trouver une agence</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Fond</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.agencies_bg_color} onChange={(e) => updateColor("agencies_bg_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.agencies_bg_color} onChange={(e) => updateColor("agencies_bg_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texte</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.agencies_text_color} onChange={(e) => updateColor("agencies_text_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.agencies_text_color} onChange={(e) => updateColor("agencies_text_color", e.target.value)} placeholder="#FFFFFF" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.agencies_button_color} onChange={(e) => updateColor("agencies_button_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.agencies_button_color} onChange={(e) => updateColor("agencies_button_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bordure bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.agencies_button_border_color || "#087A00"} onChange={(e) => updateColor("agencies_button_border_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.agencies_button_border_color} onChange={(e) => setThemeSettings({ ...themeSettings, agencies_button_border_color: e.target.value })} placeholder="Vide" className="flex-1 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interface employé */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <h4 className="font-medium text-gray-800">Interface employé (dashboard employé)</h4>
                  <div className="rounded overflow-hidden border border-gray-200">
                    <div className="text-[11px] text-gray-400 px-2 py-0.5 bg-gray-100 border-b">👁 Aperçu — Sidebar employé</div>
                    <div className="flex h-20">
                      <div className="w-28 flex-shrink-0" style={{ backgroundColor: themeSettings.employe_bg_color }}>
                        <div className="px-2 py-1.5 border-b border-white/20">
                          <div className="text-[11px] font-bold" style={{ color: themeSettings.employe_text_color }}>Espace Employé</div>
                        </div>
                        {["Tableau", "Scan QR", "Profil"].map(item => (
                          <div key={item} className="text-[10px] px-2 py-1" style={{ color: themeSettings.employe_text_color }}>{item}</div>
                        ))}
                      </div>
                      <div className="flex-1 bg-gray-50 px-3 py-2">
                        <button className="text-[11px] px-2 py-1" style={{ backgroundColor: themeSettings.employe_button_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius }}>Pointer l'arrivée</button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Fond</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_bg_color} onChange={(e) => updateColor("employe_bg_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_bg_color} onChange={(e) => updateColor("employe_bg_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texte</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_text_color} onChange={(e) => updateColor("employe_text_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_text_color} onChange={(e) => updateColor("employe_text_color", e.target.value)} placeholder="#FFFFFF" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_button_color} onChange={(e) => updateColor("employe_button_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_button_color} onChange={(e) => updateColor("employe_button_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bordure bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_button_border_color || "#087A00"} onChange={(e) => updateColor("employe_button_border_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_button_border_color} onChange={(e) => setThemeSettings({ ...themeSettings, employe_button_border_color: e.target.value })} placeholder="Vide" className="flex-1 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page connexion admin */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <h4 className="font-medium text-gray-800">Page de connexion admin</h4>
                  <div className="rounded overflow-hidden border border-gray-200">
                    <div className="text-[11px] text-gray-400 px-2 py-0.5 bg-gray-100 border-b">👁 Aperçu — Page connexion admin</div>
                    <div className="flex items-center justify-center py-3 px-4" style={{ backgroundColor: themeSettings.admin_login_bg_color }}>
                      <div className="bg-white rounded-lg p-3 w-36 shadow text-center">
                        <div className="text-xs font-bold text-gray-700 mb-2">Connexion Admin</div>
                        <div className="h-4 bg-gray-100 rounded mb-1 text-[10px] text-gray-400 flex items-center px-1">Utilisateur</div>
                        <div className="h-4 bg-gray-100 rounded mb-2 text-[10px] text-gray-400 flex items-center px-1">••••••••</div>
                        <button className="w-full text-[11px] py-1" style={{ backgroundColor: themeSettings.admin_login_button_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius }}>Se connecter</button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Fond</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.admin_login_bg_color} onChange={(e) => updateColor("admin_login_bg_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.admin_login_bg_color} onChange={(e) => updateColor("admin_login_bg_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texte</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.admin_login_text_color} onChange={(e) => updateColor("admin_login_text_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.admin_login_text_color} onChange={(e) => updateColor("admin_login_text_color", e.target.value)} placeholder="#FFFFFF" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.admin_login_button_color} onChange={(e) => updateColor("admin_login_button_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.admin_login_button_color} onChange={(e) => updateColor("admin_login_button_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bordure bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.admin_login_button_border_color || "#087A00"} onChange={(e) => updateColor("admin_login_button_border_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.admin_login_button_border_color} onChange={(e) => setThemeSettings({ ...themeSettings, admin_login_button_border_color: e.target.value })} placeholder="Vide" className="flex-1 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page connexion employé */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <h4 className="font-medium text-gray-800">Page de connexion employé</h4>
                  <div className="rounded overflow-hidden border border-gray-200">
                    <div className="text-[11px] text-gray-400 px-2 py-0.5 bg-gray-100 border-b">👁 Aperçu — Page connexion employé</div>
                    <div className="flex items-center justify-center py-3 px-4" style={{ backgroundColor: themeSettings.employe_login_bg_color }}>
                      <div className="bg-white rounded-lg p-3 w-36 shadow text-center">
                        <div className="text-xs font-bold text-gray-700 mb-2">Espace Employé</div>
                        <div className="h-4 bg-gray-100 rounded mb-1 text-[10px] text-gray-400 flex items-center px-1">Matricule</div>
                        <div className="h-4 bg-gray-100 rounded mb-2 text-[10px] text-gray-400 flex items-center px-1">••••••••</div>
                        <button className="w-full text-[11px] py-1" style={{ backgroundColor: themeSettings.employe_login_button_color, color: themeSettings.button_text_color, borderRadius: themeSettings.button_border_radius }}>Se connecter</button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Fond</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_login_bg_color} onChange={(e) => updateColor("employe_login_bg_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_login_bg_color} onChange={(e) => updateColor("employe_login_bg_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texte</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_login_text_color} onChange={(e) => updateColor("employe_login_text_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_login_text_color} onChange={(e) => updateColor("employe_login_text_color", e.target.value)} placeholder="#FFFFFF" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_login_button_color} onChange={(e) => updateColor("employe_login_button_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_login_button_color} onChange={(e) => updateColor("employe_login_button_color", e.target.value)} placeholder="#087A00" className="flex-1 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bordure bouton</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={themeSettings.employe_login_button_border_color || "#087A00"} onChange={(e) => updateColor("employe_login_button_border_color", e.target.value)} className="w-10 h-10 cursor-pointer p-1" />
                        <Input type="text" value={themeSettings.employe_login_button_border_color} onChange={(e) => setThemeSettings({ ...themeSettings, employe_login_button_border_color: e.target.value })} placeholder="Vide" className="flex-1 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Logo, Devis et PDF */}
              <Collapsible className="group" open={themeSectionsOpen["Logo, Devis et PDF"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Logo, Devis et PDF": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800">Logo, Devis et PDF</h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
                <p className="text-sm text-gray-600">Couleurs pour la zone du logo (navbar) et pour les documents générés (devis et factures PDF).</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Fond zone logo</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={themeSettings.logo_area_bg_color ? normalizeHexColor(themeSettings.logo_area_bg_color) : "#ffffff"} onChange={(e) => updateColor("logo_area_bg_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.logo_area_bg_color} onChange={(e) => updateColor("logo_area_bg_color", e.target.value)} placeholder="Vide = transparent" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Arrière-plan de la zone du logo (navbar).</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Texte zone logo</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={themeSettings.logo_area_text_color ? normalizeHexColor(themeSettings.logo_area_text_color) : "#111827"} onChange={(e) => updateColor("logo_area_text_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.logo_area_text_color} onChange={(e) => updateColor("logo_area_text_color", e.target.value)} placeholder="Vide = défaut" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Couleur du texte à côté du logo.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur principale devis / PDF *</Label>
                    <div className="flex items-center gap-3">
                      <Input type="color" value={normalizeHexColor(themeSettings.devis_pdf_primary_color)} onChange={(e) => updateColor("devis_pdf_primary_color", e.target.value)} className="w-20 h-12 cursor-pointer" />
                      <Input type="text" value={themeSettings.devis_pdf_primary_color} onChange={(e) => updateColor("devis_pdf_primary_color", e.target.value)} placeholder="#087A00" className="flex-1" />
                    </div>
                    <p className="text-xs text-gray-500">Titres, bordures et accents dans les PDF devis et factures.</p>
                  </div>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Logo et favicon */}
              <Collapsible className="group" open={themeSectionsOpen["Logo et favicon"]} onOpenChange={(o) => setThemeSectionsOpen((s) => ({ ...s, "Logo et favicon": o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-3.5 px-4 text-left rounded-xl hover:bg-site-primary/5 transition-colors border border-transparent hover:border-site-primary/10">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FaImage className="w-5 h-5 text-site-primary" />
                    Logo et favicon
                  </h3>
                  <FaChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                <div className="space-y-4 pt-2 pb-4">
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
                          onError={() => setLogoPreview(null)}
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
                          onError={() => setFaviconPreview(null)}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Format recommandé: ICO, PNG (16x16 ou 32x32). Taille max: 1MB</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="logo_signature">Signature / Logo de fin de devis</Label>
                  <Input
                    id="logo_signature"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSignatureChange}
                    className="cursor-pointer"
                  />
                  {logoSignaturePreview && (
                    <div className="mt-2">
                      <img
                        src={logoSignaturePreview}
                        alt="Aperçu de la signature"
                        className="max-h-24 object-contain rounded-lg border-2 border-gray-200"
                        onError={() => setLogoSignaturePreview(null)}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Image affichée en bas du PDF devis (signature, cachet, logo de fin). Format PNG recommandé.</p>
                </div>
                </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex justify-end pt-6 mt-8 border-t border-site-primary/10">
                <Button
                  type="submit"
                  className="rounded-xl px-6 py-2.5 bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text font-semibold shadow-md hover:shadow-lg transition-shadow"
                  disabled={saveThemeMutation.isPending}
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  {saveThemeMutation.isPending ? "Enregistrement..." : "Enregistrer le thème"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Configuration SMTP */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FaEnvelope className="w-6 h-6 text-site-primary" />
              Configuration Email (SMTP)
            </CardTitle>
            <CardDescription>
              Configurez les paramètres SMTP pour l'envoi automatique de devis et factures par email
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveSmtp} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">
                    Serveur SMTP *
                    <span className="text-xs font-normal text-gray-500 ml-2">(ex: smtp.gmail.com)</span>
                  </Label>
                  <Input
                    id="smtp_host"
                    type="text"
                    value={smtpSettings.smtp_host}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                  />
                  <p className="text-xs text-gray-500">Adresse du serveur SMTP de votre fournisseur email</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_port">
                    Port SMTP *
                    <span className="text-xs font-normal text-gray-500 ml-2">(587 pour TLS, 465 pour SSL)</span>
                  </Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={smtpSettings.smtp_port}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: parseInt(e.target.value) || 587 })}
                    min="1"
                    max="65535"
                    required
                  />
                  <p className="text-xs text-gray-500">Port de connexion au serveur SMTP</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_username">
                    Email expéditeur *
                    <span className="text-xs font-normal text-gray-500 ml-2">(Votre adresse email)</span>
                  </Label>
                  <Input
                    id="smtp_username"
                    type="email"
                    value={smtpSettings.smtp_username}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_username: e.target.value })}
                    placeholder="votre-email@gmail.com"
                    required
                  />
                  <p className="text-xs text-gray-500">Adresse email utilisée pour envoyer les emails</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_password">
                    Mot de passe SMTP *
                    <span className="text-xs font-normal text-gray-500 ml-2">(Mot de passe d'application)</span>
                  </Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={smtpSettings.smtp_password}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_password: e.target.value })}
                    placeholder="Votre mot de passe ou mot de passe d'application"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Pour Gmail, utilisez un mot de passe d'application (pas votre mot de passe principal)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smtp_use_tls"
                    checked={smtpSettings.smtp_use_tls}
                    onChange={(e) => {
                      setSmtpSettings({ ...smtpSettings, smtp_use_tls: e.target.checked, smtp_use_ssl: !e.target.checked });
                    }}
                    className="w-4 h-4 text-site-primary border-gray-300 rounded focus:ring-site-primary"
                  />
                  <Label htmlFor="smtp_use_tls" className="cursor-pointer">
                    Utiliser TLS (recommandé pour le port 587)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smtp_use_ssl"
                    checked={smtpSettings.smtp_use_ssl}
                    onChange={(e) => {
                      setSmtpSettings({ ...smtpSettings, smtp_use_ssl: e.target.checked, smtp_use_tls: !e.target.checked });
                    }}
                    className="w-4 h-4 text-site-primary border-gray-300 rounded focus:ring-site-primary"
                  />
                  <Label htmlFor="smtp_use_ssl" className="cursor-pointer">
                    Utiliser SSL (pour le port 465)
                  </Label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 Aide à la configuration</p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li><strong>Gmail:</strong> smtp.gmail.com, Port 587, TLS activé</li>
                    <li><strong>Outlook/Hotmail:</strong> smtp-mail.outlook.com, Port 587, TLS activé</li>
                    <li><strong>Yahoo:</strong> smtp.mail.yahoo.com, Port 587, TLS activé</li>
                    <li>Pour Gmail, vous devez créer un mot de passe d'application dans les paramètres de sécurité</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
                  disabled={saveSmtpMutation.isPending}
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  {saveSmtpMutation.isPending ? "Enregistrement..." : "Enregistrer la configuration SMTP"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {/* ── Informations légales et de paiement ── */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FaSave className="w-6 h-6 text-site-primary" />
              Informations légales et de paiement
            </CardTitle>
            <CardDescription>
              Ces informations apparaissent sur les devis PDF générés (SIRET, IBAN, TVA, mentions légales)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveLegal} className="space-y-8">

              {/* Identité légale */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 border-b pb-2">Identité légale</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input id="siret" value={legalSettings.siret} onChange={(e) => setLegalSettings({ ...legalSettings, siret: e.target.value })} placeholder="ex : 100 124 809 00011" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="code_ape">Code APE / NAF</Label>
                    <Input id="code_ape" value={legalSettings.code_ape} onChange={(e) => setLegalSettings({ ...legalSettings, code_ape: e.target.value })} placeholder="ex : 88.10A" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="num_tva">N° TVA intracommunautaire</Label>
                    <Input id="num_tva" value={legalSettings.num_tva} onChange={(e) => setLegalSettings({ ...legalSettings, num_tva: e.target.value })} placeholder="ex : FR68100124809" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="forme_juridique">Forme juridique</Label>
                    <Input id="forme_juridique" value={legalSettings.forme_juridique} onChange={(e) => setLegalSettings({ ...legalSettings, forme_juridique: e.target.value })} placeholder="ex : SAS, SARL, Auto-entrepreneur..." />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="rcs_ville">RCS / Ville</Label>
                    <Input id="rcs_ville" value={legalSettings.rcs_ville} onChange={(e) => setLegalSettings({ ...legalSettings, rcs_ville: e.target.value })} placeholder="ex : Nanterre" />
                  </div>
                </div>
              </div>

              {/* Informations de paiement */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 border-b pb-2">Informations de paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="paiement_beneficiaire">Nom de l'entreprise</Label>
                    <Input id="paiement_beneficiaire" value={legalSettings.paiement_beneficiaire} onChange={(e) => setLegalSettings({ ...legalSettings, paiement_beneficiaire: e.target.value })} placeholder="ex : EASE-DOM" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paiement_banque">Banque de l'entreprise</Label>
                    <Input id="paiement_banque" value={legalSettings.paiement_banque} onChange={(e) => setLegalSettings({ ...legalSettings, paiement_banque: e.target.value })} placeholder="ex : LCL" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="paiement_iban">IBAN de l'entreprise</Label>
                    <Input id="paiement_iban" value={legalSettings.paiement_iban} onChange={(e) => setLegalSettings({ ...legalSettings, paiement_iban: e.target.value })} placeholder="ex : FR38 3000 2005 1000 0000 9774 Z35" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paiement_bic">Code BIC / SWIFT</Label>
                    <Input id="paiement_bic" value={legalSettings.paiement_bic} onChange={(e) => setLegalSettings({ ...legalSettings, paiement_bic: e.target.value })} placeholder="ex : CRLYFRPP" />
                  </div>
                </div>
              </div>

              {/* Mentions devis */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 border-b pb-2">Mentions sur les devis PDF</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="mention_tva">Mention TVA</Label>
                    <Input id="mention_tva" value={legalSettings.mention_tva} onChange={(e) => setLegalSettings({ ...legalSettings, mention_tva: e.target.value })} placeholder="TVA non applicable selon l'article 293 B du CGI" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="mention_bon_pour_accord">Mention « Bon pour accord »</Label>
                    <textarea
                      id="mention_bon_pour_accord"
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
                      value={legalSettings.mention_bon_pour_accord}
                      onChange={(e) => setLegalSettings({ ...legalSettings, mention_bon_pour_accord: e.target.value })}
                      placeholder="Si accord, le devis devra être retourné signé..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text"
                  disabled={saveLegalMutation.isPending}
                >
                  <FaSave className="w-4 h-4 mr-2" />
                  {saveLegalMutation.isPending ? "Enregistrement..." : "Enregistrer les informations légales"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}

