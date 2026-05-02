"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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
import type { DrawerProps, MateriauDto, ParoiDto } from "../types";

const PAROI_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "MUR_EXT", label: "Mur extérieur" },
  { value: "MUR_INT", label: "Mur intérieur" },
  { value: "TOITURE", label: "Toiture" },
  { value: "PLANCHER_BAS", label: "Plancher bas" },
  { value: "PLANCHER_INTER", label: "Plancher intermédiaire" },
  { value: "VITRAGE", label: "Vitrage" },
  { value: "PORTE", label: "Porte" },
];

interface CoucheUI {
  key: string;
  materiauId: string;
  /** En millimètres dans l'UI ; converti en mètres au save. */
  epaisseurMm: string;
}

interface FormState {
  nom: string;
  type: string;
  description: string;
  rsi: string;
  rse: string;
  couches: CoucheUI[];
}

const EMPTY: FormState = {
  nom: "",
  type: "MUR_EXT",
  description: "",
  rsi: "",
  rse: "",
  couches: [],
};

function fromDto(p: ParoiDto): FormState {
  return {
    nom: p.nom,
    type: p.type,
    description: p.description ?? "",
    rsi: String(p.rsi ?? ""),
    rse: String(p.rse ?? ""),
    couches: (p.couches ?? []).map((c, i) => ({
      key: `c-${c.id ?? i}-${Math.random().toString(36).slice(2, 6)}`,
      materiauId: c.materiauId,
      epaisseurMm: String(Math.round((c.epaisseur ?? 0) * 1000)),
    })),
  };
}

function num(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

interface Props extends DrawerProps<ParoiDto> {
  materiaux: MateriauDto[];
}

export default function ParoiDrawer({
  open,
  onClose,
  existing,
  onSaved,
  materiaux,
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

  function addCouche() {
    setForm((s) => ({
      ...s,
      couches: [
        ...s.couches,
        {
          key: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          materiauId: materiaux[0]?.id ?? "",
          epaisseurMm: "100",
        },
      ],
    }));
  }

  function removeCouche(idx: number) {
    setForm((s) => ({ ...s, couches: s.couches.filter((_, i) => i !== idx) }));
  }

  function moveCouche(idx: number, dir: -1 | 1) {
    setForm((s) => {
      const next = [...s.couches];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return s;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...s, couches: next };
    });
  }

  function setCouche(idx: number, patch: Partial<CoucheUI>) {
    setForm((s) => ({
      ...s,
      couches: s.couches.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  }

  // ─── Calcul live des indicateurs (résumé indicatif côté UI) ─────
  const matById = useMemo(() => new Map(materiaux.map((m) => [m.id, m])), [materiaux]);

  const live = useMemo(() => {
    let rTotal = (num(form.rsi) ?? 0.13) + (num(form.rse) ?? 0.04);
    let masse = 0;
    let carbone = 0;
    let epaisseurTot = 0;
    for (const c of form.couches) {
      const m = matById.get(c.materiauId);
      const eMm = num(c.epaisseurMm);
      if (!m || eMm == null || eMm <= 0) continue;
      const eM = eMm / 1000;
      epaisseurTot += eMm;
      // Si résistance fixe (vitrage / lame d'air), on l'utilise.
      if (m.resistanceFixe != null && m.resistanceFixe > 0) {
        rTotal += m.resistanceFixe;
      } else if (m.conductivite > 0) {
        rTotal += eM / m.conductivite;
      }
      masse += eM * m.masseVolumique;
      if (m.carboneACV != null) carbone += eM * m.carboneACV;
    }
    const u = rTotal > 0 ? 1 / rTotal : 0;
    return { rTotal, u, masse, carbone, epaisseurTot };
  }, [form.couches, form.rsi, form.rse, matById]);

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (form.couches.length === 0) {
      toast.error("Ajoutez au moins une couche");
      return;
    }
    for (const [i, c] of form.couches.entries()) {
      if (!c.materiauId) {
        toast.error(`Couche ${i + 1} : matériau requis`);
        return;
      }
      const e = num(c.epaisseurMm);
      if (e == null || e <= 0) {
        toast.error(`Couche ${i + 1} : épaisseur > 0 requise`);
        return;
      }
    }

    setSaving(true);
    try {
      const couches = form.couches.map((c, i) => ({
        materiauId: c.materiauId,
        ordre: i,
        epaisseur: (num(c.epaisseurMm) ?? 0) / 1000,
      }));
      const payload = {
        nom: form.nom.trim(),
        type: form.type,
        description: form.description.trim() || null,
        rsi: num(form.rsi) ?? undefined,
        rse: num(form.rse) ?? undefined,
        couches,
      };
      const url = existing ? `/api/parois/${existing.id}` : "/api/parois";
      const method = existing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        await showApiError(res, "Enregistrement impossible");
        return;
      }
      const saved = (await res.json()) as ParoiDto;
      toast.success(existing ? "Paroi modifiée" : "Paroi créée");
      onSaved(saved);
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
          <SheetTitle>{existing ? "Modifier la paroi" : "Nouvelle paroi"}</SheetTitle>
          <SheetDescription>
            Composition multicouche — U, R, masse et carbone calculés automatiquement
            après enregistrement.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom *">
              <input
                value={form.nom}
                onChange={(e) => update("nom", e.target.value)}
                className={inputCls}
                placeholder="Mur ITE 140 mm"
              />
            </Field>
            <Field label="Type *">
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputCls}>
                {PAROI_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <input value={form.description} onChange={(e) => update("description", e.target.value)} className={inputCls} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rsi (m²·K/W)" hint="Laisser vide pour valeur par défaut">
              <input value={form.rsi} onChange={(e) => update("rsi", e.target.value)} className={inputCls} placeholder="0.13" />
            </Field>
            <Field label="Rse (m²·K/W)" hint="Laisser vide pour valeur par défaut">
              <input value={form.rse} onChange={(e) => update("rse", e.target.value)} className={inputCls} placeholder="0.04" />
            </Field>
          </div>

          {/* Composer multicouche */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Composition (intérieur → extérieur)
              </p>
              <Button size="sm" variant="outline" onClick={addCouche} disabled={materiaux.length === 0}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter une couche
              </Button>
            </div>

            {form.couches.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {materiaux.length === 0
                  ? "Créez d'abord au moins un matériau."
                  : "Aucune couche — cliquez sur Ajouter."}
              </p>
            ) : (
              <ul className="divide-y">
                {form.couches.map((c, idx) => (
                  <li key={c.key} className="flex items-center gap-2 px-3 py-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <select
                      value={c.materiauId}
                      onChange={(e) => setCouche(idx, { materiauId: e.target.value })}
                      className={`${inputCls} flex-1`}
                    >
                      {materiaux.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                          {m.categorie ? ` — ${m.categorie}` : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      value={c.epaisseurMm}
                      onChange={(e) => setCouche(idx, { epaisseurMm: e.target.value })}
                      className={`${inputCls} w-24`}
                      placeholder="mm"
                    />
                    <span className="text-[11px] text-muted-foreground">mm</span>
                    <Button size="icon" variant="ghost" onClick={() => moveCouche(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => moveCouche(idx, 1)} disabled={idx === form.couches.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeCouche(idx)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Indicateurs live */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Indicateurs (estimation)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Indic label="U" value={`${live.u.toFixed(2)} W/m²·K`} />
              <Indic label="R" value={`${live.rTotal.toFixed(2)} m²·K/W`} />
              <Indic label="Épaisseur" value={`${live.epaisseurTot.toFixed(0)} mm`} />
              <Indic label="Masse" value={`${live.masse.toFixed(0)} kg/m²`} />
              <Indic label="Carbone ACV" value={`${live.carbone.toFixed(0)} kgCO₂e/m²`} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Le calcul officiel (déphasage, ponts thermiques) est rejoué côté serveur après enregistrement.
            </p>
          </div>
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
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        {label}
      </label>
      <div className="[&_select]:w-full [&_input]:w-full [&_textarea]:w-full">
        {children}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Indic({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
