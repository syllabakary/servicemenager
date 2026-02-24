import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FaHome, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import { API_URL } from "@/config/api";

const currentYear = new Date().getFullYear();

export default function Footer() {
  // Récupérer les données du footer depuis l'API
  const { data: footerData } = useQuery({
    queryKey: ["footer_info"],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/pages/?key=footer_info&is_active=true`);
        const data = await response.json();
        return data.results?.[0] || null;
      } catch {
        return null;
      }
    },
  });

  // Parser les données JSON ou utiliser les valeurs par défaut
  let footerInfo = {
    address: "Abidjan, Côte d'Ivoire",
    phone: "+225 01 23 45 67 89",
    email: "contact@serviceslocaux.ci",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    description: "Votre partenaire de confiance pour tous vos besoins de services à domicile.",
    copyright: "EASE - DOM", // marque par défaut
  };

  if (footerData?.body) {
    try {
      footerInfo = { ...footerInfo, ...JSON.parse(footerData.body) };
    } catch {
      // Si ce n'est pas du JSON valide, utiliser les valeurs par défaut
    }
  }

  return (
    <footer className="bg-site-footer-bg border-t border-site-footer-border overflow-x-hidden w-full max-w-full">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-md bg-site-footer-link flex items-center justify-center">
            <FaHome className="w-5 h-5 text-site-button-text" />
          </div>
          <span className="text-xl font-semibold text-site-footer-text">{footerInfo.copyright}</span>
        </div>
        <p className="text-site-footer-text text-sm mb-4">
          {footerInfo.description}
        </p>
        <div className="flex gap-3">
          {footerInfo.facebook && (
          <a
              href={footerInfo.facebook}
            target="_blank"
            rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-site-footer-link transition-colors border border-site-footer-border"
            aria-label="Facebook"
          >
              <FaFacebook className="w-4 h-4 text-site-footer-link hover:text-white transition-colors" />
          </a>
          )}
          {footerInfo.twitter && (
          <a
              href={footerInfo.twitter}
            target="_blank"
            rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-site-footer-link transition-colors border border-site-footer-border"
            aria-label="Twitter"
          >
              <FaTwitter className="w-4 h-4 text-site-footer-link hover:text-white transition-colors" />
          </a>
          )}
          {footerInfo.instagram && (
          <a
              href={footerInfo.instagram}
            target="_blank"
            rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-site-footer-link transition-colors border border-site-footer-border"
            aria-label="Instagram"
          >
              <FaInstagram className="w-4 h-4 text-site-footer-link hover:text-white transition-colors" />
          </a>
          )}
          {footerInfo.linkedin && (
          <a
              href={footerInfo.linkedin}
            target="_blank"
            rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-site-footer-link transition-colors border border-site-footer-border"
            aria-label="LinkedIn"
          >
              <FaLinkedin className="w-4 h-4 text-site-footer-link hover:text-white transition-colors" />
          </a>
          )}
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="font-semibold text-site-footer-text mb-4">Services</h3>
        <ul className="space-y-2">
          <li>
            <Link href="/services" className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              Ménage à domicile
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              Garde d'enfants
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              Jardinage
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              Tous les services
            </Link>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div>
        <h3 className="font-semibold text-site-footer-text mb-4">Navigation</h3>
        <ul className="space-y-2">
          <li>
            <Link href="/" className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/agences" className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              Nos agences
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              Contact
            </Link>
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-semibold text-site-footer-text mb-4">Contact</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <FaMapMarkerAlt className="w-4 h-4 mt-0.5 text-site-footer-link flex-shrink-0" />
            <span className="text-site-footer-text text-sm">{footerInfo.address}</span>
          </li>
          <li className="flex items-start gap-2">
            <FaPhone className="w-4 h-4 mt-0.5 text-site-footer-link flex-shrink-0" />
            <a href={`tel:${footerInfo.phone.replace(/\s/g, "")}`} className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              {footerInfo.phone}
            </a>
          </li>
          <li className="flex items-start gap-2">
            <FaEnvelope className="w-4 h-4 mt-0.5 text-site-footer-link flex-shrink-0" />
            <a href={`mailto:${footerInfo.email}`} className="text-site-footer-text hover:text-site-footer-link-hover transition-colors text-sm">
              {footerInfo.email}
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-site-footer-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm text-site-footer-text">
        © {currentYear} {footerInfo.copyright}. Tous droits réservés.
      </p>
      <div className="flex gap-6">
        <a href="#" className="text-sm text-site-footer-text hover:text-site-footer-link-hover transition-colors">
          Mentions légales
        </a>
        <a href="#" className="text-sm text-site-footer-text hover:text-site-footer-link-hover transition-colors">
          Confidentialité
        </a>
      </div>
    </div>
  </div>
    </footer>
  );
}
