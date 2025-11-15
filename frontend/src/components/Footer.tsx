import { Link } from "wouter";
import { Home, Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-700">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-md bg-yellow-600 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">Services Locaux</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Votre partenaire de confiance pour tous vos besoins de services à domicile.
        </p>
        <div className="flex gap-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-gray-800 flex items-center justify-center hover:bg-yellow-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-4 h-4 text-white" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-gray-800 flex items-center justify-center hover:bg-yellow-600 transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-4 h-4 text-white" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-gray-800 flex items-center justify-center hover:bg-yellow-600 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4 text-white" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-gray-800 flex items-center justify-center hover:bg-yellow-600 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-4 h-4 text-white" />
          </a>
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="font-semibold text-white mb-4">Services</h3>
        <ul className="space-y-2">
          <li>
            <Link href="/services" className="text-gray-400 hover:text-white transition-colors text-sm">
              Ménage à domicile
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-gray-400 hover:text-white transition-colors text-sm">
              Garde d'enfants
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-gray-400 hover:text-white transition-colors text-sm">
              Jardinage
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-gray-400 hover:text-white transition-colors text-sm">
              Tous les services
            </Link>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div>
        <h3 className="font-semibold text-white mb-4">Navigation</h3>
        <ul className="space-y-2">
          <li>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/agences" className="text-gray-400 hover:text-white transition-colors text-sm">
              Nos agences
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
              Contact
            </Link>
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-semibold text-white mb-4">Contact</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
            <span className="text-gray-400 text-sm">Abidjan, Côte d'Ivoire</span>
          </li>
          <li className="flex items-start gap-2">
            <Phone className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
            <a href="tel:+2250123456789" className="text-gray-400 hover:text-white transition-colors text-sm">
              +225 01 23 45 67 89
            </a>
          </li>
          <li className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
            <a href="mailto:contact@serviceslocaux.ci" className="text-gray-400 hover:text-white transition-colors text-sm">
              contact@serviceslocaux.ci
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm text-gray-400">
        © {currentYear} Services Locaux. Tous droits réservés.
      </p>
      <div className="flex gap-6">
        <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
          Mentions légales
        </a>
        <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
          Confidentialité
        </a>
      </div>
    </div>
  </div>
    </footer>
  );
}
