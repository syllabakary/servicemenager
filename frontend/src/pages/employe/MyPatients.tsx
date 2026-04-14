import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import {
  FaUser, FaPhone, FaMapMarkerAlt, FaArrowRight, FaSpinner, FaSearch,
} from "react-icons/fa";
import { API_URL } from "@/config/api";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { EmployeLayout } from "@/components/employe/EmployeLayout";

export default function MyPatients() {
  const [, setLocation] = useLocation();
  const [user, setUser] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");
  useInactivityLogout(30 * 60 * 1000);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || storedUser.role !== "EMPLOYE") {
      setLocation("/employe/login");
      return;
    }
    setUser(storedUser);
  }, [setLocation]);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["my-assigned-patients"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/patients/my_assigned_patients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!user,
    retry: false,
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        setLocation("/employe/login");
      }
    },
  });

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="w-8 h-8 text-site-primary animate-spin" />
      </div>
    );
  }

  const filtered = (patients || []).filter((p: any) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <EmployeLayout user={user} onLogout={handleLogout}>
      <div className="space-y-4 py-5">

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mes Patients</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {patients?.length || 0} patient{patients?.length !== 1 ? "s" : ""} assigné{patients?.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-site-primary/30 focus:border-site-primary transition-all"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="w-7 h-7 text-site-primary animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((patient: any) => (
              <div
                key={patient.id}
                onClick={() => setLocation(`/employe/patient/${patient.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-site-primary/20 transition-all active:scale-[0.98]"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-site-primary to-site-secondary flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {patient.first_name?.[0]}{patient.last_name?.[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                      patient.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {patient.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  {patient.phone && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <FaPhone className="w-2.5 h-2.5" />{patient.phone}
                    </p>
                  )}
                  {patient.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                      <FaMapMarkerAlt className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{patient.address}</span>
                    </p>
                  )}
                </div>

                <FaArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FaUser className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              {search ? "Aucun résultat" : "Aucun patient assigné"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? "Essayez un autre terme" : "Contactez l'administrateur"}
            </p>
          </div>
        )}
      </div>
    </EmployeLayout>
  );
}
