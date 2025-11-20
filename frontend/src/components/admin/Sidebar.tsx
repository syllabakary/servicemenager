import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  FaHome,
  FaBriefcase,
  FaBuilding,
  FaFileAlt,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaList,
  FaCog,
} from "react-icons/fa";

interface SidebarProps {
  userRole: "ADMIN" | "SUPERADMIN";
}

export function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      icon: FaHome,
      path: "/admin/dashboard",
      roles: ["ADMIN", "SUPERADMIN"],
    },
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
      name: "Agences",
      icon: FaBuilding,
      path: "/admin/agences",
      roles: ["ADMIN", "SUPERADMIN"],
    },
    {
      name: "Bannières",
      icon: FaFileAlt,
      path: "/admin/bannieres",
      roles: ["ADMIN", "SUPERADMIN"],
    },
    {
      name: "Paramètres",
      icon: FaCog,
      path: "/admin/parametres",
      roles: ["ADMIN", "SUPERADMIN"],
    },
    {
      name: "Utilisateurs",
      icon: FaUsers,
      path: "/admin/utilisateurs",
      roles: ["SUPERADMIN"],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DC2626] via-[#B91C1C] to-[#991B1B] flex items-center justify-center shadow-lg">
                <FaHome className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900">Admin Panel</span>
                <span className="text-xs text-gray-500">Services Locaux</span>
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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-lg shadow-red-200/50"
                      : "text-gray-700 hover:bg-gray-100 hover:text-[#DC2626]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                  <span className={`font-medium ${isActive ? "text-white" : ""}`}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t-2 border-gray-200 bg-white">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#DC2626] hover:bg-red-50 hover:shadow-md transition-all duration-200 font-medium"
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

