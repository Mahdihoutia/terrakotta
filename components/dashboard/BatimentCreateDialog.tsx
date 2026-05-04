"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

const ZONES = [
  "H1a — Nord",
  "H1b — Nord-Est",
  "H1c — Est",
  "H2a — Nord-Ouest",
  "H2b — Ouest",
  "H2c — Sud-Ouest",
  "H2d — Centre",
  "H3 — Méditerranée",
];

interface Props {
  projetId: string;
}

export default function BatimentCreateDialog({ projetId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [zoneClimatique, setZoneClimatique] = useState(ZONES[0]);
  const [altitude, setAltitude] = useState("");
  const [orientation, setOrientation] = useState("");

  function reset() {
    setNom(""); setDescription(""); setZoneClimatique(ZONES[0]);
    setAltitude(""); setOrientation("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Nom du bâtiment requis");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/batiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          description: description.trim() || null,
          zoneClimatique,
          altitude: altitude ? Number(altitude) : null,
          orientation: orientation.trim() || null,
          projetId,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Création impossible");
        return;
      }
      toast.success("Bâtiment créé");
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
      <Button size="sm" onClick={() => setOpen(true)} className="h-8">
        <Plus className="mr-1 h-3.5 w-3.5" />
        Nouveau bâtiment
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-tk-border bg-tk-surface p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-tk-text">Nouveau bâtiment</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-tk-text-faint hover:bg-tk-hover">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Nom *">
                <input
                  type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Maison principale, Bâtiment A"
                  className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px]"
                  autoFocus
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Zone climatique *">
                  <select
                    value={zoneClimatique}
                    onChange={(e) => setZoneClimatique(e.target.value)}
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[13px]"
                  >
                    {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </Field>
                <Field label="Altitude (m)">
                  <input
                    type="number" value={altitude} onChange={(e) => setAltitude(e.target.value)}
                    placeholder="120"
                    className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                  />
                </Field>
              </div>

              <Field label="Orientation principale">
                <input
                  type="text" value={orientation} onChange={(e) => setOrientation(e.target.value)}
                  placeholder="Ex: Sud-Ouest"
                  className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px]"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes contextuelles…"
                  rows={2}
                  className="w-full resize-none rounded-md border border-tk-border bg-tk-input px-3 py-2 text-[13px]"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
                Créer
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
