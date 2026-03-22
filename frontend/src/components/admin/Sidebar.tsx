import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  FaHome,
  FaBriefcase,
  FaBuilding,
  FaFileAlt,
  FaUsers,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaList,
  FaCog,
  FaStar,
  FaCalendar,
  FaChartLine,
  FaLayerGroup,
  FaImages,
  FaChevronDown,
  FaChevronRight,
  FaQrcode,
  FaLock,
  FaEnvelope,
  FaFileInvoiceDollar,
  FaUserTie,
  FaComments,
  FaClipboardList,
  FaShieldAlt,
} from "react-icons/fa";

interface SidebarProps {
  userRole: "ADMIN" | "SUPERADMIN";
}

interface MenuItem {
  name: string;
  icon: any;
  path: string;
  roles: string[];
}

interface MenuSection {
  title: string;
  icon: any;
  items: MenuItem[];
}

export function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const menuSections: MenuSection[] = [
    {
      title: "Tableau de bord",
      icon: FaChartLine,
      items: [
        {
          name: "Dashboard",
          icon: FaHome,
          path: "/admin/dashboard",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Utilisateurs",
          icon: FaUsers,
          path: "/admin/utilisateurs",
          roles: ["SUPERADMIN"],
        },
      ],
    },
    {
      title: "Personnel",
      icon: FaUserTie,
      items: [
        {
          name: "Employés",
          icon: FaUsers,
          path: "/admin/employes",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Scans",
          icon: FaQrcode,
          path: "/admin/scans",
          roles: ["ADMIN", "SUPERADMIN"],
        },
      ],
    },
    {
      title: "Clients",
      icon: FaUser,
      items: [
        {
          name: "Patients",
          icon: FaUser,
          path: "/admin/patients",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Messages contact",
          icon: FaComments,
          path: "/admin/contact-messages",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Avis clients",
          icon: FaStar,
          path: "/admin/avis",
          roles: ["ADMIN", "SUPERADMIN"],
        },
      ],
    },
    {
      title: "Facturation",
      icon: FaFileInvoiceDollar,
      items: [
        {
          name: "Devis",
          icon: FaCalendar,
          path: "/admin/devis",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Factures",
          icon: FaFileInvoiceDollar,
          path: "/admin/factures",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Formulaires de devis",
          icon: FaFileAlt,
          path: "/admin/formulaires-devis",
          roles: ["ADMIN", "SUPERADMIN"],
        },
      ],
    },
    {
      title: "Services",
      icon: FaBriefcase,
      items: [
        {
          name: "Catégories",
          icon: FaList,
          path: "/admin/categories",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Services",
          icon: FaBriefcase,
          path: "/admin/services",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Avantages",
          icon: FaStar,
          path: "/admin/avantages",
          roles: ["ADMIN", "SUPERADMIN"],
        },
      ],
    },
    {
      title: "Agences",
      icon: FaBuilding,
      items: [
        {
          name: "Agences",
          icon: FaBuilding,
          path: "/admin/agences",
          roles: ["ADMIN", "SUPERADMIN"],
        },
      ],
    },
    {
      title: "Contenu",
      icon: FaLayerGroup,
      items: [
        {
          name: "Page d'accueil",
          icon: FaHome,
          path: "/admin/hero",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Bannières",
          icon: FaImages,
          path: "/admin/bannieres",
          roles: ["ADMIN", "SUPERADMIN"],
        },
      ],
    },
    {
      title: "Paramètres",
      icon: FaCog,
      items: [
        {
          name: "Paramètres",
          icon: FaCog,
          path: "/admin/parametres",
          roles: ["ADMIN", "SUPERADMIN"],
        },
        {
          name: "Changer mot de passe",
          icon: FaLock,
          path: "/admin/change-password",
          roles: ["ADMIN", "SUPERADMIN"],
        },
      ],
    },
    {
      title: "Système",
      icon: FaClipboardList,
      items: [
        {
          name: "Journal d'activité",
          icon: FaClipboardList,
          path: "/admin/logs",
          roles: ["SUPERADMIN"],
        },
        {
          name: "Permissions",
          icon: FaShieldAlt,
          path: "/admin/permissions",
          roles: ["SUPERADMIN"],
        },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Filtrer les sections et items selon le rôle
  const filteredSections = menuSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(userRole)),
  })).filter((section) => section.items.length > 0);

  // Auto-expand section containing the active route
  useEffect(() => {
    const sectionsToExpand: Record<string, boolean> = {};
    menuSections.forEach((section) => {
      const sectionItems = section.items.filter((item) => item.roles.includes(userRole));
      const hasActiveItem = sectionItems.some((item) => location === item.path);
      if (hasActiveItem) {
        sectionsToExpand[section.title] = true;
      }
    });
    
    if (Object.keys(sectionsToExpand).length > 0) {
      setExpandedSections((prev) => ({
        ...prev,
        ...sectionsToExpand,
      }));
    }
  }, [location, userRole]);

  // Toggle section expansion
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="xl:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg"
      >
        {mobileOpen ? (
          <FaTimes className="w-6 h-6 text-gray-700" />
        ) : (
          <FaBars className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-200 ease-in-out xl:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b-2 border-gray-200 bg-white">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-site-primary via-site-secondary to-site-tertiary flex items-center justify-center shadow-lg">
                <FaHome className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900">Admin Panel</span>
                {/* Marque par défaut */}
                <span className="text-xs text-gray-500">EASE - DOM</span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="xl:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-3 pt-6 pb-4 space-y-4 overflow-y-auto">
            {filteredSections.map((section, sectionIndex) => {
              const SectionIcon = section.icon;
              const isExpanded = expandedSections[section.title] || false;
              
              return (
                <div key={sectionIndex} className="space-y-1">
                  {/* Section Header - Clickable */}
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-site-primary to-site-secondary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <SectionIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {section.title}
                      </span>
                    </div>
                    {isExpanded ? (
                      <FaChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    ) : (
                      <FaChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                  
                  {/* Section Items - Collapsible */}
                  {isExpanded && (
                    <div className="space-y-1 mt-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.path;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ml-2 ${
                              isActive
                                ? "bg-gradient-to-r from-site-primary to-site-secondary text-site-button-text shadow-lg shadow-site-primary/20"
                                : "text-gray-700 hover:bg-gray-100 hover:text-site-primary hover:shadow-md"
                            }`}
                          >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-600"}`} />
                            <span className={`font-medium text-sm ${isActive ? "text-white" : "text-gray-700"}`}>
                              {item.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t-2 border-gray-200 bg-white">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-site-primary hover:bg-site-primary/10 hover:shadow-md transition-all duration-200 font-medium"
            >
              <FaSignOutAlt className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

