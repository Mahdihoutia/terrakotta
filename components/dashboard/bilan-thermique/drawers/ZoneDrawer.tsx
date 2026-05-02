"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import type {
  DrawerProps,
  ZoneDto,
  ParoiDto,
  ScenarioDto,
  BatimentDto,
} from "../types";

const USAGES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "BUREAUX", label: "Bureaux" },
  { value: "OPEN_SPACE", label: "Open space" },
  { value: "CIRCULATION", label: "Circulation" },
  { value: "ARCHIVES", label: "Archives" },
  { value: "SALLE_REUNION", label: "Salle de réunion" },
  { value: "SALLE_SERVEUR", label: "Salle serveur" },
  { value: "COMMERCE", label: "Commerce" },
  { value: "RESTAURATION", label: "Restauration" },
  { value: "LOGEMENT", label: "Logement" },
  { value: "HALL_ACCUEIL", label: "Hall accueil" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "AUTRE", label: "Autre" },
];

const ORIENTATIONS = ["", "N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;

interface ParoiUI {
  /** id BD si déjà créée, sinon undefined (création locale en attente) */
  id?: string;
  paroiId: string;
  surface: string;
  orientation: string;
}

interface FormState {
  nom: string;
  usage: string;
  surface: string;
  hauteurSousPlafond: string;
  scenarioId: string;
  consigneChauffageOcc: string;
  consigneChauffageRed: string;
  consigneClimOcc: string;
  consigneClimRed: string;
  densiteOccupation: string;
  apportsParPersonne: string;
  apportsEquipements: string;
  apportsEclairage: string;
  qVmcM3hM2: string;
  efficaciteDoubleFlux: string;
  parois: ParoiUI[];
}

const EMPTY: FormState = {
  nom: "",
  usage: "BUREAUX",
  surface: "",
  hauteurSousPlafond: "2.7",
  scenarioId: "",
  consigneChauffageOcc: "20",
  consigneChauffageRed: "16",
  consigneClimOcc: "26",
  consigneClimRed: "28",
  densiteOccupation: "15",
  apportsParPersonne: "80",
  apportsEquipements: "15",
  apportsEclairage: "8",
  qVmcM3hM2: "2.5",
  efficaciteDoubleFlux: "0",
  parois: [],
};

function fromDto(z: ZoneDto): FormState {
  return {
    nom: z.nom,
    usage: z.usage,
    surface: String(z.surface ?? ""),
    hauteurSousPlafond: String(z.hauteurSousPlafond ?? ""),
    scenarioId: z.scenarioId ?? "",
    consigneChauffageOcc: String(z.consigneChauffageOcc),
    consigneChauffageRed: String(z.consigneChauffageRed),
    consigneClimOcc: String(z.consigneClimOcc),
    consigneClimRed: String(z.consigneClimRed),
    densiteOccupation: String(z.densiteOccupation),
    apportsParPersonne: String(z.apportsParPersonne),
    apportsEquipements: String(z.apportsEquipements),
    apportsEclairage: String(z.apportsEclairage),
    qVmcM3hM2: String(z.qVmcM3hM2),
    efficaciteDoubleFlux: String(z.efficaciteDoubleFlux),
    parois: z.parois.map((p) => ({
      id: p.id,
      paroiId: p.paroiId,
      surface: String(p.surface),
      orientation: p.orientation ?? "",
    })),
  };
}

function num(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

interface Props extends DrawerProps<ZoneDto> {
  batiment: BatimentDto;
  parois: ParoiDto[];
  scenarios: ScenarioDto[];
}

export default function ZoneDrawer({
  open,
  onClose,
  existing,
  onSaved,
  batiment,
  parois,
  scenarios,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? fromDto(existing) : EMPTY);
  }, [open, existing]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function addParoi() {
    setForm((s) => ({
      ...s,
      parois: [
        ...s.parois,
        { paroiId: parois[0]?.id ?? "", surface: "10", orientation: "" },
      ],
    }));
  }

  function setParoi(idx: number, patch: Partial<ParoiUI>) {
    setForm((s) => ({
      ...s,
      parois: s.parois.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  }

  function removeParoi(idx: number) {
    setForm((s) => ({ ...s, parois: s.parois.filter((_, i) => i !== idx) }));
  }

  const paroiById = useMemo(() => new Map(parois.map((p) => [p.id, p])), [parois]);

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const surface = num(form.surface);
    if (surface == null || surface <= 0) {
      toast.error("Surface > 0 requise");
      return;
    }
    const hsp = num(form.hauteurSousPlafond);
    if (hsp == null || hsp <= 0) {
      toast.error("HSP > 0 requise");
      return;
    }

    setSaving(true);
    try {
      const basePayload = {
        nom: form.nom.trim(),
        usage: form.usage,
        surface,
        hauteurSousPlafond: hsp,
        consigneChauffageOcc: num(form.consigneChauffageOcc) ?? undefined,
        consigneChauffageRed: num(form.consigneChauffageRed) ?? undefined,
        consigneClimOcc: num(form.consigneClimOcc) ?? undefined,
        consigneClimRed: num(form.consigneClimRed) ?? undefined,
        densiteOccupation: num(form.densiteOccupation) ?? undefined,
        apportsParPersonne: num(form.apportsParPersonne) ?? undefined,
        apportsEquipements: num(form.apportsEquipements) ?? undefined,
        apportsEclairage: num(form.apportsEclairage) ?? undefined,
        qVmcM3hM2: num(form.qVmcM3hM2) ?? undefined,
        efficaciteDoubleFlux: num(form.efficaciteDoubleFlux) ?? undefined,
        scenarioId: form.scenarioId || null,
      };

      let zoneId: string;
      if (existing) {
        const res = await fetch(`/api/zones/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload),
        });
        if (!res.ok) {
          await showApiError(res, "Enregistrement impossible");
          return;
        }
        zoneId = existing.id;
      } else {
        const res = await fetch(`/api/zones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, batimentId: batiment.id }),
        });
        if (!res.ok) {
          await showApiError(res, "Création impossible");
          return;
        }
        const created = (await res.json()) as ZoneDto;
        zoneId = created.id;
      }

      // Synchroniser les parois : suppressions + créations.
      const existingParoiIds = new Set(
        existing?.parois.map((p) => p.id).filter(Boolean) ?? [],
      );
      const keptIds = new Set(
        form.parois.map((p) => p.id).filter((x): x is string => Boolean(x)),
      );
      // Suppressions
      for (const id of existingParoiIds) {
        if (!keptIds.has(id)) {
          await fetch(`/api/zones/${zoneId}/parois/${id}`, { method: "DELETE" });
        }
      }
      // Créations (uniquement les nouvelles, sans id)
      for (const p of form.parois) {
        if (p.id) continue;
        const surfaceNum = num(p.surface);
        if (!p.paroiId || surfaceNum == null || surfaceNum <= 0) continue;
        await fetch(`/api/zones/${zoneId}/parois`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paroiId: p.paroiId,
            surface: surfaceNum,
            orientation: p.orientation || null,
          }),
        });
      }

      // Recharge
      const reloadRes = await fetch(`/api/zones/${zoneId}`, { cache: "no-store" });
      const reloaded = (await reloadRes.json()) as ZoneDto;
      toast.success(existing ? "Zone modifiée" : "Zone créée");
      onSaved(reloaded);
      onClose();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle>{existing ? "Modifier la zone" : "Nouvelle zone"}</SheetTitle>
          <SheetDescription>
            Bâtiment : <span className="font-medium text-foreground">{batiment.nom}</span>
            {" — "}Zone climatique {batiment.zoneClimatique}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <Section title="Identification">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom *">
                <input value={form.nom} onChange={(e) => update("nom", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Usage *">
                <select value={form.usage} onChange={(e) => update("usage", e.target.value)} className={inputCls}>
                  {USAGES.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Surface (m²) *">
                <input value={form.surface} onChange={(e) => update("surface", e.target.value)} className={inputCls} />
              </Field>
              <Field label="HSP (m) *" hint="Hauteur sous plafond">
                <input value={form.hauteurSousPlafond} onChange={(e) => update("hauteurSousPlafond", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Scénario d'occupation">
            <Field label="Scénario">
              <select value={form.scenarioId} onChange={(e) => update("scenarioId", e.target.value)} className={inputCls}>
                <option value="">— Aucun (occupation continue) —</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                    {s.preset ? " (preset)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          <Section title="Consignes (°C)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Chauffage occupation">
                <input value={form.consigneChauffageOcc} onChange={(e) => update("consigneChauffageOcc", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Chauffage réduit">
                <input value={form.consigneChauffageRed} onChange={(e) => update("consigneChauffageRed", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Clim occupation">
                <input value={form.consigneClimOcc} onChange={(e) => update("consigneClimOcc", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Clim réduit">
                <input value={form.consigneClimRed} onChange={(e) => update("consigneClimRed", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Apports internes">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Densité (m²/pers)">
                <input value={form.densiteOccupation} onChange={(e) => update("densiteOccupation", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Apport / personne (W)">
                <input value={form.apportsParPersonne} onChange={(e) => update("apportsParPersonne", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Équipements (W/m²)">
                <input value={form.apportsEquipements} onChange={(e) => update("apportsEquipements", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Éclairage (W/m²)">
                <input value={form.apportsEclairage} onChange={(e) => update("apportsEclairage", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Ventilation">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Q VMC (m³/h·m²)">
                <input value={form.qVmcM3hM2} onChange={(e) => update("qVmcM3hM2", e.target.value)} className={inputCls} />
              </Field>
              <Field label="ε double flux (0-1)" hint="0 si simple flux">
                <input value={form.efficaciteDoubleFlux} onChange={(e) => update("efficaciteDoubleFlux", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section
            title="Parois assignées"
            action={
              <Button size="sm" variant="outline" onClick={addParoi} disabled={parois.length === 0}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            }
          >
            {form.parois.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                {parois.length === 0
                  ? "Aucune paroi disponible — créez d'abord des parois."
                  : "Aucune paroi assignée."}
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {form.parois.map((p, idx) => {
                  const meta = paroiById.get(p.paroiId);
                  return (
                    <li key={p.id ?? `new-${idx}`} className="flex items-center gap-2 px-3 py-2">
                      <select
                        value={p.paroiId}
                        onChange={(e) => setParoi(idx, { paroiId: e.target.value })}
                        className={`${inputCls} flex-1`}
                        disabled={Boolean(p.id)}
                      >
                        {parois.map((mp) => (
                          <option key={mp.id} value={mp.id}>
                            {mp.nom} ({mp.type})
                          </option>
                        ))}
                      </select>
                      <input
                        value={p.surface}
                        onChange={(e) => setParoi(idx, { surface: e.target.value })}
                        className={`${inputCls} w-24`}
                        placeholder="m²"
                      />
                      <select
                        value={p.orientation}
                        onChange={(e) => setParoi(idx, { orientation: e.target.value })}
                        className={`${inputCls} w-20`}
                      >
                        {ORIENTATIONS.map((o) => (
                          <option key={o} value={o}>{o || "—"}</option>
                        ))}
                      </select>
                      <Button size="icon" variant="ghost" onClick={() => removeParoi(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                      {meta?.uCache != null && (
                        <span className="hidden sm:inline text-[10px] text-muted-foreground tabular-nums">
                          U={meta.uCache.toFixed(2)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {existing && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Les parois déjà enregistrées ne peuvent pas changer de référence — supprimez et recréez si besoin.
              </p>
            )}
          </Section>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const inputCls =
  "rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="[&_select]:w-full [&_input]:w-full">{children}</div>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}
