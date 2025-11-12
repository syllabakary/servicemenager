import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Briefcase, Building2, Phone, Menu, X, ChevronDown, Sparkles, Baby, TreeDeciduous, Paintbrush, Shield, Truck, MapPin, Users, Info, LucideIcon } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  icon: LucideIcon;
  subSubItems?: SubSubItem[];
}

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  hasDropdown: boolean;
  subItems?: SubItem[];
}

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { path: "/", label: "Accueil", icon: Home, hasDropdown: false },
    { 
      path: "/services", 
      label: "Services", 
      icon: Briefcase, 
      hasDropdown: true,
      subItems: [
        {
          label: "Garde d'enfants",
          icon: Baby,
          subSubItems: [
            { label: "Garde d'enfants régulière", path: "/services?type=garde-reguliere" },
            { label: "Baby-sitting", path: "/services?type=babysitting" },
            { label: "Nounou partagée", path: "/services?type=nounou-partagee" },
            { label: "Aide aux devoirs", path: "/services?type=aide-devoirs" },
          ]
        },
        {
          label: "Ménage et repassage",
          icon: Sparkles,
          subSubItems: [
            { label: "Ménage régulier", path: "/services?type=menage-regulier" },
            { label: "Ménage ponctuel", path: "/services?type=menage-ponctuel" },
            { label: "Repassage à domicile", path: "/services?type=repassage" },
          ]
        },
        {
          label: "Jardinage",
          icon: TreeDeciduous,
          subSubItems: [
            { label: "Entretien régulier", path: "/services?type=jardinage-regulier" },
            { label: "Entretien ponctuel", path: "/services?type=jardinage-ponctuel" },
            { label: "Aménagement paysager", path: "/services?type=amenagement" },
          ]
        },
        {
          label: "Peinture",
          icon: Paintbrush,
          subSubItems: [
            { label: "Peinture intérieure", path: "/services?type=peinture-interieure" },
            { label: "Peinture extérieure", path: "/services?type=peinture-exterieure" },
          ]
        },
        {
          label: "Sécurité",
          icon: Shield,
          subSubItems: [
            { label: "Installation système", path: "/services?type=securite-installation" },
            { label: "Surveillance", path: "/services?type=surveillance" },
          ]
        },
        {
          label: "Déménagement",
          icon: Truck,
          subSubItems: [
            { label: "Déménagement complet", path: "/services?type=demenagement-complet" },
            { label: "Transport de meubles", path: "/services?type=transport" },
          ]
        },
      ]
    },
    { 
      path: "/agences", 
      label: "Agences", 
      icon: Building2, 
      hasDropdown: true,
      subItems: [
        {
          label: "Par ville",
          icon: MapPin,
          subSubItems: [
            { label: "Abidjan", path: "/agences?ville=abidjan" },
            { label: "Bouaké", path: "/agences?ville=bouake" },
            { label: "Yamoussoukro", path: "/agences?ville=yamoussoukro" },
            { label: "San Pedro", path: "/agences?ville=san-pedro" },
          ]
        },
        {
          label: "Par service",
          icon: Briefcase,
          subSubItems: [
            { label: "Agences de nettoyage", path: "/agences?service=nettoyage" },
            { label: "Agences de garde d'enfants", path: "/agences?service=garde-enfants" },
            { label: "Agences de jardinage", path: "/agences?service=jardinage" },
          ]
        },
        {
          label: "Recherche",
          icon: Users,
          subSubItems: [
            { label: "Trouver une agence", path: "/agences" },
            { label: "Devenir partenaire", path: "/contact?type=partenaire" },
          ]
        },
      ]
    },
    { path: "/contact", label: "Contact", icon: Phone, hasDropdown: false },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 
      bg-white/95 backdrop-blur-md border-b border-gray-200 
      shadow-sm transition-all duration-300">
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-[#A0522D] to-[#8B4513] flex items-center justify-center transition-transform group-hover:scale-105 shadow-md">
              <Home className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                Services <span className="text-[#A0522D]">Locaux</span>
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
                        className={`gap-2 transition-all duration-300 ${
                          isActive(item.path)
                            ? "bg-[#A0522D] text-white shadow-md hover:bg-[#8B4513]"
                            : "hover:bg-[#A0522D]/10 hover:text-[#A0522D] text-gray-700"
                        }`}
                        data-testid={`link-${item.label.toLowerCase()}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-lg">
                      {item.subItems.map((subItem, idx) => (
                        <DropdownMenuSub key={idx}>
                          <DropdownMenuSubTrigger className="gap-2 hover:bg-[#A0522D]/10">
                            <subItem.icon className="w-4 h-4 text-[#A0522D]" />
                            <span>{subItem.label}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="bg-white border border-gray-200 shadow-lg">
                            {subItem.subSubItems?.map((subSubItem, subIdx) => (
                              <DropdownMenuItem key={subIdx} asChild>
                                <Link href={subSubItem.path} className="cursor-pointer hover:bg-[#A0522D]/10">
                                  {subSubItem.label}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={item.path} className="cursor-pointer hover:bg-[#A0522D]/10 font-semibold text-[#A0522D]">
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
                  className={`gap-2 transition-all duration-300 ${
                    isActive(item.path)
                        ? "bg-[#A0522D] text-white shadow-md hover:bg-[#8B4513]"
                        : "hover:bg-[#A0522D]/10 hover:text-[#A0522D] text-gray-700"
                  }`}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
              );
            })}
          </div>

          {/* CTA button */}
          <div className="hidden md:block">
                        <Link href="/devis">
              <Button
                            className="bg-[#A0522D] hover:bg-[#8B4513] text-white shadow-md hover:shadow-lg transition-all duration-300"
                data-testid="button-quote-cta"
              >
                Demander un devis
              </Button>
                        </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-[#A0522D] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                  return (
                    <div key={item.path} className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </div>
                      </div>
                      <div className="pl-6 space-y-1">
                        {item.subItems.map((subItem, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-[#A0522D]">
                              <subItem.icon className="w-3 h-3" />
                              {subItem.label}
                            </div>
                            <div className="pl-6 space-y-1">
                              {subItem.subSubItems?.map((subSubItem, subIdx) => (
                                <Link
                                  key={subIdx}
                                  href={subSubItem.path}
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-xs text-gray-600 hover:bg-[#A0522D]/10 hover:text-[#A0522D]"
                                  >
                                    {subSubItem.label}
                                  </Button>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Link href={item.path} onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-sm font-semibold text-[#A0522D] hover:bg-[#A0522D]/10"
                          >
                            Voir tous les {item.label.toLowerCase()}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                }
                return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                      className={`w-full justify-start gap-2 ${
                        isActive(item.path)
                          ? "bg-[#A0522D] text-white"
                          : "hover:bg-[#A0522D]/10 hover:text-[#A0522D] text-gray-700"
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
                          <Link href="/devis" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full bg-[#A0522D] hover:bg-[#8B4513] text-white shadow-md">
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
