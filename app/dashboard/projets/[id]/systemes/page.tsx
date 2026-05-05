"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Cog, Plus, Trash2, Loader2, Flame, Droplets, Wind, Snowflake, X, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SystemeType = "CHAUFFAGE" | "ECS" | "VENTILATION" | "CLIMATISATION" | "PHOTOVOLTAIQUE";
type SystemeVecteur = "ELEC" | "GAZ_NATUREL" | "FIOUL" | "BOIS" | "PROPANE" | "RESEAU_CHALEUR";

interface Systeme {
  id: string;
  type: SystemeType;
  vecteur: SystemeVecteur;
  nom: string;
  rendement: number;
  partCouverture: number;
  cop: number | null;
  notes: string | null;
}

const TYPE_META: Record<SystemeType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CHAUFFAGE: { label: "Chauffage", icon: Flame, color: "text-orange-500" },
  ECS: { label: "ECS", icon: Droplets, color: "text-sky-500" },
  VENTILATION: { label: "Ventilation", icon: Wind, color: "text-emerald-500" },
  CLIMATISATION: { label: "Climatisation", icon: Snowflake, color: "text-blue-500" },
  PHOTOVOLTAIQUE: { label: "Photovoltaïque", icon: Sun, color: "text-amber-500" },
};

const VECTEUR_LABEL: Record<SystemeVecteur, string> = {
  ELEC: "Électricité",
  GAZ_NATUREL: "Gaz naturel",
  FIOUL: "Fioul",
  BOIS: "Bois / granulés",
  PROPANE: "Propane / GPL",
  RESEAU_CHALEUR: "Réseau de chaleur",
};

interface FormState {
  type: SystemeType;
  vecteur: SystemeVecteur;
  nom: string;
  rendement: string;
  partCouverture: string;
  cop: string;
  puissanceKwc: string;
  tauxAutoconso: string;
}

const EMPTY_FORM: FormState = {
  type: "CHAUFFAGE",
  vecteur: "GAZ_NATUREL",
  nom: "",
  rendement: "0.85",
  partCouverture: "1",
  cop: "",
  puissanceKwc: "3",
  tauxAutoconso: "0.4",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SystemesTabPage({ params }: PageProps) {
  const { id: projetId } = use(params);

  const [systemes, setSystemes] = useState<Systeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projets/${projetId}/systemes`, { cache: "no-store" });
      if (!res.ok) {
        await showApiError(res, "Chargement des systèmes impossible");
        return;
      }
      setSystemes(await res.json());
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [projetId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleCreate() {
    if (!form.nom.trim()) {
      toast.error("Nom du système requis");
      return;
    }
    const rendement = parseFloat(form.rendement);
    const partCouverture = parseFloat(form.partCouverture);
    const cop = form.cop ? parseFloat(form.cop) : null;
    if (Number.isNaN(rendement) || rendement <= 0) {
      toast.error("Rendement invalide");
      return;
    }
    setSubmitting(true);
    try {
      const isPV = form.type === "PHOTOVOLTAIQUE";
      const puissanceKwc = isPV && form.puissanceKwc ? parseFloat(form.puissanceKwc) : null;
      const tauxAutoconso = isPV && form.tauxAutoconso ? parseFloat(form.tauxAutoconso) : null;
      const res = await fetch(`/api/projets/${projetId}/systemes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type, vecteur: isPV ? "ELEC" : form.vecteur, nom: form.nom.trim(),
          rendement, partCouverture: Number.isNaN(partCouverture) ? 1 : partCouverture,
          cop: !isPV && cop && !Number.isNaN(cop) ? cop : null,
          puissanceKwc: puissanceKwc && !Number.isNaN(puissanceKwc) ? puissanceKwc : null,
          tauxAutoconso: tauxAutoconso != null && !Number.isNaN(tauxAutoconso) ? tauxAutoconso : null,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Création impossible");
        return;
      }
      toast.success("Système créé");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(s: Systeme) {
    if (!confirm(`Supprimer le système "${s.nom}" ?`)) return;
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/systemes/${s.id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      setSystemes((prev) => prev.filter((x) => x.id !== s.id));
      toast.success("Système supprimé");
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setBusyId(null);
    }
  }

  // Group by type
  const groups = (["CHAUFFAGE", "ECS", "VENTILATION", "CLIMATISATION", "PHOTOVOLTAIQUE"] as const).map((t) => ({
    type: t,
    items: systemes.filter((s) => s.type === t),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="section-title-dense">Systèmes énergétiques</h1>
          <p className="text-[13px] text-tk-text-muted">
            Équipements de production de chaleur, ECS, ventilation et climatisation. Alimente le calcul Cep + DPE.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} className="h-8">
          {showForm ? <X className="mr-1 h-3.5 w-3.5" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
          {showForm ? "Annuler" : "Ajouter"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-tk-border bg-tk-surface p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as SystemeType })}
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px]"
              >
                {(["CHAUFFAGE", "ECS", "VENTILATION", "CLIMATISATION", "PHOTOVOLTAIQUE"] as const).map((t) => (
                  <option key={t} value={t}>{TYPE_META[t].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Vecteur énergétique">
              <select
                value={form.vecteur}
                onChange={(e) => setForm({ ...form, vecteur: e.target.value as SystemeVecteur })}
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px]"
              >
                {(["ELEC", "GAZ_NATUREL", "FIOUL", "BOIS", "PROPANE", "RESEAU_CHALEUR"] as const).map((v) => (
                  <option key={v} value={v}>{VECTEUR_LABEL[v]}</option>
                ))}
              </select>
            </Field>
            <Field label="Rendement / SCOP">
              <input
                type="number"
                step="0.01"
                value={form.rendement}
                onChange={(e) => setForm({ ...form, rendement: e.target.value })}
                placeholder="0.85"
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
              />
              <p className="mt-1 text-[10px] text-tk-text-faint">
                Pour PAC : SCOP saisonnier (≈ 2.5 air/eau, 3.5 géothermie). Pas le COP nominal.
              </p>
            </Field>
            <Field label="Part couverture (0..1)">
              <input
                type="number"
                step="0.05" min="0" max="1"
                value={form.partCouverture}
                onChange={(e) => setForm({ ...form, partCouverture: e.target.value })}
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
              />
            </Field>
          </div>
          {form.type === "PHOTOVOLTAIQUE" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Puissance crête (kWc)">
                <input
                  type="number" step="0.5" min="0"
                  value={form.puissanceKwc}
                  onChange={(e) => setForm({ ...form, puissanceKwc: e.target.value })}
                  placeholder="3.0"
                  className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
                />
              </Field>
              <Field label="Taux autoconso (0..1)">
                <input
                  type="number" step="0.05" min="0" max="1"
                  value={form.tauxAutoconso}
                  onChange={(e) => setForm({ ...form, tauxAutoconso: e.target.value })}
                  placeholder="0.4"
                  className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
                />
                <p className="mt-1 text-[10px] text-tk-text-faint">
                  ≈ 0.30 sans batterie, 0.55 avec batterie ou pilotage.
                </p>
              </Field>
            </div>
          )}
          <Field label="Désignation">
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder={form.type === "PHOTOVOLTAIQUE" ? "Ex: PV 3 kWc toiture sud" : "Ex: PAC air/eau Atlantic Alféa Excellia"}
              className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px]"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button size="sm" onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
              Créer
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-tk-text-faint" />
        </div>
      ) : systemes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-tk-border bg-tk-surface/40 p-10 text-center">
          <Cog className="mx-auto h-7 w-7 text-tk-text-faint/60" />
          <p className="mt-3 text-[13px] font-medium text-tk-text">Pas de système renseigné</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-tk-text-muted">
            Ajoute au moins un chauffage et un ECS pour activer le calcul Cep et l&apos;étiquette DPE
            dans l&apos;onglet Calcul.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            if (g.items.length === 0) return null;
            const meta = TYPE_META[g.type];
            const Icon = meta.icon;
            return (
              <section key={g.type} className="overflow-hidden rounded-lg border border-tk-border bg-tk-surface">
                <header className="flex items-center gap-2 border-b border-tk-border bg-tk-bg/40 px-4 py-2.5">
                  <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                  <h2 className="text-[12px] font-semibold uppercase tracking-wider text-tk-text-muted">
                    {meta.label}
                  </h2>
                  <span className="text-[11px] text-tk-text-faint">{g.items.length}</span>
                </header>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Désignation</th>
                      <th>Vecteur</th>
                      <th className="num">Rendement</th>
                      <th className="num">Couverture</th>
                      <th className="col-narrow"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((s) => (
                      <tr key={s.id}>
                        <td className="font-medium text-tk-text">{s.nom}</td>
                        <td className="text-tk-text-muted">{VECTEUR_LABEL[s.vecteur]}</td>
                        <td className="num font-mono">{s.rendement.toFixed(2)}</td>
                        <td className="num font-mono">{(s.partCouverture * 100).toFixed(0)} %</td>
                        <td className="col-narrow text-right">
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(s)}
                            disabled={busyId === s.id}
                            aria-label="Supprimer"
                          >
                            {busyId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="field-label-tiny">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
