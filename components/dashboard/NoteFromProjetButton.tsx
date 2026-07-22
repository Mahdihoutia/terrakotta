"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ruler, Loader2, ChevronDown } from "lucide-react";
import { showApiError, showNetworkError } from "@/lib/api-errors";

interface Props {
  projetId: string;
}

/** Équipements dimensionnables — reflète FICHES_DISPONIBLES côté serveur. */
const EQUIPEMENTS: Array<{ fiche: string; label: string; groupe: string }> = [
  { fiche: "BAT-TH-163", label: "PAC air/eau (tertiaire)", groupe: "Production de chaleur" },
  { fiche: "BAR-TH-171", label: "PAC air/eau (résidentiel collectif)", groupe: "Production de chaleur" },
  { fiche: "BAR-TH-159", label: "PAC hybride (résidentiel)", groupe: "Production de chaleur" },
  { fiche: "BAT-TH-142", label: "Déstratification de l'air", groupe: "Chauffage / régulation" },
  { fiche: "BAT-TH-116", label: "GTB — gestion technique du bâtiment", groupe: "Chauffage / régulation" },
  { fiche: "BAT-TH-134", label: "Régulation HP flottante (froid)", groupe: "Froid" },
  { fiche: "BAT-TH-139", label: "Récupération de chaleur (froid)", groupe: "Froid" },
  { fiche: "BAR-EN-101", label: "Isolation combles / toiture", groupe: "Enveloppe" },
  { fiche: "BAR-EN-102", label: "Isolation des murs", groupe: "Enveloppe" },
  { fiche: "BAR-EN-103", label: "Isolation d'un plancher", groupe: "Enveloppe" },
];

const GROUPES = ["Production de chaleur", "Chauffage / régulation", "Froid", "Enveloppe"];

/**
 * Crée une Note de dimensionnement PRÉ-REMPLIE depuis le projet, pour
 * l'ÉQUIPEMENT choisi (PAC, déstratificateur, GTB, isolation…).
 *
 * Flux : choix de la fiche → fetch prefill projet (identité + bâti +
 * systèmes + calibration, champs adaptés à la fiche) → stockage dans le
 * canal localStorage partagé → navigation vers l'éditeur Note, qui pose
 * projetId. La note apparaît ensuite dans l'onglet Livrables.
 */
export default function NoteFromProjetButton({ projetId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function creerNote(fiche: string) {
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projets/${projetId}/note-prefill?fiche=${encodeURIComponent(fiche)}`,
      );
      if (!res.ok) {
        await showApiError(res, "Pré-remplissage de la note");
        return;
      }
      const payload = await res.json();
      localStorage.setItem(
        "kilowater:audit-to-note-prefill",
        JSON.stringify(payload),
      );
      router.push("/dashboard/documents?create=note");
    } catch (err) {
      showNetworkError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[12px] font-medium text-violet-700 transition-colors hover:bg-violet-500/20 disabled:opacity-60 dark:text-violet-300"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Ruler className="h-3.5 w-3.5" />
        )}
        Note de dimensionnement
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-lg border border-tk-border bg-tk-surface shadow-lg">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-tk-text-faint">
            Choisir l&apos;équipement à dimensionner
          </div>
          <div className="max-h-80 overflow-y-auto pb-1">
            {GROUPES.map((groupe) => (
              <div key={groupe}>
                <div className="px-3 pt-2 pb-0.5 text-[10px] font-semibold text-tk-text-muted">
                  {groupe}
                </div>
                {EQUIPEMENTS.filter((e) => e.groupe === groupe).map((e) => (
                  <button
                    key={e.fiche}
                    onClick={() => creerNote(e.fiche)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12px] text-tk-text hover:bg-tk-hover"
                  >
                    <span>{e.label}</span>
                    <span className="shrink-0 rounded bg-tk-hover px-1.5 py-0.5 font-mono text-[10px] text-tk-text-muted">
                      {e.fiche}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
