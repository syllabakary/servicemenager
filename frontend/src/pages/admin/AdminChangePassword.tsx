import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "@/config/api";

export default function AdminChangePassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || (storedUser.role !== "ADMIN" && storedUser.role !== "SUPERADMIN")) {
      setLocation("/gestion-ease/acces-prive");
      return;
    }
    setUser(storedUser);
  }, [setLocation]);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { old_password: string; new_password: string }) => {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${API_URL}/users/${user.id}/change_password/`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Mot de passe changé",
        description: "Votre mot de passe a été changé avec succès.",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || "Une erreur est survenue lors du changement de mot de passe.";
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: "❌ Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "❌ Erreur", description: "Les nouveaux mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "❌ Erreur", description: "Le nouveau mot de passe doit contenir au moins 8 caractères.", variant: "destructive" });
      return;
    }
    if (oldPassword === newPassword) {
      toast({ title: "❌ Erreur", description: "Le nouveau mot de passe doit être différent de l'ancien.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ old_password: oldPassword, new_password: newPassword });
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Changer mon mot de passe</h1>
          <p className="text-gray-600">Modifiez votre mot de passe de connexion à l'interface d'administration.</p>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-site-primary to-site-secondary text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2">
              <FaLock className="w-6 h-6" />
              Modification du mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="oldPassword" className="text-base font-semibold">Ancien mot de passe</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Entrez votre ancien mot de passe"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="text-lg h-12 pr-12"
                    required
                  />
                  <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showOldPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-base font-semibold">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nouveau mot de passe (min. 8 caractères)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-lg h-12 pr-12"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showNewPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base font-semibold">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmez le nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-lg h-12 pr-12"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showConfirmPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text h-12 text-base font-semibold"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Modification en cours...
                  </span>
                ) : (
                  <>
                    <FaCheckCircle className="w-5 h-5 mr-2" />
                    Changer le mot de passe
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Mot de passe oublié ?</strong> Seul un superadministrateur peut réinitialiser votre mot de passe. Le nouveau mot de passe vous sera envoyé par email (si votre adresse email est renseignée).
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
