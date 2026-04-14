import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaHome, FaLock, FaIdCard, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function EmployeLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"locked" | "warning" | "error" | "">("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockMinutes, setLockMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorType("");
    setRemainingAttempts(null);
    setLockMinutes(null);
    setLoading(true);

    try {
      const normalizedMatricule = matricule.trim().toUpperCase();
      const response = await axios.post(`${API_URL}/login-matricule/`, {
        matricule: normalizedMatricule,
        password,
      }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });

      if (response.data.tokens && response.data.user) {
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        queryClient.invalidateQueries();
        setLocation("/employe/dashboard");
      } else {
        setError("Réponse invalide du serveur");
        setErrorType("error");
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError("Le serveur ne répond pas. Vérifiez votre connexion réseau.");
        setErrorType("error");
      } else if (err.response?.status === 403) {
        const data = err.response.data;
        setErrorType("locked");
        setError(data?.error || "Compte temporairement bloqué. Contactez un administrateur.");
      } else if (err.response?.data) {
        const data = err.response.data;
        if (data?.error === "locked") {
          setErrorType("locked");
          setLockMinutes(data.lock_minutes);
          setError(data.message);
        } else if (data?.error === "invalid_credentials") {
          setErrorType("warning");
          setRemainingAttempts(data.remaining_attempts);
          setError(data.message);
        } else {
          setErrorType("error");
          setError(data.error || data.detail || "Matricule ou mot de passe incorrect");
        }
      } else {
        setErrorType("error");
        setError("Erreur de connexion. Vérifiez votre réseau.");
      }
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
            {error && errorType === "locked" && (
              <div className="p-4 text-sm bg-red-50 border-2 border-red-400 rounded-lg space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <FaLock className="w-4 h-4" />
                  Compte bloqué
                </div>
                <p className="text-red-600">{error}</p>
                {lockMinutes && (
                  <p className="text-red-500 text-xs">Contactez un administrateur pour débloquer votre compte.</p>
                )}
              </div>
            )}
            {error && errorType === "warning" && (
              <div className="p-4 text-sm bg-orange-50 border-2 border-orange-400 rounded-lg space-y-1">
                <div className="flex items-center gap-2 font-bold text-orange-700">
                  <FaExclamationTriangle className="w-4 h-4" />
                  Identifiants incorrects
                </div>
                <p className="text-orange-700">{error}</p>
                {remainingAttempts !== null && remainingAttempts <= 2 && (
                  <p className="text-orange-500 text-xs font-semibold">
                    ⚠️ Attention : encore {remainingAttempts} erreur(s) et votre compte sera suspendu.
                  </p>
                )}
              </div>
            )}
            {error && errorType === "error" && (
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

