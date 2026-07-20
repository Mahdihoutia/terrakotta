"use client";

import { use, useEffect, useState } from "react";
import {
  Snowflake,
  Play,
  Loader2,
  Plus,
  X,
  Info,
  FileDown,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Metric from "@/components/dashboard/Metric";

type Regime = "BT" | "MT" | "HT";
type TypeAppoint = "GAZ" | "ELEC" | "AUCUN";

interface ScenarioInput {
  nom: string;
  regime: Regime;
  unites: number[];
  typeAppoint: TypeAppoint;
  tBivalenceForcee: number | null;
  rendementGaz: number;
}

interface HistoBucket {
  tRange: string;
  heures: number;
  besoinKwh: number;
  pacKwh: number;
  appointKwh: number;
  copMoyen: number;
}

interface ScenarioResultat {
  nom: string;
  regime: Regime;
  unites: number[];
  typeAppoint: TypeAppoint;
  tBivalenceForcee: number | null;
  puissanceInstallee: number;
  energieBesoin: number;
  energiePAC: number;
  energieAppoint: number;
  tauxCouverturePAC: number;
  scop: number;
  consoElecPAC: number;
  consoAppointGaz: number;
  consoAppointElec: number;
  temperatureBivalence: number | null;
  emissionsCO2AvantKg: number;
  emissionsCO2ApresKg: number;
  reductionCO2Pct: number;
  histoTemperature: HistoBucket[];
}

interface Response {
  calibrationId: string;
  periodeDebut: string;
  periodeFin: string;
  puissanceCalee: number;
  puissanceRecommandeeMin: number;
  puissanceRecommandeeMax: number;
  fourchetteCommerciale: number[];
  marges: { relance: number; distribution: number };
  consoGazAvantPeriode: number;
  emissionsAvantPeriode: number;
  scenarios: ScenarioResultat[];
}

const REGIME_LABEL: Record<Regime, string> = {
  BT: "Basse T° (plancher / VC 35°C)",
  MT: "Moyenne T° (radiateurs 55°C)",
  HT: "Haute T° (radiateurs 65-70°C)",
};

const APPOINT_LABEL: Record<TypeAppoint, string> = {
  GAZ: "Chaudière gaz",
  ELEC: "Résistance élec",
  AUCUN: "Aucun (PAC seule)",
};

const nf = (n: number, dec = 0) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n);

const DEFAULT_SCENARIOS: ScenarioInput[] = [
  {
    nom: "PAC 195 kW cascade (65+130)",
    regime: "MT",
    unites: [65, 130],
    typeAppoint: "GAZ",
    tBivalenceForcee: null,
    rendementGaz: 0.925,
  },
  {
    nom: "PAC 130 kW mono + appoint gaz",
    regime: "MT",
    unites: [130],
    typeAppoint: "GAZ",
    tBivalenceForcee: null,
    rendementGaz: 0.925,
  },
];

interface Props {
  params: Promise<{ id: string }>;
}

export default function PacPage({ params }: Props) {
  const { id: projetId } = use(params);
  const [scenarios, setScenarios] = useState<ScenarioInput[]>(DEFAULT_SCENARIOS);
  const [marges, setMarges] = useState({ relance: 0.12, distribution: 0.05 });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Response | null>(null);
  const [hasCalibration, setHasCalibration] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null);
  const [scenarioRetenuIdx, setScenarioRetenuIdx] = useState(0);
  const [categorie, setCategorie] = useState<"TERTIAIRE" | "RESIDENTIEL_COLLECTIF">(
    "TERTIAIRE",
  );
  const [site, setSite] = useState({
    surfaceChauffee: "2612",
    zoneClimatique: "H1",
    usage: "Établissement scolaire",
    fournisseurEnergie: "GRDF",
    compteurRef: "—",
    generateurExistantMarque: "Atlantic",
    generateurExistantModele: "Guillot VARMAX 180",
    generateurExistantNb: "2",
    generateurExistantPuissanceKw: "180",
    generateurExistantVecteur: "GAZ_NATUREL" as
      | "GAZ_NATUREL"
      | "FIOUL"
      | "PROPANE"
      | "ELEC"
      | "BOIS"
      | "RESEAU_CHALEUR",
  });
  const [ceeActif, setCeeActif] = useState(true);
  const [cee, setCee] = useState({
    forfaitKwhcParM2: "1100",
    facteurCorrectifSecteur: "0.8",
    facteurR: "1",
    bonificationCoupDePouce: "3",
    primeEurMWhc: "6.9",
  });

  useEffect(() => {
    fetch(`/api/projets/${projetId}/calibration`)
      .then((r) => r.json())
      .then((list: unknown[]) => setHasCalibration(list.length > 0))
      .catch(() => setHasCalibration(false));
  }, [projetId]);

  function updateScenario(idx: number, patch: Partial<ScenarioInput>) {
    setScenarios((s) => s.map((sc, i) => (i === idx ? { ...sc, ...patch } : sc)));
  }

  function updateUnite(sIdx: number, uIdx: number, value: number) {
    setScenarios((s) =>
      s.map((sc, i) =>
        i === sIdx
          ? { ...sc, unites: sc.unites.map((u, j) => (j === uIdx ? value : u)) }
          : sc,
      ),
    );
  }

  function addUnite(sIdx: number) {
    setScenarios((s) =>
      s.map((sc, i) =>
        i === sIdx && sc.unites.length < 5 ? { ...sc, unites: [...sc.unites, 65] } : sc,
      ),
    );
  }

  function removeUnite(sIdx: number, uIdx: number) {
    setScenarios((s) =>
      s.map((sc, i) =>
        i === sIdx && sc.unites.length > 1
          ? { ...sc, unites: sc.unites.filter((_, j) => j !== uIdx) }
          : sc,
      ),
    );
  }

  function addScenario() {
    if (scenarios.length >= 6) return;
    setScenarios((s) => [
      ...s,
      {
        nom: `Scénario ${s.length + 1}`,
        regime: "MT",
        unites: [100],
        typeAppoint: "GAZ",
        tBivalenceForcee: null,
        rendementGaz: 0.925,
      },
    ]);
  }

  function removeScenario(idx: number) {
    setScenarios((s) => s.filter((_, i) => i !== idx));
  }

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`/api/projets/${projetId}/dimensionnement-pac`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarios, marges }),
      });
      if (!res.ok) {
        await showApiError(res, "Dimensionnement PAC");
        return;
      }
      const json = (await res.json()) as Response;
      setResult(json);
      toast.success(`${json.scenarios.length} scénario(s) simulé(s)`);
    } catch (err) {
      showNetworkError(err);
    } finally {
      setRunning(false);
    }
  }

  async function downloadNote(format: "pdf" | "word") {
    if (!result || scenarios.length === 0) return;
    setDownloading(format);
    try {
      const scenarioRetenu = scenarios[scenarioRetenuIdx] ?? scenarios[0];
      const autresScenarios = scenarios.filter((_, i) => i !== scenarioRetenuIdx);
      const endpoint =
        format === "pdf"
          ? "note-dimensionnement-pac"
          : "note-dimensionnement-pac-word";
      const res = await fetch(`/api/projets/${projetId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorie,
          scenarioRetenu,
          autresScenarios,
          marges,
          site: {
            generateurExistantMarque: site.generateurExistantMarque,
            generateurExistantModele: site.generateurExistantModele,
            generateurExistantNb: Number(site.generateurExistantNb),
            generateurExistantPuissanceKw: Number(site.generateurExistantPuissanceKw),
            generateurExistantVecteur: site.generateurExistantVecteur,
            surfaceChauffee: Number(site.surfaceChauffee),
            zoneClimatique: site.zoneClimatique,
            usage: site.usage,
            fournisseurEnergie: site.fournisseurEnergie,
            compteurRef: site.compteurRef,
          },
          cee: ceeActif
            ? {
                forfaitKwhcParM2: Number(cee.forfaitKwhcParM2),
                facteurCorrectifSecteur: Number(cee.facteurCorrectifSecteur),
                facteurR: Number(cee.facteurR),
                bonificationCoupDePouce: Number(cee.bonificationCoupDePouce),
                primeEurMWhc: Number(cee.primeEurMWhc),
              }
            : null,
        }),
      });
      if (!res.ok) {
        await showApiError(res, `Génération ${format.toUpperCase()}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `note-dimensionnement-pac-${projetId.slice(-8)}.${format === "pdf" ? "pdf" : "docx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Note ${format.toUpperCase()} téléchargée`);
    } catch (err) {
      showNetworkError(err);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title-dense flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-tk-primary" />
          Dimensionnement PAC air/eau
        </h1>
        <p className="mt-1 text-[13px] text-tk-text-muted">
          Simulation horaire mono ou cascade, sur météo ERA5 + puissance calée. Résultats :
          taux de couverture PAC/appoint, température de bivalence, SCOP, bilan CO₂.
        </p>
      </div>

      {hasCalibration === false && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-[12px] text-amber-700 dark:text-amber-400">
          Aucune calibration disponible. Va d&apos;abord dans l&apos;onglet{" "}
          <strong>Calibration</strong> et lance un calage ERA5 — ses résultats sont
          l&apos;entrée du moteur PAC.
        </div>
      )}

      {/* Marges */}
      <section className="rounded-xl border border-tk-border bg-tk-surface p-5">
        <h2 className="mb-3 text-[14px] font-semibold text-tk-text">
          Marges de dimensionnement
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-[11px] text-tk-text-muted">
            Relance matinale (%)
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.5"
              value={marges.relance}
              onChange={(e) =>
                setMarges({ ...marges, relance: Number(e.target.value) })
              }
              className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
            />
            <span className="mt-0.5 block text-[10px] text-tk-text-faint">
              Défaut 0.12 (12 %)
            </span>
          </label>
          <label className="text-[11px] text-tk-text-muted">
            Pertes distribution (%)
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.3"
              value={marges.distribution}
              onChange={(e) =>
                setMarges({ ...marges, distribution: Number(e.target.value) })
              }
              className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
            />
            <span className="mt-0.5 block text-[10px] text-tk-text-faint">Défaut 0.05</span>
          </label>
          <div className="flex items-end">
            <Button onClick={run} disabled={running || hasCalibration === false} className="w-full">
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Simuler {scenarios.length} scénario(s)
            </Button>
          </div>
        </div>
      </section>

      {/* Scénarios en édition */}
      <section className="rounded-xl border border-tk-border bg-tk-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-tk-text">
            Scénarios PAC ({scenarios.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={addScenario}
            disabled={scenarios.length >= 6}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {scenarios.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-tk-border bg-tk-bg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  value={s.nom}
                  onChange={(e) => updateScenario(i, { nom: e.target.value })}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-medium text-tk-text hover:border-tk-border focus:border-tk-border focus:outline-none"
                />
                <button
                  onClick={() => removeScenario(i)}
                  className="rounded p-1 text-tk-text-faint hover:bg-tk-hover hover:text-red-500"
                  aria-label="Supprimer scénario"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                  Régime
                  <select
                    value={s.regime}
                    onChange={(e) =>
                      updateScenario(i, { regime: e.target.value as Regime })
                    }
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-surface px-2 py-1 text-[12px] normal-case text-tk-text"
                  >
                    {(Object.keys(REGIME_LABEL) as Regime[]).map((r) => (
                      <option key={r} value={r}>
                        {REGIME_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                  Appoint
                  <select
                    value={s.typeAppoint}
                    onChange={(e) =>
                      updateScenario(i, { typeAppoint: e.target.value as TypeAppoint })
                    }
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-surface px-2 py-1 text-[12px] normal-case text-tk-text"
                  >
                    {(Object.keys(APPOINT_LABEL) as TypeAppoint[]).map((a) => (
                      <option key={a} value={a}>
                        {APPOINT_LABEL[a]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                    Unités PAC (kW) — total {s.unites.reduce((a, b) => a + b, 0)} kW
                  </span>
                  <button
                    onClick={() => addUnite(i)}
                    disabled={s.unites.length >= 5}
                    className="text-[10px] text-tk-primary hover:underline disabled:opacity-30"
                  >
                    + unité
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.unites.map((u, j) => (
                    <div key={j} className="inline-flex items-center gap-0.5">
                      <input
                        type="number"
                        min="1"
                        value={u}
                        onChange={(e) => updateUnite(i, j, Number(e.target.value))}
                        className="w-16 rounded border border-tk-border bg-tk-surface px-1.5 py-0.5 text-[12px] text-tk-text"
                      />
                      {s.unites.length > 1 && (
                        <button
                          onClick={() => removeUnite(i, j)}
                          className="rounded p-0.5 text-tk-text-faint hover:text-red-500"
                          aria-label="Retirer unité"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                  T° bivalence forcée
                  <input
                    type="number"
                    step="0.5"
                    placeholder="auto"
                    value={s.tBivalenceForcee ?? ""}
                    onChange={(e) =>
                      updateScenario(i, {
                        tBivalenceForcee:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-surface px-2 py-1 text-[12px] normal-case text-tk-text"
                  />
                </label>
                {s.typeAppoint === "GAZ" && (
                  <label className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                    η chaudière gaz
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="1.2"
                      value={s.rendementGaz}
                      onChange={(e) =>
                        updateScenario(i, { rendementGaz: Number(e.target.value) })
                      }
                      className="mt-0.5 w-full rounded border border-tk-border bg-tk-surface px-2 py-1 text-[12px] normal-case text-tk-text"
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Résultats */}
      {result && (
        <>
          <section className="rounded-xl border border-tk-border bg-tk-surface p-5">
            <h2 className="mb-3 text-[14px] font-semibold text-tk-text">
              Fourchette de puissance recommandée
            </h2>
            <p className="mb-3 text-[11px] text-tk-text-muted">
              Applique les marges relance + distribution à la puissance calée pour
              proposer une plage à installer et les tailles catalogue standard qui
              tombent dans cette plage.
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              <KpiCard
                label="Puissance calée"
                value={result.puissanceCalee}
                unit="kW"
                sub="ERA5 + relevés"
              />
              <KpiCard
                label="Recommandation min"
                value={result.puissanceRecommandeeMin}
                unit="kW"
                sub={`+${nf(result.marges.relance * 100)} % relance`}
              />
              <KpiCard
                label="Recommandation max"
                value={result.puissanceRecommandeeMax}
                unit="kW"
                sub={`+${nf(result.marges.distribution * 100)} % distrib`}
              />
              <div className="rounded-lg border border-tk-border bg-tk-bg p-3">
                <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                  Fourchette commerciale
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.fourchetteCommerciale.length === 0 ? (
                    <span className="text-[12px] text-tk-text-muted">Aucune</span>
                  ) : (
                    result.fourchetteCommerciale.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-tk-primary/15 px-1.5 py-0.5 text-[11px] font-mono text-tk-primary"
                      >
                        {p} kW
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Comparateur scénarios */}
          <section className="rounded-xl border border-tk-border bg-tk-surface p-5">
            <h2 className="mb-3 text-[14px] font-semibold text-tk-text">
              Comparateur de scénarios
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] uppercase text-tk-text-faint">
                  <tr>
                    <th className="py-1.5 text-left font-medium">Scénario</th>
                    <th className="py-1.5 text-right font-medium">P inst.</th>
                    <th className="py-1.5 text-right font-medium">T° biv.</th>
                    <th className="py-1.5 text-right font-medium">Couv. PAC</th>
                    <th className="py-1.5 text-right font-medium">SCOP</th>
                    <th className="py-1.5 text-right font-medium">Conso élec PAC</th>
                    <th className="py-1.5 text-right font-medium">Appoint</th>
                    <th className="py-1.5 text-right font-medium">CO₂ après</th>
                    <th className="py-1.5 text-right font-medium">Δ CO₂</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tk-border/60">
                  {result.scenarios.map((s, i) => (
                    <tr key={i}>
                      <td className="py-2">
                        <div className="font-medium text-tk-text">{s.nom}</div>
                        <div className="text-[10px] text-tk-text-muted">
                          {s.regime} · {s.unites.join(" + ")} kW ·{" "}
                          {APPOINT_LABEL[s.typeAppoint]}
                        </div>
                      </td>
                      <td className="py-2 text-right font-mono text-tk-text">
                        {s.puissanceInstallee}
                      </td>
                      <td className="py-2 text-right font-mono text-tk-text-muted">
                        {s.temperatureBivalence != null
                          ? `${nf(s.temperatureBivalence, 1)}°C`
                          : "—"}
                      </td>
                      <td
                        className={cn(
                          "py-2 text-right font-mono",
                          s.tauxCouverturePAC > 0.85 && "text-emerald-600",
                          s.tauxCouverturePAC < 0.7 && "text-amber-600",
                        )}
                      >
                        {nf(s.tauxCouverturePAC * 100, 1)} %
                      </td>
                      <td className="py-2 text-right font-mono text-tk-text">
                        {nf(s.scop, 2)}
                      </td>
                      <td className="py-2 text-right font-mono text-tk-text-muted">
                        {nf(s.consoElecPAC)} kWh
                      </td>
                      <td className="py-2 text-right font-mono text-tk-text-muted">
                        {s.typeAppoint === "GAZ"
                          ? `${nf(s.consoAppointGaz)} kWh gaz`
                          : s.typeAppoint === "ELEC"
                            ? `${nf(s.consoAppointElec)} kWh élec`
                            : "—"}
                      </td>
                      <td className="py-2 text-right font-mono text-tk-text">
                        {nf(s.emissionsCO2ApresKg / 1000, 2)} t
                      </td>
                      <td className="py-2 text-right font-mono text-emerald-600">
                        −{nf(s.reductionCO2Pct, 1)} %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 flex items-start gap-1.5 rounded-md bg-tk-hover/40 p-2 text-[11px] text-tk-text-muted leading-relaxed">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Émissions Avant (chaudière existante) :{" "}
              {nf(result.emissionsAvantPeriode / 1000, 2)} t CO₂ sur la période. Facteurs
              ADEME : gaz 0.227 kgCO₂/kWh PCI, élec 0.055 kgCO₂/kWh (mix France ACV).
            </p>
          </section>

          {/* ─── Génération note de dimensionnement PDF ────────── */}
          <section className="rounded-xl border border-tk-border bg-tk-surface p-5 space-y-4">
            <div>
              <h2 className="text-[14px] font-semibold text-tk-text flex items-center gap-2">
                <FileDown className="h-4 w-4 text-tk-primary" />
                Note de dimensionnement — livrable PDF
              </h2>
              <p className="mt-1 text-[12px] text-tk-text-muted">
                Pièce technique opposable (fiche CEE BAT-TH-163 tertiaire ou
                BAR-TH-171 résidentiel collectif). Reprend la calibration ERA5, la
                validation ASHRAE G14 et le scénario PAC retenu ci-dessous.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[11px] text-tk-text-muted">
                  Catégorie du bâtiment
                  <select
                    value={categorie}
                    onChange={(e) =>
                      setCategorie(e.target.value as typeof categorie)
                    }
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  >
                    <option value="TERTIAIRE">Tertiaire (BAT-TH-163)</option>
                    <option value="RESIDENTIEL_COLLECTIF">
                      Résidentiel collectif (BAR-TH-171)
                    </option>
                  </select>
                </label>
                <label className="text-[11px] text-tk-text-muted">
                  Scénario retenu
                  <select
                    value={scenarioRetenuIdx}
                    onChange={(e) => setScenarioRetenuIdx(Number(e.target.value))}
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  >
                    {result.scenarios.map((s, i) => (
                      <option key={i} value={i}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                  Chaufferie existante (info livrable)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={site.generateurExistantMarque}
                    onChange={(e) =>
                      setSite({ ...site, generateurExistantMarque: e.target.value })
                    }
                    placeholder="Marque"
                    className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                  <input
                    value={site.generateurExistantModele}
                    onChange={(e) =>
                      setSite({ ...site, generateurExistantModele: e.target.value })
                    }
                    placeholder="Modèle"
                    className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                  <input
                    type="number"
                    value={site.generateurExistantNb}
                    onChange={(e) =>
                      setSite({ ...site, generateurExistantNb: e.target.value })
                    }
                    placeholder="Nb unités"
                    className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                  <input
                    type="number"
                    value={site.generateurExistantPuissanceKw}
                    onChange={(e) =>
                      setSite({
                        ...site,
                        generateurExistantPuissanceKw: e.target.value,
                      })
                    }
                    placeholder="P nom / unité (kW)"
                    className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                  <input
                    type="number"
                    value={site.surfaceChauffee}
                    onChange={(e) =>
                      setSite({ ...site, surfaceChauffee: e.target.value })
                    }
                    placeholder="Surface m²"
                    className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                  <input
                    value={site.zoneClimatique}
                    onChange={(e) =>
                      setSite({ ...site, zoneClimatique: e.target.value })
                    }
                    placeholder="Zone (H1/H2/H3)"
                    className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                  <input
                    value={site.usage}
                    onChange={(e) => setSite({ ...site, usage: e.target.value })}
                    placeholder="Usage (école, copro…)"
                    className="col-span-2 rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                  <input
                    value={site.compteurRef}
                    onChange={(e) =>
                      setSite({ ...site, compteurRef: e.target.value })
                    }
                    placeholder="PCE / PDL"
                    className="col-span-2 rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] text-tk-text-muted">
                  <input
                    type="checkbox"
                    checked={ceeActif}
                    onChange={(e) => setCeeActif(e.target.checked)}
                    className="rounded"
                  />
                  Inclure calcul CEE dans le PDF
                </label>
                {ceeActif && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={cee.forfaitKwhcParM2}
                      onChange={(e) =>
                        setCee({ ...cee, forfaitKwhcParM2: e.target.value })
                      }
                      placeholder="Forfait kWhc/m²"
                      className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={cee.facteurCorrectifSecteur}
                      onChange={(e) =>
                        setCee({ ...cee, facteurCorrectifSecteur: e.target.value })
                      }
                      placeholder="Facteur secteur"
                      className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={cee.facteurR}
                      onChange={(e) => setCee({ ...cee, facteurR: e.target.value })}
                      placeholder="Facteur R"
                      className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                    />
                    <input
                      type="number"
                      value={cee.bonificationCoupDePouce}
                      onChange={(e) =>
                        setCee({ ...cee, bonificationCoupDePouce: e.target.value })
                      }
                      placeholder="Bonif. Coup Pouce"
                      className="rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={cee.primeEurMWhc}
                      onChange={(e) =>
                        setCee({ ...cee, primeEurMWhc: e.target.value })
                      }
                      placeholder="€/MWhc"
                      className="col-span-2 rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                onClick={() => downloadNote("pdf")}
                disabled={downloading !== null}
                className="w-full"
              >
                {downloading === "pdf" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
                Télécharger PDF
              </Button>
              <Button
                onClick={() => downloadNote("word")}
                disabled={downloading !== null}
                variant="outline"
                className="w-full"
              >
                {downloading === "word" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Télécharger Word (.docx)
              </Button>
            </div>
            <p className="text-[11px] text-tk-text-faint">
              PDF pour opposabilité / archivage. Word (.docx) pour envoi client
              éditable et intégration dans dossier CEE.
            </p>
          </section>

          {/* Histogramme couverture par plage T° */}
          <section className="space-y-4">
            {result.scenarios.map((s, i) => (
              <div key={i} className="rounded-xl border border-tk-border bg-tk-surface p-5">
                <h3 className="mb-3 text-[13px] font-semibold text-tk-text">
                  {s.nom} — répartition par plage de température
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="text-[10px] uppercase text-tk-text-faint">
                      <tr>
                        <th className="py-1 text-left font-medium">Plage Te (°C)</th>
                        <th className="py-1 text-right font-medium">Heures</th>
                        <th className="py-1 text-right font-medium">Besoin</th>
                        <th className="py-1 text-right font-medium">PAC</th>
                        <th className="py-1 text-right font-medium">Appoint</th>
                        <th className="py-1 text-right font-medium">COP moy.</th>
                        <th className="py-1 text-left font-medium pl-3">Couverture</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tk-border/60">
                      {s.histoTemperature.map((b) => {
                        const pctPac =
                          b.besoinKwh > 0 ? (b.pacKwh / b.besoinKwh) * 100 : 0;
                        return (
                          <tr key={b.tRange}>
                            <td className="py-1.5 font-mono text-tk-text">
                              {b.tRange}
                            </td>
                            <td className="py-1.5 text-right font-mono text-tk-text-muted">
                              {b.heures}
                            </td>
                            <td className="py-1.5 text-right font-mono text-tk-text-muted">
                              {nf(b.besoinKwh)}
                            </td>
                            <td className="py-1.5 text-right font-mono text-emerald-600">
                              {nf(b.pacKwh)}
                            </td>
                            <td className="py-1.5 text-right font-mono text-amber-600">
                              {nf(b.appointKwh)}
                            </td>
                            <td className="py-1.5 text-right font-mono text-tk-text">
                              {nf(b.copMoyen, 2)}
                            </td>
                            <td className="py-1.5 pl-3">
                              <div className="relative h-2 w-full overflow-hidden rounded bg-tk-border/40">
                                <div
                                  className="absolute inset-y-0 left-0 bg-emerald-500"
                                  style={{ width: `${Math.min(100, pctPac)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: number;
  unit: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-tk-border bg-tk-bg p-3">
      <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">{label}</p>
      <Metric value={value} unit={unit} size="lg" />
      {sub && <p className="mt-1 text-[10px] text-tk-text-muted">{sub}</p>}
    </div>
  );
}
