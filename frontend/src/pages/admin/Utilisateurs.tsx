import React, { useState, useEffect } from "react";
import { DeleteDialog } from "@/components/admin/DeleteDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FaPlus, FaEdit, FaTrash, FaKey, FaLockOpen, FaLock, FaUserLock, FaCopy, FaCheck, FaEnvelope, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminUtilisateurs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<any>(null);
  const [userToUnlock, setUserToUnlock] = useState<any>(null);
  const [resetResult, setResetResult] = useState<{ username: string; password: string; email?: string; email_sent?: boolean } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = storedUser.role === "SUPERADMIN";

  const unlockMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem("access_token");
      const res = await axios.post(
        `${API_URL}/users/${userId}/unlock/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data: any) => {
      toast({ title: "✅ Compte débloqué", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || "Erreur lors du déblocage.";
      toast({ title: "❌ Erreur", description: msg, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem("access_token");
      const res = await axios.post(
        `${API_URL}/users/${userId}/reset_password/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data: any) => {
      setUserToResetPassword(null);
      setCopiedPassword(false);
      setResetResult({
        username: data.username,
        password: data.new_password,
        email: data.email,
        email_sent: data.email_sent,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || "Erreur lors de la réinitialisation du mot de passe.";
      toast({ title: "❌ Erreur", description: msg, variant: "destructive" });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isSuperAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/users/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteUserId(null);
    },
  });

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Accès réservé aux super-administrateurs
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-site-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
                Gestion des Utilisateurs
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">Créez et gérez les comptes administrateurs</p>
            </div>
            <Button 
              onClick={handleNew} 
              className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-site-button-text shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-2xl font-bold text-gray-900">Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">Nom d'utilisateur</TableHead>
                    <TableHead className="font-bold text-gray-900">Email</TableHead>
                    <TableHead className="font-bold text-gray-900">Rôle</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.results?.map((user: any) => {
                    const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
                    return (
                        <TableRow key={user.id} className={`hover:bg-gray-50 transition-colors ${isLocked ? "bg-red-50" : ""}`}>
                          <TableCell className="font-semibold text-gray-900">
                            <div className="flex items-center gap-2">
                              {user.username}
                              {isLocked && (
                                <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded-full px-2 py-0.5 font-semibold">
                                  <FaLock className="w-3 h-3" /> Bloqué
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-700">{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={`${
                                user.role === "SUPERADMIN"
                                  ? "bg-purple-500 hover:bg-purple-600"
                                  : user.role === "ADMIN"
                                  ? "bg-blue-500 hover:bg-blue-600"
                                  : "bg-gray-500 hover:bg-gray-600"
                              } text-white font-semibold px-3 py-1 shadow-sm`}
                            >
                              {user.role === "SUPERADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Admin" : "Client"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                                className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                title="Modifier"
                              >
                                <FaEdit className="w-5 h-5" />
                              </Button>
                              {isLocked && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUserToUnlock(user)}
                                  className="hover:bg-green-50 hover:text-green-600 rounded-lg"
                                  title="Débloquer le compte"
                                  disabled={unlockMutation.isPending}
                                >
                                  <FaLockOpen className="w-5 h-5 text-green-600" />
                                </Button>
                              )}
                              {user.role !== "SUPERADMIN" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUserToResetPassword(user)}
                                    className="hover:bg-amber-50 hover:text-amber-600 rounded-lg"
                                    title="Réinitialiser le mot de passe"
                                    disabled={resetPasswordMutation.isPending}
                                  >
                                    <FaKey className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteUserId(user.id)}
                                    className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                                    title="Supprimer"
                                  >
                                    <FaTrash className="w-5 h-5 text-red-500" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <UserDialog
          user={editingUser}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          }}
        />

        <Dialog open={!!userToResetPassword} onOpenChange={(open) => !open && setUserToResetPassword(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl shadow-xl border-2 border-site-primary/20">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600">
                  <FaKey className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Réinitialiser le mot de passe</DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {userToResetPassword && (
                      <>
                        Compte : <strong className="text-gray-900">{userToResetPassword.username}</strong>
                        {userToResetPassword.role && (
                          <span className="ml-2">
                            (<span className="capitalize">{userToResetPassword.role.toLowerCase()}</span>)
                          </span>
                        )}
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              {userToResetPassword?.email ? (
                <p className="text-sm text-gray-700">
                  Un nouveau mot de passe sera généré et envoyé par email à{" "}
                  <strong className="text-gray-900">{userToResetPassword.email}</strong>. L&apos;utilisateur pourra se connecter avec son nom d&apos;utilisateur et ce mot de passe, puis le modifier s&apos;il le souhaite.
                </p>
              ) : (
                <p className="text-sm text-gray-700">
                  Aucune adresse email renseignée pour cet utilisateur. Un nouveau mot de passe sera généré mais ne pourra pas être envoyé par email. Vous devrez le communiquer manuellement. Pensez à renseigner l&apos;email dans la fiche utilisateur pour les prochaines réinitialisations.
                </p>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserToResetPassword(null)}
                className="rounded-lg"
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text rounded-lg"
                disabled={resetPasswordMutation.isPending}
                onClick={() => {
                  if (userToResetPassword) {
                    resetPasswordMutation.mutate(userToResetPassword.id);
                  }
                }}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FaKey className="w-4 h-4 mr-2" />
                    {userToResetPassword?.email ? "Réinitialiser et envoyer l'email" : "Générer un nouveau mot de passe"}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog déblocage compte */}
        <Dialog open={!!userToUnlock} onOpenChange={(open) => !open && setUserToUnlock(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl shadow-xl border-2 border-green-200">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
                  <FaUserLock className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-gray-900">Débloquer le compte</DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    {userToUnlock && (
                      <>Compte : <strong className="text-gray-900">{userToUnlock.username}</strong></>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <FaLock className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  Ce compte est actuellement <strong>bloqué</strong> suite à trop de tentatives de connexion échouées.
                </p>
              </div>
              <p className="text-sm text-gray-700">
                En débloquant ce compte, l'utilisateur pourra se reconnecter immédiatement. Le compteur de tentatives sera remis à zéro.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserToUnlock(null)}
                className="rounded-lg"
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                disabled={unlockMutation.isPending}
                onClick={() => {
                  if (userToUnlock) {
                    unlockMutation.mutate(userToUnlock.id);
                    setUserToUnlock(null);
                  }
                }}
              >
                {unlockMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                ) : (
                  <FaLockOpen className="w-4 h-4 mr-2" />
                )}
                Débloquer le compte
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog affichage mot de passe réinitialisé */}
        <Dialog open={!!resetResult} onOpenChange={(open) => { if (!open) setResetResult(null); }}>
          <DialogContent className="sm:max-w-md rounded-2xl shadow-xl border-2 border-blue-200">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
                  <FaKey className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-gray-900">Mot de passe réinitialisé</DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">
                    Compte : <strong>{resetResult?.username}</strong>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Statut email */}
              {resetResult?.email_sent ? (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FaEnvelope className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    Email envoyé automatiquement à <strong>{resetResult.email}</strong>
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <FaExclamationTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-700">
                    Email non envoyé (adresse non renseignée ou SMTP non configuré).<br />
                    <strong>Communiquez ce mot de passe manuellement.</strong>
                  </p>
                </div>
              )}

              {/* Mot de passe en clair */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Nouveau mot de passe :</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg font-mono text-lg font-bold text-gray-900 tracking-widest select-all">
                    {resetResult?.password}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`flex-shrink-0 transition-colors ${copiedPassword ? "border-green-500 text-green-600 bg-green-50" : ""}`}
                    onClick={() => {
                      navigator.clipboard.writeText(resetResult?.password || "");
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                  >
                    {copiedPassword ? <FaCheck className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Cliquez sur le mot de passe pour le sélectionner, ou utilisez le bouton copier.</p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  ⚠️ Ce mot de passe ne sera <strong>plus affiché</strong> après fermeture. Notez-le avant de fermer.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text rounded-lg"
                onClick={() => setResetResult(null)}
              >
                J'ai noté le mot de passe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <DeleteDialog
          open={deleteUserId !== null}
          onClose={() => setDeleteUserId(null)}
          onHardDelete={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
          isPending={deleteMutation.isPending}
          itemLabel="cet utilisateur"
        />
      </div>
    </DashboardLayout>
  );
}

function UserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "ADMIN",
    first_name: "",
    last_name: "",
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      const payload = { ...data };
      if (!payload.password && user) {
        delete payload.password;
      }
      if (user) {
        await axios.patch(`${API_URL}/users/${user.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/users/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        role: user.role || "ADMIN",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "ADMIN",
        first_name: "",
        last_name: "",
      });
    }
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.username && !user) {
      const base = `${(payload.first_name || "").toLowerCase()}${(payload.last_name || "").toLowerCase()}`.replace(/\s+/g, "");
      payload.username = base || `user${Date.now()}`;
    }
    saveMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Modifiez les informations de l'utilisateur"
              : "Remplissez les informations pour créer un nouvel utilisateur"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!user}
                placeholder="Laissez vide pour générer automatiquement"
              />
              {!user && <p className="text-xs text-gray-500">Généré automatiquement si vide (prénom + nom)</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">{user ? "Nouveau mot de passe" : "Mot de passe *"}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
                placeholder={user ? "Laisser vide pour ne pas changer" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-site-button-primary hover:bg-site-button-primary-hover text-site-button-text">
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

