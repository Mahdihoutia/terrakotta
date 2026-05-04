"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

interface Props {
  projetId: string;
}

export default function RapportProjetExportButton({ projetId }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/projets/${projetId}/rapport-pdf`);
      if (!res.ok) {
        await showApiError(res, "Génération du rapport impossible");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="?([^";]+)"?/)?.[1] ?? `rapport-audit.pdf`;
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
      setDownloading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleExport} disabled={downloading} className="h-8">
      {downloading ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="mr-1 h-3.5 w-3.5" />
      )}
      Exporter rapport (PDF)
    </Button>
  );
}
