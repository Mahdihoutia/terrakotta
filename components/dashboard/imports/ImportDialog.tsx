"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Loader2, X, CheckCircle2, AlertCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Step = "upload" | "mapping" | "preview" | "progress";

interface PreviewResponse {
  headers: string[];
  detectedMapping: Record<string, string | null>;
  sampleRows: Record<string, unknown>[];
  allRows: Record<string, unknown>[];
  totalRows: number;
  previewErrors: { row: number; field: string; message: string }[];
}

interface ImportStatusResponse {
  id: string;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  totalRows: number;
  processedRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  errorsJson: unknown;
}

interface Props {
  entity: "contact";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: (importId: string) => void;
}

const CONTACT_FIELDS: { value: string; label: string; required?: boolean }[] = [
  { value: "nom", label: "Nom", required: true },
  { value: "prenom", label: "Prénom" },
  { value: "email", label: "Email" },
  { value: "telephone", label: "Téléphone" },
  { value: "raisonSociale", label: "Société" },
  { value: "fonction", label: "Fonction" },
  { value: "notes", label: "Notes" },
];

export default function ImportDialog({ open, onOpenChange, onDone }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [importId, setImportId] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportStatusResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setUploading(false);
    setPreview(null);
    setFilename("");
    setMapping({});
    setImportId(null);
    setStatus(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Polling de l'avancement pendant l'étape 4.
  useEffect(() => {
    if (step !== "progress" || !importId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/imports/${importId}`);
        if (!res.ok) return;
        const data: ImportStatusResponse = await res.json();
        if (cancelled) return;
        setStatus(data);
        if (data.status === "DONE") {
          toast.success(`Import terminé — ${data.importedRows} contact(s) créé(s)`);
          onDone?.(importId);
        }
      } catch {
        // silencieux : retry au prochain tick
      }
    };
    void tick();
    const id = setInterval(() => {
      if (status?.status === "DONE" || status?.status === "FAILED") return;
      void tick();
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [step, importId, onDone, status?.status]);

  async function handleFile(file: File) {
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      toast.error("Format non supporté (.csv ou .xlsx uniquement)");
      return;
    }
    setFilename(file.name);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/imports/contacts/preview", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? `Erreur ${res.status}`);
        setUploading(false);
        return;
      }
      const data: PreviewResponse = await res.json();
      // Lire le fichier une 2e fois côté client pour récupérer toutes les rows
      // (le preview ne renvoie que les 10 premières). Comme on n'a pas xlsx
      // côté client, on s'appuie sur sampleRows pour le rendu et on renverra
      // au commit ce qui aura été reparsed via une 2e requête.
      setPreview(data);
      setMapping(data.detectedMapping);
      setStep("mapping");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setUploading(false);
    }
  }

  async function handleCommit() {
    if (!preview) {
      toast.error("Aperçu manquant");
      return;
    }
    const normalizedRows = preview.allRows.map((r) =>
      remapRow(r, mapping, preview.detectedMapping)
    );

    const commitRes = await fetch("/api/imports/contacts/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        mapping,
        rows: normalizedRows,
      }),
    });
    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => null);
      toast.error(err?.error ?? `Erreur ${commitRes.status}`);
      return;
    }
    const { importId: id } = (await commitRes.json()) as { importId: string };
    setImportId(id);
    setStep("progress");
  }

  // Si le mapping a été modifié par l'utilisateur, on re-normalise les sample
  // rows à partir du raw (sample contient les valeurs déjà mappées via le
  // detectedMapping initial). Approche simple : on regarde les rows brutes
  // via headers (préservés dans preview.headers).
  function remapRow(
    mappedRow: Record<string, unknown>,
    currentMapping: Record<string, string | null>,
    initialMapping: Record<string, string | null>
  ): Record<string, unknown> {
    // Reconstitue (header → value) depuis la sampleRow + initialMapping
    const byHeader: Record<string, unknown> = {};
    for (const [header, field] of Object.entries(initialMapping)) {
      if (field && field in mappedRow) {
        byHeader[header] = (mappedRow as Record<string, unknown>)[field];
      }
    }
    const out: Record<string, unknown> = {};
    for (const [header, field] of Object.entries(currentMapping)) {
      if (!field) continue;
      out[field] = byHeader[header] ?? null;
    }
    return out;
  }

  const missingRequired = CONTACT_FIELDS.filter(
    (f) => f.required && !Object.values(mapping).includes(f.value)
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="glass relative w-full max-w-2xl rounded-2xl border border-tk-border bg-tk-bg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-tk-text-faint hover:text-tk-text"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-tk-text">Importer des contacts</h2>
              <p className="text-xs text-tk-text-faint">
                Fichier CSV ou Excel (.xlsx) — 1000 lignes max, 5 Mo max
              </p>
            </div>
            <label
              htmlFor="import-file-input"
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-tk-border bg-tk-surface px-6 py-12 text-center transition hover:bg-tk-hover",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="mb-2 h-6 w-6 animate-spin text-tk-text-faint" />
                  <p className="text-sm text-tk-text-muted">Analyse du fichier…</p>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-6 w-6 text-tk-text-faint" />
                  <p className="text-sm text-tk-text">Glissez-déposez ou cliquez pour choisir</p>
                  <p className="mt-1 text-xs text-tk-text-faint">.csv, .xlsx</p>
                </>
              )}
              <input
                id="import-file-input"
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </label>
            <a
              href="/templates/contacts-import-template.xlsx"
              className="inline-flex items-center gap-2 text-xs text-tk-text-secondary hover:text-tk-text"
              download
            >
              <FileDown className="h-3.5 w-3.5" />
              Télécharger le modèle .xlsx
            </a>
          </div>
        )}

        {step === "mapping" && preview && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-tk-text">Mapping des colonnes</h2>
              <p className="text-xs text-tk-text-faint">
                {preview.totalRows} lignes détectées dans {filename}
              </p>
            </div>
            <div className="max-h-80 overflow-auto rounded-xl border border-tk-border">
              <table className="w-full text-sm">
                <thead className="bg-tk-surface">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-tk-text-muted">
                      Colonne du fichier
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-tk-text-muted">
                      Champ Kilowater
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.headers.map((h) => (
                    <tr key={h} className="border-t border-tk-border">
                      <td className="px-3 py-2 text-tk-text">{h}</td>
                      <td className="px-3 py-2">
                        <select
                          value={mapping[h] ?? ""}
                          onChange={(e) =>
                            setMapping({ ...mapping, [h]: e.target.value || null })
                          }
                          className="w-full rounded-lg border border-tk-border bg-tk-surface px-2 py-1 text-xs text-tk-text"
                        >
                          <option value="">— Ignorer cette colonne —</option>
                          {CONTACT_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                              {f.required ? " (requis)" : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {missingRequired.length > 0 && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                Champs requis manquants : {missingRequired.map((f) => f.label).join(", ")}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("upload")}>
                Retour
              </Button>
              <Button
                size="sm"
                disabled={missingRequired.length > 0}
                onClick={() => setStep("preview")}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-tk-text">Aperçu</h2>
              <p className="text-xs text-tk-text-faint">Vérifiez avant d'importer</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-tk-border bg-tk-surface p-3">
                <p className="text-2xl font-bold text-tk-text">{preview.allRows.length}</p>
                <p className="text-[10px] text-tk-text-faint">Lignes prêtes</p>
              </div>
              <div className="rounded-xl border border-tk-border bg-tk-surface p-3">
                <p className="text-2xl font-bold text-tk-text">{preview.previewErrors.length}</p>
                <p className="text-[10px] text-tk-text-faint">Erreurs détectées</p>
              </div>
              <div className="rounded-xl border border-tk-border bg-tk-surface p-3">
                <p className="text-2xl font-bold text-tk-text">{preview.totalRows}</p>
                <p className="text-[10px] text-tk-text-faint">Total dans le fichier</p>
              </div>
            </div>
            {preview.previewErrors.length > 0 && (
              <div className="max-h-32 overflow-auto rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-400">
                {preview.previewErrors.map((e, i) => (
                  <div key={i}>
                    Ligne {e.row} — {e.field} : {e.message}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("mapping")}>
                Retour
              </Button>
              <Button size="sm" onClick={handleCommit}>
                Importer {preview.allRows.length} contact(s)
              </Button>
            </div>
          </div>
        )}

        {step === "progress" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-tk-text">
              {status?.status === "DONE"
                ? "Import terminé"
                : status?.status === "FAILED"
                  ? "Import échoué"
                  : "Traitement en cours…"}
            </h2>
            {status && status.status === "DONE" && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">
                  {status.importedRows} importé(s) · {status.skippedRows} doublons ignorés ·{" "}
                  {status.errorRows} erreur(s)
                </span>
              </div>
            )}
            {status && status.status === "FAILED" && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Une erreur est survenue pendant l'import</span>
              </div>
            )}
            {status && status.status !== "DONE" && status.status !== "FAILED" && (
              <>
                <Progress
                  value={status.processedRows}
                  max={Math.max(status.totalRows, 1)}
                />
                <p className="text-xs text-tk-text-faint">
                  {status.processedRows} / {status.totalRows} lignes
                </p>
              </>
            )}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
