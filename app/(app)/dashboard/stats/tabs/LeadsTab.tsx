import { getLeadsStats } from "@/lib/stats/queries/leads";
import { formatDateFr, formatEuro, formatJours, formatPercent } from "@/lib/stats/utils";
import StatKpi from "../StatKpi";
import {
  FunnelChart, LeadsMonthlyChart, LeadsParSourceChart, ConversionParSourceChart,
} from "../charts/LeadsCharts";

interface Props {
  period: { start: Date; end: Date };
}

const STATUT_LABEL: Record<string, string> = {
  NOUVEAU: "Nouveau", CONTACTE: "Contacté", QUALIFIE: "Qualifié",
  PROPOSITION: "Proposition", GAGNE: "Gagné", PERDU: "Perdu",
};

export default async function LeadsTab({ period }: Props) {
  const stats = await getLeadsStats(period);
  const { kpis, funnel, perdus, monthly, parSource, conversionParSource, stagnants } = stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatKpi label="Pipeline ouvert" value={formatEuro(kpis.pipelineOuvert)} hint="budget estimé — leads non clôturés" />
        <StatKpi label="Taux de conversion" value={kpis.tauxConversion === null ? "—" : formatPercent(kpis.tauxConversion, 0)} hint="gagnés / (gagnés+perdus)" />
        <StatKpi label="Délai médian conversion" value={formatJours(kpis.delaiMedian)} hint="création → MAJ statut gagné" />
        <StatKpi label="Score moyen pipeline" value={kpis.scoreMoyen === null ? "—" : `${kpis.scoreMoyen.toFixed(1)} / 5`} hint="leads ouverts" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-premium p-5">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-tk-text">Funnel de conversion</h3>
            <p className="text-xs text-tk-text-faint">
              Perdus sur la période : <span className="tabular text-tk-text">{perdus}</span>
            </p>
          </header>
          <FunnelChart data={funnel} />
        </section>
        <ChartCard title="Évolution mensuelle nouveaux leads" subtitle="12 mois glissants">
          <LeadsMonthlyChart data={monthly} />
        </ChartCard>
        <ChartCard title="Répartition par source" subtitle="top 10 sur la période">
          <LeadsParSourceChart data={parSource} />
        </ChartCard>
        <ChartCard title="Taux de conversion par source" subtitle="min. 3 leads clôturés">
          <ConversionParSourceChart data={conversionParSource} />
        </ChartCard>
      </div>

      <section className="card-premium overflow-hidden p-0">
        <header className="border-b border-tk-border px-5 py-3">
          <h3 className="text-sm font-semibold text-tk-text">Leads stagnants</h3>
          <p className="text-xs text-tk-text-faint">Pas de mise à jour depuis plus de 30 jours</p>
        </header>
        {stagnants.length === 0 ? (
          <div className="p-8 text-center text-sm text-tk-text-faint">Aucun lead stagnant</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-tk-border text-[0.7rem] uppercase tracking-wider text-tk-text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-right">Score</th>
                  <th className="px-4 py-2 text-right">Budget estimé</th>
                  <th className="px-4 py-2 text-right">Dernière MAJ</th>
                </tr>
              </thead>
              <tbody>
                {stagnants.map((l, i) => (
                  <tr key={l.id} className={i % 2 === 0 ? "bg-transparent" : "bg-tk-hover/30"}>
                    <td className="px-4 py-2 font-medium text-tk-text">{l.nom}</td>
                    <td className="px-4 py-2 text-tk-text-muted">{l.source.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="px-4 py-2 text-tk-text-muted">{STATUT_LABEL[l.statut] ?? l.statut}</td>
                    <td className="px-4 py-2 text-right tabular">{l.score ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular">{l.budgetEstime ? formatEuro(l.budgetEstime) : "—"}</td>
                    <td className="px-4 py-2 text-right tabular text-tk-text-faint">{formatDateFr(l.dateMiseAJour)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card-premium p-5">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-tk-text">{title}</h3>
        {subtitle && <p className="text-xs text-tk-text-faint">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
