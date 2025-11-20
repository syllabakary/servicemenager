import { Link } from "wouter";
import { FaHome, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-red-100 border-t border-red-200 overflow-x-hidden w-full max-w-full">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-md bg-[#DC2626] flex items-center justify-center">
            <FaHome className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Services Locaux</span>
        </div>
        <p className="text-gray-700 text-sm mb-4">
          Votre partenaire de confiance pour tous vos besoins de services à domicile.
        </p>
        <div className="flex gap-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
            aria-label="Facebook"
          >
            <FaFacebook className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
            aria-label="Twitter"
          >
            <FaTwitter className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
            aria-label="Instagram"
          >
            <FaInstagram className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
          </a>
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
        <ul className="space-y-2">
          <li>
            <Link href="/services" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              Ménage à domicile
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              Garde d'enfants
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              Jardinage
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              Tous les services
            </Link>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
        <ul className="space-y-2">
          <li>
            <Link href="/" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/agences" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              Nos agences
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              Contact
            </Link>
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <FaMapMarkerAlt className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
            <span className="text-gray-700 text-sm">Abidjan, Côte d'Ivoire</span>
          </li>
          <li className="flex items-start gap-2">
            <FaPhone className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
            <a href="tel:+2250123456789" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              +225 01 23 45 67 89
            </a>
          </li>
          <li className="flex items-start gap-2">
            <FaEnvelope className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
            <a href="mailto:contact@serviceslocaux.ci" className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              contact@serviceslocaux.ci
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-red-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm text-gray-700">
        © {currentYear} Services Locaux. Tous droits réservés.
      </p>
      <div className="flex gap-6">
        <a href="#" className="text-sm text-gray-700 hover:text-[#DC2626] transition-colors">
          Mentions légales
        </a>
        <a href="#" className="text-sm text-gray-700 hover:text-[#DC2626] transition-colors">
          Confidentialité
        </a>
      </div>
    </div>
  </div>
    </footer>
  );
}
