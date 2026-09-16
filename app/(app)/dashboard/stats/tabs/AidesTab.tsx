import type { CategorieCible } from "@prisma/client";
import { getAidesStats } from "@/lib/stats/queries/aides";
import { formatDateFr, formatEuro, formatJours } from "@/lib/stats/utils";
import StatKpi from "../StatKpi";
import {
  AidesMonthlyChart, AidesParTypeChart, AidesAcceptationChart,
} from "../charts/AidesCharts";

interface Props {
  period: { start: Date; end: Date };
  categories: CategorieCible[];
}

const TYPE_LABEL: Record<string, string> = {
  MAPRIMERENOVATION: "MaPrimeRénov'", CEE: "CEE", ECO_PTZ: "Éco-PTZ",
  AIDE_LOCALE: "Aide locale", COUP_DE_POUCE: "Coup de pouce", AUTRE: "Autre",
};

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente", DEPOSE: "Déposé", EN_INSTRUCTION: "En instruction",
  ACCORDE: "Accordé", REFUSE: "Refusé", VERSE: "Versé",
};

export default async function AidesTab({ period, categories }: Props) {
  const stats = await getAidesStats(period, categories);
  const { kpis, monthly, parType, acceptation, enAttente } = stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatKpi label="Aides en instruction" value={String(kpis.enInstruction)} hint="en attente, déposé, en instruction" />
        <StatKpi label="Montant accordé" value={formatEuro(kpis.montantNotifie)} hint="aides accordées sur la période" />
        <StatKpi label="kWh cumac valorisés" value={kpis.kwhCumac.toLocaleString("fr-FR")} hint="CEE accordées sur la période" />
        <StatKpi label="Délai médian dépôt → accord" value={formatJours(kpis.delaiMedian)} hint="aides bouclées dans la période" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Évolution mensuelle — déposées vs accordées" subtitle="12 mois glissants">
          <AidesMonthlyChart data={monthly} />
        </ChartCard>
        <ChartCard title="Répartition par type" subtitle="sur la période">
          <AidesParTypeChart data={parType} />
        </ChartCard>
        <ChartCard title="Taux d'acceptation" subtitle="aides créées sur la période">
          <AidesAcceptationChart data={acceptation} />
        </ChartCard>
      </div>

      <section className="card-premium overflow-hidden p-0">
        <header className="border-b border-tk-border px-5 py-3">
          <h3 className="text-sm font-semibold text-tk-text">Aides en instruction &gt; 60 jours</h3>
          <p className="text-xs text-tk-text-faint">Dossiers à relancer auprès des financeurs</p>
        </header>
        {enAttente.length === 0 ? (
          <div className="p-8 text-center text-sm text-tk-text-faint">Aucun dossier en attente prolongée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-tk-border text-[0.7rem] uppercase tracking-wider text-tk-text-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Projet</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Statut</th>
                  <th className="px-4 py-2 text-right">Montant</th>
                  <th className="px-4 py-2 text-right">Date dépôt</th>
                  <th className="px-4 py-2 text-right">Jours d&apos;attente</th>
                </tr>
              </thead>
              <tbody>
                {enAttente.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-transparent" : "bg-tk-hover/30"}>
                    <td className="px-4 py-2 font-medium text-tk-text">{a.projetTitre}</td>
                    <td className="px-4 py-2 text-tk-text-muted">{TYPE_LABEL[a.type] ?? a.type}</td>
                    <td className="px-4 py-2 text-tk-text-muted">{STATUT_LABEL[a.statut] ?? a.statut}</td>
                    <td className="px-4 py-2 text-right tabular">{a.montant ? formatEuro(a.montant) : "—"}</td>
                    <td className="px-4 py-2 text-right tabular text-tk-text-faint">
                      {a.dateDepot ? formatDateFr(a.dateDepot) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular font-semibold text-orange-500">
                      {a.joursAttente} j
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
