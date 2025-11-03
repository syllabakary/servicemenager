import { Link } from "wouter";
import { Home, Briefcase, Building2, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-card-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">Services Locaux</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Votre partenaire de confiance pour tous vos besoins de services à domicile.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center hover-elevate active-elevate-2 transition-transform"
                data-testid="link-facebook"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center hover-elevate active-elevate-2 transition-transform"
                data-testid="link-twitter"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center hover-elevate active-elevate-2 transition-transform"
                data-testid="link-instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center hover-elevate active-elevate-2 transition-transform"
                data-testid="link-linkedin"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="link-footer-menage">
                  Ménage à domicile
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="link-footer-garde">
                  Garde d'enfants
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="link-footer-jardinage">
                  Jardinage
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="link-footer-tous">
                  Tous les services
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="link-footer-accueil">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/agences" className="text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="link-footer-agences">
                  Nos agences
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="link-footer-contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground text-sm">Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a href="tel:+2250123456789" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  +225 01 23 45 67 89
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <a href="mailto:contact@serviceslocaux.ci" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  contact@serviceslocaux.ci
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Services Locaux. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Mentions légales
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Confidentialité
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
