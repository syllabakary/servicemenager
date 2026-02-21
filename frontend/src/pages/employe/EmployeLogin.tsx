import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaHome, FaLock, FaIdCard } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function EmployeLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Normaliser le matricule (trim et uppercase)
      const normalizedMatricule = matricule.trim().toUpperCase();
      
      // Log pour débogage
      console.log("Tentative de connexion avec:", {
        matricule: normalizedMatricule,
        apiUrl: API_URL,
        endpoint: `${API_URL}/login-matricule/`,
        hostname: window.location.hostname,
      });
      
      const response = await axios.post(`${API_URL}/login-matricule/`, {
        matricule: normalizedMatricule,
        password: password,
      }, {
        timeout: 10000, // 10 secondes de timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Réponse reçue:", response.data);

      if (response.data.tokens && response.data.user) {
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        queryClient.invalidateQueries();
        
        // Rediriger vers le dashboard employé
        setLocation("/employe/dashboard");
      } else {
        setError("Réponse invalide du serveur");
      }
    } catch (err: any) {
      console.error("Erreur de connexion complète:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: {
          url: err.config?.url,
          method: err.config?.method,
        },
      });
      
      let errorMessage = "Erreur de connexion";
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = "Timeout: Le serveur ne répond pas. Vérifiez votre connexion réseau.";
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = "Erreur réseau: Impossible de joindre le serveur. Vérifiez que le serveur est démarré et accessible.";
      } else if (err.response?.status === 404) {
        errorMessage = "Endpoint non trouvé. Vérifiez l'URL de l'API.";
      } else if (err.response?.status === 500) {
        errorMessage = "Erreur serveur. Contactez l'administrateur.";
      } else if (err.response?.data) {
        errorMessage = err.response.data.error || err.response.data.detail || "Matricule ou mot de passe incorrect";
      } else {
        errorMessage = err.message || "Erreur inconnue";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-site-section-employe-login-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-site-section-employe-login-button-border">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-site-section-employe-login-button rounded-full flex items-center justify-center">
            <FaIdCard className="w-8 h-8 text-site-button-text" />
          </div>
          <CardTitle className="text-3xl font-bold text-site-section-employe-login-text">
            Connexion Employé
          </CardTitle>
          <CardDescription className="text-base mt-2 text-site-section-employe-login-text/90">
            Connectez-vous avec votre matricule et mot de passe
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
              <Label htmlFor="matricule">Matricule</Label>
              <div className="relative">
                <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="matricule"
                  type="text"
                  placeholder="EMP001"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
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
              className="w-full bg-site-section-employe-login-button hover:opacity-90 text-site-button-text border-2 border-site-section-employe-login-button-border"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-sm text-gray-600 hover:text-site-primary"
              >
                <FaHome className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

