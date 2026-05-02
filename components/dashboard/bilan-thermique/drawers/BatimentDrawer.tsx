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
import { ZONE_CLIMATIQUE_DATA } from "@/lib/thermal/zones";
import type { DrawerProps, BatimentDto } from "../types";

const ZONE_LABELS = Object.keys(ZONE_CLIMATIQUE_DATA);

interface FormState {
  nom: string;
  description: string;
  zoneClimatique: string;
  altitude: string;
  orientation: string;
}

const EMPTY: FormState = {
  nom: "",
  description: "",
  zoneClimatique: ZONE_LABELS[0] ?? "H1a — Nord",
  altitude: "",
  orientation: "",
};

function fromDto(b: BatimentDto): FormState {
  return {
    nom: b.nom,
    description: b.description ?? "",
    zoneClimatique: b.zoneClimatique,
    altitude: b.altitude != null ? String(b.altitude) : "",
    orientation: b.orientation ?? "",
  };
}

function num(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default function BatimentDrawer({
  open,
  onClose,
  existing,
  onSaved,
}: DrawerProps<BatimentDto>) {
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
    if (!form.zoneClimatique) {
      toast.error("Zone climatique requise");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        description: form.description.trim() || null,
        zoneClimatique: form.zoneClimatique,
        altitude: num(form.altitude),
        orientation: form.orientation.trim() || null,
      };
      const url = existing ? `/api/batiments/${existing.id}` : "/api/batiments";
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
      const saved = (await res.json()) as BatimentDto;
      toast.success(existing ? "Bâtiment modifié" : "Bâtiment créé");
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
          <SheetTitle>{existing ? "Modifier le bâtiment" : "Nouveau bâtiment"}</SheetTitle>
          <SheetDescription>
            Métadonnées du bâtiment. Les zones et leur affectation de parois
            se gèrent depuis l&apos;onglet Bâtiments.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <Field label="Nom *">
            <input value={form.nom} onChange={(e) => update("nom", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className={`${inputCls} min-h-[60px]`} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Zone climatique *">
              <select value={form.zoneClimatique} onChange={(e) => update("zoneClimatique", e.target.value)} className={inputCls}>
                {ZONE_LABELS.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </Field>
            <Field label="Altitude (m)">
              <input value={form.altitude} onChange={(e) => update("altitude", e.target.value)} className={inputCls} placeholder="120" />
            </Field>
          </div>
          <Field label="Orientation principale" hint="Ex : Façade principale au S, ou texte libre">
            <input value={form.orientation} onChange={(e) => update("orientation", e.target.value)} className={inputCls} />
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
