"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { showApiError, showNetworkError } from "@/lib/api-errors";

interface Props {
  projetId: string;
}

/**
 * Crée un Audit énergétique PRÉ-REMPLI depuis les données du projet.
 *
 * Flux : fetch du prefill projet (identité + bâti + systèmes + DPE +
 * déperditions + DEET + consos calibrées) → stockage dans le canal
 * localStorage dédié → navigation vers l'éditeur Audit du module Documents,
 * qui lit le prefill et pose projetId. L'audit apparaît ensuite
 * automatiquement dans cet onglet Livrables.
 */
export default function AuditFromProjetButton({ projetId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function creerAudit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projets/${projetId}/audit-prefill`);
      if (!res.ok) {
        await showApiError(res, "Pré-remplissage de l'audit");
        return;
      }
      const payload = await res.json();
      localStorage.setItem(
        "kilowater:projet-to-audit-prefill",
        JSON.stringify(payload),
      );
      router.push("/dashboard/documents?create=audit");
    } catch (err) {
      showNetworkError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={creerAudit}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-500/20 disabled:opacity-60 dark:text-amber-300"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5" />
      )}
      Audit énergétique (pré-rempli)
    </button>
  );
}
