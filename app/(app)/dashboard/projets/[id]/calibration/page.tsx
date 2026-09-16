"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  Gauge,
  Plus,
  Trash2,
  Loader2,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import Metric from "@/components/dashboard/Metric";

type Vecteur = "ELEC" | "GAZ_NATUREL" | "FIOUL" | "BOIS" | "PROPANE" | "RESEAU_CHALEUR";
type Source = "R" | "E" | "F";

interface Releve {
  id: string;
  vecteur: Vecteur;
  periodeDebut: string;
  periodeFin: string;
  kwh: number;
  source: Source;
  compteurRef: string | null;
  notes: string | null;
}

interface CalibrationScenario {
  pmax: number;
  eUtileCalc: number;
  eGazCalc: number;
  ecartPct: number;
  interpretation: "surdim" | "sousdim" | "bon" | "borderline";
}

interface CalibrationResponse {
  id: string;
  energieRelevee: number;
  sommeDh: number;
  heuresActives: number;
  pCaleeDh: number;
  pCaleeRegression: number | null;
  ecartMethodes: number | null;
  r2: number | null;
  rmse: number | null;
  cvRmse: number | null;
  nmbe: number | null;
  conformeAshrae: boolean;
  meilleur: CalibrationScenario;
  scenarios: CalibrationScenario[];
  regressionPoints: Array<{ mois: string; dh: number; kwh: number; kwhCalc: number }>;
  mensuel: Array<{ mois: string; sommeDh: number; heures: number }>;
  meteoSource: "open-meteo-archive" | "cache";
  deltaTBase: number;
}

const VECTEUR_LABEL: Record<Vecteur, string> = {
  ELEC: "Électricité",
  GAZ_NATUREL: "Gaz naturel",
  FIOUL: "Fioul",
  BOIS: "Bois / granulés",
  PROPANE: "Propane / GPL",
  RESEAU_CHALEUR: "Réseau de chaleur",
};

const SOURCE_LABEL: Record<Source, string> = {
  R: "Relevé réel",
  E: "Estimé",
  F: "Facture",
};

const nf = (n: number, dec = 0) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n);

interface FormReleve {
  vecteur: Vecteur;
  periodeDebut: string;
  periodeFin: string;
  kwh: string;
  source: Source;
  compteurRef: string;
}

interface FormCalibration {
  latitude: string;
  longitude: string;
  periodeDebut: string;
  periodeFin: string;
  vecteur: Vecteur;
  rendement: string;
  tArret: string;
  tBase: string;
}

const DEFAULT_FORM_RELEVE: FormReleve = {
  vecteur: "GAZ_NATUREL",
  periodeDebut: "",
  periodeFin: "",
  kwh: "",
  source: "R",
  compteurRef: "",
};

const DEFAULT_FORM_CALIB: FormCalibration = {
  latitude: "48.5",
  longitude: "2.58",
  periodeDebut: "",
  periodeFin: "",
  vecteur: "GAZ_NATUREL",
  rendement: "0.925",
  tArret: "14.5",
  tBase: "-7",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function CalibrationPage({ params }: Props) {
  const { id: projetId } = use(params);

  const [releves, setReleves] = useState<Releve[]>([]);
  const [loading, setLoading] = useState(true);
  const [formReleve, setFormReleve] = useState<FormReleve>(DEFAULT_FORM_RELEVE);
  const [submittingReleve, setSubmittingReleve] = useState(false);
  const [formCalib, setFormCalib] = useState<FormCalibration>(DEFAULT_FORM_CALIB);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CalibrationResponse | null>(null);

  const loadReleves = useCallback(async () => {
    try {
      const res = await fetch(`/api/projets/${projetId}/consommations`);
      if (!res.ok) {
        await showApiError(res, "Chargement relevés");
        return;
      }
      setReleves(await res.json());
    } catch (err) {
      showNetworkError(err);
    } finally {
      setLoading(false);
    }
  }, [projetId]);

  useEffect(() => {
    loadReleves();
  }, [loadReleves]);

  async function submitReleve(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReleve(true);
    try {
      const res = await fetch(`/api/projets/${projetId}/consommations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vecteur: formReleve.vecteur,
          periodeDebut: formReleve.periodeDebut,
          periodeFin: formReleve.periodeFin,
          kwh: Number(formReleve.kwh),
          source: formReleve.source,
          compteurRef: formReleve.compteurRef || null,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Création relevé");
        return;
      }
      toast.success("Relevé ajouté");
      setFormReleve({ ...DEFAULT_FORM_RELEVE, vecteur: formReleve.vecteur });
      loadReleves();
    } catch (err) {
      showNetworkError(err);
    } finally {
      setSubmittingReleve(false);
    }
  }

  async function deleteReleve(cid: string) {
    if (!confirm("Supprimer ce relevé ?")) return;
    try {
      const res = await fetch(`/api/projets/${projetId}/consommations/${cid}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        await showApiError(res, "Suppression");
        return;
      }
      toast.success("Relevé supprimé");
      loadReleves();
    } catch (err) {
      showNetworkError(err);
    }
  }

  async function importCSV(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const header = lines.shift()?.split(",").map((s) => s.trim().toLowerCase()) ?? [];
    const idx = {
      vecteur: header.indexOf("vecteur"),
      debut: header.indexOf("periode_debut"),
      fin: header.indexOf("periode_fin"),
      kwh: header.indexOf("kwh"),
      source: header.indexOf("source"),
    };
    if (idx.debut < 0 || idx.fin < 0 || idx.kwh < 0) {
      toast.error("CSV: colonnes requises 'vecteur, periode_debut, periode_fin, kwh, source'");
      return;
    }
    const items = lines.map((l) => {
      const cols = l.split(",").map((s) => s.trim());
      return {
        vecteur: (cols[idx.vecteur] || "GAZ_NATUREL") as Vecteur,
        periodeDebut: cols[idx.debut],
        periodeFin: cols[idx.fin],
        kwh: Number(cols[idx.kwh]),
        source: ((cols[idx.source] || "R") as Source),
      };
    });
    const res = await fetch(`/api/projets/${projetId}/consommations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      await showApiError(res, "Import CSV");
      return;
    }
    const json = await res.json();
    toast.success(`${json.count} relevés importés`);
    loadReleves();
  }

  async function runCalibration(e: React.FormEvent) {
    e.preventDefault();
    if (releves.length === 0) {
      toast.error("Ajoute au moins un relevé avant de calibrer.");
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`/api/projets/${projetId}/calibration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: Number(formCalib.latitude),
          longitude: Number(formCalib.longitude),
          periodeDebut: formCalib.periodeDebut,
          periodeFin: formCalib.periodeFin,
          vecteur: formCalib.vecteur,
          rendement: Number(formCalib.rendement),
          tArret: Number(formCalib.tArret),
          tBase: Number(formCalib.tBase),
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Calibration");
        return;
      }
      const json = (await res.json()) as CalibrationResponse;
      setResult(json);
      toast.success(
        json.conformeAshrae
          ? "Calibration conforme ASHRAE Guideline 14"
          : "Calibration terminée (hors seuils ASHRAE)",
      );
    } catch (err) {
      showNetworkError(err);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title-dense flex items-center gap-2">
          <Gauge className="h-4 w-4 text-tk-primary" />
          Calibration énergétique — ERA5
        </h1>
        <p className="mt-1 text-[13px] text-tk-text-muted">
          Import des consos réelles (GRDF / Enedis) + calage sur météo horaire ERA5
          Copernicus. Verdict statistique ASHRAE Guideline 14 (CV(RMSE) ≤ 15 %, |NMBE| ≤ 5 %).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* ─── Relevés consos ─────────────────────────────── */}
        <section className="rounded-xl border border-tk-border bg-tk-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-tk-text">
              Relevés de consommation ({releves.length})
            </h2>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-tk-border bg-tk-surface px-2.5 py-1 text-[12px] text-tk-text-secondary hover:border-tk-border-hover hover:text-tk-text">
              <Upload className="h-3.5 w-3.5" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importCSV(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          <form onSubmit={submitReleve} className="grid grid-cols-2 gap-2 rounded-lg border border-dashed border-tk-border p-3">
            <label className="col-span-2 text-[11px] text-tk-text-muted">
              Vecteur
              <select
                value={formReleve.vecteur}
                onChange={(e) =>
                  setFormReleve({ ...formReleve, vecteur: e.target.value as Vecteur })
                }
                className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
              >
                {(Object.keys(VECTEUR_LABEL) as Vecteur[]).map((v) => (
                  <option key={v} value={v}>
                    {VECTEUR_LABEL[v]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-tk-text-muted">
              Période début
              <input
                type="date"
                required
                value={formReleve.periodeDebut}
                onChange={(e) => setFormReleve({ ...formReleve, periodeDebut: e.target.value })}
                className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
              />
            </label>
            <label className="text-[11px] text-tk-text-muted">
              Période fin
              <input
                type="date"
                required
                value={formReleve.periodeFin}
                onChange={(e) => setFormReleve({ ...formReleve, periodeFin: e.target.value })}
                className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
              />
            </label>
            <label className="text-[11px] text-tk-text-muted">
              kWh
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formReleve.kwh}
                onChange={(e) => setFormReleve({ ...formReleve, kwh: e.target.value })}
                className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
              />
            </label>
            <label className="text-[11px] text-tk-text-muted">
              Source
              <select
                value={formReleve.source}
                onChange={(e) =>
                  setFormReleve({ ...formReleve, source: e.target.value as Source })
                }
                className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
              >
                {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="submit"
              size="sm"
              disabled={submittingReleve}
              className="col-span-2 mt-1"
            >
              {submittingReleve ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Ajouter le relevé
            </Button>
          </form>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="py-6 text-center text-[12px] text-tk-text-muted">
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              </div>
            ) : releves.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-tk-text-muted">
                Aucun relevé. Ajoute-en un ou importe un CSV
                (vecteur, periode_debut, periode_fin, kwh, source).
              </p>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="text-[11px] uppercase text-tk-text-faint">
                  <tr>
                    <th className="py-1 text-left font-medium">Période</th>
                    <th className="py-1 text-left font-medium">Vecteur</th>
                    <th className="py-1 text-right font-medium">kWh</th>
                    <th className="py-1 text-center font-medium">Src</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tk-border/60">
                  {releves.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 text-tk-text">
                        {r.periodeDebut.slice(0, 10)} → {r.periodeFin.slice(0, 10)}
                      </td>
                      <td className="py-1.5 text-tk-text-muted">
                        {VECTEUR_LABEL[r.vecteur]}
                      </td>
                      <td className="py-1.5 text-right font-mono text-tk-text">{nf(r.kwh)}</td>
                      <td className="py-1.5 text-center">
                        <span
                          className={cn(
                            "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                            r.source === "R" && "bg-emerald-500/15 text-emerald-600",
                            r.source === "E" && "bg-amber-500/15 text-amber-600",
                            r.source === "F" && "bg-blue-500/15 text-blue-600",
                          )}
                        >
                          {r.source}
                        </span>
                      </td>
                      <td className="py-1.5 text-right">
                        <button
                          onClick={() => deleteReleve(r.id)}
                          className="rounded p-1 text-tk-text-faint hover:bg-tk-hover hover:text-red-500"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-tk-hover/40 font-medium">
                    <td className="py-1.5 text-tk-text">Total</td>
                    <td></td>
                    <td className="py-1.5 text-right font-mono text-tk-text">
                      {nf(releves.reduce((s, r) => s + r.kwh, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ─── Formulaire calibration ─────────────────────── */}
        <section className="rounded-xl border border-tk-border bg-tk-surface p-5">
          <h2 className="mb-4 text-[14px] font-semibold text-tk-text">
            Paramètres de calibration
          </h2>

          <form onSubmit={runCalibration} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-tk-text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Latitude
                </span>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formCalib.latitude}
                  onChange={(e) => setFormCalib({ ...formCalib, latitude: e.target.value })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                />
              </label>
              <label className="text-[11px] text-tk-text-muted">
                Longitude
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formCalib.longitude}
                  onChange={(e) => setFormCalib({ ...formCalib, longitude: e.target.value })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                />
              </label>
              <label className="text-[11px] text-tk-text-muted">
                Période début
                <input
                  type="date"
                  required
                  value={formCalib.periodeDebut}
                  onChange={(e) => setFormCalib({ ...formCalib, periodeDebut: e.target.value })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                />
              </label>
              <label className="text-[11px] text-tk-text-muted">
                Période fin
                <input
                  type="date"
                  required
                  value={formCalib.periodeFin}
                  onChange={(e) => setFormCalib({ ...formCalib, periodeFin: e.target.value })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                />
              </label>
              <label className="col-span-2 text-[11px] text-tk-text-muted">
                Vecteur relevés
                <select
                  value={formCalib.vecteur}
                  onChange={(e) =>
                    setFormCalib({ ...formCalib, vecteur: e.target.value as Vecteur })
                  }
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                >
                  {(Object.keys(VECTEUR_LABEL) as Vecteur[]).map((v) => (
                    <option key={v} value={v}>
                      {VECTEUR_LABEL[v]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-tk-text-muted">
                Rendement η (0-1)
                <input
                  type="number"
                  step="0.001"
                  min="0.1"
                  max="1.2"
                  required
                  value={formCalib.rendement}
                  onChange={(e) => setFormCalib({ ...formCalib, rendement: e.target.value })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                />
              </label>
              <label className="text-[11px] text-tk-text-muted">
                Seuil arrêt Te (°C)
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formCalib.tArret}
                  onChange={(e) => setFormCalib({ ...formCalib, tArret: e.target.value })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                />
              </label>
              <label className="col-span-2 text-[11px] text-tk-text-muted">
                Température de base Te_base (°C)
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formCalib.tBase}
                  onChange={(e) => setFormCalib({ ...formCalib, tBase: e.target.value })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                />
              </label>
            </div>
            <p className="flex items-start gap-1.5 rounded-md bg-tk-hover/40 p-2 text-[11px] text-tk-text-muted leading-relaxed">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Profil Ti dynamique : école (occupé 19°C / réduit 15-16°C / WE 14°C / vacances 12°C).
              Météo ERA5 chargée depuis Open-Meteo Archive (cache DB par zone/période).
            </p>
            <Button type="submit" disabled={running} className="w-full">
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Lancer la calibration
            </Button>
          </form>
        </section>
      </div>

      {/* ─── Résultats ──────────────────────────────────────── */}
      {result && (
        <section className="space-y-4 rounded-xl border border-tk-border bg-tk-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-tk-text">Résultats de calibration</h2>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                result.conformeAshrae
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-600",
              )}
            >
              {result.conformeAshrae ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {result.conformeAshrae
                ? "Conforme ASHRAE Guideline 14"
                : "Hors seuils ASHRAE G14"}
            </span>
          </div>

          {/* KPIs principaux */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-tk-border bg-tk-bg p-3">
              <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                Puissance calée (DH)
              </p>
              <Metric value={result.pCaleeDh} unit="kW" size="lg" />
              <p className="mt-1 text-[10px] text-tk-text-muted">
                Meilleur écart : {nf(result.meilleur.ecartPct, 2)} %
              </p>
            </div>
            <div className="rounded-lg border border-tk-border bg-tk-bg p-3">
              <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                Puissance calée (régression)
              </p>
              <Metric
                value={result.pCaleeRegression != null ? result.pCaleeRegression : null}
                unit="kW"
                size="lg"
                decimals={1}
                fallback="—"
              />
              <p className="mt-1 text-[10px] text-tk-text-muted">
                Écart méthodes :{" "}
                {result.ecartMethodes != null ? `${nf(result.ecartMethodes, 2)} %` : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-tk-border bg-tk-bg p-3">
              <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                ΣDH période
              </p>
              <Metric value={result.sommeDh} unit="°C·h" size="lg" />
              <p className="mt-1 text-[10px] text-tk-text-muted">
                {nf(result.heuresActives)} h chauffage actif
              </p>
            </div>
            <div className="rounded-lg border border-tk-border bg-tk-bg p-3">
              <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                Énergie relevée
              </p>
              <Metric value={result.energieRelevee} unit="kWh" size="lg" />
              <p className="mt-1 text-[10px] text-tk-text-muted">
                Météo : {result.meteoSource}
              </p>
            </div>
          </div>

          {/* Indicateurs stat ASHRAE */}
          <div>
            <h3 className="mb-2 text-[12px] font-semibold text-tk-text">
              Indices de performance statistique (ASHRAE G14 / IPMVP)
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="R² (mensuel)" value={result.r2} unit="" decimals={3} good={(v) => v >= 0.75} />
              <StatCard label="RMSE" value={result.rmse} unit="kWh" decimals={0} />
              <StatCard
                label="CV(RMSE)"
                value={result.cvRmse}
                unit="%"
                decimals={2}
                threshold={15}
                good={(v) => v <= 15}
              />
              <StatCard
                label="NMBE"
                value={result.nmbe}
                unit="%"
                decimals={2}
                threshold={5}
                good={(v) => Math.abs(v) <= 5}
              />
            </div>
          </div>

          {/* Tableau scénarios */}
          <div>
            <h3 className="mb-2 text-[12px] font-semibold text-tk-text">
              Balayage puissance (extrait — meilleur ± quelques points)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="text-[11px] uppercase text-tk-text-faint">
                  <tr>
                    <th className="py-1 text-left font-medium">Pmax (kW)</th>
                    <th className="py-1 text-right font-medium">E utile calc.</th>
                    <th className="py-1 text-right font-medium">E gaz calc.</th>
                    <th className="py-1 text-right font-medium">Écart %</th>
                    <th className="py-1 text-center font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tk-border/60">
                  {extractAroundBest(result.scenarios, result.meilleur.pmax).map((s) => {
                    const isBest = s.pmax === result.meilleur.pmax;
                    return (
                      <tr
                        key={s.pmax}
                        className={cn(isBest && "bg-emerald-500/10 font-semibold")}
                      >
                        <td className="py-1.5 font-mono text-tk-text">{s.pmax}</td>
                        <td className="py-1.5 text-right font-mono text-tk-text-muted">
                          {nf(s.eUtileCalc)}
                        </td>
                        <td className="py-1.5 text-right font-mono text-tk-text-muted">
                          {nf(s.eGazCalc)}
                        </td>
                        <td
                          className={cn(
                            "py-1.5 text-right font-mono",
                            Math.abs(s.ecartPct) < 5 && "text-emerald-600",
                            Math.abs(s.ecartPct) >= 10 && "text-red-500",
                          )}
                        >
                          {nf(s.ecartPct, 2)} %
                        </td>
                        <td className="py-1.5 text-center text-[10px]">
                          <VerdictBadge kind={s.interpretation} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Régression mensuelle */}
          {result.regressionPoints.length > 0 && (
            <div>
              <h3 className="mb-2 text-[12px] font-semibold text-tk-text">
                Régression mensuelle (DH ↔ kWh)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="text-[11px] uppercase text-tk-text-faint">
                    <tr>
                      <th className="py-1 text-left font-medium">Mois</th>
                      <th className="py-1 text-right font-medium">DH (°C·h)</th>
                      <th className="py-1 text-right font-medium">kWh relevé</th>
                      <th className="py-1 text-right font-medium">kWh calculé</th>
                      <th className="py-1 text-right font-medium">Écart</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tk-border/60">
                    {result.regressionPoints.map((p) => {
                      const ecart = ((p.kwhCalc - p.kwh) / p.kwh) * 100;
                      return (
                        <tr key={p.mois}>
                          <td className="py-1.5 text-tk-text">{p.mois}</td>
                          <td className="py-1.5 text-right font-mono text-tk-text-muted">
                            {nf(p.dh)}
                          </td>
                          <td className="py-1.5 text-right font-mono text-tk-text">
                            {nf(p.kwh)}
                          </td>
                          <td className="py-1.5 text-right font-mono text-tk-text-muted">
                            {nf(p.kwhCalc)}
                          </td>
                          <td
                            className={cn(
                              "py-1.5 text-right font-mono",
                              Math.abs(ecart) < 5 && "text-emerald-600",
                              Math.abs(ecart) >= 15 && "text-red-500",
                            )}
                          >
                            {nf(ecart, 1)} %
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  decimals = 2,
  threshold,
  good,
}: {
  label: string;
  value: number | null;
  unit: string;
  decimals?: number;
  threshold?: number;
  good?: (v: number) => boolean;
}) {
  const ok = value != null && good ? good(value) : null;
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        ok === true && "border-emerald-500/40 bg-emerald-500/5",
        ok === false && "border-amber-500/40 bg-amber-500/5",
        ok == null && "border-tk-border bg-tk-bg",
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">{label}</p>
      <Metric value={value} unit={unit} size="md" decimals={decimals} fallback="—" />
      {threshold != null && (
        <p className="mt-1 text-[10px] text-tk-text-muted">Seuil : ≤ {threshold} %</p>
      )}
    </div>
  );
}

function VerdictBadge({ kind }: { kind: CalibrationScenario["interpretation"] }) {
  const map = {
    bon: { label: "Bon calage", cls: "bg-emerald-500/20 text-emerald-600" },
    borderline: { label: "Borderline", cls: "bg-amber-500/20 text-amber-600" },
    surdim: { label: "Surdim", cls: "bg-red-500/20 text-red-600" },
    sousdim: { label: "Sous-dim", cls: "bg-red-500/20 text-red-600" },
  } as const;
  const v = map[kind];
  return <span className={cn("rounded px-1.5 py-0.5 font-medium", v.cls)}>{v.label}</span>;
}

/** Extrait meilleur ± 3 valeurs autour pour un tableau lisible. */
function extractAroundBest(
  scenarios: CalibrationScenario[],
  bestPmax: number,
): CalibrationScenario[] {
  const idx = scenarios.findIndex((s) => s.pmax === bestPmax);
  if (idx < 0) return scenarios.slice(0, 8);
  const start = Math.max(0, idx - 3);
  const end = Math.min(scenarios.length, idx + 4);
  return scenarios.slice(start, end);
}
