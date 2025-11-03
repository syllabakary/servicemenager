import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuoteRequestSchema, type InsertQuoteRequest } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface QuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteForm({ open, onOpenChange }: QuoteFormProps) {
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InsertQuoteRequest>({
    resolver: zodResolver(insertQuoteRequestSchema),
    defaultValues: {
      nom: "",
      email: "",
      service: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertQuoteRequest) => {
      const response = await apiRequest("POST", "/api/quote-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée !",
        description: "Nous vous contacterons rapidement pour discuter de votre projet.",
      });
      reset();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertQuoteRequest) => {
    mutation.mutate(data);
  };

  const serviceValue = watch("service");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-quote-form">
        <DialogHeader>
          <DialogTitle className="text-2xl" data-testid="heading-quote-form">Demander un devis</DialogTitle>
          <DialogDescription data-testid="text-quote-description">
            Remplissez le formulaire ci-dessous et nous vous contacterons rapidement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom complet *</Label>
            <Input
              id="nom"
              {...register("nom")}
              placeholder="Votre nom"
              data-testid="input-name"
            />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="votre@email.com"
              data-testid="input-email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service souhaité *</Label>
            <Select
              value={serviceValue}
              onValueChange={(value) => setValue("service", value)}
            >
              <SelectTrigger id="service" data-testid="select-service-quote">
                <SelectValue placeholder="Sélectionnez un service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ménage à domicile" data-testid="option-menage">Ménage à domicile</SelectItem>
                <SelectItem value="Garde d'enfants" data-testid="option-garde">Garde d'enfants</SelectItem>
                <SelectItem value="Jardinage" data-testid="option-jardinage">Jardinage</SelectItem>
                <SelectItem value="Repassage" data-testid="option-repassage">Repassage</SelectItem>
                <SelectItem value="Autre" data-testid="option-autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            {errors.service && (
              <p className="text-sm text-destructive">{errors.service.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              {...register("message")}
              placeholder="Décrivez vos besoins..."
              rows={4}
              data-testid="textarea-message"
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 gap-2"
              data-testid="button-submit"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Envoyer la demande
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
