"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

type Typo =
  | "MUR_DALLE_INTERMEDIAIRE" | "MUR_PLANCHER_BAS" | "MUR_TOITURE" | "MUR_REFEND"
  | "MENUISERIE_TUNNEL" | "MENUISERIE_NU_INTERIEUR" | "MENUISERIE_NU_EXTERIEUR"
  | "BALCON_NON_ROMPU" | "BALCON_RUPTEUR";
type Iso = "ITE" | "ITI" | "ITR" | "Aucune";

const TYPO_LABEL: Record<Typo, string> = {
  MUR_DALLE_INTERMEDIAIRE: "Mur / dalle intermédiaire",
  MUR_PLANCHER_BAS: "Mur / plancher bas",
  MUR_TOITURE: "Mur / toiture",
  MUR_REFEND: "Mur / refend",
  MENUISERIE_TUNNEL: "Menuiserie tunnel",
  MENUISERIE_NU_INTERIEUR: "Menuiserie nu intérieur",
  MENUISERIE_NU_EXTERIEUR: "Menuiserie nu extérieur",
  BALCON_NON_ROMPU: "Balcon non rompu",
  BALCON_RUPTEUR: "Balcon avec rupteur",
};

// Bibliothèque ψ (W/m·K) — Th-U fascicule 5/5 pour preview
const PSI: Record<Typo, Record<Iso, number>> = {
  MUR_DALLE_INTERMEDIAIRE: { ITE: 0.05, ITI: 0.95, ITR: 0.10, Aucune: 0.85 },
  MUR_PLANCHER_BAS:        { ITE: 0.20, ITI: 0.85, ITR: 0.55, Aucune: 0.70 },
  MUR_TOITURE:             { ITE: 0.05, ITI: 0.65, ITR: 0.15, Aucune: 0.55 },
  MUR_REFEND:              { ITE: 0.02, ITI: 0.65, ITR: 0.10, Aucune: 0.55 },
  MENUISERIE_TUNNEL:       { ITE: 0.02, ITI: 0.05, ITR: 0.05, Aucune: 0.05 },
  MENUISERIE_NU_INTERIEUR: { ITE: 0.45, ITI: 0.10, ITR: 0.40, Aucune: 0.10 },
  MENUISERIE_NU_EXTERIEUR: { ITE: 0.05, ITI: 0.45, ITR: 0.10, Aucune: 0.45 },
  BALCON_NON_ROMPU:        { ITE: 0.90, ITI: 0.95, ITR: 0.85, Aucune: 0.95 },
  BALCON_RUPTEUR:          { ITE: 0.30, ITI: 0.40, ITR: 0.30, Aucune: 0.40 },
};

interface Pont {
  id: string;
  typo: Typo;
  isolation: Iso;
  longueur: number;
  psiOverride: number | null;
  notes: string | null;
}

interface Props {
  batimentId: string;
}

export default function PontsThermiquesPanel({ batimentId }: Props) {
  const router = useRouter();
  const [list, setList] = useState<Pont[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [typo, setTypo] = useState<Typo>("MUR_PLANCHER_BAS");
  const [isolation, setIsolation] = useState<Iso>("Aucune");
  const [longueur, setLongueur] = useState("");
  const [psiOverride, setPsiOverride] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/batiments/${batimentId}/ponts-thermiques`, { cache: "no-store" });
      if (!res.ok) {
        await showApiError(res, "Chargement impossible");
        return;
      }
      setList(await res.json());
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [batimentId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const l = Number(longueur);
    if (!Number.isFinite(l) || l <= 0) {
      toast.error("Longueur invalide");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/batiments/${batimentId}/ponts-thermiques`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typo, isolation, longueur: l,
          psiOverride: psiOverride ? Number(psiOverride) : null,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Ajout impossible");
        return;
      }
      toast.success("Pont thermique ajouté");
      setLongueur(""); setPsiOverride("");
      setOpen(false);
      await refresh();
      router.refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/ponts-thermiques/${id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      setList((prev) => prev.filter((p) => p.id !== id));
      toast.success("Supprimé");
      router.refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setBusyId(null);
    }
  }

  const totalH = list.reduce((s, p) => {
    const psi = p.psiOverride ?? PSI[p.typo][p.isolation];
    return s + psi * p.longueur;
  }, 0);

  const psiPreview = Number(psiOverride) > 0 ? Number(psiOverride) : PSI[typo][isolation];

  return (
    <div className="border-t border-tk-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <p className="text-[12px] font-semibold uppercase tracking-wider text-tk-text-muted">
            Ponts thermiques
          </p>
          <span className="text-[11px] text-tk-text-faint">
            {list.length} liaison{list.length > 1 ? "s" : ""}
            {list.length > 0 && ` · H_pt = ${totalH.toFixed(0)} W/K`}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)} className="h-7">
          <Plus className="mr-1 h-3 w-3" />
          {open ? "Annuler" : "Ajouter"}
        </Button>
      </div>

      {open && (
        <form onSubmit={handleAdd} className="border-t border-tk-border bg-tk-bg/40 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="sm:col-span-2">
              <p className="field-label-tiny mb-1">Typologie</p>
              <select
                value={typo} onChange={(e) => setTypo(e.target.value as Typo)}
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px]"
              >
                {(Object.keys(TYPO_LABEL) as Typo[]).map((t) => (
                  <option key={t} value={t}>{TYPO_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="field-label-tiny mb-1">Isolation</p>
              <select
                value={isolation} onChange={(e) => setIsolation(e.target.value as Iso)}
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px]"
              >
                {(["ITE", "ITI", "ITR", "Aucune"] as Iso[]).map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="field-label-tiny mb-1">Longueur (m)</p>
              <input
                type="number" step="0.1" value={longueur}
                onChange={(e) => setLongueur(e.target.value)}
                placeholder="ex: 24"
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
              />
            </div>
            <div>
              <p className="field-label-tiny mb-1">ψ override</p>
              <input
                type="number" step="0.01" value={psiOverride}
                onChange={(e) => setPsiOverride(e.target.value)}
                placeholder={`auto ${PSI[typo][isolation].toFixed(2)}`}
                className="h-8 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[12px] tabular-nums"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] text-tk-text-faint">
              ψ retenu : <span className="font-mono">{psiPreview.toFixed(2)}</span> W/m·K · H estimée :
              {" "}<span className="font-mono">{(psiPreview * (Number(longueur) || 0)).toFixed(0)}</span> W/K
            </p>
            <Button type="submit" size="sm" disabled={submitting} className="h-7">
              {submitting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />}
              Ajouter
            </Button>
          </div>
        </form>
      )}

      {!loading && list.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Liaison</th>
              <th>Iso.</th>
              <th className="num">L (m)</th>
              <th className="num">ψ (W/m·K)</th>
              <th className="num">H = ψ·L</th>
              <th className="col-narrow"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const psi = p.psiOverride ?? PSI[p.typo][p.isolation];
              return (
                <tr key={p.id}>
                  <td>{TYPO_LABEL[p.typo]}</td>
                  <td className="text-tk-text-muted">{p.isolation}</td>
                  <td className="num font-mono">{p.longueur.toFixed(1)}</td>
                  <td className="num font-mono">{psi.toFixed(2)}{p.psiOverride != null && " *"}</td>
                  <td className="num font-mono">{(psi * p.longueur).toFixed(0)}</td>
                  <td className="col-narrow text-right">
                    <Button
                      variant="ghost" size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                      disabled={busyId === p.id}
                      aria-label="Supprimer"
                    >
                      {busyId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
