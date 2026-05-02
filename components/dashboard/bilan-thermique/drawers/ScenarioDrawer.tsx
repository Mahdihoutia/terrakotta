"use client";

import { useEffect, useState, useRef } from "react";
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
import type { DrawerProps, ScenarioDto } from "../types";

type Code = "OCC" | "RED" | "INOCC";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

const COLORS: Record<Code, string> = {
  OCC: "bg-emerald-500",
  RED: "bg-amber-400",
  INOCC: "bg-muted",
};

const LABELS: Record<Code, string> = {
  OCC: "Occupé",
  RED: "Réduit",
  INOCC: "Inoccupé",
};

function emptyPattern(): Code[][] {
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => "INOCC" as Code),
  );
}

function clonePattern(p: Code[][]): Code[][] {
  return p.map((row) => [...row]);
}

interface FormState {
  nom: string;
  description: string;
  pattern: Code[][];
  paint: Code;
}

const EMPTY: FormState = {
  nom: "",
  description: "",
  pattern: emptyPattern(),
  paint: "OCC",
};

function fromDto(s: ScenarioDto): FormState {
  return {
    nom: s.nom,
    description: s.description ?? "",
    pattern: clonePattern(s.pattern),
    paint: "OCC",
  };
}

export default function ScenarioDrawer({
  open,
  onClose,
  existing,
  onSaved,
}: DrawerProps<ScenarioDto>) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setForm(existing ? fromDto(existing) : EMPTY);
  }, [open, existing]);

  function setCell(jour: number, heure: number, code: Code) {
    setForm((s) => {
      const next = clonePattern(s.pattern);
      next[jour][heure] = code;
      return { ...s, pattern: next };
    });
  }

  function paintAll(code: Code) {
    setForm((s) => ({
      ...s,
      pattern: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => code)),
    }));
  }

  function applyPreset(name: "bureaux" | "logement" | "continu") {
    setForm((s) => {
      const next = emptyPattern();
      if (name === "continu") {
        for (let j = 0; j < 7; j++) for (let h = 0; h < 24; h++) next[j][h] = "OCC";
      } else if (name === "bureaux") {
        for (let j = 0; j < 5; j++) {
          for (let h = 0; h < 24; h++) {
            if (h >= 8 && h < 18) next[j][h] = "OCC";
            else if (h === 7 || h === 18) next[j][h] = "RED";
          }
        }
      } else if (name === "logement") {
        for (let j = 0; j < 7; j++) {
          for (let h = 0; h < 24; h++) {
            if (h >= 7 && h < 9) next[j][h] = "OCC";
            else if (h >= 18 && h < 23) next[j][h] = "OCC";
            else if (h >= 23 || h < 7) next[j][h] = "RED";
          }
        }
      }
      return { ...s, pattern: next };
    });
  }

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        description: form.description.trim() || null,
        pattern: form.pattern,
      };
      const url = existing ? `/api/scenarios/${existing.id}` : "/api/scenarios";
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
      const saved = (await res.json()) as ScenarioDto;
      toast.success(existing ? "Scénario modifié" : "Scénario créé");
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
          <SheetTitle>{existing ? "Modifier le scénario" : "Nouveau scénario"}</SheetTitle>
          <SheetDescription>
            Pattern hebdomadaire 7 jours × 24 heures — cliquez ou glissez pour peindre les cases.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom *">
              <input
                value={form.nom}
                onChange={(e) => setForm((s) => ({ ...s, nom: e.target.value }))}
                className={inputCls}
                placeholder="Bureaux 9h-18h"
              />
            </Field>
            <Field label="Description">
              <input
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Outil :</span>
              {(Object.keys(COLORS) as Code[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, paint: c }))}
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                    form.paint === c ? "border-foreground" : "border-border"
                  }`}
                >
                  <span className={`inline-block h-3 w-3 rounded ${COLORS[c]}`} />
                  {LABELS[c]}
                </button>
              ))}
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => applyPreset("bureaux")}>Bureaux 8-18</Button>
                <Button size="sm" variant="ghost" onClick={() => applyPreset("logement")}>Logement</Button>
                <Button size="sm" variant="ghost" onClick={() => applyPreset("continu")}>Continu</Button>
                <Button size="sm" variant="ghost" onClick={() => paintAll("INOCC")}>Vider</Button>
              </span>
            </div>

            <div
              className="overflow-x-auto select-none"
              onMouseUp={() => { draggingRef.current = false; }}
              onMouseLeave={() => { draggingRef.current = false; }}
            >
              <table className="text-[10px]">
                <thead>
                  <tr>
                    <th className="w-8" />
                    {Array.from({ length: 24 }, (_, h) => (
                      <th key={h} className="w-5 px-0 text-center font-normal text-muted-foreground">
                        {h % 3 === 0 ? h : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map((nom, j) => (
                    <tr key={j}>
                      <th className="px-1 text-right font-medium text-muted-foreground">{nom}</th>
                      {Array.from({ length: 24 }, (_, h) => {
                        const code = form.pattern[j][h];
                        return (
                          <td
                            key={h}
                            onMouseDown={() => {
                              draggingRef.current = true;
                              setCell(j, h, form.paint);
                            }}
                            onMouseEnter={() => {
                              if (draggingRef.current) setCell(j, h, form.paint);
                            }}
                            className={`h-5 w-5 cursor-pointer border border-background ${COLORS[code]}`}
                            title={`${nom} ${h}h — ${LABELS[code]}`}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
