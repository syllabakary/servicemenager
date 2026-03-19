import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { FaPlus, FaEdit, FaTrash, FaQrcode, FaDownload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

import { API_URL } from "@/config/api";

export default function AdminPatients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [qrCodeModal, setQrCodeModal] = useState<{ open: boolean; patient: any | null }>({
    open: false,
    patient: null,
  });
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string | null>(null);
  // État contrôlé pour les champs qui ne sont pas dans FormData (Select/Switch Radix)
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formCivility, setFormCivility] = useState<string>("none");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = storedUser.role === "ADMIN" || storedUser.role === "SUPERADMIN";

  // Récupérer les employés pour l'assignation
  const { data: employeesData } = useQuery({
    queryKey: ["admin-employees"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/users/?role=EMPLOYE`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/patients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/patients/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patients"] });
      toast({
        title: "✅ Patient supprimé",
        description: "Le patient a été supprimé avec succès.",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error?.response?.data?.detail || "Impossible de supprimer le patient.",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      if (editingPatient) {
        await axios.patch(`${API_URL}/patients/${editingPatient.id}/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/patients/`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patients"] });
      setIsDialogOpen(false);
      setEditingPatient(null);
      toast({
        title: editingPatient ? "✅ Patient modifié" : "✅ Patient créé",
        description: editingPatient
          ? "Le patient a été modifié avec succès."
          : "Le patient a été créé avec succès. Le QR code sera généré automatiquement.",
      });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const data = error?.response?.data;
      let description = data?.detail || (typeof data === "object" && Object.keys(data || {}).length ? JSON.stringify(data) : "Une erreur s'est produite.");
      if (status === 401) {
        description = "Session expirée. Veuillez vous reconnecter.";
      } else if (status === 400 && data) {
        const msgs: string[] = [];
        if (typeof data === "object") {
          Object.entries(data).forEach(([k, v]) => {
            msgs.push(Array.isArray(v) ? `${k}: ${v.join(" ")}` : `${k}: ${v}`);
          });
        }
        if (msgs.length) description = msgs.join(" · ");
      }
      toast({
        title: "❌ Erreur",
        description,
        variant: "destructive",
      });
    },
  });

  const generateQrMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(`${API_URL}/patients/${id}/generate_qr_image/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Attendre un peu pour que le fichier soit bien sauvegardé
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-patients"] });
      }, 500);
      toast({
        title: "✅ QR Code généré",
        description: "L'image du QR code a été générée avec succès. Vous pouvez maintenant le voir et le télécharger.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error?.response?.data?.error || "Impossible de générer l'image QR code. Vérifiez que la bibliothèque qrcode est installée.",
        variant: "destructive",
      });
    },
  });

  const regenerateAllQrMutation = useMutation({
    mutationFn: async (force: boolean = false) => {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(`${API_URL}/patients/regenerate_all_qr_codes/`, { force }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-patients"] });
      toast({
        title: "✅ QR Codes régénérés",
        description: data.message || `${data.regenerated_count} QR code(s) régénéré(s) avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error?.response?.data?.error || "Impossible de régénérer les QR codes.",
        variant: "destructive",
      });
    },
  });

  const checkMissingQrMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/patients/check_missing_qr_files/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.missing_count > 0) {
        toast({
          title: "⚠️ Fichiers manquants détectés",
          description: `${data.missing_count} fichier(s) QR code manquant(s). Régénération en cours...`,
        });
        // Régénérer automatiquement les fichiers manquants
        regenerateAllQrMutation.mutate(false);
      } else {
        toast({
          title: "✅ Tous les fichiers sont présents",
          description: "Tous les QR codes sont correctement générés.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error?.response?.data?.error || "Impossible de vérifier les fichiers QR codes.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
    setFormIsActive(patient?.is_active !== false);
    setFormCivility(patient?.civility || "none");
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingPatient(null);
    setFormIsActive(true);
    setFormCivility("none");
    setIsDialogOpen(true);
  };

  const handleViewQR = async (patient: any) => {
    // Charger l'image QR code avec authentification
    try {
      const token = localStorage.getItem("access_token");
      const imageUrl = `${API_URL}/patients/${patient.id}/qr_code_image/`;
      
      const response = await axios.get(imageUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      // Créer un blob URL pour afficher l'image
      const blob = new Blob([response.data], { type: 'image/png' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      setQrCodeImageUrl(blobUrl);
      setQrCodeModal({ open: true, patient });
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error?.response?.data?.error || "Impossible de charger le QR code.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = async (patient: any) => {
    // Télécharger directement depuis l'endpoint qui génère le QR code à la volée
    await downloadQRFile(patient);
  };

  const downloadQRFile = async (patient: any) => {
    try {
      const token = localStorage.getItem("access_token");
      
      // Utiliser le nouvel endpoint qui retourne directement l'image
      const imageUrl = `${API_URL}/patients/${patient.id}/qr_code_image/`;
      
      const response = await axios.get(imageUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      // Vérifier si la réponse est une erreur JSON (au lieu d'une image)
      if (response.data.type === 'application/json') {
        const errorText = await response.data.text();
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Erreur lors de la génération du QR code');
      }

      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr_code_${patient.first_name}_${patient.last_name}_${patient.qr_code?.substring(0, 8) || 'qr'}.png`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Téléchargement réussi",
        description: "Le QR code a été téléchargé avec succès.",
      });
    } catch (error: any) {
      // Essayer d'extraire le message d'erreur de la réponse
      let errorMessage = "Impossible de télécharger le QR code.";
      
      if (error?.response) {
        if (error.response.data instanceof Blob) {
          // Si c'est un blob, essayer de le lire comme JSON
          try {
            const errorText = await error.response.data.text();
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = error.response.status === 500 
              ? "Erreur serveur. Vérifiez que la bibliothèque qrcode est installée (pip install qrcode[pil])."
              : errorMessage;
          }
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.status === 500) {
          errorMessage = "Erreur serveur. Vérifiez que la bibliothèque qrcode est installée (pip install qrcode[pil]).";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.error || "Le patient n'a pas de QR code ou de nom.";
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const assignedEmployees: number[] = [];
    const checkboxes = e.currentTarget.querySelectorAll<HTMLInputElement>('input[name="assigned_employees"]:checked');
    checkboxes.forEach((checkbox) => {
      const employeeId = parseInt(checkbox.value);
      if (!isNaN(employeeId)) assignedEmployees.push(employeeId);
    });
    const data: any = {
      civility: formCivility === "none" ? "" : formCivility,
      first_name: (formData.get("first_name") as string)?.trim() || "",
      last_name: (formData.get("last_name") as string)?.trim() || "",
      birth_date: (formData.get("birth_date") as string) || null,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      address: (formData.get("address") as string)?.trim() || null,
      is_active: formIsActive,
      assigned_employees: assignedEmployees,
    };
    saveMutation.mutate(data);
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Accès réservé aux administrateurs
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

  const patients = data?.results || [];
  const employees = employeesData?.results || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
                Gestion des Patients
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">
                Créez et gérez les patients avec leurs QR codes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleNew}
                className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Nouveau patient
              </Button>
              <Button
                onClick={() => checkMissingQrMutation.mutate()}
                disabled={checkMissingQrMutation.isPending}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                <FaQrcode className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {checkMissingQrMutation.isPending ? "Vérification..." : "Vérifier QR codes manquants"}
              </Button>
              <Button
                onClick={() => regenerateAllQrMutation.mutate(true)}
                disabled={regenerateAllQrMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                <FaQrcode className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {regenerateAllQrMutation.isPending ? "Régénération..." : "Régénérer tous les QR codes"}
              </Button>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Liste des patients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">Nom</TableHead>
                    <TableHead className="font-bold text-gray-900">Client</TableHead>
                    <TableHead className="font-bold text-gray-900">QR Code</TableHead>
                    <TableHead className="font-bold text-gray-900">Téléphone</TableHead>
                    <TableHead className="font-bold text-gray-900">État</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun patient enregistré
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient: any) => (
                      <TableRow key={patient.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-700">
                          {patient.first_name} {patient.last_name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {patient.client_username || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            <FaQrcode className="w-3 h-3 mr-1" />
                            {patient.qr_code ? patient.qr_code.substring(0, 12) + "..." : "Génération..."}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{patient.phone || "-"}</TableCell>
                        <TableCell>
                          {patient.is_active ? (
                            <Badge className="bg-green-100 text-green-800">
                              <FaCheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              <FaTimesCircle className="w-3 h-3 mr-1" />
                              Inactif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Toujours afficher les boutons QR code - l'endpoint génère à la volée */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewQR(patient)}
                              className="hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                              title="Voir QR Code"
                            >
                              <FaQrcode className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadQR(patient)}
                              className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                              title="Télécharger QR Code"
                            >
                              <FaDownload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(patient)}
                              className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            >
                              <FaEdit className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(patient.id)}
                              className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <FaTrash className="w-5 h-5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog pour créer/modifier un patient */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPatient ? "Modifier le patient" : "Nouveau patient"}
              </DialogTitle>
              <DialogDescription>
                {editingPatient
                  ? "Modifiez les informations du patient"
                  : "Remplissez les informations pour créer un nouveau patient. Le QR code sera généré automatiquement."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Civilité</Label>
                  <Select value={formCivility} onValueChange={setFormCivility}>
                    <SelectTrigger><SelectValue placeholder="Civilité" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non précisé</SelectItem>
                      <SelectItem value="M.">Monsieur</SelectItem>
                      <SelectItem value="Mme">Madame</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Date de naissance</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    defaultValue={editingPatient?.birth_date}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={editingPatient?.first_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={editingPatient?.last_name}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingPatient?.email}
                    placeholder="email@exemple.fr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingPatient?.phone}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={editingPatient?.address}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Employés assignés</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun employé disponible</p>
                  ) : (
                    employees.map((employee: any) => {
                      const isAssigned = editingPatient?.assigned_employees?.some(
                        (e: any) => (e.id || e) === employee.id
                      );
                      return (
                        <div key={employee.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`employee-${employee.id}`}
                            name="assigned_employees"
                            value={employee.id}
                            defaultChecked={isAssigned}
                            className="w-4 h-4 text-site-primary border-gray-300 rounded focus:ring-site-primary"
                          />
                          <label
                            htmlFor={`employee-${employee.id}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {employee.first_name} {employee.last_name} ({employee.matricule || employee.username})
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Cochez les employés qui seront assignés à ce patient
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Patient actif (le QR code peut être scanné)
                </Label>
              </div>
              {editingPatient?.qr_code && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>QR Code:</strong> {editingPatient.qr_code}
                  </p>
                  {editingPatient.qr_code_image_url && (
                    <div className="mt-2">
                      <img
                        src={editingPatient.qr_code_image_url}
                        alt="QR Code"
                        className="max-w-[200px]"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPatient(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-white"
                >
                  {saveMutation.isPending ? "Enregistrement..." : editingPatient ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal QR Code */}
        <Dialog open={qrCodeModal.open} onOpenChange={(open) => {
          if (!open) {
            // Nettoyer le blob URL quand on ferme le modal
            if (qrCodeImageUrl) {
              window.URL.revokeObjectURL(qrCodeImageUrl);
              setQrCodeImageUrl(null);
            }
            setQrCodeModal({ open: false, patient: null });
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code - {qrCodeModal.patient ? `${qrCodeModal.patient.first_name} ${qrCodeModal.patient.last_name}` : ''}</DialogTitle>
              <DialogDescription>
                Scannez ce QR code pour accéder aux informations du patient
              </DialogDescription>
            </DialogHeader>
            {qrCodeModal.patient && (
              <div className="flex flex-col items-center space-y-4 py-4">
                {/* Afficher le QR code depuis le blob URL */}
                {qrCodeImageUrl ? (
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-lg">
                    <img
                      src={qrCodeImageUrl}
                      alt={`QR Code - ${qrCodeModal.patient.first_name} ${qrCodeModal.patient.last_name}`}
                      className="w-full max-w-[300px] h-auto mx-auto block"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        toast({
                          title: "❌ Erreur",
                          description: "Impossible d'afficher le QR code.",
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-lg flex items-center justify-center" style={{ width: '300px', height: '300px' }}>
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Chargement du QR code...</p>
                    </div>
                  </div>
                )}
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {qrCodeModal.patient.first_name?.toUpperCase()} {qrCodeModal.patient.last_name?.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {qrCodeModal.patient.qr_code || 'QR Code en cours de génération...'}
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={() => handleDownloadQR(qrCodeModal.patient)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    <FaDownload className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setQrCodeModal({ open: false, patient: null })}
                    className="flex-1"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


