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
import { FaPlus, FaEdit, FaTrash, FaUser, FaIdCard, FaChevronLeft, FaChevronRight, FaCheck, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBriefcase, FaFileAlt, FaStar, FaCog, FaEye } from "react-icons/fa";
import { useLocation } from "wouter";
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
import { motion, AnimatePresence } from "framer-motion";
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

import { API_URL } from "@/config/api";

export default function AdminEmployes() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingEmploye, setEditingEmploye] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = storedUser.role === "ADMIN" || storedUser.role === "SUPERADMIN";

  // État pour stocker toutes les données du formulaire
  const getInitialFormData = () => {
    const saved = localStorage.getItem("employee_form_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  };

  const [formData, setFormData] = useState<any>(() => {
    // Si on édite un employé, charger ses données
    if (editingEmploye) {
      return {
        username: editingEmploye.username || "",
        email: editingEmploye.email || "",
        first_name: editingEmploye.first_name || "",
        last_name: editingEmploye.last_name || "",
        phone: editingEmploye.phone || "",
        matricule: editingEmploye.matricule || "",
        password: "",
        sexe: editingEmploye.employee_profile?.sexe || "",
        date_naissance: editingEmploye.employee_profile?.date_naissance || "",
        nationalite: editingEmploye.employee_profile?.nationalite || "",
        email_professionnel: editingEmploye.employee_profile?.email_professionnel || "",
        email_personnel: editingEmploye.employee_profile?.email_personnel || "",
        telephone_principal: editingEmploye.employee_profile?.telephone_principal || editingEmploye.phone || "",
        telephone_secondaire: editingEmploye.employee_profile?.telephone_secondaire || "",
        adresse_numero_rue: editingEmploye.employee_profile?.adresse_numero_rue || "",
        adresse_ville: editingEmploye.employee_profile?.adresse_ville || "",
        adresse_code_postal: editingEmploye.employee_profile?.adresse_code_postal || "",
        adresse_pays: editingEmploye.employee_profile?.adresse_pays || "",
        statut_compte: editingEmploye.employee_profile?.statut_compte || "ACTIF",
        poste_fonction: editingEmploye.employee_profile?.poste_fonction || "",
        service_departement: editingEmploye.employee_profile?.service_departement || "",
        type_contrat: editingEmploye.employee_profile?.type_contrat || "",
        date_debut_contrat: editingEmploye.employee_profile?.date_debut_contrat || "",
        date_fin_contrat: editingEmploye.employee_profile?.date_fin_contrat || "",
        temps_travail: editingEmploye.employee_profile?.temps_travail || "",
        taux_horaire: editingEmploye.employee_profile?.taux_horaire || "",
        salaire: editingEmploye.employee_profile?.salaire || "",
        mode_paiement: editingEmploye.employee_profile?.mode_paiement || "",
        numero_securite_sociale: editingEmploye.employee_profile?.numero_securite_sociale || "",
        numero_employe_interne: editingEmploye.employee_profile?.numero_employe_interne || "",
        statut_documents: editingEmploye.employee_profile?.statut_documents || "EN_ATTENTE",
      };
    }
    return getInitialFormData();
  });

  // Sauvegarder dans localStorage à chaque changement (seulement pour création, pas pour édition)
  React.useEffect(() => {
    if (!editingEmploye && Object.keys(formData).length > 0) {
      localStorage.setItem("employee_form_data", JSON.stringify(formData));
    } else if (editingEmploye) {
      // Ne pas sauvegarder dans localStorage si on édite
      localStorage.removeItem("employee_form_data");
    }
  }, [formData, editingEmploye]);

  // Fonction pour mettre à jour un champ
  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-employes"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_URL}/users/?role=EMPLOYE`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Récupérer les profils employés pour chaque utilisateur
      const users = res.data.results || [];
      const usersWithProfiles = await Promise.all(
        users.map(async (user: any) => {
          try {
            const profileRes = await axios.get(`${API_URL}/employee-profiles/?user=${user.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const profile = profileRes.data.results?.[0];
            return { ...user, employee_profile: profile };
          } catch {
            return { ...user, employee_profile: null };
          }
        })
      );
      return { ...res.data, results: usersWithProfiles };
    },
    enabled: isAdmin,
  });

  // Détecter le paramètre 'edit' dans l'URL et ouvrir le formulaire d'édition
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId && data?.results) {
      const employeToEdit = data.results.find((e: any) => e.id === parseInt(editId));
      if (employeToEdit) {
        handleEdit(employeToEdit);
        // Nettoyer l'URL en retirant le paramètre edit
        params.delete("edit");
        const newUrl = params.toString() 
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [data]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-employes"] });
      toast({
        title: "✅ Employé supprimé",
        description: "L'employé a été supprimé avec succès.",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "❌ Erreur",
        description: error?.response?.data?.detail || "Impossible de supprimer l'employé.",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("access_token");
      
      // Séparer les données utilisateur et profil employé
      const userData: any = {
        username: data.username?.trim() || '',
        email: data.email?.trim() || '',
        first_name: data.first_name?.trim() || '',
        last_name: data.last_name?.trim() || '',
      };
      
      // Ajouter le matricule (obligatoire pour les employés)
      if (data.matricule && data.matricule.trim()) {
        // Normaliser le matricule (trim et uppercase)
        userData.matricule = data.matricule.trim().toUpperCase();
      } else if (!editingEmploye) {
        throw new Error("Le matricule est requis pour créer un nouvel employé.");
      }
      
      // Ajouter phone seulement s'il n'est pas vide
      if (data.phone && data.phone.trim()) {
        userData.phone = data.phone.trim();
      }
      
      // Le mot de passe est requis pour la création (mais seulement si on est en train de créer)
      if (!editingEmploye) {
        // Pour la création, vérifier que le mot de passe n'est pas vide après trim
        const passwordValue = data.password?.trim() || "";
        if (!passwordValue) {
          throw new Error("Le mot de passe est requis pour créer un nouvel employé.");
        }
        userData.password = passwordValue;
      } else {
        // Pour la modification, le mot de passe est optionnel
        if (data.password && data.password.trim()) {
          userData.password = data.password.trim();
        }
      }
      
      // Fonction helper pour nettoyer les valeurs
      const cleanValue = (value: any): any => {
        if (value === '' || value === null || value === undefined) {
          return null;
        }
        if (typeof value === 'string') {
          const trimmed = value.trim();
          return trimmed === '' ? null : trimmed;
        }
        return value;
      };
      
      const profileData: any = {
        sexe: cleanValue(data.sexe),
        date_naissance: cleanValue(data.date_naissance) || null,
        nationalite: cleanValue(data.nationalite),
        email_professionnel: cleanValue(data.email_professionnel),
        email_personnel: cleanValue(data.email_personnel),
        telephone_principal: cleanValue(data.telephone_principal),
        telephone_secondaire: cleanValue(data.telephone_secondaire),
        adresse_numero_rue: cleanValue(data.adresse_numero_rue),
        adresse_ville: cleanValue(data.adresse_ville),
        adresse_code_postal: cleanValue(data.adresse_code_postal),
        adresse_pays: cleanValue(data.adresse_pays),
        statut_compte: cleanValue(data.statut_compte) || 'ACTIF',
        poste_fonction: cleanValue(data.poste_fonction),
        service_departement: cleanValue(data.service_departement),
        type_contrat: cleanValue(data.type_contrat),
        date_debut_contrat: cleanValue(data.date_debut_contrat) || null,
        date_fin_contrat: cleanValue(data.date_fin_contrat) || null,
        temps_travail: cleanValue(data.temps_travail),
        taux_horaire: data.taux_horaire && data.taux_horaire !== '' ? parseFloat(data.taux_horaire) : null,
        salaire: data.salaire && data.salaire !== '' ? parseFloat(data.salaire) : null,
        mode_paiement: cleanValue(data.mode_paiement),
        numero_securite_sociale: cleanValue(data.numero_securite_sociale),
        numero_employe_interne: cleanValue(data.numero_employe_interne),
        statut_documents: cleanValue(data.statut_documents) || 'EN_ATTENTE',
      };
      
      if (editingEmploye) {
        // Mise à jour
        if (!userData.password) {
          delete userData.password;
        }
        const userResponse = await axios.patch(`${API_URL}/users/${editingEmploye.id}/`, userData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Mettre à jour ou créer le profil employé
        try {
          const profileResponse = await axios.get(`${API_URL}/employee-profiles/?user=${editingEmploye.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const existingProfile = profileResponse.data.results?.[0];
          
          if (existingProfile) {
            // Mise à jour du profil existant
            profileData.user = editingEmploye.id;
            await axios.patch(`${API_URL}/employee-profiles/${existingProfile.id}/`, profileData, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } else {
            // Créer un nouveau profil
            profileData.user = editingEmploye.id;
            await axios.post(`${API_URL}/employee-profiles/`, profileData, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch (error: any) {
          // Si le profil n'existe pas, le créer
          if (error?.response?.status === 404 || error?.response?.status === 400) {
            profileData.user = editingEmploye.id;
            await axios.post(`${API_URL}/employee-profiles/`, profileData, {
              headers: { Authorization: `Bearer ${token}` },
            });
          } else {
            throw error;
          }
        }
      } else {
        // Création
        const userPayload = { ...userData, role: "EMPLOYE" };
        // Nettoyer les valeurs vides
        Object.keys(userPayload).forEach(key => {
          if (userPayload[key] === '' || userPayload[key] === null) {
            if (key !== 'password' && key !== 'phone') {
              delete userPayload[key];
            }
          }
        });
        
        try {
          const userResponse = await axios.post(`${API_URL}/users/`, userPayload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // S'assurer que newUserId est un nombre, pas un tableau
          let newUserId = userResponse.data?.id || userResponse.data?.user?.id;
          
          // Si c'est un tableau, prendre le premier élément
          if (Array.isArray(newUserId)) {
            newUserId = newUserId[0];
          }
          
          // Convertir en nombre
          newUserId = Number(newUserId);
          
          if (!newUserId || isNaN(newUserId)) {
            console.error("Réponse de création utilisateur:", userResponse.data);
            throw new Error("Impossible de récupérer l'ID de l'utilisateur créé.");
          }
          
          // Créer le profil employé
          // Nettoyer les valeurs vides du profil
          const cleanProfileData: any = {};
          Object.keys(profileData).forEach(key => {
            // Ne pas inclure le champ 'user' s'il existe déjà dans profileData
            if (key === 'user') return;
            if (profileData[key] !== '' && profileData[key] !== null && profileData[key] !== undefined) {
              cleanProfileData[key] = profileData[key];
            }
          });
          // S'assurer que user est un ID numérique (pas un tableau)
          // Vérifier une dernière fois que ce n'est pas un tableau
          if (Array.isArray(newUserId)) {
            console.error("ERREUR: newUserId est un tableau!", newUserId);
            newUserId = newUserId[0];
          }
          cleanProfileData.user = Number(newUserId);
          
          // Vérifier que user est bien un nombre
          if (isNaN(cleanProfileData.user)) {
            console.error("ERREUR: user n'est pas un nombre!", cleanProfileData.user);
            throw new Error("L'ID utilisateur n'est pas valide.");
          }
          
          console.log("Données du profil à envoyer:", cleanProfileData);
          console.log("Type de user:", typeof cleanProfileData.user, "Valeur:", cleanProfileData.user);
          
          // Vérifier si un profil existe déjà pour cet utilisateur
          try {
            const existingProfileRes = await axios.get(`${API_URL}/employee-profiles/?user=${cleanProfileData.user}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const existingProfile = existingProfileRes.data.results?.[0];
            
            if (existingProfile) {
              // Mettre à jour le profil existant
              await axios.patch(`${API_URL}/employee-profiles/${existingProfile.id}/`, cleanProfileData, {
                headers: { Authorization: `Bearer ${token}` },
              });
            } else {
              // Créer un nouveau profil
              await axios.post(`${API_URL}/employee-profiles/`, cleanProfileData, {
                headers: { Authorization: `Bearer ${token}` },
              });
            }
          } catch (profileError: any) {
            // Si l'erreur est 404, essayer de créer
            if (profileError?.response?.status === 404) {
              await axios.post(`${API_URL}/employee-profiles/`, cleanProfileData, {
                headers: { Authorization: `Bearer ${token}` },
              });
            } else {
              throw profileError;
            }
          }
        } catch (error: any) {
          // Afficher l'erreur détaillée
          console.error("Erreur détaillée:", error.response?.data);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-employes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-employee-profiles"] });
      setIsDialogOpen(false);
      setEditingEmploye(null);
      setCurrentStep(1);
      // Nettoyer le localStorage après succès
      localStorage.removeItem("employee_form_data");
      setFormData({});
      toast({
        title: editingEmploye ? "✅ Employé modifié" : "✅ Employé créé",
        description: editingEmploye
          ? "L'employé et son profil ont été modifiés avec succès."
          : "L'employé a été créé avec succès.",
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors de la sauvegarde:", error);
      const errorData = error?.response?.data;
      let errorMessage = "Une erreur s'est produite.";
      
      if (errorData) {
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object') {
          // Afficher toutes les erreurs de validation
          const errors = Object.entries(errorData)
            .map(([key, value]: [string, any]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join('\n');
          errorMessage = errors || JSON.stringify(errorData);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (employe: any) => {
    setEditingEmploye(employe);
    setCurrentStep(1);
    // Charger les données de l'employé dans le formData pour l'édition
    setFormData({
      username: employe.username || "",
      email: employe.email || "",
      first_name: employe.first_name || "",
      last_name: employe.last_name || "",
      phone: employe.phone || "",
      password: "", // Ne jamais pré-remplir le mot de passe
      sexe: employe.employee_profile?.sexe || "",
      date_naissance: employe.employee_profile?.date_naissance || "",
      nationalite: employe.employee_profile?.nationalite || "",
      email_professionnel: employe.employee_profile?.email_professionnel || "",
      email_personnel: employe.employee_profile?.email_personnel || "",
      telephone_principal: employe.employee_profile?.telephone_principal || employe.phone || "",
      telephone_secondaire: employe.employee_profile?.telephone_secondaire || "",
      adresse_numero_rue: employe.employee_profile?.adresse_numero_rue || "",
      adresse_ville: employe.employee_profile?.adresse_ville || "",
      adresse_code_postal: employe.employee_profile?.adresse_code_postal || "",
      adresse_pays: employe.employee_profile?.adresse_pays || "",
      statut_compte: employe.employee_profile?.statut_compte || "ACTIF",
      poste_fonction: employe.employee_profile?.poste_fonction || "",
      service_departement: employe.employee_profile?.service_departement || "",
      type_contrat: employe.employee_profile?.type_contrat || "",
      date_debut_contrat: employe.employee_profile?.date_debut_contrat || "",
      date_fin_contrat: employe.employee_profile?.date_fin_contrat || "",
      temps_travail: employe.employee_profile?.temps_travail || "",
      taux_horaire: employe.employee_profile?.taux_horaire || "",
      salaire: employe.employee_profile?.salaire || "",
      mode_paiement: employe.employee_profile?.mode_paiement || "",
      numero_securite_sociale: employe.employee_profile?.numero_securite_sociale || "",
      numero_employe_interne: employe.employee_profile?.numero_employe_interne || "",
      statut_documents: employe.employee_profile?.statut_documents || "EN_ATTENTE",
    });
    setIsDialogOpen(true);
  };

  // Détecter le paramètre 'edit' dans l'URL et ouvrir le formulaire d'édition
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId && data?.results) {
      const employeToEdit = data.results.find((e: any) => e.id === parseInt(editId));
      if (employeToEdit && !isDialogOpen) {
        handleEdit(employeToEdit);
        // Nettoyer l'URL en retirant le paramètre edit
        params.delete("edit");
        const newUrl = params.toString() 
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [data, isDialogOpen]);
  
  const nextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validation stricte à l'étape 1
    if (currentStep === 1) {
      const missing: string[] = [];
      if (!formData.first_name?.trim()) missing.push("Prénom");
      if (!formData.last_name?.trim()) missing.push("Nom");
      if (!formData.email?.trim()) missing.push("Email");
      if (!formData.matricule?.trim()) missing.push("Matricule");
      if (!editingEmploye && !formData.password?.trim()) missing.push("Mot de passe");
      if (missing.length > 0) {
        toast({
          title: "❌ Champs obligatoires manquants",
          description: `Veuillez renseigner : ${missing.join(", ")}.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNew = () => {
    setEditingEmploye(null);
    // Vider complètement le formulaire et le localStorage pour un nouvel employé
    localStorage.removeItem("employee_form_data");
    setFormData({});
    setCurrentStep(1);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation des champs requis à la soumission finale
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.matricule) {
      toast({
        title: "❌ Champs requis manquants",
        description: "Veuillez remplir tous les champs obligatoires (Email, Prénom, Nom, Matricule).",
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }
    
    // Vérifier le mot de passe seulement si on crée un nouvel employé
    if (!editingEmploye && (!formData.password || !formData.password.trim())) {
      toast({
        title: "❌ Mot de passe requis",
        description: "Le mot de passe est requis pour créer un nouvel employé.",
        variant: "destructive",
      });
      setCurrentStep(1); // Retourner à l'étape 1 pour voir l'erreur
      return;
    }
    
    // Utiliser les données de l'état formData au lieu de FormData
    saveMutation.mutate(formData);
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

  const employes = data?.results || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
                Gestion des Employés
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">
                Créez et gérez les comptes employés
              </p>
            </div>
            <Button
              onClick={handleNew}
              className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Nouvel employé
            </Button>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Liste des employés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold text-gray-900">Nom</TableHead>
                    <TableHead className="font-bold text-gray-900">Email</TableHead>
                    <TableHead className="font-bold text-gray-900">Matricule</TableHead>
                    <TableHead className="font-bold text-gray-900">Téléphone</TableHead>
                    <TableHead className="font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Aucun employé enregistré
                      </TableCell>
                    </TableRow>
                  ) : (
                    employes.map((employe: any) => (
                      <TableRow key={employe.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-700">
                          {employe.first_name} {employe.last_name}
                        </TableCell>
                        <TableCell className="text-gray-600">{employe.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            <FaIdCard className="w-3 h-3 mr-1" />
                            {employe.matricule || "Génération..."}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{employe.phone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/admin/employe-detail?id=${employe.id}`)}
                              className="hover:bg-green-50 hover:text-green-600 rounded-lg"
                              title="Voir la fiche"
                            >
                              <FaEye className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employe)}
                              className="hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                              title="Modifier"
                            >
                              <FaEdit className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(employe.id)}
                              className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                              title="Supprimer"
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

        {/* Dialog pour créer/modifier un employé */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setCurrentStep(1);
            // Vider le formulaire et localStorage seulement si on n'édite pas
            if (!editingEmploye) {
              localStorage.removeItem("employee_form_data");
              setFormData({});
            }
            setEditingEmploye(null);
          }
        }}>
          <DialogContent className="max-w-[98vw] w-full max-h-[98vh] h-full overflow-hidden flex flex-col p-0 m-0 rounded-lg">
            <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-site-primary to-site-secondary text-white flex-shrink-0">
              <DialogTitle className="text-3xl font-bold">
                {editingEmploye ? "Modifier l'employé" : "Nouvel employé"}
              </DialogTitle>
              <DialogDescription className="text-white/90 mt-2 text-base">
                {editingEmploye
                  ? "Modifiez les informations de l'employé (tous les champs sont optionnels sauf ceux marqués *)"
                  : "Remplissez les informations pour créer un nouvel employé (tous les champs sont optionnels sauf ceux marqués *)"}
              </DialogDescription>
            </DialogHeader>
            
            {/* Indicateur de progression */}
            <div className="px-6 pt-4 pb-4 bg-gray-50 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                          currentStep >= step
                            ? "bg-gradient-to-r from-site-primary to-site-secondary text-white shadow-lg"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {currentStep > step ? (
                          <FaCheck className="w-5 h-5" />
                        ) : (
                          step
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 font-medium ${
                          currentStep >= step ? "text-site-primary" : "text-gray-500"
                        }`}
                      >
                        {step === 1 && "Identité"}
                        {step === 2 && "Coordonnées"}
                        {step === 3 && "Sécurité"}
                        {step === 4 && "Professionnel"}
                        {step === 5 && "Documents"}
                      </span>
                    </div>
                    {step < 5 && (
                      <div
                        className={`h-1 flex-1 mx-2 transition-all ${
                          currentStep > step ? "bg-site-primary" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Contenu du formulaire avec animation */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Étape 1: Identité */}
                    {currentStep === 1 && (
                      <div className="space-y-6 max-w-6xl mx-auto">
                        <div className="bg-white p-8 rounded-xl border-2 border-blue-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaUser className="w-7 h-7 text-site-primary" />
                            Informations de base
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="username">Nom d'utilisateur *</Label>
                              <Input
                                id="username"
                                name="username"
                                value={formData.username || ""}
                                onChange={(e) => updateField("username", e.target.value)}
                                required
                                disabled={!!editingEmploye}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email || ""}
                                onChange={(e) => updateField("email", e.target.value)}
                                required
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="first_name">Prénom *</Label>
                              <Input
                                id="first_name"
                                name="first_name"
                                value={formData.first_name || ""}
                                onChange={(e) => updateField("first_name", e.target.value)}
                                required
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="last_name">Nom *</Label>
                              <Input
                                id="last_name"
                                name="last_name"
                                value={formData.last_name || ""}
                                onChange={(e) => updateField("last_name", e.target.value)}
                                required
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="matricule">Matricule *</Label>
                              <Input
                                id="matricule"
                                name="matricule"
                                value={formData.matricule || ""}
                                onChange={(e) => updateField("matricule", e.target.value)}
                                required
                                placeholder="Ex: EMP001"
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                              <p className="text-xs text-gray-500">Le matricule doit être unique et sera utilisé pour la connexion</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="password">
                                {editingEmploye ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}
                              </Label>
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              value={formData.password || ""}
                              onChange={(e) => updateField("password", e.target.value)}
                              required={!editingEmploye}
                              className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                            />
                            </div>
                          </div>
                          {editingEmploye?.matricule && (
                            <div className="mt-4 p-3 bg-white border border-blue-300 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>Matricule:</strong> {editingEmploye.matricule}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaUser className="w-7 h-7 text-site-primary" />
                            Informations personnelles
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="sexe">Sexe</Label>
                              <Select 
                                name="sexe" 
                                value={formData.sexe || ""}
                                onValueChange={(value) => updateField("sexe", value)}
                              >
                                <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Masculin</SelectItem>
                                  <SelectItem value="F">Féminin</SelectItem>
                                  <SelectItem value="A">Autre</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="date_naissance">Date de naissance</Label>
                              <Input
                                id="date_naissance"
                                name="date_naissance"
                                type="date"
                                value={formData.date_naissance || ""}
                                onChange={(e) => updateField("date_naissance", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                          <div className="space-y-2 mt-4">
                            <Label htmlFor="nationalite">Nationalité</Label>
                            <Input
                              id="nationalite"
                              name="nationalite"
                              value={formData.nationalite || ""}
                              onChange={(e) => updateField("nationalite", e.target.value)}
                              placeholder="Ex: Française, Ivoirienne..."
                              className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Étape 2: Coordonnées */}
                    {currentStep === 2 && (
                      <div className="space-y-6 max-w-6xl mx-auto">
                        <div className="bg-white p-8 rounded-xl border-2 border-green-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaEnvelope className="w-7 h-7 text-site-primary" />
                            Emails
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="email_professionnel">Email professionnel</Label>
                              <Input
                                id="email_professionnel"
                                name="email_professionnel"
                                type="email"
                                value={formData.email_professionnel || ""}
                                onChange={(e) => updateField("email_professionnel", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email_personnel">Email personnel</Label>
                              <Input
                                id="email_personnel"
                                name="email_personnel"
                                type="email"
                                value={formData.email_personnel || ""}
                                onChange={(e) => updateField("email_personnel", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-xl border-2 border-blue-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaPhone className="w-7 h-7 text-site-primary" />
                            Téléphones
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="telephone_principal">Téléphone principal</Label>
                              <Input
                                id="telephone_principal"
                                name="telephone_principal"
                                type="tel"
                                value={formData.telephone_principal || ""}
                                onChange={(e) => updateField("telephone_principal", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="telephone_secondaire">Téléphone secondaire</Label>
                              <Input
                                id="telephone_secondaire"
                                name="telephone_secondaire"
                                type="tel"
                                value={formData.telephone_secondaire || ""}
                                onChange={(e) => updateField("telephone_secondaire", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-xl border-2 border-purple-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaMapMarkerAlt className="w-7 h-7 text-site-primary" />
                            Adresse
                          </h3>
                          <div className="space-y-2">
                            <Label htmlFor="adresse_numero_rue">Numéro et rue</Label>
                            <Input
                              id="adresse_numero_rue"
                              name="adresse_numero_rue"
                              value={formData.adresse_numero_rue || ""}
                              onChange={(e) => updateField("adresse_numero_rue", e.target.value)}
                              placeholder="Ex: 123 Rue de la République"
                              className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="adresse_code_postal">Code postal</Label>
                              <Input
                                id="adresse_code_postal"
                                name="adresse_code_postal"
                                value={formData.adresse_code_postal || ""}
                                onChange={(e) => updateField("adresse_code_postal", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="adresse_ville">Ville</Label>
                              <Input
                                id="adresse_ville"
                                name="adresse_ville"
                                value={formData.adresse_ville || ""}
                                onChange={(e) => updateField("adresse_ville", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="adresse_pays">Pays</Label>
                              <Input
                                id="adresse_pays"
                                name="adresse_pays"
                                value={formData.adresse_pays || ""}
                                onChange={(e) => updateField("adresse_pays", e.target.value)}
                                placeholder="Ex: Côte d'Ivoire"
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Étape 3: Sécurité */}
                    {currentStep === 3 && (
                      <div className="space-y-6 max-w-6xl mx-auto">
                        <div className="bg-white p-8 rounded-xl border-2 border-red-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaCog className="w-7 h-7 text-site-primary" />
                            Statut du compte
                          </h3>
                          <div className="space-y-2">
                            <Label htmlFor="statut_compte">Statut</Label>
                            <Select 
                              name="statut_compte" 
                              value={formData.statut_compte || "ACTIF"}
                              onValueChange={(value) => updateField("statut_compte", value)}
                            >
                              <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ACTIF">Actif</SelectItem>
                                <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                                <SelectItem value="SUPPRIME">Supprimé</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Étape 4: Professionnel */}
                    {currentStep === 4 && (
                      <div className="space-y-6 max-w-6xl mx-auto">
                        <div className="bg-white p-8 rounded-xl border-2 border-indigo-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaBriefcase className="w-7 h-7 text-site-primary" />
                            Poste et service
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="poste_fonction">Poste / Fonction</Label>
                              <Input
                                id="poste_fonction"
                                name="poste_fonction"
                                value={formData.poste_fonction || ""}
                                onChange={(e) => updateField("poste_fonction", e.target.value)}
                                placeholder="Ex: Aide à domicile, Infirmier..."
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="service_departement">Service / Département</Label>
                              <Input
                                id="service_departement"
                                name="service_departement"
                                value={formData.service_departement || ""}
                                onChange={(e) => updateField("service_departement", e.target.value)}
                                placeholder="Ex: Soins à domicile, Ménage..."
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-xl border-2 border-yellow-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaFileAlt className="w-7 h-7 text-site-primary" />
                            Contrat
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="type_contrat">Type de contrat</Label>
                              <Select 
                                name="type_contrat" 
                                value={formData.type_contrat || ""}
                                onValueChange={(value) => updateField("type_contrat", value)}
                              >
                                <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CDI">CDI</SelectItem>
                                  <SelectItem value="CDD">CDD</SelectItem>
                                  <SelectItem value="STAGE">Stage</SelectItem>
                                  <SelectItem value="INTERIM">Intérim</SelectItem>
                                  <SelectItem value="PRESTATION">Contrat de Prestation</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="temps_travail">Temps de travail</Label>
                              <Select 
                                name="temps_travail" 
                                value={formData.temps_travail || ""}
                                onValueChange={(value) => updateField("temps_travail", value)}
                              >
                                <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PLEIN">Temps plein</SelectItem>
                                  <SelectItem value="PARTIEL">Temps partiel</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="date_debut_contrat">Date de début</Label>
                              <Input
                                id="date_debut_contrat"
                                name="date_debut_contrat"
                                type="date"
                                value={formData.date_debut_contrat || ""}
                                onChange={(e) => updateField("date_debut_contrat", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="date_fin_contrat">Date de fin (si applicable)</Label>
                              <Input
                                id="date_fin_contrat"
                                name="date_fin_contrat"
                                type="date"
                                value={formData.date_fin_contrat || ""}
                                onChange={(e) => updateField("date_fin_contrat", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-xl border-2 border-green-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaStar className="w-7 h-7 text-site-primary" />
                            Rémunération
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="taux_horaire">Taux horaire</Label>
                              <Input
                                id="taux_horaire"
                                name="taux_horaire"
                                type="number"
                                step="0.01"
                                value={formData.taux_horaire || ""}
                                onChange={(e) => updateField("taux_horaire", e.target.value)}
                                placeholder="Ex: 15.50"
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="salaire">Salaire</Label>
                              <Input
                                id="salaire"
                                name="salaire"
                                type="number"
                                step="0.01"
                                value={formData.salaire || ""}
                                onChange={(e) => updateField("salaire", e.target.value)}
                                placeholder="Ex: 2500.00"
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="mode_paiement">Mode de paiement</Label>
                              <Select 
                                name="mode_paiement" 
                                value={formData.mode_paiement || ""}
                                onValueChange={(value) => updateField("mode_paiement", value)}
                              >
                                <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="VIREMENT">Virement bancaire</SelectItem>
                                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                                  <SelectItem value="ESPECES">Espèces</SelectItem>
                                  <SelectItem value="AUTRE">Autre</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-3 border-b border-gray-200">
                            <FaFileAlt className="w-7 h-7 text-site-primary" />
                            Informations administratives
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="numero_securite_sociale">Numéro de sécurité sociale</Label>
                              <Input
                                id="numero_securite_sociale"
                                name="numero_securite_sociale"
                                value={formData.numero_securite_sociale || ""}
                                onChange={(e) => updateField("numero_securite_sociale", e.target.value)}
                                placeholder="Si légalement autorisé"
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="numero_employe_interne">Numéro d'employé interne</Label>
                              <Input
                                id="numero_employe_interne"
                                name="numero_employe_interne"
                                value={formData.numero_employe_interne || ""}
                                onChange={(e) => updateField("numero_employe_interne", e.target.value)}
                                className="h-11 bg-white border-gray-300 focus:border-site-primary focus:ring-site-primary"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Navigation entre les étapes */}
              <div className="flex items-center justify-between px-6 py-4 border-t bg-white flex-shrink-0 shadow-lg">
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center gap-2"
                    >
                      <FaChevronLeft className="w-4 h-4" />
                      Précédent
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setCurrentStep(1);
                      // Vider le formulaire si on annule la création (pas l'édition)
                      if (!editingEmploye) {
                        localStorage.removeItem("employee_form_data");
                        setFormData({});
                      }
                      setEditingEmploye(null);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-white flex items-center gap-2"
                    >
                      Suivant
                      <FaChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-white flex items-center gap-2"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <FaCheck className="w-4 h-4" />
                          {editingEmploye ? "Modifier" : "Créer"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
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
                Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.
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
      </div>
    </DashboardLayout>
  );
}

