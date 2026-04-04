import KpiCard from "@/components/dashboard/KpiCard";
import LeadsChart from "@/components/dashboard/LeadsChart";
import RecentLeads from "@/components/dashboard/RecentLeads";
import AgentStatusCard from "@/components/dashboard/AgentStatusCard";

const KPI_DATA = [
  {
    label: "Leads actifs",
    value: 47,
    change: 12,
    changeLabel: "vs mois dernier",
    icon: "users",
  },
  {
    label: "Taux de conversion",
    value: "38%",
    change: 5.2,
    changeLabel: "vs mois dernier",
    icon: "target",
  },
  {
    label: "Agents IA actifs",
    value: 3,
    change: 0,
    changeLabel: "stable",
    icon: "bot",
  },
  {
    label: "CA pipeline",
    value: "124 500 €",
    change: 18,
    changeLabel: "vs mois dernier",
    icon: "trending",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tk-text">Overview</h1>
        <p className="text-tk-text-faint">
          Bienvenue sur votre tableau de bord Terrakotta
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_DATA.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadsChart />
        <AgentStatusCard />
      </div>

      <RecentLeads />
    </div>
  );
}
