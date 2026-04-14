import { useLocation } from "wouter";
import { FaHome, FaQrcode, FaUsers, FaUser, FaSignOutAlt } from "react-icons/fa";

interface EmployeLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

const navItems = [
  { label: "Accueil",   icon: FaHome,   path: "/employe/dashboard" },
  { label: "Scanner",   icon: FaQrcode, path: "/employe/scan" },
  { label: "Patients",  icon: FaUsers,  path: "/employe/patients" },
  { label: "Profil",    icon: FaUser,   path: "/employe/profil" },
];

export function EmployeLayout({ children, user, onLogout }: EmployeLayoutProps) {
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-site-primary to-site-secondary flex items-center justify-center text-white font-bold text-sm shadow">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono leading-tight">
                    {user.matricule}
                  </p>
                </div>
              </>
            )}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-14 pb-20 max-w-2xl mx-auto w-full px-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || location.startsWith(item.path + "/");
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all duration-200 relative ${
                    isActive ? "text-site-primary" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-site-primary rounded-full" />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-site-primary/10" : ""}`}>
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-site-primary" : "text-gray-400"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
