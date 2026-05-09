"use client";

import { useEffect, useState } from "react";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

interface Props {
  projetId: string;
}

interface VarianteOption {
  id: string;
  nom: string;
}

type Format = "pdf" | "word";

export default function RapportProjetExportButton({ projetId }: Props) {
  const [downloading, setDownloading] = useState<Format | null>(null);
  const [variantes, setVariantes] = useState<VarianteOption[]>([]);
  const [varianteId, setVarianteId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projets/${projetId}/variantes`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { id: string; nom: string; type: string }[]) => {
        if (cancelled || !Array.isArray(list)) return;
        setVariantes(list.filter((v) => v.type === "VARIANTE"));
      })
      .catch(() => {
        /* silencieux : la sélection variante reste optionnelle */
      });
    return () => {
      cancelled = true;
    };
  }, [projetId]);

  async function handleExport(format: Format) {
    setDownloading(format);
    try {
      const qs = varianteId ? `?varianteId=${encodeURIComponent(varianteId)}` : "";
      const path = format === "pdf" ? "rapport-pdf" : "rapport-word";
      const res = await fetch(`/api/projets/${projetId}/${path}${qs}`);
      if (!res.ok) {
        await showApiError(res, "Génération du rapport impossible");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const fallback = `rapport-audit.${format === "pdf" ? "pdf" : "docx"}`;
      const filename =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="?([^";]+)"?/)?.[1] ?? fallback;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Rapport téléchargé");
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {variantes.length > 0 && (
        <select
          value={varianteId}
          onChange={(e) => setVarianteId(e.target.value)}
          disabled={downloading !== null}
          className="h-8 rounded-md border border-tk-border bg-tk-surface px-2 text-[12px] text-tk-text focus:border-tk-primary focus:outline-none disabled:opacity-60"
          aria-label="Scénario à exporter"
        >
          <option value="">État existant</option>
          {variantes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nom}
            </option>
          ))}
        </select>
      )}
      <Button
        size="sm"
        onClick={() => handleExport("pdf")}
        disabled={downloading !== null}
        className="h-8"
      >
        {downloading === "pdf" ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileDown className="mr-1 h-3.5 w-3.5" />
        )}
        PDF
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleExport("word")}
        disabled={downloading !== null}
        className="h-8"
      >
        {downloading === "word" ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="mr-1 h-3.5 w-3.5" />
        )}
        Word
      </Button>
    </div>
  );
}
