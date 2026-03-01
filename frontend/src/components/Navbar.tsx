import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FaHome, FaBriefcase, FaBuilding, FaPhone, FaChevronDown, FaBaby, FaTree, FaPaintBrush, FaShieldAlt, FaTruck, FaMapMarkerAlt, FaUsers, FaInfoCircle } from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
import { HiSparkles } from "react-icons/hi";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/config/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubSubItem {
  label: string;
  path: string;
}

interface SubItem {
  label: string;
  icon: IconType;
  subSubItems?: SubSubItem[];
}

interface NavItem {
  path: string;
  label: string;
  icon: IconType;
  hasDropdown: boolean;
  subItems?: SubItem[];
}

// EASE-DOM: nom du site depuis site-settings ou défaut "EASE - DOM"
// Mapping des icônes par catégorie
const categoryIconMap: Record<string, IconType> = {
  "Garde d'enfants": FaBaby,
  "Ménage et repassage": HiSparkles,
  "Jardinage": FaTree,
  "Peinture": FaPaintBrush,
  "Sécurité": FaShieldAlt,
  "Déménagement": FaTruck,
};

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  // Fermer tous les sous-menus quand on ferme le menu principal
  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
    setOpenSubMenus({});
  };

  // Récupérer les services depuis l'API
  const { data: navbarData } = useQuery({
    queryKey: ["navbar"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/navbar/`);
      return response.json();
    },
  });

  // Récupérer le nom du site et le logo depuis les paramètres (affichés dans la navbar)
  const { data: siteSettings, refetch: refetchSiteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/site-settings/`);
      return response.json();
    },
  });

  // Rafraîchir le nom/logo quand on enregistre dans Paramètres (admin)
  useEffect(() => {
    const onSettingsUpdated = () => refetchSiteSettings();
    window.addEventListener("site-settings-updated", onSettingsUpdated);
    return () => window.removeEventListener("site-settings-updated", onSettingsUpdated);
  }, [refetchSiteSettings]);

  const siteName = siteSettings?.site_name || "EASE - DOM";
  const siteTagline = siteSettings?.site_tagline || "Votre partenaire de confiance";
  const logoUrl = siteSettings?.logo_url || null;
  const [logoLoadError, setLogoLoadError] = useState(false);
  useEffect(() => setLogoLoadError(false), [logoUrl]);
  const showLogoImg = logoUrl && !logoLoadError;
  // Afficher le nom en deux parties si contient un espace (ex. "Services" + "Locaux")
  const [namePart1, namePart2] = siteName.includes(" ")
    ? [siteName.split(" ")[0], siteName.split(" ").slice(1).join(" ")]
    : [siteName, ""];

  // Construire les items de navigation pour les services
  const buildServicesSubItems = (): SubItem[] => {
    if (!navbarData?.services_by_category) {
      return [];
    }

    const subItems: SubItem[] = [];
    const categories = Object.keys(navbarData.services_by_category).sort();

    for (const categoryName of categories) {
      const services = navbarData.services_by_category[categoryName];
      if (services && services.length > 0) {
        subItems.push({
          label: categoryName,
          icon: categoryIconMap[categoryName] || FaBriefcase,
          subSubItems: services.map((service: any) => ({
            label: service.name,
            path: `/services/${service.slug}`,
          })),
        });
      }
    }

    return subItems;
  };

  const servicesSubItems = buildServicesSubItems();

  // Construire les items de navigation pour les agences
  const buildAgenciesSubItems = (): SubSubItem[] => {
    if (!navbarData?.agencies) {
      return [];
    }
    return navbarData.agencies.map((agency: any) => ({
      label: `${agency.name} - ${agency.city}`,
      path: `/agences/${agency.slug}`,
    }));
  };

  // Construire les villes uniques depuis les agences
  const buildCitiesSubItems = (): SubSubItem[] => {
    if (!navbarData?.agencies || navbarData.agencies.length === 0) {
      return [];
    }
    // Extraire toutes les villes uniques et les trier
    const cities = [...new Set(navbarData.agencies.map((a: any) => a.city))].sort();
    return cities.map((city: string) => ({
      label: city,
      // Utiliser le nom exact de la ville (avec la bonne casse) dans l'URL
      path: `/agences?ville=${encodeURIComponent(city)}`,
    }));
  };

  // Construire les services pour le filtre des agences
  const buildServicesForAgenciesSubItems = (): SubSubItem[] => {
    if (!navbarData?.services || navbarData.services.length === 0) {
      return [];
    }
    // Tous les services actifs, limités à 10 pour ne pas surcharger le menu
    return navbarData.services.slice(0, 10).map((service: any) => ({
      label: service.name,
      path: `/services/${service.slug}`, // Rediriger vers la page du service
    }));
  };

  const citiesSubItems = buildCitiesSubItems();
  const servicesForAgenciesSubItems = buildServicesForAgenciesSubItems();

  const navItems: NavItem[] = [
    { path: "/", label: "Accueil", icon: FaHome, hasDropdown: false },
    { 
      path: "/services", 
      label: "Services", 
      icon: FaBriefcase, 
      hasDropdown: servicesSubItems.length > 0,
      subItems: servicesSubItems.length > 0 ? servicesSubItems : undefined,
    },
    {
      path: "/agences",
      label: "Agences",
      icon: FaBuilding,
      hasDropdown: true,
      subItems: [
        {
          label: "Par ville",
          icon: FaMapMarkerAlt,
          subSubItems: citiesSubItems.length > 0 ? citiesSubItems : [],
        },
      ],
    },
    { path: "/contact", label: "Contact", icon: FaPhone, hasDropdown: false },
  ];

  const isActive = (path: string) => location === path;

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 
      bg-white/95 backdrop-blur-md border-b border-gray-200 
      shadow-sm w-full max-w-full overflow-x-hidden"
      style={{ zIndex: 9998 }}>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 md:h-20 w-full gap-2">
          
          {/* Logo (nom et logo depuis les paramètres du site) */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0 rounded-lg px-1 -mx-1"
            style={{
              backgroundColor: "var(--site-logo-area-bg-hex, transparent)",
              color: "var(--site-logo-area-text-hex, inherit)",
            }}
            data-testid="link-home"
          >
            {showLogoImg ? (
              <img
                src={logoUrl!}
                alt={siteName}
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg object-contain transition-transform duration-200 group-hover:scale-105 shadow-md flex-shrink-0 bg-white"
                onError={() => setLogoLoadError(true)}
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-site-primary to-site-secondary flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-md flex-shrink-0">
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">
                {namePart2 ? (
                  <>
                    <span className="text-site-name-part1">{namePart1}</span>{" "}
                    <span className="text-site-name-part2">{namePart2}</span>
                  </>
                ) : (
                  <span className="text-site-name-part2">{siteName}</span>
                )}
              </span>
              <span className="text-xs text-site-tagline hidden md:block">{siteTagline}</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.hasDropdown && item.subItems) {
                return (
                  <DropdownMenu key={item.path}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        className={`gap-2 transition-colors duration-200 ${
                          isActive(item.path)
                            ? "bg-site-button-primary text-site-button-text shadow-md hover:bg-site-button-primary-hover"
                            : "hover:bg-site-primary/10 hover:text-site-primary text-gray-700"
                        }`}
                        data-testid={`link-${item.label.toLowerCase()}`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{item.label}</span>
                        <FaChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="w-56 bg-white border border-gray-200 shadow-lg" sideOffset={5}>
                      {item.subItems.map((subItem, idx) => (
                        <DropdownMenuSub key={idx}>
                          <DropdownMenuSubTrigger className="gap-2 hover:bg-site-primary/10 focus:bg-site-primary/10 focus:text-gray-900 data-[state=open]:bg-site-primary/10">
                            <subItem.icon className="w-4 h-4 text-site-primary" />
                            <span>{subItem.label}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="bg-white border border-gray-200 shadow-lg">
                            {subItem.subSubItems?.map((subSubItem, subIdx) => (
                              <DropdownMenuItem key={subIdx} asChild>
                                <Link href={subSubItem.path} className="cursor-pointer hover:bg-site-primary/10 hover:text-gray-900 focus:bg-site-primary/10 focus:text-gray-900">
                                  {subSubItem.label}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={item.path} className="cursor-pointer hover:bg-site-primary/10 hover:text-site-primary focus:bg-site-primary/10 focus:text-site-primary font-semibold text-site-primary">
                          Voir tous les {item.label.toLowerCase()}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`gap-2 transition-colors duration-200 ${
                    isActive(item.path)
                        ? "bg-site-button-primary text-site-button-text shadow-md hover:bg-site-button-primary-hover"
                        : "hover:bg-site-primary/10 hover:text-site-primary text-gray-700"
                  }`}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Button>
              </Link>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/admin/login">
              <Button
                variant="outline"
                className="border-2 border-site-button-outline-border text-site-button-outline-text hover:bg-site-button-outline-hover-bg hover:text-white transition-colors"
              >
                Connexion
              </Button>
            </Link>
            <Link href="/devis">
              <Button
                className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text shadow-md hover:shadow-lg transition-all duration-300"
                data-testid="button-quote-cta"
              >
                Demander un devis
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-site-primary transition-colors relative flex-shrink-0 ml-2 z-[102]"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (mobileMenuOpen) {
                handleCloseMenu();
              } else {
                setMobileMenuOpen(true);
              }
            }}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </nav>
    
    {/* Mobile menu - en dehors de la navbar pour éviter les problèmes de z-index */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Overlay pour fermer le menu */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              handleCloseMenu();
            }}
            className="md:hidden fixed bg-black/50"
            style={{ 
              zIndex: 9999, 
              top: '64px',
              left: 0,
              right: 0,
              bottom: 0,
              position: 'fixed'
            }}
          />
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white fixed left-0 right-0 bottom-0 shadow-2xl w-full overflow-y-auto"
            style={{ 
              top: '64px',
              zIndex: 10000,
              position: 'fixed',
              width: '100%',
              backgroundColor: 'white'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
              <div className="px-3 py-4 space-y-2 bg-white w-full">
                {navItems.map((item) => {
                  if (item.hasDropdown && item.subItems) {
                    const isSubMenuOpen = openSubMenus[item.path] || false;
                    return (
                      <div key={item.path} className="space-y-1 border-b border-gray-100 pb-1.5 last:border-b-0 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSubMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }));
                          }}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-site-primary/10 rounded-lg transition-colors bg-gray-50 border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-site-primary" />
                            <span>{item.label}</span>
                          </div>
                          <FaChevronDown className={`w-3.5 h-3.5 transition-transform text-gray-500 ${isSubMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSubMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-2 sm:pl-3 pr-2 space-y-1 mt-1.5 bg-white rounded-lg w-full"
                          >
                          {item.subItems.map((subItem, idx) => {
                            const subSubMenuKey = `${item.path}-${idx}`;
                            const isSubSubMenuOpen = openSubMenus[subSubMenuKey] || false;
                            return (
                              <div key={idx} className="space-y-1 border-l-2 border-gray-200 pl-2 sm:pl-3 ml-1 sm:ml-2 w-full">
                                {subItem.subSubItems && subItem.subSubItems.length > 0 ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenSubMenus(prev => ({ ...prev, [subSubMenuKey]: !prev[subSubMenuKey] }));
                                      }}
                                      className="flex items-center justify-between w-full px-2 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-site-primary/10 rounded-md transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <subItem.icon className="w-4 h-4 text-site-primary" />
                                        <span>{subItem.label}</span>
                                      </div>
                                      <FaChevronDown className={`w-3 h-3 transition-transform text-gray-400 ${isSubSubMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isSubSubMenuOpen && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pl-2 sm:pl-4 space-y-1 mt-1 w-full"
                                      >
                                        {subItem.subSubItems.map((subSubItem, subIdx) => (
                                          <Link
                                            key={subIdx}
                                            href={subSubItem.path}
                                            onClick={handleCloseMenu}
                                            className="block"
                                          >
                                            <Button
                                              variant="ghost"
                                              className="w-full justify-start text-xs text-gray-600 hover:bg-site-primary/10 hover:text-site-primary py-1.5 h-auto"
                                            >
                                              {subSubItem.label}
                                            </Button>
                                          </Link>
                                        ))}
                                      </motion.div>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-700">
                                    <subItem.icon className="w-4 h-4 text-site-primary" />
                                    <span>{subItem.label}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className="pt-1.5 mt-1.5 border-t border-gray-200">
                            <Link href={item.path} onClick={handleCloseMenu}>
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-xs font-semibold text-site-primary hover:bg-site-primary/10 py-1.5"
                              >
                                Voir tous les {item.label.toLowerCase()}
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                }
                return (
                <Link key={item.path} href={item.path} className="block w-full">
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start gap-2 px-3 py-2 text-sm font-medium ${
                      isActive(item.path)
                        ? "bg-site-button-primary text-site-button-text shadow-md"
                        : "hover:bg-site-primary/10 hover:text-site-primary text-gray-700 bg-gray-50 border border-gray-200"
                    }`}
                    onClick={handleCloseMenu}
                    data-testid={`link-mobile-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
                );
              })}
              
              {/* CTA Buttons Mobile */}
              <div className="pt-4 mt-4 border-t border-gray-300 space-y-2 w-full">
                <Link href="/admin/login" onClick={handleCloseMenu} className="block w-full">
                  <Button variant="outline" className="w-full border-2 border-site-button-outline-border text-site-button-outline-text hover:bg-site-button-outline-hover-bg hover:text-white py-2 text-sm font-semibold">
                    Connexion
                  </Button>
                </Link>
                <Link href="/devis" onClick={handleCloseMenu} className="block w-full">
                  <Button className="w-full bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text shadow-lg py-2 text-sm font-semibold">
                    Demander un devis
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
