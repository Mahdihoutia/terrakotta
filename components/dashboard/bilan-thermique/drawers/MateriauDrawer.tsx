"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import type { DrawerProps, MateriauDto } from "../types";

const CATEGORIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "STRUCTURE", label: "Structure" },
  { value: "ISOLANT", label: "Isolant" },
  { value: "FINITION", label: "Finition" },
  { value: "VITRAGE", label: "Vitrage" },
  { value: "LAME_AIR", label: "Lame d'air" },
  { value: "MEMBRANE", label: "Membrane" },
  { value: "AUTRE", label: "Autre" },
];

interface FormState {
  nom: string;
  categorie: string;
  marque: string;
  reference: string;
  conductivite: string;
  masseVolumique: string;
  capaciteThermique: string;
  resistanceVapeur: string;
  resistanceFixe: string;
  carboneACV: string;
  source: string;
  notes: string;
}

const EMPTY: FormState = {
  nom: "",
  categorie: "ISOLANT",
  marque: "",
  reference: "",
  conductivite: "",
  masseVolumique: "",
  capaciteThermique: "",
  resistanceVapeur: "",
  resistanceFixe: "",
  carboneACV: "",
  source: "",
  notes: "",
};

function fromDto(m: MateriauDto): FormState {
  return {
    nom: m.nom,
    categorie: m.categorie,
    marque: m.marque ?? "",
    reference: m.reference ?? "",
    conductivite: String(m.conductivite ?? ""),
    masseVolumique: String(m.masseVolumique ?? ""),
    capaciteThermique: String(m.capaciteThermique ?? ""),
    resistanceVapeur: m.resistanceVapeur != null ? String(m.resistanceVapeur) : "",
    resistanceFixe: m.resistanceFixe != null ? String(m.resistanceFixe) : "",
    carboneACV: m.carboneACV != null ? String(m.carboneACV) : "",
    source: m.source ?? "",
    notes: m.notes ?? "",
  };
}

function num(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default function MateriauDrawer({
  open,
  onClose,
  existing,
  onSaved,
}: DrawerProps<MateriauDto>) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? fromDto(existing) : EMPTY);
  }, [open, existing]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const cond = num(form.conductivite);
    const rho = num(form.masseVolumique);
    const cap = num(form.capaciteThermique);
    if (cond == null || cond < 0) {
      toast.error("λ (conductivité) requis et positif");
      return;
    }
    if (rho == null || rho <= 0) {
      toast.error("ρ (masse volumique) requis et > 0");
      return;
    }
    if (cap == null || cap < 0) {
      toast.error("c (capacité thermique) requis et positif");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        categorie: form.categorie,
        marque: form.marque.trim() || null,
        reference: form.reference.trim() || null,
        conductivite: cond,
        masseVolumique: rho,
        capaciteThermique: cap,
        resistanceVapeur: num(form.resistanceVapeur),
        resistanceFixe: num(form.resistanceFixe),
        carboneACV: num(form.carboneACV),
        source: form.source.trim() || null,
        notes: form.notes.trim() || null,
      };
      const url = existing ? `/api/materiaux/${existing.id}` : "/api/materiaux";
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
      const saved = (await res.json()) as MateriauDto;
      toast.success(existing ? "Matériau modifié" : "Matériau créé");
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
      <SheetContent className="sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>{existing ? "Modifier le matériau" : "Nouveau matériau"}</SheetTitle>
          <SheetDescription>
            Caractéristiques thermiques et environnementales — utilisées pour le calcul
            U/R des parois et l&apos;empreinte carbone.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom *">
              <input
                value={form.nom}
                onChange={(e) => update("nom", e.target.value)}
                className={inputCls}
                placeholder="Laine de verre 200 mm"
              />
            </Field>
            <Field label="Catégorie *">
              <select
                value={form.categorie}
                onChange={(e) => update("categorie", e.target.value)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Marque">
              <input value={form.marque} onChange={(e) => update("marque", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Référence">
              <input value={form.reference} onChange={(e) => update("reference", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="λ (W/m·K) *" hint="Conductivité thermique">
              <input value={form.conductivite} onChange={(e) => update("conductivite", e.target.value)} className={inputCls} placeholder="0.035" />
            </Field>
            <Field label="ρ (kg/m³) *" hint="Masse volumique">
              <input value={form.masseVolumique} onChange={(e) => update("masseVolumique", e.target.value)} className={inputCls} placeholder="40" />
            </Field>
            <Field label="c (J/kg·K) *" hint="Capacité thermique">
              <input value={form.capaciteThermique} onChange={(e) => update("capaciteThermique", e.target.value)} className={inputCls} placeholder="1030" />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="μ (résistance vapeur)">
              <input value={form.resistanceVapeur} onChange={(e) => update("resistanceVapeur", e.target.value)} className={inputCls} />
            </Field>
            <Field label="R fixe (m²·K/W)" hint="Pour vitrages / lames d'air">
              <input value={form.resistanceFixe} onChange={(e) => update("resistanceFixe", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Carbone ACV (kgCO₂e/m³)">
              <input value={form.carboneACV} onChange={(e) => update("carboneACV", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Source">
            <input value={form.source} onChange={(e) => update("source", e.target.value)} className={inputCls} placeholder="FDES Isover, DTU 20.1, …" />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className={`${inputCls} min-h-[60px]`} />
          </Field>
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
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

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
      {children}
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
