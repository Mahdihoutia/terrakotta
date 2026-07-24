"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

interface Props {
  batimentId: string;
  batimentNom: string;
}

/**
 * Supprime (soft-delete) un bâtiment depuis l'onglet Bâti du projet.
 * Retire le bâtiment du projet — il reste récupérable via la corbeille.
 */
export default function BatimentDeleteButton({ batimentId, batimentNom }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Retirer le bâtiment « ${batimentNom} » de ce projet ?\nSes zones et parois affectées seront détachées du calcul.`,
      )
    )
      return;
    setLoading(true);
    try {
      const res = await fetch(`/api/batiments/${batimentId}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression du bâtiment");
        return;
      }
      toast.success("Bâtiment retiré");
      router.refresh();
    } catch (err) {
      showNetworkError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      aria-label="Supprimer le bâtiment"
      className="inline-flex h-7 w-7 items-center justify-center rounded text-tk-text-faint hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
