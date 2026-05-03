import { cn } from "@/lib/utils";
import Metric from "@/components/dashboard/Metric";
import DpeBadge from "@/components/dashboard/DpeBadge";
import { TrendingDown, TrendingUp, Minus, Check, Plus } from "lucide-react";

export type DpeLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface ScenarioIndicators {
  cep: number;        // kWhep/m²·an
  cef: number;        // kWhef/m²·an
  ges: number;        // kgCO2eq/m²·an
  dpe: DpeLetter;
  ges_class: DpeLetter;
  besoinChauffage: number;
  besoinECS: number;
  besoinClim: number;
}

export interface Travail {
  poste: string;
  description: string;
  coutHT: number;
}

export interface ScenarioFinances {
  coutTravauxHT: number;
  aides: { nom: string; montant: number }[];
  resteACharge: number;
  economieAnnuelle: number;
  tri: number; // années
}

export interface Scenario {
  id: string;
  nom: string;
  type: "INITIAL" | "VARIANTE";
  description?: string;
  indicateurs: ScenarioIndicators;
  travaux?: Travail[];
  finances?: ScenarioFinances;
}

interface Props {
  scenarios: Scenario[];
  surface: number;
}

function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function Delta({ from, to, lowerIsBetter = true, suffix = "%", invert = false }: {
  from: number;
  to: number;
  lowerIsBetter?: boolean;
  suffix?: string;
  invert?: boolean;
}) {
  if (from === 0) return null;
  const diff = ((to - from) / from) * 100;
  const isImprovement = invert
    ? diff > 0
    : (lowerIsBetter ? diff < 0 : diff > 0);
  const Icon = diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        isImprovement
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400",
      )}
    >
      <Icon className="h-3 w-3" />
      {diff > 0 ? "+" : ""}{diff.toFixed(0)}{suffix}
    </span>
  );
}

function ScenarioColumn({ scenario, baseline, surface, isFirst }: {
  scenario: Scenario;
  baseline: Scenario;
  surface: number;
  isFirst: boolean;
}) {
  const isInitial = scenario.type === "INITIAL";
  const ind = scenario.indicateurs;
  const ref = baseline.indicateurs;
  const fin = scenario.finances;

  return (
    <div className={cn(
      "flex flex-col min-w-[260px] flex-1",
      !isFirst && "border-l border-tk-border",
    )}>
      {/* Column header */}
      <div className={cn(
        "px-4 py-3 border-b border-tk-border",
        isInitial ? "bg-tk-bg/40" : "bg-tk-surface",
      )}>
        <p className="field-label-tiny">
          {isInitial ? "État initial" : "Variante de rénovation"}
        </p>
        <h3 className="text-[14px] font-semibold text-tk-text leading-tight truncate">
          {scenario.nom}
        </h3>
        {scenario.description && (
          <p className="mt-0.5 text-[11px] text-tk-text-muted line-clamp-2">{scenario.description}</p>
        )}
      </div>

      {/* DPE badges */}
      <div className="px-4 py-4 border-b border-tk-border flex items-center gap-3">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] uppercase tracking-wider text-tk-text-faint">DPE</span>
          <DpeBadge letter={ind.dpe} />
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] uppercase tracking-wider text-tk-text-faint">GES</span>
          <DpeBadge letter={ind.ges_class} />
        </div>
      </div>

      {/* Indicateurs énergétiques */}
      <div className="px-4 py-4 border-b border-tk-border space-y-3">
        <Row label="Cep" tooltip="Consommation énergie primaire">
          <Metric value={ind.cep} unit={<>kWh<sub>ep</sub>/m²·an</>} size="md" decimals={0} />
          {!isInitial && <Delta from={ref.cep} to={ind.cep} />}
        </Row>
        <Row label="Cef" tooltip="Consommation énergie finale">
          <Metric value={ind.cef} unit={<>kWh<sub>ef</sub>/m²·an</>} size="sm" decimals={0} />
          {!isInitial && <Delta from={ref.cef} to={ind.cef} />}
        </Row>
        <Row label="GES" tooltip="Émissions gaz à effet de serre">
          <Metric value={ind.ges} unit={<>kgCO<sub>2</sub>/m²·an</>} size="sm" decimals={1} />
          {!isInitial && <Delta from={ref.ges} to={ind.ges} />}
        </Row>
      </div>

      {/* Besoins par usage */}
      <div className="px-4 py-4 border-b border-tk-border space-y-2">
        <p className="field-label-tiny">Besoins · kWh/m²·an</p>
        <BesoinBar label="Chauffage" value={ind.besoinChauffage} max={Math.max(ref.besoinChauffage, ind.besoinChauffage, 1)} />
        <BesoinBar label="ECS" value={ind.besoinECS} max={Math.max(ref.besoinECS, ind.besoinECS, 1)} />
        {(ind.besoinClim > 0 || ref.besoinClim > 0) && (
          <BesoinBar label="Climatisation" value={ind.besoinClim} max={Math.max(ref.besoinClim, ind.besoinClim, 1)} />
        )}
      </div>

      {/* Travaux (variante uniquement) */}
      {!isInitial && scenario.travaux && scenario.travaux.length > 0 && (
        <div className="px-4 py-4 border-b border-tk-border">
          <p className="field-label-tiny mb-2">Travaux · {scenario.travaux.length} postes</p>
          <ul className="space-y-1.5">
            {scenario.travaux.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]">
                <Check className="h-3 w-3 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="flex-1 text-tk-text-secondary">{t.poste}</span>
                <span className="font-mono tabular-nums text-tk-text-muted">{formatEur(t.coutHT)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Finances (variante uniquement) */}
      {!isInitial && fin && (
        <div className="px-4 py-4 border-b border-tk-border space-y-2.5">
          <Row label="Coût travaux HT">
            <Metric value={fin.coutTravauxHT} unit="€" size="sm" decimals={0} />
          </Row>
          {fin.aides.map((a, i) => (
            <Row key={i} label={a.nom} small>
              <Metric value={-a.montant} unit="€" size="sm" decimals={0} tone="pos" />
            </Row>
          ))}
          <div className="pt-2 border-t border-tk-border/60">
            <Row label="Reste à charge" emphasis>
              <Metric value={fin.resteACharge} unit="€" size="md" decimals={0} />
            </Row>
          </div>
        </div>
      )}

      {/* Rentabilité (variante uniquement) */}
      {!isInitial && fin && (
        <div className="px-4 py-4 space-y-2.5">
          <Row label="Économie annuelle">
            <Metric value={fin.economieAnnuelle} unit="€/an" size="sm" decimals={0} tone="pos" />
          </Row>
          <Row label="TRI">
            <Metric value={fin.tri} unit="ans" size="sm" decimals={0} />
          </Row>
        </div>
      )}
    </div>
  );
}

function Row({ label, children, tooltip, small, emphasis }: {
  label: string;
  children: React.ReactNode;
  tooltip?: string;
  small?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          "text-[11px]",
          emphasis ? "font-semibold text-tk-text uppercase tracking-wide text-[10px]" : "text-tk-text-muted",
          small && "text-[10px]",
        )}
        title={tooltip}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function BesoinBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-0.5">
        <span className="text-tk-text-muted">{label}</span>
        <span className="font-mono tabular-nums text-tk-text">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-tk-hover overflow-hidden">
        <div
          className="h-full rounded-full bg-tk-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ScenarioComparator({ scenarios, surface }: Props) {
  if (scenarios.length === 0) return null;
  const baseline = scenarios.find((s) => s.type === "INITIAL") ?? scenarios[0];
  return (
    <div className="rounded-lg border border-tk-border bg-tk-surface overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-tk-border bg-tk-bg/40">
        <div>
          <h2 className="text-[14px] font-semibold text-tk-text">Comparateur de scénarios</h2>
          <p className="text-[11px] text-tk-text-muted">
            Surface chauffée {surface} m² · {scenarios.length - 1} variante{scenarios.length > 2 ? "s" : ""} de rénovation
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-tk-border bg-tk-surface px-2.5 py-1 text-[12px] font-medium text-tk-text-secondary hover:border-tk-border-hover hover:text-tk-text"
        >
          <Plus className="h-3 w-3" />
          Ajouter une variante
        </button>
      </header>
      <div className="flex overflow-x-auto">
        {scenarios.map((s, i) => (
          <ScenarioColumn
            key={s.id}
            scenario={s}
            baseline={baseline}
            surface={surface}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
