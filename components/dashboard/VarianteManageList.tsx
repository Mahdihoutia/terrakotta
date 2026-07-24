"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, GitCompare } from "lucide-react";
import VarianteCreateDialog from "@/components/dashboard/VarianteCreateDialog";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

interface GesteRow {
  code: string;
  quantite: string;
  coutHT: string;
}

export interface VarianteItem {
  id: string;
  nom: string;
  description: string | null;
  gestes: GesteRow[];
}

interface Props {
  projetId: string;
  variantes: VarianteItem[];
}

/**
 * Liste des variantes enregistrées avec actions d'édition et de suppression.
 * Complète le comparateur (lecture) par la gestion (modifier / supprimer),
 * puisque l'ancien flux ne permettait que créer + comparer.
 */
export default function VarianteManageList({ projetId, variantes }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (variantes.length === 0) return null;

  async function handleDelete(v: VarianteItem) {
    if (!confirm(`Supprimer la variante « ${v.nom} » ?`)) return;
    setBusyId(v.id);
    try {
      const res = await fetch(`/api/projets/${projetId}/variantes/${v.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      toast.success("Variante supprimée");
      router.refresh();
    } catch (err) {
      showNetworkError(err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-lg border border-tk-border bg-tk-surface">
      <header className="flex items-center gap-2 border-b border-tk-border bg-tk-bg/40 px-4 py-2.5">
        <GitCompare className="h-3.5 w-3.5 text-tk-text-faint" />
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-tk-text-muted">
          Variantes enregistrées
        </h2>
        <span className="text-[11px] text-tk-text-faint">{variantes.length}</span>
      </header>
      <ul className="divide-y divide-tk-border/60">
        {variantes.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-tk-text">{v.nom}</p>
              <p className="truncate text-[11px] text-tk-text-muted">
                {v.gestes.length} geste{v.gestes.length > 1 ? "s" : ""}
                {v.description ? ` · ${v.description}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <VarianteCreateDialog
                projetId={projetId}
                existingVariante={v}
              />
              <button
                onClick={() => handleDelete(v)}
                disabled={busyId === v.id}
                aria-label="Supprimer la variante"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-tk-text-faint hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
              >
                {busyId === v.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
