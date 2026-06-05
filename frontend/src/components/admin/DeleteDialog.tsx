import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onTrash?: () => void;       // soft delete → corbeille (optionnel)
  onHardDelete: () => void;   // suppression définitive
  isPending?: boolean;
  itemLabel?: string;         // ex: "ce patient", "cet avis"
  softDeleteLabel?: string;   // ex: "Mettre à la corbeille"
}

export function DeleteDialog({
  open,
  onClose,
  onTrash,
  onHardDelete,
  isPending = false,
  itemLabel = "cet élément",
  softDeleteLabel = "Mettre à la corbeille",
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">
            Supprimer {itemLabel} ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-gray-600 space-y-1 mt-1">
              {onTrash && (
                <p>
                  <span className="font-semibold text-gray-700">Corbeille</span>{" "}
                  — récupérable, retiré des exports
                </p>
              )}
              <p>
                <span className="font-semibold text-gray-700">Définitif</span>{" "}
                — suppression permanente et irrécupérable
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 mt-2">
          <div className="flex gap-2 w-full">
            <AlertDialogCancel className="flex-1 m-0" disabled={isPending}>
              Annuler
            </AlertDialogCancel>
            {onTrash && (
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isPending}
                onClick={onTrash}
              >
                {isPending ? "..." : softDeleteLabel}
              </Button>
            )}
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending}
              onClick={onHardDelete}
            >
              {isPending ? "..." : "Supprimer"}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
