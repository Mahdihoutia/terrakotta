"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { BATIMENTS_TYPES, type BatimentType } from "@/lib/thermal/batiments-types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Indique si le formulaire actuel contient déjà des saisies. */
  hasExistingValues: boolean;
  onSelect: (template: BatimentType) => void;
}

export default function BatimentTypePicker({ open, onOpenChange, hasExistingValues, onSelect }: Props) {
  const [pending, setPending] = useState<BatimentType | null>(null);

  function handlePick(template: BatimentType) {
    if (hasExistingValues) {
      setPending(template);
    } else {
      onSelect(template);
      onOpenChange(false);
    }
  }

  function confirm() {
    if (pending) {
      onSelect(pending);
      setPending(null);
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Charger un bâtiment type
            </DialogTitle>
            <DialogDescription>
              Pré-remplit les ~30 champs les plus impactants pour gagner du temps. Vous pourrez ensuite ajuster.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[60vh] overflow-y-auto pr-1">
            {BATIMENTS_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handlePick(t)}
                className={cn(
                  "text-left rounded-lg border bg-background p-4 space-y-2",
                  "transition-colors hover:border-primary/40 hover:bg-primary/5",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight">{t.nom}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">DPE {t.dpeEstime}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{t.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {t.highlights.map((h) => (
                    <Badge key={h} variant="secondary" className="text-[10px] font-normal">{h}</Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remplacer les valeurs actuelles ?</DialogTitle>
            <DialogDescription>
              Le chargement du modèle « {pending?.nom} » remplacera les saisies déjà effectuées.
              Les photos et préconisations ne sont pas touchées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Annuler</Button>
            <Button onClick={confirm}>Charger le modèle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
