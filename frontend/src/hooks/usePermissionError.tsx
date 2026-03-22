/**
 * Hook global pour gérer les erreurs 403 (permission refusée).
 * Utiliser avec PermissionErrorProvider dans App.tsx.
 */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { FaLock, FaTimes } from "react-icons/fa";

interface PermissionError {
  module_label?: string;
  action_label?: string;
  message?: string;
}

interface PermissionErrorContextType {
  showPermissionError: (error?: PermissionError) => void;
}

const PermissionErrorContext = createContext<PermissionErrorContextType>({
  showPermissionError: () => {},
});

export function usePermissionError() {
  return useContext(PermissionErrorContext);
}

export function PermissionErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<PermissionError | null>(null);

  const showPermissionError = useCallback((err?: PermissionError) => {
    setError(err || {});
  }, []);

  // Écouter l'événement global émis par l'intercepteur axios
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setError({
        message: detail?.message,
        module_label: detail?.module_label,
        action_label: detail?.action_label,
      });
    };
    window.addEventListener("permission-denied", handler);
    return () => window.removeEventListener("permission-denied", handler);
  }, []);

  const close = () => setError(null);

  return (
    <PermissionErrorContext.Provider value={{ showPermissionError }}>
      {children}
      {error && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FaLock className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-red-800">Accès refusé</h2>
                  <p className="text-xs text-red-500">Permission insuffisante</p>
                </div>
              </div>
              <button
                onClick={close}
                className="text-red-400 hover:text-red-600 transition-colors p-1"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-700 text-sm leading-relaxed">
                {error.message || "Vous n'avez pas la permission d'effectuer cette action."}
              </p>

              {(error.module_label || error.action_label) && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-4 text-sm">
                  {error.module_label && (
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide">Module</span>
                      <div className="font-medium text-gray-700">{error.module_label}</div>
                    </div>
                  )}
                  {error.action_label && (
                    <>
                      <div className="w-px h-8 bg-gray-200" />
                      <div>
                        <span className="text-gray-400 text-xs uppercase tracking-wide">Action</span>
                        <div className="font-medium text-gray-700">{error.action_label}</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <p className="mt-4 text-xs text-gray-400">
                Contactez votre super administrateur pour obtenir les droits nécessaires.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={close}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </PermissionErrorContext.Provider>
  );
}

/**
 * Extrait les infos d'une erreur axios 403 pour le popup
 */
export function extractPermissionError(err: any): PermissionError | null {
  if (err?.response?.status === 403) {
    const data = err.response.data;
    if (data?.code === "permission_denied") {
      return {
        message: data.message,
        module_label: data.module_label,
        action_label: data.action_label,
      };
    }
    return { message: "Vous n'avez pas la permission d'effectuer cette action." };
  }
  return null;
}
