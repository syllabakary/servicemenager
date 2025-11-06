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
    <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-50 
      w-[95%] md:w-[90%] lg:w-[80%]
      bg-gradient-to-r from-background/90 via-background/80 to-background/90 
      backdrop-blur-xl border border-border/60 
      rounded-2xl shadow-lg shadow-primary/10 transition-all duration-500">
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-3">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
              Services <span className="text-primary">Locaux</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`gap-2 transition-all duration-300 ${
                    isActive(item.path)
                      ? "shadow-md shadow-primary/20"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* CTA button */}
          <div className="hidden md:block">
            <a href="#demander-devis">
              <Button
                variant="default"
                className="shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                data-testid="button-quote-cta"
              >
                Demander un devis
              </Button>
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
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
            className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md rounded-b-2xl"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="w-full justify-start gap-2 hover:bg-primary/10 hover:text-primary"
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
                  className="w-full shadow-md shadow-primary/20"
                  onClick={() => setMobileMenuOpen(false)}
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
