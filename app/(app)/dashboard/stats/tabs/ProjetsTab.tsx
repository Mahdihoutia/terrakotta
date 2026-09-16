import type { CategorieCible } from "@prisma/client";
import { getProjetsStats } from "@/lib/stats/queries/projets";
import { formatEuro, formatJours, formatPercent } from "@/lib/stats/utils";
import StatKpi from "../StatKpi";
import {
  ProjetsMonthlyChart, ProjetsParStatutChart, ProjetsParCategorieChart, TopTravauxChart,
} from "../charts/ProjetsCharts";

interface Props {
  period: { start: Date; end: Date };
  categories: CategorieCible[];
}

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente", EN_COURS: "En cours", EN_PAUSE: "En pause",
  TERMINE: "Terminé", ANNULE: "Annulé",
};

export default async function ProjetsTab({ period, categories }: Props) {
  const stats = await getProjetsStats(period, categories);
  const { kpis, monthly, parStatut, parCategorie, topTravaux, topActifs } = stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatKpi label="Portefeuille actif" value={String(kpis.portefeuilleActif)} hint="projets non clôturés" />
        <StatKpi label="CA carnet de commandes" value={formatEuro(kpis.caCarnet)} hint="budget prévu — projets actifs" />
        <StatKpi label="Durée médiane projet" value={formatJours(kpis.dureeMediane)} hint="livrés sur la période" />
        <StatKpi label="Taux d'achèvement" value={kpis.tauxAchevement === null ? "—" : formatPercent(kpis.tauxAchevement, 0)} hint="TERMINE / (TERMINE+ANNULE)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Évolution mensuelle — créés vs livrés" subtitle="12 mois glissants">
          <ProjetsMonthlyChart data={monthly} />
        </ChartCard>
        <ChartCard title="Répartition par statut" subtitle="sur la période">
          <ProjetsParStatutChart data={parStatut} />
        </ChartCard>
        <ChartCard title="Répartition par catégorie cible" subtitle="sur la période">
          <ProjetsParCategorieChart data={parCategorie} />
        </ChartCard>
        <ChartCard title="Top types de travaux" subtitle="top 5 sur la période">
          <TopTravauxChart data={topTravaux} />
        </ChartCard>
      </div>

      <section className="card-premium overflow-hidden p-0">
        <header className="border-b border-tk-border px-5 py-3">
          <h3 className="text-sm font-semibold text-tk-text">Top projets actifs par budget</h3>
          <p className="text-xs text-tk-text-faint">Surveillance des dérapages budgétaires</p>
        </header>
        {topActifs.length === 0 ? (
          <div className="p-8 text-center text-sm text-tk-text-faint">Aucun projet actif</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-tk-border text-[0.7rem] uppercase tracking-wider text-tk-text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Projet</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-right">Budget prévu</th>
                  <th className="px-4 py-2 text-right">Dépensé</th>
                  <th className="px-4 py-2 text-right">% Dérapage</th>
                </tr>
              </thead>
              <tbody>
                {topActifs.map((p, i) => {
                  const derapColor = p.derapage === null
                    ? "text-tk-text-faint"
                    : p.derapage > 100
                      ? "text-red-600 font-semibold"
                      : p.derapage > 85
                        ? "text-orange-500 font-semibold"
                        : "text-tk-text";
                  return (
                    <tr key={p.id} className={i % 2 === 0 ? "bg-transparent" : "bg-tk-hover/30"}>
                      <td className="px-4 py-2 font-medium text-tk-text">{p.titre}</td>
                      <td className="px-4 py-2 text-tk-text-muted">{p.clientNom}</td>
                      <td className="px-4 py-2 text-tk-text-muted">{STATUT_LABEL[p.statut] ?? p.statut}</td>
                      <td className="px-4 py-2 text-right tabular">{p.budgetPrevu === null ? "—" : formatEuro(p.budgetPrevu)}</td>
                      <td className="px-4 py-2 text-right tabular">{formatEuro(p.budgetDepense)}</td>
                      <td className={`px-4 py-2 text-right tabular ${derapColor}`}>
                        {p.derapage === null ? "—" : `${p.derapage.toFixed(0)} %`}
                      </td>
                    </tr>
                  );
                })}
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
