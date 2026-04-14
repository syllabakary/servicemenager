import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { FaLock, FaIdCard, FaEnvelope, FaPhone, FaSignOutAlt } from "react-icons/fa";
import { EmployeLayout } from "@/components/employe/EmployeLayout";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

export default function EmployeProfil() {
  const [, setLocation] = useLocation();
  useInactivityLogout(30 * 60 * 1000);
  const [user, setUser] = React.useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || storedUser.role !== "EMPLOYE") {
      setLocation("/employe/login");
      return;
    }
    setUser(storedUser);
  }, [setLocation]);

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    const access = localStorage.getItem("access_token");
    if (refresh && access) {
      try {
        await fetch("/api/logout/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
          body: JSON.stringify({ refresh }),
        });
      } catch {}
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setLocation("/employe/login");
  };

  if (!user) return null;

  return (
    <EmployeLayout user={user} onLogout={handleLogout}>
      <div className="space-y-5 py-5">

        {/* Avatar + nom */}
        <div className="bg-gradient-to-r from-site-primary to-site-secondary rounded-2xl p-6 text-white text-center shadow-lg">
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <h2 className="text-xl font-bold">{user.first_name} {user.last_name}</h2>
          <p className="text-white/70 text-sm mt-1">Employé</p>
        </div>

        {/* Infos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informations</span>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FaIdCard className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Matricule</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">{user.matricule || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FaEnvelope className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-semibold text-gray-900">{user.email || "—"}</p>
              </div>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FaPhone className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Téléphone</p>
                  <p className="text-sm font-semibold text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paramètres</span>
          </div>
          <div className="divide-y divide-gray-50">
            <button
              onClick={() => setLocation("/employe/change-password")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FaLock className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Changer mon mot de passe</p>
                <p className="text-xs text-gray-400">Modifier votre mot de passe de connexion</p>
              </div>
              <span className="text-gray-300">›</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <FaSignOutAlt className="w-3.5 h-3.5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600">Déconnexion</p>
                <p className="text-xs text-gray-400">Se déconnecter de l'application</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </EmployeLayout>
  );
}
