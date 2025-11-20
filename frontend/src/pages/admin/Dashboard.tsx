import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FaBriefcase,
  FaBuilding,
  FaFileAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

export default function AdminDashboard() {
  const { data: services } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: agencies } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/agencies/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const { data: pages } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/pages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const stats = [
    {
      title: "Services",
      value: services?.count || 0,
      active: services?.results?.filter((s: any) => s.active).length || 0,
      icon: FaBriefcase,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Agences",
      value: agencies?.count || 0,
      active: agencies?.results?.filter((a: any) => a.active).length || 0,
      icon: FaBuilding,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Bannières",
      value: pages?.count || 0,
      active: pages?.results?.filter((p: any) => p.is_active).length || 0,
      icon: FaFileAlt,
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#DC2626] to-[#B91C1C] bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Vue d'ensemble de votre administration</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-xl border-0 bg-white hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-bl-full opacity-50"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold text-gray-900 mb-3">{stat.value}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FaCheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700 font-medium">{stat.active} actif(s)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaTimesCircle className="w-4 h-4 text-red-500" />
                      <span className="text-gray-700 font-medium">
                        {stat.value - stat.active} inactif(s)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-900">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/services"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaBriefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les services</h3>
                <p className="text-sm text-gray-600">Ajouter, modifier, activer</p>
              </Link>
              <Link
                href="/admin/agences"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaBuilding className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les agences</h3>
                <p className="text-sm text-gray-600">Ajouter, modifier, activer</p>
              </Link>
              <Link
                href="/admin/bannieres"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaFileAlt className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les bannières</h3>
                <p className="text-sm text-gray-600">Modifier le contenu</p>
              </Link>
              <Link
                href="/admin/utilisateurs"
                className="group p-6 rounded-xl border-2 border-gray-200 hover:border-[#DC2626] hover:bg-gradient-to-br hover:from-red-50 hover:to-white transition-all duration-300 block shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#DC2626] to-[#B91C1C] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FaUsers className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-[#DC2626] transition-colors">Gérer les utilisateurs</h3>
                <p className="text-sm text-gray-600">Créer des admins</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

