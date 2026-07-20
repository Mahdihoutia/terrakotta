"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  Building2,
  TrendingDown,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Plus,
  X,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import Metric from "@/components/dashboard/Metric";
import { cn } from "@/lib/utils";

type Activite =
  | "BUREAUX"
  | "ENSEIGNEMENT"
  | "HOSPITALIER"
  | "HOTELLERIE_RESTAURATION"
  | "COMMERCE"
  | "LOGISTIQUE_INDUSTRIE"
  | "SPORT_LOISIRS"
  | "CULTURE"
  | "AUTRE_TERTIAIRE";
type Methode = "RELATIVE" | "ABSOLUE";
type Zone = "H1" | "H2" | "H3";
type Statut = "ALIGNE" | "EN_ECART" | "EN_AVANCE" | "INDETERMINE";

const ACTIVITE_LABEL: Record<Activite, string> = {
  BUREAUX: "Bureaux",
  ENSEIGNEMENT: "Enseignement",
  HOSPITALIER: "Hospitalier / santé",
  HOTELLERIE_RESTAURATION: "Hôtellerie / restauration",
  COMMERCE: "Commerce",
  LOGISTIQUE_INDUSTRIE: "Logistique / industrie",
  SPORT_LOISIRS: "Sport / loisirs",
  CULTURE: "Culture",
  AUTRE_TERTIAIRE: "Autre tertiaire",
};

const STATUT_META: Record<
  Statut,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ALIGNE: { label: "Aligné", color: "text-emerald-600", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  EN_AVANCE: { label: "En avance", color: "text-blue-600", bg: "bg-blue-500/15", icon: CheckCircle2 },
  EN_ECART: { label: "En écart", color: "text-red-600", bg: "bg-red-500/15", icon: AlertTriangle },
  INDETERMINE: { label: "Indéterminé", color: "text-slate-500", bg: "bg-slate-500/15", icon: Info },
};

interface TrajectoirePoint {
  annee: number;
  objectif: number;
  actuel: number;
}

interface Trajectoire {
  methode: Methode;
  anneeReference: number;
  consoReference: number;
  consoActuelle: number | null;
  anneeActuelle: number | null;
  objectif2030: number;
  objectif2040: number;
  objectif2050: number;
  ecartAlignmentPct: number | null;
  statut: Statut;
  points: TrajectoirePoint[];
  baissePct2030: number;
  baissePct2040: number;
  baissePct2050: number;
  cabsRef: { 2030: number; 2040: number; 2050: number };
}

interface Profil {
  id: string;
  assujetti: boolean;
  methode: Methode;
  activite: Activite;
  zoneClimatique: Zone;
  surfacePlancher: number;
  anneeReference: number;
  consoReferenceKwhEfM2: number;
  consoActuelleKwhEfM2: number | null;
  anneeActuelle: number | null;
  notes: string | null;
}

interface ApiResponse {
  profil: Profil | null;
  trajectoire: Trajectoire | null;
  prochaineDeclarationOperat: string;
}

interface Geste {
  nom: string;
  gainPct: string;
  anneeMiseEnService: string;
}

const nf = (n: number, dec = 0) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(n);

const DEFAULT_FORM: Profil = {
  id: "",
  assujetti: true,
  methode: "RELATIVE",
  activite: "BUREAUX",
  zoneClimatique: "H1",
  surfacePlancher: 1000,
  anneeReference: 2015,
  consoReferenceKwhEfM2: 200,
  consoActuelleKwhEfM2: null,
  anneeActuelle: null,
  notes: null,
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function DeetPage({ params }: Props) {
  const { id: projetId } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profil, setProfil] = useState<Profil>(DEFAULT_FORM);
  const [trajectoire, setTrajectoire] = useState<Trajectoire | null>(null);
  const [prochaineDeclarationOperat, setProchaineDeclarationOperat] = useState<string>("");
  const [gestes, setGestes] = useState<Geste[]>([]);
  const [pointsSimules, setPointsSimules] = useState<TrajectoirePoint[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projets/${projetId}/deet`);
        if (!res.ok) {
          await showApiError(res, "Chargement DEET");
          return;
        }
        const json = (await res.json()) as ApiResponse;
        if (json.profil) setProfil(json.profil);
        setTrajectoire(json.trajectoire);
        setProchaineDeclarationOperat(json.prochaineDeclarationOperat);
      } catch (err) {
        showNetworkError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [projetId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projets/${projetId}/deet`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assujetti: profil.assujetti,
          methode: profil.methode,
          activite: profil.activite,
          zoneClimatique: profil.zoneClimatique,
          surfacePlancher: Number(profil.surfacePlancher),
          anneeReference: Number(profil.anneeReference),
          consoReferenceKwhEfM2: Number(profil.consoReferenceKwhEfM2),
          consoActuelleKwhEfM2:
            profil.consoActuelleKwhEfM2 != null ? Number(profil.consoActuelleKwhEfM2) : null,
          anneeActuelle: profil.anneeActuelle,
          notes: profil.notes,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Sauvegarde DEET");
        return;
      }
      const json = (await res.json()) as ApiResponse;
      if (json.profil) setProfil(json.profil);
      setTrajectoire(json.trajectoire);
      setPointsSimules(null);
      toast.success("Profil DEET enregistré");
    } catch (err) {
      showNetworkError(err);
    } finally {
      setSaving(false);
    }
  }

  async function simuler() {
    if (gestes.length === 0) {
      setPointsSimules(null);
      return;
    }
    try {
      const res = await fetch(`/api/projets/${projetId}/deet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestes: gestes
            .filter((g) => g.nom && g.gainPct && g.anneeMiseEnService)
            .map((g) => ({
              nom: g.nom,
              gainPct: Number(g.gainPct),
              anneeMiseEnService: Number(g.anneeMiseEnService),
            })),
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Simulation");
        return;
      }
      const json = (await res.json()) as {
        pointsSimules: TrajectoirePoint[];
      };
      setPointsSimules(json.pointsSimules);
      toast.success("Simulation appliquée");
    } catch (err) {
      showNetworkError(err);
    }
  }

  useEffect(() => {
    // Auto-simuler quand la liste change
    if (gestes.length > 0) simuler();
    else setPointsSimules(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestes]);

  const chartData = useMemo(() => {
    if (!trajectoire) return [];
    return trajectoire.points.map((p, i) => ({
      annee: p.annee,
      Objectif: Number(p.objectif.toFixed(2)),
      Actuel: Number(p.actuel.toFixed(2)),
      Simulé: pointsSimules ? Number(pointsSimules[i]?.actuel.toFixed(2)) : undefined,
    }));
  }, [trajectoire, pointsSimules]);

  const statutMeta = trajectoire ? STATUT_META[trajectoire.statut] : STATUT_META.INDETERMINE;
  const StatutIcon = statutMeta.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title-dense flex items-center gap-2">
          <Building2 className="h-4 w-4 text-tk-primary" />
          Décret Tertiaire — Cockpit projet
        </h1>
        <p className="mt-1 text-[13px] text-tk-text-muted">
          Trajectoire de réduction obligatoire (−40 % en 2030, −50 % en 2040, −60 % en 2050) ou
          respect d&apos;un seuil absolu Cabs. Déclaration OPERAT chaque année avant le 30 septembre.
        </p>
      </div>

      {/* Alerte prochaine déclaration */}
      {prochaineDeclarationOperat && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-[12px] text-blue-700 dark:text-blue-300">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          Prochaine déclaration OPERAT :{" "}
          <strong>
            {new Date(prochaineDeclarationOperat).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ─── Configuration ─────────────────────────────── */}
        <section className="rounded-xl border border-tk-border bg-tk-surface p-5">
          <h2 className="mb-4 text-[14px] font-semibold text-tk-text">Configuration</h2>

          {loading ? (
            <div className="py-8 text-center text-tk-text-muted">
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[12px] text-tk-text">
                <input
                  type="checkbox"
                  checked={profil.assujetti}
                  onChange={(e) => setProfil({ ...profil, assujetti: e.target.checked })}
                />
                Bâtiment assujetti DEET (surface tertiaire &gt; 1 000 m²)
              </label>

              <label className="block text-[11px] text-tk-text-muted">
                Activité principale
                <select
                  value={profil.activite}
                  onChange={(e) => setProfil({ ...profil, activite: e.target.value as Activite })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                >
                  {(Object.keys(ACTIVITE_LABEL) as Activite[]).map((a) => (
                    <option key={a} value={a}>
                      {ACTIVITE_LABEL[a]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-tk-text-muted">
                  Zone climatique
                  <select
                    value={profil.zoneClimatique}
                    onChange={(e) => setProfil({ ...profil, zoneClimatique: e.target.value as Zone })}
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  >
                    <option value="H1">H1 (Nord / Est)</option>
                    <option value="H2">H2 (Ouest / Centre)</option>
                    <option value="H3">H3 (Méditerranée)</option>
                  </select>
                </label>
                <label className="text-[11px] text-tk-text-muted">
                  Surface plancher (m²)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={profil.surfacePlancher}
                    onChange={(e) =>
                      setProfil({ ...profil, surfacePlancher: Number(e.target.value) })
                    }
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                </label>
              </div>

              <label className="block text-[11px] text-tk-text-muted">
                Méthode d&apos;objectif
                <select
                  value={profil.methode}
                  onChange={(e) => setProfil({ ...profil, methode: e.target.value as Methode })}
                  className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                >
                  <option value="RELATIVE">Relative (−40 / −50 / −60 % vs. baseline)</option>
                  <option value="ABSOLUE">Absolue (respect Cabs par activité)</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-tk-text-muted">
                  Année de référence
                  <input
                    type="number"
                    min="2010"
                    max="2019"
                    value={profil.anneeReference}
                    onChange={(e) =>
                      setProfil({ ...profil, anneeReference: Number(e.target.value) })
                    }
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                </label>
                <label className="text-[11px] text-tk-text-muted">
                  Conso ref (kWhEF/m²/an)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={profil.consoReferenceKwhEfM2}
                    onChange={(e) =>
                      setProfil({
                        ...profil,
                        consoReferenceKwhEfM2: Number(e.target.value),
                      })
                    }
                    className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                  />
                </label>
              </div>

              <div className="rounded-md border border-dashed border-tk-border p-2">
                <p className="mb-2 text-[10px] uppercase tracking-wide text-tk-text-faint">
                  Conso actuelle mesurée (dernier reporting OPERAT)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-tk-text-muted">
                    Année
                    <input
                      type="number"
                      min="2020"
                      max="2050"
                      value={profil.anneeActuelle ?? ""}
                      onChange={(e) =>
                        setProfil({
                          ...profil,
                          anneeActuelle: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                    />
                  </label>
                  <label className="text-[11px] text-tk-text-muted">
                    kWhEF/m²/an
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={profil.consoActuelleKwhEfM2 ?? ""}
                      onChange={(e) =>
                        setProfil({
                          ...profil,
                          consoActuelleKwhEfM2: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="mt-0.5 w-full rounded border border-tk-border bg-tk-bg px-2 py-1 text-[12px] text-tk-text"
                    />
                  </label>
                </div>
              </div>

              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Enregistrer et recalculer
              </Button>
            </div>
          )}
        </section>

        {/* ─── Résultats trajectoire ─────────────────────── */}
        <section className="space-y-4">
          {trajectoire ? (
            <>
              {/* KPIs */}
              <div className="grid gap-3 sm:grid-cols-4">
                <div
                  className={cn(
                    "rounded-lg border p-3",
                    statutMeta.bg,
                    "border-current/40",
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                    Statut d&apos;alignement
                  </p>
                  <div className={cn("mt-1 flex items-center gap-1.5", statutMeta.color)}>
                    <StatutIcon className="h-4 w-4" />
                    <span className="text-[15px] font-semibold">{statutMeta.label}</span>
                  </div>
                  {trajectoire.ecartAlignmentPct != null && (
                    <p className="mt-1 text-[11px] text-tk-text-muted">
                      Écart : {trajectoire.ecartAlignmentPct > 0 ? "+" : ""}
                      {nf(trajectoire.ecartAlignmentPct, 1)} % vs. trajectoire
                    </p>
                  )}
                </div>
                <KpiCard
                  label="Objectif 2030"
                  value={trajectoire.objectif2030}
                  unit="kWhEF/m²/an"
                  sub={`−${nf(trajectoire.baissePct2030, 0)} %`}
                />
                <KpiCard
                  label="Objectif 2040"
                  value={trajectoire.objectif2040}
                  unit="kWhEF/m²/an"
                  sub={`−${nf(trajectoire.baissePct2040, 0)} %`}
                />
                <KpiCard
                  label="Objectif 2050"
                  value={trajectoire.objectif2050}
                  unit="kWhEF/m²/an"
                  sub={`−${nf(trajectoire.baissePct2050, 0)} %`}
                />
              </div>

              {/* Graphique */}
              <div className="rounded-xl border border-tk-border bg-tk-surface p-5">
                <h2 className="mb-3 text-[14px] font-semibold text-tk-text">
                  Trajectoire baseline → 2050
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--tk-border)" />
                      <XAxis
                        dataKey="annee"
                        tick={{ fontSize: 11, fill: "var(--tk-text-muted)" }}
                        stroke="var(--tk-border)"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--tk-text-muted)" }}
                        stroke="var(--tk-border)"
                        label={{
                          value: "kWhEF/m²/an",
                          angle: -90,
                          position: "insideLeft",
                          fontSize: 10,
                          fill: "var(--tk-text-faint)",
                        }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: "var(--tk-surface)",
                          border: "1px solid var(--tk-border)",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <ReferenceLine
                        x={2030}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        label={{ value: "2030", fontSize: 10, fill: "#f59e0b" }}
                      />
                      <ReferenceLine
                        x={2040}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        label={{ value: "2040", fontSize: 10, fill: "#f59e0b" }}
                      />
                      <ReferenceLine
                        x={2050}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        label={{ value: "2050", fontSize: 10, fill: "#f59e0b" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Objectif"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Actuel"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                      {pointsSimules && (
                        <Line
                          type="monotone"
                          dataKey="Simulé"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-tk-text-muted">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  Vert : trajectoire cible réglementaire. Rouge : projection de la conso
                  actuelle sans action. Bleu pointillé : simulation avec les gestes ci-dessous.
                </p>
              </div>

              {/* Simulateur */}
              <div className="rounded-xl border border-tk-border bg-tk-surface p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-tk-text">
                    Simulateur &quot;Et si…&quot; ({gestes.length} geste{gestes.length > 1 ? "s" : ""})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setGestes([
                        ...gestes,
                        {
                          nom: `Geste ${gestes.length + 1}`,
                          gainPct: "15",
                          anneeMiseEnService: String(new Date().getFullYear() + 1),
                        },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un geste
                  </Button>
                </div>

                {gestes.length === 0 ? (
                  <p className="py-4 text-center text-[12px] text-tk-text-muted">
                    Ajoute un geste (isolation, PAC, régulation…) pour simuler son impact sur la
                    trajectoire.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {gestes.map((g, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_100px_100px_auto] items-end gap-2 rounded-md border border-tk-border bg-tk-bg p-2"
                      >
                        <label className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                          Nom du geste
                          <input
                            value={g.nom}
                            onChange={(e) =>
                              setGestes(
                                gestes.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)),
                              )
                            }
                            className="mt-0.5 w-full rounded border border-tk-border bg-tk-surface px-2 py-1 text-[12px] normal-case text-tk-text"
                          />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                          Gain %
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={g.gainPct}
                            onChange={(e) =>
                              setGestes(
                                gestes.map((x, j) =>
                                  j === i ? { ...x, gainPct: e.target.value } : x,
                                ),
                              )
                            }
                            className="mt-0.5 w-full rounded border border-tk-border bg-tk-surface px-2 py-1 text-[12px] text-tk-text"
                          />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-tk-text-faint">
                          Année MES
                          <input
                            type="number"
                            min="2020"
                            max="2050"
                            value={g.anneeMiseEnService}
                            onChange={(e) =>
                              setGestes(
                                gestes.map((x, j) =>
                                  j === i ? { ...x, anneeMiseEnService: e.target.value } : x,
                                ),
                              )
                            }
                            className="mt-0.5 w-full rounded border border-tk-border bg-tk-surface px-2 py-1 text-[12px] text-tk-text"
                          />
                        </label>
                        <button
                          onClick={() => setGestes(gestes.filter((_, j) => j !== i))}
                          className="rounded p-1 text-tk-text-faint hover:bg-tk-hover hover:text-red-500"
                          aria-label="Supprimer geste"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            !loading && (
              <div className="rounded-xl border border-dashed border-tk-border bg-tk-surface/40 p-10 text-center">
                <TrendingDown className="mx-auto h-6 w-6 text-tk-text-faint" />
                <p className="mt-3 text-[13px] font-medium text-tk-text">
                  Configure le profil DEET pour lancer le calcul
                </p>
                <p className="mx-auto mt-1 max-w-md text-[12px] text-tk-text-muted">
                  Renseigne l&apos;activité, la surface, l&apos;année de référence et la conso
                  correspondante pour voir apparaître la trajectoire.
                </p>
              </div>
            )
          )}
        </section>
      </div>
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
      <Metric value={value} unit={unit} size="lg" decimals={0} />
      {sub && <p className="mt-1 text-[10px] text-tk-text-muted">{sub}</p>}
    </div>
  );
}
