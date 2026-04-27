"use client";

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
import { Sparkles } from "lucide-react";
import type { FicheCandidate } from "@/lib/thermal/audit-to-note-mapping";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: FicheCandidate[];
  onSelect: (id: FicheCandidate["id"]) => void;
  onCreateBlank: () => void;
}

export default function FicheChoiceDialog({ open, onOpenChange, candidates, onSelect, onCreateBlank }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fiches CEE pertinentes détectées
          </DialogTitle>
          <DialogDescription>
            {candidates.length} fiche{candidates.length > 1 ? "s" : ""} CEE pertinente{candidates.length > 1 ? "s" : ""} détectée{candidates.length > 1 ? "s" : ""} depuis cet audit. Sélectionnez celle que vous souhaitez créer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left rounded-lg border bg-background p-3 flex items-start gap-3",
                "transition-colors hover:border-primary/40 hover:bg-primary/5",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <Badge variant="secondary" className="font-mono text-[11px] shrink-0">{c.id}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{c.raison}</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                Priorité {c.priorite}
              </Badge>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCreateBlank}>
            Créer une note vierge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
