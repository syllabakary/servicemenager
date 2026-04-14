import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  FaLock, FaIdCard, FaEnvelope, FaPhone, FaSignOutAlt,
  FaCamera, FaPen, FaCheck, FaTimes, FaSpinner,
} from "react-icons/fa";
import { EmployeLayout } from "@/components/employe/EmployeLayout";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { API_URL } from "@/config/api";
import axios from "axios";

export default function EmployeProfil() {
  const [, setLocation] = useLocation();
  useInactivityLogout(30 * 60 * 1000);
  const [user, setUser] = React.useState<any>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Photo
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || storedUser.role !== "EMPLOYE") {
      setLocation("/employe/login");
      return;
    }
    setUser(storedUser);
    setEditEmail(storedUser.email || "");
    setEditPhone(storedUser.phone || "");
    setPhotoPreview(storedUser.photo_url || null);
  }, [setLocation]);

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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem("access_token");
      const form = new FormData();
      form.append("photo", file);
      const res = await axios.patch(`${API_URL}/users/update_me/`, form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const updated = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setPhotoPreview(res.data.photo_url || photoPreview);
    } catch {
      setSaveError("Erreur lors de l'envoi de la photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.patch(
        `${API_URL}/users/update_me/`,
        { email: editEmail, phone: editPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
    } catch {
      setSaveError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`;

  return (
    <EmployeLayout user={user} onLogout={handleLogout}>
      <div className="space-y-5 py-5">

        {/* Avatar card */}
        <div className="bg-gradient-to-r from-site-primary to-site-secondary rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
          {/* Photo / Avatar */}
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 rounded-full border-4 border-white/40 overflow-hidden shadow-lg mx-auto">
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {initials}
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <FaSpinner className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            {/* Camera button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-site-primary hover:scale-110 transition-transform"
            >
              <FaCamera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <h2 className="text-xl font-bold">{user.first_name} {user.last_name}</h2>
          <p className="text-white/70 text-sm mt-0.5 font-mono">{user.matricule}</p>
          <p className="text-white/60 text-xs mt-0.5">Employé</p>
        </div>

        {/* Error */}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {saveError}
          </div>
        )}

        {/* Infos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informations</span>
            {!editing ? (
              <button
                onClick={() => { setEditing(true); setSaveError(""); }}
                className="flex items-center gap-1.5 text-xs text-site-primary font-semibold px-2.5 py-1.5 rounded-lg bg-site-primary/10 hover:bg-site-primary/20 transition-colors"
              >
                <FaPen className="w-3 h-3" /> Modifier
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(false); setEditEmail(user.email || ""); setEditPhone(user.phone || ""); setSaveError(""); }}
                  className="flex items-center gap-1 text-xs text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="w-3 h-3" /> Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs text-white bg-site-primary px-2.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saving ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheck className="w-3 h-3" />}
                  Sauvegarder
                </button>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {/* Matricule - non éditable */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FaIdCard className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Matricule</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">{user.matricule || "—"}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FaEnvelope className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Email</p>
                {editing ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full text-sm font-semibold text-gray-900 border-b border-site-primary/40 focus:outline-none focus:border-site-primary bg-transparent py-0.5"
                    placeholder="email@exemple.com"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{user.email || "—"}</p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <FaPhone className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Téléphone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full text-sm font-semibold text-gray-900 border-b border-site-primary/40 focus:outline-none focus:border-site-primary bg-transparent py-0.5"
                    placeholder="0600000000"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{user.phone || "—"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paramètres</span>
          </div>
          <div className="divide-y divide-gray-50">
            <button
              onClick={() => setLocation("/employe/change-password")}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FaLock className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Changer mon mot de passe</p>
                <p className="text-xs text-gray-400">Modifier votre mot de passe de connexion</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <FaSignOutAlt className="w-3.5 h-3.5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600">Déconnexion</p>
                <p className="text-xs text-gray-400">Se déconnecter de l'application</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </EmployeLayout>
  );
}
