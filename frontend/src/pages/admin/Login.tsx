import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaHome, FaLock, FaUser } from "react-icons/fa";
import axios from "axios";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/token/`, {
        username,
        password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // Récupérer les infos de l'utilisateur
      let user;
      try {
        const userResponse = await axios.get(`${API_URL}/users/me/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        user = userResponse.data;
      } catch {
        // Si l'endpoint /me/ n'existe pas, utiliser /users/ avec filtre
        const usersResponse = await axios.get(`${API_URL}/users/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        // Trouver l'utilisateur actuel
        user = usersResponse.data.results?.find((u: any) => u.username === username) || usersResponse.data.results?.[0];
      }
      localStorage.setItem("user", JSON.stringify(user));

      // Rediriger selon le rôle
      if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
        setLocation("/admin/dashboard");
      } else {
        setError("Vous n'avez pas les droits d'accès à l'administration");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Nom d'utilisateur ou mot de passe incorrect"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#DC2626] to-black flex items-center justify-center">
              <FaLock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Connexion Admin
          </CardTitle>
          <CardDescription>
            Accédez à votre espace d'administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            <div className="text-center space-y-2">
              <Link href="/employe/login">
                <Button variant="ghost" className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full">
                  Connexion Employé
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="text-sm text-gray-600 hover:text-[#DC2626]">
                  <FaHome className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

