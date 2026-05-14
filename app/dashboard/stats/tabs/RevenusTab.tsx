import type { CategorieCible } from "@prisma/client";
import { getRevenusStats } from "@/lib/stats/queries/revenus";
import { formatDateFr, formatEuro, formatJours } from "@/lib/stats/utils";
import StatKpi from "../StatKpi";
import {
  RevenusMonthlyChart, AcceptationDevisChart, AgingChart, TopClientsChart,
} from "../charts/RevenusCharts";

interface Props {
  period: { start: Date; end: Date };
  categories: CategorieCible[];
}

export default async function RevenusTab({ period, categories }: Props) {
  const stats = await getRevenusStats(period, categories);
  const { kpis, monthly, acceptationDevis, aging, topClients, retards } = stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatKpi label="CA prévisionnel" value={formatEuro(kpis.caPrevisionnel)} hint="devis envoyés sur la période" />
        <StatKpi label="CA accepté" value={formatEuro(kpis.caAccepte)} hint="devis acceptés sur la période" />
        <StatKpi label="CA facturé" value={formatEuro(kpis.caFacture)} hint="factures émises sur la période" />
        <StatKpi label="CA encaissé" value={formatEuro(kpis.caEncaisse)} hint="factures payées sur la période" />
        <StatKpi label="Créances ouvertes" value={formatEuro(kpis.creancesOuvertes)} hint="stock actuel" />
        <StatKpi label="DSO" value={formatJours(kpis.dso)} hint="délai médian d&apos;encaissement" />
      </div>

      <ChartCard title="Évolution mensuelle" subtitle="12 mois glissants — émis, accepté, facturé, encaissé">
        <RevenusMonthlyChart data={monthly} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Taux d'acceptation devis" subtitle="sur la période">
          <AcceptationDevisChart data={acceptationDevis} />
        </ChartCard>
        <ChartCard title="Aging des créances" subtitle="factures non payées · stock actuel">
          <AgingChart data={aging} />
        </ChartCard>
        <ChartCard title="Top 5 clients par CA facturé" subtitle="sur la période">
          <TopClientsChart data={topClients} />
        </ChartCard>
      </div>

      <section className="card-premium overflow-hidden p-0">
        <header className="border-b border-tk-border px-5 py-3">
          <h3 className="text-sm font-semibold text-tk-text">Factures en retard</h3>
          <p className="text-xs text-tk-text-faint">Échéance dépassée — relance prioritaire</p>
        </header>
        {retards.length === 0 ? (
          <div className="p-8 text-center text-sm text-tk-text-faint">Aucune facture en retard</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-tk-border text-[0.7rem] uppercase tracking-wider text-tk-text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Numéro</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-right">Montant HT</th>
                  <th className="px-4 py-2 text-right">Échéance</th>
                  <th className="px-4 py-2 text-right">Jours de retard</th>
                </tr>
              </thead>
              <tbody>
                {retards.map((f, i) => (
                  <tr key={f.id} className={i % 2 === 0 ? "bg-transparent" : "bg-tk-hover/30"}>
                    <td className="px-4 py-2 font-medium text-tk-text">{f.numero}</td>
                    <td className="px-4 py-2 text-tk-text-muted">{f.clientNom}</td>
                    <td className="px-4 py-2 text-right tabular">{formatEuro(f.montantHT)}</td>
                    <td className="px-4 py-2 text-right tabular text-tk-text-faint">
                      {f.dateEcheance ? formatDateFr(f.dateEcheance) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular font-semibold text-red-600">
                      {f.joursRetard} j
                    </td>
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
