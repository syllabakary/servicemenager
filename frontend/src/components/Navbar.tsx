import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FaHome, FaBriefcase, FaBuilding, FaPhone, FaChevronDown, FaBaby, FaTree, FaPaintBrush, FaShieldAlt, FaTruck, FaMapMarkerAlt, FaUsers, FaInfoCircle } from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
import { HiSparkles } from "react-icons/hi";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconType } from "react-icons";
import { useQuery } from "@tanstack/react-query";
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

  // Récupérer les services depuis l'API
  const { data: navbarData } = useQuery({
    queryKey: ["navbar"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/navbar/");
      return response.json();
    },
  });

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
          subSubItems: [
            { label: "Abidjan", path: "/agences?ville=abidjan" },
            { label: "Bouaké", path: "/agences?ville=bouake" },
            { label: "Yamoussoukro", path: "/agences?ville=yamoussoukro" },
            { label: "San Pedro", path: "/agences?ville=san-pedro" },
          ]
        },
        {
          label: "Par service",
          icon: FaBriefcase,
          subSubItems: [
            { label: "Agences de nettoyage", path: "/agences?service=nettoyage" },
            { label: "Agences de garde d'enfants", path: "/agences?service=garde-enfants" },
            { label: "Agences de jardinage", path: "/agences?service=jardinage" },
          ]
        },
        {
          label: "Recherche",
          icon: FaUsers,
          subSubItems: [
            { label: "Trouver une agence", path: "/agences" },
            { label: "Devenir partenaire", path: "/contact?type=partenaire" },
          ]
        },
      ]
    },
    { path: "/contact", label: "Contact", icon: FaPhone, hasDropdown: false },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 
      bg-white/95 backdrop-blur-md border-b border-gray-200 
      shadow-sm w-full max-w-full overflow-x-hidden">
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-black flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-md">
              <FaHome className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                Services <span className="text-[#DC2626]">Locaux</span>
            </span>
              <span className="text-xs text-gray-500 hidden md:block">Votre partenaire de confiance</span>
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
                            ? "bg-[#DC2626] text-white shadow-md hover:bg-[#DC2626]"
                            : "hover:bg-[#DC2626]/10 hover:text-[#DC2626] text-gray-700"
                        }`}
                        data-testid={`link-${item.label.toLowerCase()}`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{item.label}</span>
                        <FaChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-lg" sideOffset={5}>
                      {item.subItems.map((subItem, idx) => (
                        <DropdownMenuSub key={idx}>
                          <DropdownMenuSubTrigger className="gap-2 hover:bg-[#DC2626]/10 focus:bg-[#DC2626]/10 focus:text-gray-900 data-[state=open]:bg-[#DC2626]/10">
                            <subItem.icon className="w-4 h-4 text-[#DC2626]" />
                            <span>{subItem.label}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="bg-white border border-gray-200 shadow-lg">
                            {subItem.subSubItems?.map((subSubItem, subIdx) => (
                              <DropdownMenuItem key={subIdx} asChild>
                                <Link href={subSubItem.path} className="cursor-pointer hover:bg-[#DC2626]/10 hover:text-gray-900 focus:bg-[#DC2626]/10 focus:text-gray-900">
                                  {subSubItem.label}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={item.path} className="cursor-pointer hover:bg-[#DC2626]/10 hover:text-[#DC2626] focus:bg-[#DC2626]/10 focus:text-[#DC2626] font-semibold text-[#DC2626]">
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
                        ? "bg-[#DC2626] text-white shadow-md hover:bg-[#DC2626]"
                        : "hover:bg-[#DC2626]/10 hover:text-[#DC2626] text-gray-700"
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
                className="border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-colors"
              >
                Connexion
              </Button>
            </Link>
            <Link href="/devis">
              <Button
                className="bg-[#DC2626] hover:bg-[#DC2626] text-white shadow-md hover:shadow-lg transition-all duration-300"
                data-testid="button-quote-cta"
              >
                Demander un devis
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-[#DC2626] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                if (item.hasDropdown && item.subItems) {
                  const isSubMenuOpen = openSubMenus[item.path] || false;
                  return (
                    <div key={item.path} className="space-y-1">
                      <button
                        onClick={() => setOpenSubMenus(prev => ({ ...prev, [item.path]: !prev[item.path] }))}
                        className="flex items-center justify-between w-full px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </div>
                        <FaChevronDown className={`w-4 h-4 transition-transform ${isSubMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isSubMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-6 space-y-1"
                        >
                          {item.subItems.map((subItem, idx) => {
                            const subSubMenuKey = `${item.path}-${idx}`;
                            const isSubSubMenuOpen = openSubMenus[subSubMenuKey] || false;
                            return (
                              <div key={idx} className="space-y-1">
                                <button
                                  onClick={() => setOpenSubMenus(prev => ({ ...prev, [subSubMenuKey]: !prev[subSubMenuKey] }))}
                                  className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <subItem.icon className="w-3 h-3" />
                                    {subItem.label}
                                  </div>
                                  {subItem.subSubItems && subItem.subSubItems.length > 0 && (
                                    <FaChevronDown className={`w-3 h-3 transition-transform ${isSubSubMenuOpen ? 'rotate-180' : ''}`} />
                                  )}
                                </button>
                                {isSubSubMenuOpen && subItem.subSubItems && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pl-6 space-y-1"
                                  >
                                    {subItem.subSubItems.map((subSubItem, subIdx) => (
                                      <Link
                                        key={subIdx}
                                        href={subSubItem.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                      >
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-xs text-gray-600 hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                                        >
                                          {subSubItem.label}
                                        </Button>
                                      </Link>
                                    ))}
                                  </motion.div>
                                )}
                              </div>
                            );
                          })}
                          <Link href={item.path} onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-sm font-semibold text-[#DC2626] hover:bg-[#DC2626]/10"
                            >
                              Voir tous les {item.label.toLowerCase()}
                            </Button>
                          </Link>
                        </motion.div>
                      )}
                    </div>
                  );
                }
                return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                      className={`w-full justify-start gap-2 ${
                        isActive(item.path)
                          ? "bg-[#DC2626] text-white"
                          : "hover:bg-[#DC2626]/10 hover:text-[#DC2626] text-gray-700"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
                );
              })}
                          <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white">
                              Connexion
                            </Button>
                          </Link>
                          <Link href="/devis" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full bg-[#DC2626] hover:bg-[#DC2626] text-white shadow-md">
                              Demander un devis
                            </Button>
                          </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
