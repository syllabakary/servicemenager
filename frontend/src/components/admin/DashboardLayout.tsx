import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import axios from "axios";
import { API_URL } from "@/config/api";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        setLocation("/gestion-ease/acces-prive");
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Vérifier que le token est toujours valide
        await axios.get(`${API_URL}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        // Token invalide, rediriger vers login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setLocation("/gestion-ease/acces-prive");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative">
      <Sidebar userRole={user.role} />
      <main className="xl:ml-64 min-h-screen pb-8 pt-6 sm:pt-8">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

