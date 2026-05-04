"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

const GESTES = [
  { code: "ISOLATION_MURS_ITE", label: "ITE — Isolation murs ext." },
  { code: "ISOLATION_MURS_ITI", label: "ITI — Isolation murs int." },
  { code: "ISOLATION_COMBLES", label: "Isolation combles" },
  { code: "ISOLATION_PLANCHER_BAS", label: "Isolation plancher bas" },
  { code: "ISOLATION_TOITURE_TERRASSE", label: "Isolation toiture-terrasse" },
  { code: "MENUISERIES", label: "Menuiseries" },
  { code: "VMC_DOUBLE_FLUX", label: "VMC double flux" },
  { code: "PAC_AIR_EAU", label: "PAC air/eau" },
  { code: "PAC_GEOTHERMIQUE", label: "PAC géothermique" },
  { code: "CHAUDIERE_BIOMASSE", label: "Chaudière biomasse" },
  { code: "POELE_GRANULES", label: "Poêle à granulés" },
  { code: "CHAUFFE_EAU_THERMODYNAMIQUE", label: "CET (chauffe-eau thermo)" },
  { code: "CHAUFFE_EAU_SOLAIRE", label: "Chauffe-eau solaire" },
  { code: "DEPOSE_CUVE_FIOUL", label: "Dépose cuve fioul" },
  { code: "AUDIT_ENERGETIQUE", label: "Audit énergétique" },
] as const;

interface GesteRow {
  code: string;
  quantite: string;
  coutHT: string;
}

interface Props {
  projetId: string;
}

export default function VarianteCreateDialog({ projetId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [gestes, setGestes] = useState<GesteRow[]>([
    { code: "ISOLATION_MURS_ITE", quantite: "100", coutHT: "20000" },
  ]);

  function reset() {
    setNom(""); setDescription("");
    setGestes([{ code: "ISOLATION_MURS_ITE", quantite: "100", coutHT: "20000" }]);
  }

  function addGeste() {
    setGestes((g) => [...g, { code: "ISOLATION_COMBLES", quantite: "80", coutHT: "4000" }]);
  }
  function removeGeste(i: number) {
    setGestes((g) => g.filter((_, idx) => idx !== i));
  }
  function updateGeste(i: number, patch: Partial<GesteRow>) {
    setGestes((g) => g.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Nom requis");
      return;
    }
    const parsedGestes = gestes
      .map((row) => ({
        code: row.code,
        quantite: Number(row.quantite),
        coutHT: Number(row.coutHT),
      }))
      .filter((g) => g.quantite > 0 && g.coutHT >= 0);
    if (parsedGestes.length === 0) {
      toast.error("Au moins un geste avec quantité et coût valides");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projets/${projetId}/variantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          description: description.trim() || null,
          type: "VARIANTE",
          inputs: { gestes: parsedGestes },
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Création impossible");
        return;
      }
      toast.success(`Variante "${nom}" créée`);
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-tk-border bg-tk-surface px-2.5 py-1 text-[12px] font-medium text-tk-text-secondary hover:border-tk-border-hover hover:text-tk-text"
      >
        <Plus className="h-3 w-3" />
        Ajouter une variante
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-xl border border-tk-border bg-tk-surface p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-tk-text">Nouvelle variante de rénovation</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-tk-text-faint hover:bg-tk-hover">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Nom *">
                <input
                  type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Bouquet 1 — Enveloppe"
                  className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px]"
                  autoFocus
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="ITE laine de bois 16 cm, isolation combles 30 cm, menuiseries triple vitrage…"
                  rows={2}
                  className="w-full resize-none rounded-md border border-tk-border bg-tk-input px-3 py-2 text-[13px]"
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="field-label-tiny">Gestes de travaux</p>
                  <button type="button" onClick={addGeste} className="text-[11px] font-medium text-tk-primary hover:underline">
                    + Ajouter un geste
                  </button>
                </div>
                <div className="space-y-1.5">
                  {gestes.map((g, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={g.code}
                        onChange={(e) => updateGeste(i, { code: e.target.value })}
                        className="h-8 flex-1 rounded-md border border-tk-border bg-tk-input px-2 text-[12px]"
                      >
                        {GESTES.map((opt) => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
                      </select>
                      <input
                        type="number" value={g.quantite}
                        onChange={(e) => updateGeste(i, { quantite: e.target.value })}
                        placeholder="Qté"
                        className="h-8 w-20 rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
                      />
                      <input
                        type="number" value={g.coutHT}
                        onChange={(e) => updateGeste(i, { coutHT: e.target.value })}
                        placeholder="€ HT"
                        className="h-8 w-24 rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => removeGeste(i)}
                        disabled={gestes.length === 1}
                        className="rounded p-1 text-tk-text-faint hover:bg-tk-hover hover:text-red-500 disabled:opacity-30"
                        aria-label="Retirer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
                Créer la variante
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="field-label-tiny mb-1">{label}</p>
      {children}
    </div>
  );
}
