import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  FaQrcode, FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaSignOutAlt, 
  FaArrowLeft, FaCalendarAlt, FaCamera, FaKeyboard, FaStop
} from "react-icons/fa";
import axios from "axios";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { API_URL } from "@/config/api";

// Import dynamique pour html5-qrcode
let Html5Qrcode: any = null;
if (typeof window !== "undefined") {
  import("html5-qrcode").then((module) => {
    Html5Qrcode = module.Html5Qrcode;
  });
}

export default function ScanQR() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState("");
  const [lastScan, setLastScan] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"ARRIVEE" | "DEPART" | null>(null);
  const [scanComment, setScanComment] = useState<string>(""); // Commentaire optionnel pour signaler une erreur
  const [patientScans, setPatientScans] = useState<any[]>([]);
  const [showExtraScanDialog, setShowExtraScanDialog] = useState(false);
  const [extraScanData, setExtraScanData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [showCameraContainer, setShowCameraContainer] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token || storedUser.role !== "EMPLOYE") {
      setLocation("/employe/login");
      return;
    }
    
    setUser(storedUser);
    
    // Demander la permission de géolocalisation dès le chargement de la page
    if (navigator.geolocation) {
      // Demander la permission de géolocalisation (sans attendre de réponse)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("✅ Permission de géolocalisation accordée:", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("⚠️ Permission de géolocalisation refusée ou erreur:", error.message);
        },
        {
          timeout: 5000,
          enableHighAccuracy: false, // Mode rapide pour la demande de permission
          maximumAge: 60000 // Accepter une position en cache pour la demande de permission
        }
      );
    }
    
    // Vérifier si on est sur iOS ou Android sans HTTPS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isHTTPS = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.hostname.startsWith('10.');
    
    // Sur iOS et Android, la caméra nécessite HTTPS (sauf localhost/IP locale)
    if ((isIOS || isAndroid) && !isHTTPS) {
      console.warn(`${isIOS ? 'iOS' : 'Android'} détecté sans HTTPS - activation automatique du mode manuel`);
      setCameraAvailable(false);
      setScanMode("manual");
    } else {
      // Vérifier si html5-qrcode est disponible et si la caméra est accessible
      import("html5-qrcode").then(async (module) => {
        Html5Qrcode = module.Html5Qrcode;
        
        // Vérifier si l'API de la caméra est disponible
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Tester si on peut accéder à la caméra
          try {
            // Sur Android, essayer d'abord avec la caméra arrière
            const constraints = isAndroid 
              ? { 
                  video: { 
                    facingMode: "environment", // Caméra arrière
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  } 
                }
              : { video: true };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach(track => track.stop()); // Arrêter immédiatement
            setCameraAvailable(true);
            console.log("Caméra disponible et accessible");
          } catch (err: any) {
            console.warn("Caméra non accessible:", err);
            // Si c'est une erreur de permission, on peut quand même essayer
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              console.warn("Permission caméra refusée, mais on peut essayer quand même");
              setCameraAvailable(true); // On laisse l'utilisateur essayer
            } else {
              setCameraAvailable(false);
              setScanMode("manual");
            }
          }
        } else {
          console.warn("getUserMedia non disponible");
          setCameraAvailable(false);
          setScanMode("manual");
        }
      }).catch((err) => {
        console.error("Erreur lors du chargement de html5-qrcode:", err);
        setCameraAvailable(false);
        setScanMode("manual");
      });
    }
  }, [setLocation]);

  // L'heure est toujours automatique, pas besoin d'initialiser selectedDateTime
  // On utilisera l'heure actuelle au moment de la validation
  // Note: selectedDateTime est conservé pour compatibilité mais ne sera plus utilisé

  // Démarrer le scanner caméra
  const startCameraScan = async () => {
    // Vérifier si on est sur iOS ou Android sans HTTPS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isHTTPS = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.hostname.startsWith('10.') ||
                    window.location.hostname.includes('ease-dom.fr'); // Permettre sur le domaine
    
    // Sur desktop/web, permettre toujours le scan même sans HTTPS
    const isDesktop = !isIOS && !isAndroid;
    
    if ((isIOS || isAndroid) && !isHTTPS && !isDesktop) {
      toast({
        title: "Caméra non disponible",
        description: `Sur ${isIOS ? 'iPhone/iPad' : 'Android'}, l'accès à la caméra nécessite HTTPS ou une adresse IP locale. Utilisez le mode manuel pour saisir le code QR.`,
        variant: "destructive",
      });
      setScanMode("manual");
      return;
    }
    
    if (!Html5Qrcode) {
      toast({
        title: "❌ Erreur",
        description: "Le scanner caméra n'est pas disponible. Utilisez le mode manuel.",
        variant: "destructive",
      });
      setScanMode("manual");
      return;
    }

    // Activer le mode scanning pour afficher le conteneur
    setIsScanning(true);
    setShowCameraContainer(true);
    
    // Attendre que le DOM soit mis à jour et que l'élément soit rendu
    await new Promise(resolve => setTimeout(resolve, 500));

    // Attendre que l'élément soit disponible dans le DOM
    let attempts = 0;
    const maxAttempts = 30;
    let qrReaderElement: HTMLElement | null = null;
    
    while (attempts < maxAttempts) {
      qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement && qrReaderElement.offsetParent !== null) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Vérifier que l'élément existe et est visible
    if (!qrReaderElement) {
      setIsScanning(false);
      toast({
        title: "❌ Erreur",
        description: "L'élément de scan n'est pas disponible. Veuillez réessayer.",
        variant: "destructive",
      });
      return;
    }

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Détecter si on est sur mobile, iOS ou Android
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // Configuration pour mobile vs desktop
      const config = isMobile
        ? {
            fps: isIOS ? 2 : (isAndroid ? 10 : 5), // Plus de FPS sur Android
            qrbox: isIOS ? { width: 200, height: 200 } : (isAndroid ? { width: 300, height: 300 } : { width: 250, height: 250 }),
            aspectRatio: 1.0,
            disableFlip: false, // Permettre le retournement
            videoConstraints: (isIOS || isAndroid) ? {
              facingMode: "environment", // Caméra arrière
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } : undefined,
          }
        : {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
          };

      // Sur iOS/Safari, essayer d'abord avec des contraintes spécifiques
      if (isIOS && isSafari) {
        try {
          // Essayer avec la caméra arrière en spécifiant explicitement les contraintes
          await scanner.start(
            {
              facingMode: "environment",
              // Contraintes spécifiques pour iOS
            },
            config,
            (decodedText: string) => {
              handleQrCodeDetected(decodedText);
              stopCameraScan();
            },
            (errorMessage: string) => {
              // Erreur ignorée (scan en cours)
            }
          );
        } catch (iosError: any) {
          console.log("Erreur caméra iOS, essai avec contraintes alternatives:", iosError);
          // Essayer avec la caméra avant
          try {
            await scanner.start(
              { facingMode: "user" },
              config,
              (decodedText: string) => {
                handleQrCodeDetected(decodedText);
                stopCameraScan();
              },
              (errorMessage: string) => {
                // Erreur ignorée
              }
            );
          } catch (userError: any) {
            throw userError; // Relancer l'erreur pour qu'elle soit gérée en bas
          }
        }
      } else if (isAndroid) {
        // Pour Android, essayer d'abord avec la caméra arrière
        try {
          await scanner.start(
            { 
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            config,
            (decodedText: string) => {
              handleQrCodeDetected(decodedText);
              stopCameraScan();
            },
            (errorMessage: string) => {
              // Erreur ignorée (scan en cours)
            }
          );
        } catch (androidError: any) {
          console.log("Erreur caméra Android arrière, essai avec la caméra avant:", androidError);
          // Si la caméra arrière échoue, essayer la caméra avant
          try {
            await scanner.start(
              { 
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              config,
              (decodedText: string) => {
                handleQrCodeDetected(decodedText);
                stopCameraScan();
              },
              (errorMessage: string) => {
                // Erreur ignorée
              }
            );
          } catch (userError: any) {
            throw userError; // Relancer l'erreur pour qu'elle soit gérée en bas
          }
        }
      } else {
        // Pour les autres appareils (desktop), logique normale
        try {
          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              handleQrCodeDetected(decodedText);
              stopCameraScan();
            },
            (errorMessage: string) => {
              // Erreur ignorée (scan en cours)
            }
          );
        } catch (envError: any) {
          // Si la caméra arrière échoue, essayer la caméra avant (user)
          console.log("Caméra arrière non disponible, essai avec la caméra avant");
          try {
            await scanner.start(
              { facingMode: "user" },
              config,
              (decodedText: string) => {
                handleQrCodeDetected(decodedText);
                stopCameraScan();
              },
              (errorMessage: string) => {
                // Erreur ignorée
              }
            );
          } catch (userError: any) {
            throw userError; // Relancer l'erreur pour qu'elle soit gérée en bas
          }
        }
      }
    } catch (err: any) {
      setIsScanning(false);
      console.error("Erreur caméra:", err);
      
      let errorMessage = "Impossible d'accéder à la caméra.";
      let errorTitle = "❌ Erreur caméra";
      
      // Analyser le type d'erreur
      const errorStr = String(err).toLowerCase();
      const errorName = err?.name?.toLowerCase() || "";
      const errorMsg = err?.message?.toLowerCase() || "";
      
      if (errorName.includes("notallowed") || errorName.includes("permission") || errorMsg.includes("permission")) {
        errorTitle = "❌ Permission refusée";
        errorMessage = "L'accès à la caméra a été refusé. Sur mobile :\n• Safari : Réglages > Safari > Caméra\n• Chrome : Menu > Paramètres > Site > Caméra\n\nAutorisez l'accès et réessayez.";
      } else if (errorName.includes("notfound") || errorName.includes("devicesnotfound") || errorMsg.includes("camera") || errorMsg.includes("device")) {
        errorTitle = "❌ Caméra non trouvée";
        errorMessage = "Aucune caméra n'a été détectée sur cet appareil. Utilisez le mode manuel pour entrer le code QR.";
      } else       if (errorMsg.includes("https") || errorMsg.includes("secure") || errorMsg.includes("ssl") || errorStr.includes("secure")) {
        errorTitle = "❌ Connexion non sécurisée";
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
          errorMessage = "Sur iPhone/iPad, l'accès à la caméra nécessite HTTPS. Utilisez le mode manuel pour entrer le code QR, ou configurez HTTPS pour votre serveur.";
        } else {
          errorMessage = "L'accès à la caméra nécessite HTTPS sur mobile. Sur HTTP, utilisez le mode manuel pour entrer le code QR.";
        }
      } else if (errorName.includes("notreadable") || errorName.includes("trackstart") || errorMsg.includes("already in use")) {
        errorTitle = "❌ Caméra occupée";
        errorMessage = "La caméra est déjà utilisée par une autre application. Fermez les autres applications utilisant la caméra et réessayez.";
      } else if (errorMsg.includes("getusermedia") || errorMsg.includes("media devices") || errorStr.includes("not supported")) {
        errorTitle = "❌ Navigateur non compatible";
        errorMessage = "Votre navigateur ne supporte pas l'accès à la caméra. Utilisez Chrome ou Safari (dernière version) ou le mode manuel.";
      } else {
        errorMessage = err?.message || String(err) || "Impossible d'accéder à la caméra. Utilisez le mode manuel pour entrer le code QR.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Afficher plus longtemps pour que l'utilisateur puisse lire
      });
      setScanMode("manual");
      setShowCameraContainer(false);
    }
  };

  // Arrêter le scanner caméra
  const stopCameraScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        // Ignorer les erreurs de nettoyage
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Récupérer les scans existants pour un patient par QR code
  const fetchPatientScans = async (qrCode: string) => {
    try {
      const token = localStorage.getItem("access_token");
      
      // Utiliser l'endpoint by_qr_code pour les employés
      const patientResponse = await axios.get(`${API_URL}/patients/by_qr_code/?qr_code=${qrCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (patientResponse.data && patientResponse.data.id) {
        const patient = patientResponse.data;
        
        // Ensuite, récupérer les presences pour ce patient
        const presencesResponse = await axios.get(`${API_URL}/presences/?patient=${patient.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // L'API peut retourner results (pagination) ou directement un tableau
        const presences = presencesResponse.data.results || presencesResponse.data || [];
        setPatientScans(presences);
      } else {
        setPatientScans([]);
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des scans:", error);
      // Ne pas bloquer le processus si la récupération échoue
      setPatientScans([]);
    }
  };

  // Gérer la détection d'un QR code
  const handleQrCodeDetected = async (decodedText: string) => {
    setQrCode(decodedText);
    setScanData({ qrCode: decodedText });
    
    // Récupérer les scans existants pour ce patient
    await fetchPatientScans(decodedText);
    
    // Afficher le dialog pour choisir le type de scan
    setShowStatusDialog(true);
    const now = new Date();
    const formatted = format(now, "yyyy-MM-dd'T'HH:mm");
    // L'heure est automatique, pas besoin de setSelectedDateTime
  };

  // Nettoyer le scanner au démontage
  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, []);

  const scanMutation = useMutation({
    mutationFn: async (data: { qrCode: string; status: "ARRIVEE" | "DEPART"; scanTime?: string; allowExtraScan?: boolean; notes?: string }) => {
      const token = localStorage.getItem("access_token");
      
      // Capturer la position GPS au moment de la validation du scan
      // La localisation est capturée juste avant l'envoi au serveur, quand l'employé clique sur "Valider"
      let latitude = null;
      let longitude = null;
      
      if (navigator.geolocation) {
        try {
          // Options pour une meilleure précision sur mobile (utilise le GPS)
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            // Timeout plus long pour permettre au GPS de se stabiliser
            const timeoutId = setTimeout(() => {
              reject(new Error("Timeout: La localisation GPS prend trop de temps"));
            }, 15000); // 15 secondes de timeout
            
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timeoutId);
                resolve(pos);
              }, 
              (err) => {
                clearTimeout(timeoutId);
                reject(err);
              }, 
              { 
                timeout: 15000, // 15 secondes de timeout (plus long sur mobile)
                enableHighAccuracy: true, // Utiliser GPS si disponible (plus précis sur mobile)
                maximumAge: 0 // Ne pas utiliser de position en cache, toujours demander une nouvelle position
              }
            );
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log("✅ Localisation GPS capturée au moment du scan:", { latitude, longitude });
        } catch (error: any) {
          // Si la localisation échoue, on continue quand même sans GPS mais on log l'erreur
          const errorMsg = error?.message || String(error);
          console.warn("⚠️ Impossible de capturer la localisation GPS:", errorMsg);
          console.warn("Détails de l'erreur:", {
            code: error?.code,
            message: errorMsg,
            name: error?.name
          });
          // Afficher un avertissement à l'utilisateur mais continuer quand même
          toast({
            title: "⚠️ Localisation GPS non disponible",
            description: "Le scan sera enregistré sans coordonnées GPS. Assurez-vous d'autoriser l'accès à la localisation dans les paramètres de votre navigateur.",
            variant: "default",
          });
        }
      } else {
        console.warn("❌ La géolocalisation n'est pas disponible sur cet appareil");
        toast({
          title: "⚠️ Géolocalisation non disponible",
          description: "Votre appareil ne supporte pas la géolocalisation. Le scan sera enregistré sans coordonnées GPS.",
          variant: "default",
        });
      }
      
      const payload: any = {
        qr_code: data.qrCode,
        status: data.status,
        latitude,
        longitude,
      };

      // Si c'est un scan supplémentaire (3ème, 4ème, etc.)
      if (data.allowExtraScan) {
        payload.allow_extra_scan = true;
      }

      // Si une date/heure personnalisée est fournie
      if (data.scanTime) {
        payload.scan_time = data.scanTime;
      }

      // Si un commentaire est fourni
      if (data.notes) {
        payload.notes = data.notes;
      }
      
      const response = await axios.post(
        `${API_URL}/presences/scan_qr_code/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setLastScan(data);
      setShowConfirmDialog(false);
      setShowStatusDialog(false);
      setQrCode("");
      setSelectedStatus(null);
      queryClient.invalidateQueries({ queryKey: ["employe-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["my-assigned-patients"] });
      if (scanData?.qrCode) {
        fetchPatientScans(scanData.qrCode);
      }
      toast({
        title: data.status === "ARRIVEE" ? "✅ Arrivée enregistrée" : "✅ Départ enregistré",
        description: data.status === "ARRIVEE"
          ? `Arrivée enregistrée pour ${data.patient_name}`
          : `Départ enregistré. Durée: ${data.duration_hours ? `${Math.floor(data.duration_hours)}h ${Math.round((data.duration_hours % 1) * 60)}min` : "N/A"}`,
      });
    },
    onError: (error: any) => {
      console.error("Erreur lors du scan:", error);
      const errorData = error?.response?.data;
      
      // Si c'est une erreur de limite atteinte, afficher le dialog de confirmation
      if (errorData?.error === 'LIMIT_REACHED') {
        setShowConfirmDialog(false);
        setShowStatusDialog(false);
        setExtraScanData({
          qrCode: scanData?.qrCode,
          status: selectedStatus,
          scanTime: undefined, // L'heure est automatique, le backend utilisera l'heure actuelle
          totalScans: errorData.total_scans,
          message: errorData.message,
        });
        setShowExtraScanDialog(true);
        return;
      }
      
      // Gérer les erreurs 400 avec message détaillé
      if (error?.response?.status === 400) {
        const errorDetails = error.response.data;
        console.error("Détails de l'erreur 400:", errorDetails);
        const errorMessage = errorDetails?.error || errorDetails?.message || "Erreur lors de l'enregistrement du scan";
        setShowConfirmDialog(false);
        setShowStatusDialog(false);
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        setShowConfirmDialog(false);
        setShowStatusDialog(false);
        toast({
          title: "Erreur",
          description: errorData?.error || errorData?.message || "Une erreur est survenue lors de l'enregistrement du scan",
          variant: "destructive",
        });
      }
      
      setQrCode("");
      setSelectedStatus(null);
    },
  });

  // Mutation pour supprimer un scan
  const deleteScanMutation = useMutation({
    mutationFn: async (scanId: number) => {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/presences/${scanId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employe-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["my-assigned-patients"] });
      if (scanData?.qrCode) {
        fetchPatientScans(scanData.qrCode);
      }
      toast({
        title: "✅ Scan supprimé",
        description: "Le scan a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erreur",
        description: error?.response?.data?.error || "Impossible de supprimer le scan.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (qrCode.trim()) {
      setScanData({ qrCode: qrCode.trim() });
      // Récupérer les scans existants
      await fetchPatientScans(qrCode.trim());
      // Afficher le dialog pour choisir le type de scan
      setShowStatusDialog(true);
      const now = new Date();
      const formatted = format(now, "yyyy-MM-dd'T'HH:mm");
      // L'heure est automatique, pas besoin de setSelectedDateTime
    }
  };

  const handleStatusSelected = () => {
    if (selectedStatus) {
      // Fermer le dialog de statut et ouvrir le dialog de confirmation
      setShowStatusDialog(false);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmScan = () => {
    if (scanData && selectedStatus) {
      // Afficher l'avertissement avant de valider
      setShowWarningDialog(true);
    }
  };

  const handleFinalConfirmScan = () => {
    if (scanData && selectedStatus) {
      // L'heure est automatique - on n'envoie pas scanTime, le backend utilisera l'heure actuelle
      scanMutation.mutate({
        qrCode: scanData.qrCode,
        status: selectedStatus,
        // scanTime n'est pas envoyé - le backend utilisera l'heure actuelle automatiquement
        allowExtraScan: false,
        notes: scanComment || undefined, // Commentaire optionnel
      });
      // Réinitialiser le commentaire après l'envoi
      setScanComment("");
      setShowWarningDialog(false);
      setShowConfirmDialog(false);
    }
  };

  const handleConfirmExtraScan = () => {
    if (extraScanData) {
      scanMutation.mutate({
        qrCode: extraScanData.qrCode,
        status: extraScanData.status,
        scanTime: extraScanData.scanTime || undefined,
        allowExtraScan: true,
        notes: scanComment || undefined, // Commentaire optionnel
      });
      setShowExtraScanDialog(false);
      setExtraScanData(null);
      // Réinitialiser le commentaire après l'envoi
      setScanComment("");
    }
  };

  const handleLogout = () => {
    stopCameraScan();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setLocation("/employe/login");
  };

  const toggleScanMode = () => {
    if (isScanning) {
      stopCameraScan();
    }
    const newMode = scanMode === "camera" ? "manual" : "camera";
    setScanMode(newMode);
    if (newMode === "camera") {
      setShowCameraContainer(true);
    } else {
      setShowCameraContainer(false);
    }
  };

  // Détecter si on est sur iOS sans HTTPS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isIOSWithoutHTTPS = isIOS && !isHTTPS;

  // Afficher le conteneur caméra quand on passe en mode caméra
  useEffect(() => {
    if (scanMode === "camera" && cameraAvailable && !isIOSWithoutHTTPS) {
      setShowCameraContainer(true);
    } else {
      setShowCameraContainer(false);
      if (isScanning) {
        stopCameraScan();
      }
    }
  }, [scanMode, cameraAvailable, isIOSWithoutHTTPS]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-20 pb-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Scanner QR Code
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#DC2626] to-[#B91C1C] flex items-center justify-center text-white font-bold">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div>
                  <p className="text-gray-800 font-semibold">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Matricule: <span className="font-mono font-semibold text-[#DC2626]">{user.matricule}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setLocation("/employe/dashboard")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="lg"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto"
              >
                <FaSignOutAlt className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>

        {/* Avertissement iOS sans HTTPS */}
        {isIOSWithoutHTTPS && (
          <Card className="shadow-xl border-0 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-orange-600 text-xl">⚠️</div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 mb-1">
                    Caméra non disponible sur iPhone/iPad
                  </p>
                  <p className="text-sm text-orange-800">
                    Sur iPhone/iPad, l'accès à la caméra nécessite HTTPS. Le mode manuel est automatiquement activé. Vous pouvez saisir le code QR manuellement ci-dessous.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mode de scan */}
        <div className="flex gap-2 justify-center">
          {cameraAvailable && !isIOSWithoutHTTPS && (
            <Button
              onClick={toggleScanMode}
              variant={scanMode === "camera" ? "default" : "outline"}
              size="lg"
              className={scanMode === "camera" ? "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-lg" : ""}
            >
              {scanMode === "camera" ? (
                <>
                  <FaCamera className="w-5 h-5 mr-2" />
                  Mode Caméra
                </>
              ) : (
                <>
                  <FaKeyboard className="w-5 h-5 mr-2" />
                  Mode Manuel
                </>
              )}
            </Button>
          )}
        </div>

        {/* Scanner Caméra */}
        {scanMode === "camera" && cameraAvailable && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <FaCamera className="w-6 h-6" />
                Scanner avec la caméra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {!isScanning ? (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-2xl flex items-center justify-center shadow-lg">
                        <FaQrcode className="w-16 h-16 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 text-lg font-medium">
                      Positionnez le QR code dans le cadre de la caméra
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      La caméra s'activera automatiquement
                    </p>
                    <Button
                      onClick={startCameraScan}
                      className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white shadow-lg hover:shadow-xl px-8 py-6 text-lg font-semibold"
                      size="lg"
                    >
                      <FaCamera className="w-5 h-5 mr-2" />
                      Démarrer le scan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full flex justify-center">
                      <div 
                        id="qr-reader" 
                        ref={scannerContainerRef}
                        className="w-full rounded-lg overflow-hidden bg-black"
                        style={{ minHeight: "400px", maxWidth: "500px", width: "100%" }}
                      ></div>
                    </div>
                    <Button
                      onClick={stopCameraScan}
                      variant="outline"
                      className="w-full py-6 text-lg font-semibold"
                      size="lg"
                    >
                      <FaStop className="w-5 h-5 mr-2" />
                      Arrêter le scan
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulaire de scan manuel */}
        {scanMode === "manual" && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <FaKeyboard className="w-6 h-6" />
                Saisie manuelle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qrCode" className="text-base font-semibold">Code QR du patient</Label>
                  <Input
                    id="qrCode"
                    type="text"
                    placeholder="Entrez le code QR du patient"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    className="text-lg h-14 border-2 focus:border-[#DC2626] focus:ring-[#DC2626]"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500">
                    Saisissez le code QR du patient manuellement
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={!qrCode.trim() || scanMutation.isPending}
                >
                  {scanMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <FaQrcode className="w-5 h-5 mr-2" />
                      Scanner
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Dernier scan */}
        {lastScan && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <FaCheckCircle className="w-6 h-6" />
                Dernier scan enregistré
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Patient:</span>
                  <span className="font-bold text-gray-900 text-lg">{lastScan.patient_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Statut:</span>
                  <Badge
                    variant={lastScan.status === "ARRIVEE" ? "default" : "secondary"}
                    className={
                      lastScan.status === "ARRIVEE"
                        ? "bg-green-500 text-white px-4 py-2 text-base"
                        : "bg-red-500 text-white px-4 py-2 text-base"
                    }
                  >
                    {lastScan.status === "ARRIVEE" ? "Arrivée" : "Départ"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Date/Heure:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(lastScan.scan_time), "dd MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>
                {lastScan.duration_hours && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Durée:</span>
                    <span className="font-medium text-blue-600 text-lg">
                      {Math.floor(lastScan.duration_hours)}h{" "}
                      {Math.round((lastScan.duration_hours % 1) * 60)}min
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog pour choisir le type de scan (Arrivée/Départ) */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FaQrcode className="w-5 h-5 text-[#DC2626]" />
                Type de scan
              </DialogTitle>
              <DialogDescription>
                Choisissez le type de scan pour ce patient.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  <strong>QR Code:</strong> {scanData?.qrCode}
                </p>
              </div>

              {/* Scans existants aujourd'hui */}
              {patientScans.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">
                    Scans enregistrés aujourd'hui:
                  </p>
                  <div className="space-y-2">
                    {patientScans.map((scan: any) => (
                      <div key={scan.id} className="flex items-center justify-between bg-white p-2 rounded border border-yellow-300">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={scan.status === "ARRIVEE" ? "default" : "secondary"}
                            className={
                              scan.status === "ARRIVEE"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }
                          >
                            {scan.status === "ARRIVEE" ? "Arrivée" : "Départ"}
                          </Badge>
                          <span className="text-sm text-gray-700">
                            {format(new Date(scan.scan_time), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Choix du type de scan */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Sélectionnez le type de scan:</Label>
                {(() => {
                  // Trier les scans par date (plus récent en premier)
                  const sortedScans = patientScans.length > 0 
                    ? [...patientScans].sort((a: any, b: any) => 
                        new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime()
                      )
                    : [];
                  
                  const lastScan = sortedScans[0] || null;
                  
                  // Logique simple pour cycles infinis : Arrivée → Départ → Arrivée → Départ → ...
                  // - Si le dernier scan est un DÉPART (ou aucun scan), ARRIVÉE est disponible
                  // - Si le dernier scan est une ARRIVÉE, DÉPART est disponible
                  const canScanArrival = !lastScan || lastScan.status === "DEPART";
                  const canScanDeparture = lastScan && lastScan.status === "ARRIVEE";
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant={selectedStatus === "ARRIVEE" ? "default" : "outline"}
                          onClick={() => setSelectedStatus("ARRIVEE")}
                          disabled={!canScanArrival}
                          className={`h-20 flex flex-col items-center justify-center gap-2 ${
                            selectedStatus === "ARRIVEE"
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : !canScanArrival
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <FaCheckCircle className="w-6 h-6" />
                          <span className="font-semibold">Arrivée</span>
                          {!canScanArrival && (
                            <span className="text-xs">Départ requis d'abord</span>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant={selectedStatus === "DEPART" ? "default" : "outline"}
                          onClick={() => setSelectedStatus("DEPART")}
                          disabled={!canScanDeparture}
                          className={`h-20 flex flex-col items-center justify-center gap-2 ${
                            selectedStatus === "DEPART"
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : !canScanDeparture
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <FaTimesCircle className="w-6 h-6" />
                          <span className="font-semibold">Départ</span>
                          {!canScanDeparture && (
                            <span className="text-xs">Arrivée requise</span>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-blue-600 font-medium text-center">
                        {canScanArrival 
                          ? "Prochain scan : Arrivée (après un départ, vous pouvez commencer une nouvelle mission)"
                          : "Prochain scan : Départ (après une arrivée, vous devez enregistrer le départ)"}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDialog(false);
                  setSelectedStatus(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleStatusSelected}
                className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white"
                disabled={!selectedStatus}
              >
                Continuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation avec date/heure */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FaCalendarAlt className="w-5 h-5 text-[#DC2626]" />
                Confirmer le scan
              </DialogTitle>
              <DialogDescription>
                Vérifiez et ajustez la date et l'heure du scan si nécessaire.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  <strong>QR Code:</strong> {scanData?.qrCode}
                </p>
                <div className="text-sm text-blue-800 font-medium">
                  <strong>Type:</strong>{" "}
                  <Badge
                    variant={selectedStatus === "ARRIVEE" ? "default" : "secondary"}
                    className={
                      selectedStatus === "ARRIVEE"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }
                  >
                    {selectedStatus === "ARRIVEE" ? "Arrivée" : "Départ"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date et heure du scan</Label>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    Date et heure automatiques:
                  </p>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  L'heure est enregistrée automatiquement au moment de la validation. Seul l'administrateur pourra la modifier ultérieurement.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scanComment">
                  Commentaire (optionnel)
                  <span className="text-xs text-gray-500 font-normal ml-1">
                    - Pour signaler une erreur ou ajouter une note
                  </span>
                </Label>
                <Textarea
                  id="scanComment"
                  placeholder="Ex: Erreur de pointage, patient absent, problème technique..."
                  value={scanComment}
                  onChange={(e) => setScanComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Ce commentaire sera visible par l'administrateur pour le suivi
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setShowStatusDialog(true);
                }}
                disabled={scanMutation.isPending}
              >
                Retour
              </Button>
              <Button
                onClick={handleConfirmScan}
                className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white"
                disabled={scanMutation.isPending || !selectedStatus}
              >
                {scanMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="w-4 h-4 mr-2" />
                    Valider
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement avant validation finale */}
        <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <FaClock className="w-5 h-5" />
                Avertissement important
              </DialogTitle>
              <DialogDescription>
                Veuillez vérifier attentivement les informations avant de valider.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm font-semibold text-orange-800 mb-2">
                  Attention:
                </p>
                <p className="text-sm text-orange-900">
                  {selectedStatus === "DEPART" 
                    ? "Une fois validé, vous ne pourrez plus modifier la date et l'heure de ce départ, ni celle de l'arrivée correspondante. Seul l'administrateur pourra effectuer des modifications."
                    : "Une fois validé, la date et l'heure de cette arrivée seront enregistrées. Si vous scannez ensuite un départ, vous ne pourrez plus modifier les heures. Seul l'administrateur pourra effectuer des modifications."}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  Informations du scan:
                </p>
                <div className="space-y-2 text-sm text-blue-900">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <Badge
                      variant={selectedStatus === "ARRIVEE" ? "default" : "secondary"}
                      className={
                        selectedStatus === "ARRIVEE"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }
                    >
                      {selectedStatus === "ARRIVEE" ? "Arrivée" : "Départ"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date et heure:</span>
                    <span className="font-semibold">
                      {format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}
                    </span>
                  </div>
                  {scanComment && (
                    <div className="flex justify-between">
                      <span className="font-medium">Commentaire:</span>
                      <span className="text-xs italic">{scanComment}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 text-center font-medium">
                  Vérifiez que toutes les informations sont correctes avant de continuer.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowWarningDialog(false)}
                disabled={scanMutation.isPending}
              >
                Retour
              </Button>
              <Button
                onClick={handleFinalConfirmScan}
                className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white"
                disabled={scanMutation.isPending || !selectedStatus}
              >
                {scanMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="w-4 h-4 mr-2" />
                    Oui, je confirme et j'enregistre
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation pour scan supplémentaire (3ème, 4ème, etc.) */}
        <Dialog open={showExtraScanDialog} onOpenChange={setShowExtraScanDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-600">
                <FaTimesCircle className="w-5 h-5" />
                Attention - Scan supplémentaire
              </DialogTitle>
              <DialogDescription>
                {extraScanData?.message || "Vous avez déjà effectué plusieurs scans pour ce patient aujourd'hui."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-medium">
                  <strong>Nombre de scans aujourd'hui:</strong> {extraScanData?.totalScans || 0}
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  Vous êtes sur le point d'enregistrer un scan supplémentaire ({extraScanData?.totalScans ? extraScanData.totalScans + 1 : 1}ème scan) pour ce patient.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Type de scan:</strong>{" "}
                  <Badge
                    variant={extraScanData?.status === "ARRIVEE" ? "default" : "secondary"}
                    className={
                      extraScanData?.status === "ARRIVEE"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }
                  >
                    {extraScanData?.status === "ARRIVEE" ? "Arrivée" : "Départ"}
                  </Badge>
                </div>
                <div className="text-sm text-blue-800 mt-2">
                  <strong>QR Code:</strong> {extraScanData?.qrCode}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir continuer avec ce scan supplémentaire ?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowExtraScanDialog(false);
                  setExtraScanData(null);
                }}
                disabled={scanMutation.isPending}
              >
                Non, annuler
              </Button>
              <Button
                onClick={handleConfirmExtraScan}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                disabled={scanMutation.isPending}
              >
                {scanMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Oui, continuer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
