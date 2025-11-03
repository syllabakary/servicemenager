import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Briefcase, Building2, Phone, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Accueil", icon: Home },
    { path: "/services", label: "Services", icon: Briefcase },
    { path: "/agences", label: "Agences", icon: Building2 },
    { path: "/contact", label: "Contact", icon: Phone },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Services Locaux</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="gap-2"
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <a href="#demander-devis">
              <Button variant="default" data-testid="button-quote-cta">
                Demander un devis
              </Button>
            </a>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <a href="#demander-devis">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="button-mobile-quote-cta"
                >
                  Demander un devis
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
