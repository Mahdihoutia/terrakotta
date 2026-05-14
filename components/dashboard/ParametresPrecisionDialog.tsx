"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Loader2, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

type Inertie = "LEGERE" | "MOYENNE" | "LOURDE";
type ZoneRevenu = "IDF" | "AUTRES";

interface InitialValues {
  nbOccupants: number | null;
  inertie: Inertie | null;
  intermittenceChauffage: boolean;
  permeabiliteAir: number | null;
  consoFactureChauffage: number | null;
  consoFactureECS: number | null;
  nbPersonnesFoyer: number | null;
  rfrFoyer: number | null;
  zoneRevenuFoyer: ZoneRevenu | null;
}

interface Props {
  projetId: string;
  initial: InitialValues;
  /** Catégorie de cible du projet — n'affiche la section foyer MPR que pour PARTICULIER. */
  categorieCible: string;
}

export default function ParametresPrecisionDialog({ projetId, initial, categorieCible }: Props) {
  const showFoyer = categorieCible === "PARTICULIER";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nbOccupants, setNbOccupants] = useState(initial.nbOccupants?.toString() ?? "");
  const [inertie, setInertie] = useState<Inertie | "">(initial.inertie ?? "");
  const [intermittence, setIntermittence] = useState(initial.intermittenceChauffage);
  const [permea, setPermea] = useState(initial.permeabiliteAir?.toString() ?? "");
  const [conChauf, setConChauf] = useState(initial.consoFactureChauffage?.toString() ?? "");
  const [conEcs, setConEcs] = useState(initial.consoFactureECS?.toString() ?? "");
  const [nbFoyer, setNbFoyer] = useState(initial.nbPersonnesFoyer?.toString() ?? "");
  const [rfr, setRfr] = useState(initial.rfrFoyer?.toString() ?? "");
  const [zoneFoyer, setZoneFoyer] = useState<ZoneRevenu | "">(initial.zoneRevenuFoyer ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nbOccupants: nbOccupants ? Number(nbOccupants) : null,
        inertie: inertie || null,
        intermittenceChauffage: intermittence,
        permeabiliteAir: permea ? Number(permea) : null,
        consoFactureChauffage: conChauf ? Number(conChauf) : null,
        consoFactureECS: conEcs ? Number(conEcs) : null,
        nbPersonnesFoyer: showFoyer && nbFoyer ? Number(nbFoyer) : null,
        rfrFoyer: showFoyer && rfr ? Number(rfr) : null,
        zoneRevenuFoyer: showFoyer ? (zoneFoyer || null) : null,
      };
      const res = await fetch(`/api/projets/${projetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        await showApiError(res, "Sauvegarde impossible");
        return;
      }
      toast.success("Paramètres enregistrés — recalcul en cours");
      setOpen(false);
      router.refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-8">
        <Settings2 className="mr-1 h-3.5 w-3.5" />
        Précision
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-xl border border-tk-border bg-tk-surface p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-tk-text">Précision thermique &amp; calibration</h2>
                <p className="text-[11px] text-tk-text-muted mt-0.5">
                  Affine le calcul Cep / DPE en saisissant les paramètres réels du logement.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-tk-text-faint hover:bg-tk-hover"><X className="h-4 w-4" /></button>
            </div>

            <section className="space-y-3 border-b border-tk-border pb-4">
              <p className="field-label-tiny">Saisie occupants &amp; bâti</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre d'occupants">
                  <input
                    type="number" min="0" max="20" step="1"
                    value={nbOccupants}
                    onChange={(e) => setNbOccupants(e.target.value)}
                    placeholder="auto (Nadeq surface)"
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                  />
                  <Hint>Vide = Nadeq calculé depuis surface (DPE 2021)</Hint>
                </Field>

                <Field label="Inertie thermique">
                  <select value={inertie} onChange={(e) => setInertie(e.target.value as Inertie | "")} className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[13px]">
                    <option value="">Auto (Moyenne)</option>
                    <option value="LEGERE">Légère — bardage bois, ossature</option>
                    <option value="MOYENNE">Moyenne — brique, parpaing</option>
                    <option value="LOURDE">Lourde — pierre, béton plein</option>
                  </select>
                  <Hint>Impacte η_gn (utilisation apports gratuits)</Hint>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Programmation chauffage">
                  <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-tk-border bg-tk-input cursor-pointer">
                    <input
                      type="checkbox" checked={intermittence}
                      onChange={(e) => setIntermittence(e.target.checked)}
                    />
                    <span className="text-[13px] text-tk-text-secondary">Intermittence nuit / WE</span>
                  </label>
                  <Hint>Réduit Bch d&apos;environ −10 %</Hint>
                </Field>

                <Field label="Perméabilité Q4Pa-surf">
                  <input
                    type="number" min="0" max="5" step="0.1"
                    value={permea}
                    onChange={(e) => setPermea(e.target.value)}
                    placeholder="défaut 1.7"
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                  />
                  <Hint>m³/h·m² · 0.6 BBC, 1.7 RT 2005, 3.5 avant 1975</Hint>
                </Field>
              </div>
            </section>

            <section className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <p className="field-label-tiny mb-0">Calibration facture</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-tk-primary/10 px-2 py-0.5 text-[10px] font-medium text-tk-primary">
                  <Info className="h-2.5 w-2.5" />
                  Crédibilité ingénieur
                </span>
              </div>
              <p className="text-[11px] text-tk-text-muted">
                Si tu connais la conso annuelle réelle (moyenne 3 ans), elle calibre le Bch calculé via un facteur correcteur k = facture / calculé.
                Plage acceptée : 0,5 à 2,0.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Conso chauffage (kWh EF/an)">
                  <input
                    type="number" min="0" step="100"
                    value={conChauf}
                    onChange={(e) => setConChauf(e.target.value)}
                    placeholder="ex: 22 000"
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                  />
                </Field>
                <Field label="Conso ECS (kWh EF/an)">
                  <input
                    type="number" min="0" step="100"
                    value={conEcs}
                    onChange={(e) => setConEcs(e.target.value)}
                    placeholder="ex: 2 500"
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                  />
                </Field>
              </div>
            </section>

            {showFoyer && (
            <section className="space-y-3 border-t border-tk-border pt-4 mt-4">
              <div className="flex items-center gap-2">
                <p className="field-label-tiny mb-0">Foyer demandeur — MaPrimeRénov&apos;</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-tk-primary/10 px-2 py-0.5 text-[10px] font-medium text-tk-primary">
                  <Info className="h-2.5 w-2.5" />
                  Catégorie ressources
                </span>
              </div>
              <p className="text-[11px] text-tk-text-muted">
                Détermine la catégorie BLEU / JAUNE / VIOLET / ROSE et donc les forfaits MPR
                appliqués au plan de financement. Sans ces valeurs, les montants affichés sont
                indicatifs (foyer démo).
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Personnes du foyer">
                  <input
                    type="number" min="1" max="15" step="1"
                    value={nbFoyer}
                    onChange={(e) => setNbFoyer(e.target.value)}
                    placeholder="ex: 4"
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                  />
                </Field>
                <Field label="RFR (€/an)">
                  <input
                    type="number" min="0" step="500"
                    value={rfr}
                    onChange={(e) => setRfr(e.target.value)}
                    placeholder="ex: 28 000"
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                  />
                  <Hint>Revenu fiscal de référence</Hint>
                </Field>
                <Field label="Zone géographique">
                  <select
                    value={zoneFoyer}
                    onChange={(e) => setZoneFoyer(e.target.value as ZoneRevenu | "")}
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[13px]"
                  >
                    <option value="">— Choisir —</option>
                    <option value="IDF">Île-de-France</option>
                    <option value="AUTRES">Autres régions</option>
                  </select>
                </Field>
              </div>
            </section>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Settings2 className="mr-1 h-3.5 w-3.5" />}
                Enregistrer
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
      <p className="text-[11px] font-medium text-tk-text-secondary mb-1">{label}</p>
      {children}
    </div>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[10.5px] text-tk-text-faint leading-snug">{children}</p>;
}
