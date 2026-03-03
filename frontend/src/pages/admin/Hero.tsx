import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/config/api";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FaSave, FaImage, FaTimes, FaHome } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

export default function AdminHero() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("access_token");

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: hero, isLoading } = useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/hero-content/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Pré-remplir le formulaire dès que les données arrivent
  useEffect(() => {
    if (hero) {
      setFormData({
        title: hero.title || "",
        subtitle: hero.subtitle || "",
        description: hero.description || "",
      });
    }
  }, [hero]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("subtitle", formData.subtitle);
      fd.append("description", formData.description);
      if (imageFile) {
        fd.append("background_image", imageFile);
      }
      const res = await axios.patch(`${API_URL}/hero-content/`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      setImageFile(null);
      setImagePreview(null);
      toast({ title: "Sauvegardé", description: "Page d'accueil mise à jour avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentImage = imagePreview || hero?.background_image_url || null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-site-primary to-site-secondary rounded-xl flex items-center justify-center">
              <FaHome className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-site-primary to-site-secondary bg-clip-text text-transparent">
                Page d'accueil
              </h1>
              <p className="text-gray-600 mt-1">Modifiez le titre, le texte et l'image de fond de la section principale</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-site-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche — Texte */}
            <Card className="border border-gray-100 shadow-lg rounded-2xl">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">Texte affiché</CardTitle>
                <CardDescription>Ces textes apparaissent sur la section principale de la page d'accueil.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Titre principal</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nous aimons vous rendre la vie plus facile !"
                    className="border-2 border-gray-200 focus:border-site-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle" className="text-sm font-semibold text-gray-700">Sous-titre</Label>
                  <Textarea
                    id="subtitle"
                    rows={4}
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Ménage, aide à domicile, jardinage..."
                    className="border-2 border-gray-200 focus:border-site-primary resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    Description <span className="text-gray-400 font-normal">(optionnel)</span>
                  </Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Retrouvez du temps pour vous..."
                    className="border-2 border-gray-200 focus:border-site-primary resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Colonne droite — Image de fond */}
            <Card className="border border-gray-100 shadow-lg rounded-2xl">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">Image de fond</CardTitle>
                <CardDescription>Image affichée en arrière-plan. Laissez vide pour utiliser l'image par défaut.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {currentImage ? (
                  <div className="relative w-full h-52 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img src={currentImage} alt="Aperçu" className="w-full h-full object-cover" />
                    {imageFile && (
                      <>
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Nouvelle image
                        </span>
                        <button
                          onClick={removeNewImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {!imageFile && (
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        Image actuelle
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-52 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-400">
                      <FaImage className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune image — image par défaut utilisée</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="hero-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 border-2 border-gray-200 hover:border-site-primary w-full"
                >
                  <FaImage className="w-4 h-4" />
                  {currentImage ? "Changer l'image" : "Choisir une image"}
                </Button>
                {imageFile && (
                  <p className="text-sm text-green-600 font-medium">
                    Fichier sélectionné : {imageFile.name}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bouton Sauvegarder */}
        {!isLoading && (
          <div className="flex justify-end">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2 bg-gradient-to-r from-site-primary to-site-secondary hover:from-site-secondary hover:to-site-tertiary text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold"
            >
              <FaSave className="w-4 h-4" />
              {saveMutation.isPending ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
