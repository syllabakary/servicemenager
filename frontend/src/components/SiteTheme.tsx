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

      // Mettre à jour le favicon si disponible
      if (settings.logo_favicon_url) {
        const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (link) {
          link.href = settings.logo_favicon_url;
        } else {
          const newLink = document.createElement("link");
          newLink.rel = "icon";
          newLink.href = settings.logo_favicon_url;
          document.head.appendChild(newLink);
        }
      }
    }
  }, [settings]);

  return null; // Ce composant ne rend rien
}

