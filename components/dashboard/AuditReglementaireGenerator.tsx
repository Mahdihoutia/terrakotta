"use client";

import { useState } from "react";
import { FileDown, FileText, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";

type Categorie = "TERTIAIRE" | "RESIDENTIEL_COLLECTIF";
type Format = "pdf" | "word";

interface Props {
  projetId: string;
  defaultCategorie?: Categorie;
}

export default function AuditReglementaireGenerator({
  projetId,
  defaultCategorie = "TERTIAIRE",
}: Props) {
  const [categorie, setCategorie] = useState<Categorie>(defaultCategorie);
  const [auteur, setAuteur] = useState("Bureau d'étude Kilowater");
  const [downloading, setDownloading] = useState<Format | null>(null);

  async function download(format: Format) {
    setDownloading(format);
    try {
      const res = await fetch(`/api/projets/${projetId}/audit-reglementaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorie, auteur, format }),
      });
      if (!res.ok) {
        await showApiError(res, `Génération audit ${format.toUpperCase()}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-reglementaire-${projetId.slice(-8)}.${format === "pdf" ? "pdf" : "docx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Audit ${format.toUpperCase()} téléchargé`);
    } catch (err) {
      showNetworkError(err);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="rounded-xl border border-tk-border bg-tk-surface p-5 space-y-4">
      <div>
        <h2 className="text-[14px] font-semibold text-tk-text flex items-center gap-2">
          <FileText className="h-4 w-4 text-tk-primary" />
          Générer un audit énergétique réglementaire
        </h2>
        <p className="mt-1 text-[12px] text-tk-text-muted">
          Livrable normé (arrêté 30 avril 2022 tertiaire ou cahier ADEME copro) avec 3 scénarios
          obligatoires chiffrés (25-40 %, 40-60 %, &gt; 60 %). Utilise le Bâti + Systèmes du projet
          et les variantes de rénovation existantes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-[11px] text-tk-text-muted">
          Catégorie du bâtiment
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as Categorie)}
            className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
          >
            <option value="TERTIAIRE">Tertiaire (arrêté 30/04/2022)</option>
            <option value="RESIDENTIEL_COLLECTIF">Résidentiel collectif (cahier ADEME)</option>
          </select>
        </label>
        <label className="text-[11px] text-tk-text-muted">
          Rédigé par
          <input
            type="text"
            value={auteur}
            onChange={(e) => setAuteur(e.target.value)}
            className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          onClick={() => download("pdf")}
          disabled={downloading !== null}
          className="w-full"
        >
          {downloading === "pdf" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileDown className="h-3.5 w-3.5" />
          )}
          Télécharger PDF
        </Button>
        <Button
          onClick={() => download("word")}
          disabled={downloading !== null}
          variant="outline"
          className="w-full"
        >
          {downloading === "word" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          Télécharger Word (.docx)
        </Button>
      </div>

      <p className="flex items-start gap-1.5 rounded-md bg-tk-hover/40 p-2 text-[11px] text-tk-text-muted leading-relaxed">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Si le projet contient au moins 3 variantes de rénovation, elles seront utilisées. Sinon,
        des scénarios types (isolation légère / mixte / rénovation BBC) sont appliqués sur la
        baseline du projet.
      </p>
    </section>
  );
}
