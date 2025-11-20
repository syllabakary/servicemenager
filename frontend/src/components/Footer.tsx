import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FaHome, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";

const currentYear = new Date().getFullYear();

export default function Footer() {
  // Récupérer les données du footer depuis l'API
  const { data: footerData } = useQuery({
    queryKey: ["footer_info"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:8000/api/pages/?key=footer_info&is_active=true");
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
    copyright: "Services Locaux",
  };

  if (footerData?.body) {
    try {
      footerInfo = { ...footerInfo, ...JSON.parse(footerData.body) };
    } catch {
      // Si ce n'est pas du JSON valide, utiliser les valeurs par défaut
    }
  }

  return (
    <footer className="bg-red-100 border-t border-red-200 overflow-x-hidden w-full max-w-full">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-md bg-[#DC2626] flex items-center justify-center">
            <FaHome className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">{footerInfo.copyright}</span>
        </div>
        <p className="text-gray-700 text-sm mb-4">
          {footerInfo.description}
        </p>
        <div className="flex gap-3">
          {footerInfo.facebook && (
            <a
              href={footerInfo.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
              aria-label="Facebook"
            >
              <FaFacebook className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
            </a>
          )}
          {footerInfo.twitter && (
            <a
              href={footerInfo.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
              aria-label="Twitter"
            >
              <FaTwitter className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
            </a>
          )}
          {footerInfo.instagram && (
            <a
              href={footerInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
              aria-label="Instagram"
            >
              <FaInstagram className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
            </a>
          )}
          {footerInfo.linkedin && (
            <a
              href={footerInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-md bg-white flex items-center justify-center hover:bg-[#DC2626] transition-colors border border-red-200"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-4 h-4 text-[#DC2626] hover:text-white transition-colors" />
            </a>
          )}
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
            <span className="text-gray-700 text-sm">{footerInfo.address}</span>
          </li>
          <li className="flex items-start gap-2">
            <FaPhone className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
            <a href={`tel:${footerInfo.phone.replace(/\s/g, '')}`} className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              {footerInfo.phone}
            </a>
          </li>
          <li className="flex items-start gap-2">
            <FaEnvelope className="w-4 h-4 mt-0.5 text-[#DC2626] flex-shrink-0" />
            <a href={`mailto:${footerInfo.email}`} className="text-gray-700 hover:text-[#DC2626] transition-colors text-sm">
              {footerInfo.email}
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-red-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm text-gray-700">
        © {currentYear} {footerInfo.copyright}. Tous droits réservés.
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
