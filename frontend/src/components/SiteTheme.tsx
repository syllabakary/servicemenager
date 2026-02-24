import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/config/api";

/**
 * Composant pour injecter les variables CSS dynamiques depuis l'API
 */
export function SiteTheme() {
  const { data: settings, refetch } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      // Ajouter un timestamp pour éviter le cache
      const res = await axios.get(`${API_URL}/site-settings/?t=${Date.now()}`);
      return res.data;
    },
    staleTime: 0, // Pas de cache, toujours récupérer les dernières données
    cacheTime: 0, // Ne pas mettre en cache
    refetchOnWindowFocus: true, // Rafraîchir quand la fenêtre reprend le focus
    refetchOnMount: true, // Rafraîchir à chaque montage du composant
    refetchOnReconnect: true, // Rafraîchir lors de la reconnexion
  });

  // Écouter les événements de mise à jour des paramètres
  useEffect(() => {
    const handleSettingsUpdate = () => {
      // Forcer un refetch immédiat
      refetch().catch(console.error);
    };
    
    window.addEventListener("site-settings-updated", handleSettingsUpdate);
    
    return () => {
      window.removeEventListener("site-settings-updated", handleSettingsUpdate);
    };
  }, [refetch]);
  
  // Écouter aussi les changements de focus pour rafraîchir si nécessaire
  useEffect(() => {
    const handleFocus = () => {
      refetch().catch(console.error);
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetch]);

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Convertir les couleurs hex en RGB pour les variables CSS
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      // Convertir RGB en HSL pour les variables CSS
      const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0,
          s = 0,
          l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r:
              h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
              break;
            case g:
              h = ((b - r) / d + 2) / 6;
              break;
            case b:
              h = ((r - g) / d + 4) / 6;
              break;
          }
        }

        return {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          l: Math.round(l * 100),
        };
      };

      // Fonction helper pour appliquer une couleur
      const applyColor = (colorValue: string, varName: string) => {
        if (!colorValue) return;
        const rgb = hexToRgb(colorValue);
        if (rgb) {
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          root.style.setProperty(`--site-${varName}`, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
          root.style.setProperty(`--site-${varName}-hex`, colorValue);
        }
      };
      // Appliquer les couleurs principales
      applyColor(settings.primary_color, "primary");
      applyColor(settings.secondary_color, "secondary");
      applyColor(settings.tertiary_color, "tertiary");
      
      // Appliquer les couleurs des boutons
      applyColor(settings.button_primary_color || settings.primary_color, "button-primary");
      applyColor(settings.button_primary_hover_color || settings.secondary_color, "button-primary-hover");
      applyColor(settings.button_text_color || "#FFFFFF", "button-text");
      
      // Appliquer les couleurs des textes
      applyColor(settings.text_primary_color || settings.primary_color, "text-primary");
      applyColor(settings.text_link_color || settings.primary_color, "text-link");
      applyColor(settings.text_link_hover_color || settings.secondary_color, "text-link-hover");

      // Bannière (bandeau promo)
      applyColor(settings.banner_bg_color || settings.primary_color, "banner-bg");
      applyColor(settings.banner_text_color || "#FFFFFF", "banner-text");
      applyColor(settings.banner_button_color || settings.primary_color, "banner-button");
      applyColor(settings.banner_button_border_color || "", "banner-button-border");

      // Section Services
      applyColor(settings.services_bg_color || settings.primary_color, "section-services-bg");
      applyColor(settings.services_text_color || "#FFFFFF", "section-services-text");
      applyColor(settings.services_button_color || settings.button_primary_color || settings.primary_color, "section-services-button");
      applyColor(settings.services_button_border_color || "", "section-services-button-border");
      // Section Agences
      applyColor(settings.agencies_bg_color || settings.primary_color, "section-agencies-bg");
      applyColor(settings.agencies_text_color || "#FFFFFF", "section-agencies-text");
      applyColor(settings.agencies_button_color || settings.button_primary_color || settings.primary_color, "section-agencies-button");
      applyColor(settings.agencies_button_border_color || "", "section-agencies-button-border");
      // Interface employé
      applyColor(settings.employe_bg_color || settings.primary_color, "section-employe-bg");
      applyColor(settings.employe_text_color || "#FFFFFF", "section-employe-text");
      applyColor(settings.employe_button_color || settings.button_primary_color || settings.primary_color, "section-employe-button");
      applyColor(settings.employe_button_border_color || "", "section-employe-button-border");
      // Page connexion admin
      applyColor(settings.admin_login_bg_color || settings.primary_color, "section-admin-login-bg");
      applyColor(settings.admin_login_text_color || "#FFFFFF", "section-admin-login-text");
      applyColor(settings.admin_login_button_color || settings.button_primary_color || settings.primary_color, "section-admin-login-button");
      applyColor(settings.admin_login_button_border_color || "", "section-admin-login-button-border");
      // Page connexion employé
      applyColor(settings.employe_login_bg_color || settings.primary_color, "section-employe-login-bg");
      applyColor(settings.employe_login_text_color || "#FFFFFF", "section-employe-login-text");
      applyColor(settings.employe_login_button_color || settings.button_primary_color || settings.primary_color, "section-employe-login-button");
      applyColor(settings.employe_login_button_border_color || "", "section-employe-login-button-border");

      // Bordures section (transparent si vide)
      if (!settings.banner_button_border_color) root.style.setProperty("--site-banner-button-border-hex", "transparent");
      if (!settings.services_button_border_color) root.style.setProperty("--site-section-services-button-border-hex", "transparent");
      if (!settings.agencies_button_border_color) root.style.setProperty("--site-section-agencies-button-border-hex", "transparent");
      if (!settings.employe_button_border_color) root.style.setProperty("--site-section-employe-button-border-hex", "transparent");
      if (!settings.admin_login_button_border_color) root.style.setProperty("--site-section-admin-login-button-border-hex", "transparent");
      if (!settings.employe_login_button_border_color) root.style.setProperty("--site-section-employe-login-button-border-hex", "transparent");

      // Footer
      applyColor(settings.footer_bg_color || "#FEF2F2", "footer-bg");
      applyColor(settings.footer_text_color || "#374151", "footer-text");
      applyColor(settings.footer_link_color || settings.primary_color, "footer-link");
      applyColor(settings.footer_link_hover_color || settings.secondary_color, "footer-link-hover");
      applyColor(settings.footer_border_color || "#FECACA", "footer-border");

      // Bordures des boutons (toutes interfaces)
      const btnBorderColor = settings.button_border_color || "";
      const btnBorderWidth = (settings.button_border_width ?? 0);
      const btnBorderRadius = settings.button_border_radius || "0.375rem";
      if (btnBorderColor) {
        const rgb = hexToRgb(btnBorderColor);
        if (rgb) {
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          root.style.setProperty("--site-button-border", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
          root.style.setProperty("--site-button-border-hex", btnBorderColor);
        }
      } else {
        root.style.setProperty("--site-button-border-hex", "transparent");
      }
      root.style.setProperty("--site-button-border-width", `${btnBorderWidth}px`);
      root.style.setProperty("--site-button-border-radius", btnBorderRadius);

      // Boutons outline (ex. Connexion)
      applyColor(settings.button_outline_border_color || settings.primary_color, "button-outline-border");
      applyColor(settings.button_outline_text_color || settings.primary_color, "button-outline-text");
      applyColor(settings.button_outline_hover_bg_color || settings.primary_color, "button-outline-hover-bg");

      // Nom et slogan (navbar)
      applyColor(settings.site_name_part1_color || "#111827", "name-part1");
      applyColor(settings.site_name_part2_color || settings.primary_color, "name-part2");
      applyColor(settings.site_tagline_color || "#6B7280", "tagline");

      // Logo, Devis et PDF
      if (settings.logo_area_bg_color) {
        applyColor(settings.logo_area_bg_color, "logo-area-bg");
      } else {
        root.style.setProperty("--site-logo-area-bg-hex", "transparent");
      }
      if (settings.logo_area_text_color) {
        applyColor(settings.logo_area_text_color, "logo-area-text");
      }
      applyColor(settings.devis_pdf_primary_color || settings.primary_color || "#087A00", "devis-pdf-primary");

      // Titre de la page (onglet) = nom du site personnalisé
      // Défaut EASE - DOM si pas de paramètre en base
      const siteName = (settings.site_name || "EASE - DOM").trim();
      const tagline = (settings.site_tagline || "").trim();
      document.title = tagline ? `${siteName} - ${tagline}` : siteName;

      // Favicon : image personnalisée ou initiales du nom du site
      const primaryHex = settings.primary_color || "#087A00";
      const getOrCreateFaviconLink = () => {
        let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        return link;
      };
      if (settings.logo_favicon_url) {
        getOrCreateFaviconLink().href = settings.logo_favicon_url;
      } else {
        // Générer un favicon avec les initiales du nom du site (personnalisation par le nom)
        const nameForFavicon = (settings.site_name || "S").trim();
        const initials = nameForFavicon
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || nameForFavicon[0]?.toUpperCase() || "S";
        try {
          const size = 32;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = primaryHex;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${initials.length === 1 ? 20 : 14}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(initials, size / 2, size / 2);
            const dataUrl = canvas.toDataURL("image/png");
            getOrCreateFaviconLink().href = dataUrl;
          }
        } catch {
          getOrCreateFaviconLink().href = "/favicon.ico";
        }
      }
    }
  }, [settings]);

  return null; // Ce composant ne rend rien
}

