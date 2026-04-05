import KpiCard from "@/components/dashboard/KpiCard";
import LeadsChart from "@/components/dashboard/LeadsChart";
import RecentLeads from "@/components/dashboard/RecentLeads";
import AgentStatusCard from "@/components/dashboard/AgentStatusCard";
import { prisma } from "@/lib/db";

/** Formater un montant en euros français (ex: "12 500 €") */
function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Formater une date en français (ex: "5 avril 2026") */
function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Calculer le pourcentage de variation entre deux valeurs */
function computeChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/** Labels de statut projet en français */
const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  EN_PAUSE: "En pause",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

/** Couleurs de badge par statut */
const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-500/15 text-yellow-400",
  EN_COURS: "bg-blue-500/15 text-blue-400",
  EN_PAUSE: "bg-orange-500/15 text-orange-400",
  TERMINE: "bg-green-500/15 text-green-400",
  ANNULE: "bg-red-500/15 text-red-400",
};

async function fetchKpis() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  try {
    // ── Ligne 1 : KPIs principaux ──────────────────────────────

    // Projets actifs (mois en cours)
    const projetsActifs = await prisma.projet.count({
      where: { statut: { in: ["EN_ATTENTE", "EN_COURS", "EN_PAUSE"] } },
    });
    const projetsActifsPrev = await prisma.projet.count({
      where: {
        statut: { in: ["EN_ATTENTE", "EN_COURS", "EN_PAUSE"] },
        createdAt: { lt: startOfMonth },
      },
    });

    // CA devis acceptés
    const caDevisResult = await prisma.devis.aggregate({
      _sum: { montantHT: true },
      where: { statut: "ACCEPTE" },
    });
    const caDevis = Number(caDevisResult._sum.montantHT ?? 0);
    const caDevisPrevResult = await prisma.devis.aggregate({
      _sum: { montantHT: true },
      where: {
        statut: "ACCEPTE",
        dateEmis: { lt: startOfMonth },
      },
    });
    const caDevisPrev = Number(caDevisPrevResult._sum.montantHT ?? 0);

    // Leads en cours
    const leadsEnCours = await prisma.lead.count({
      where: { statut: { notIn: ["GAGNE", "PERDU"] } },
    });
    const leadsEnCoursPrev = await prisma.lead.count({
      where: {
        statut: { notIn: ["GAGNE", "PERDU"] },
        dateCreation: { lt: startOfMonth },
      },
    });

    // Visites ce mois
    const visitesCeMois = await prisma.evenement.count({
      where: {
        type: "VISITE",
        date: { gte: startOfMonth },
      },
    });
    const visitesMoisPrev = await prisma.evenement.count({
      where: {
        type: "VISITE",
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
    });

    // ── Ligne 2 : KPIs secondaires ─────────────────────────────

    // Taux de conversion leads
    const totalLeads = await prisma.lead.count();
    const leadsGagnes = await prisma.lead.count({
      where: { statut: "GAGNE" },
    });
    const tauxConversion = totalLeads > 0
      ? Math.round((leadsGagnes / totalLeads) * 100)
      : 0;

    // Taux conversion mois précédent
    const totalLeadsPrev = await prisma.lead.count({
      where: { dateCreation: { lt: startOfMonth } },
    });
    const leadsGagnesPrev = await prisma.lead.count({
      where: {
        statut: "GAGNE",
        dateCreation: { lt: startOfMonth },
      },
    });
    const tauxConversionPrev = totalLeadsPrev > 0
      ? Math.round((leadsGagnesPrev / totalLeadsPrev) * 100)
      : 0;

    // Devis en attente
    const devisEnAttente = await prisma.devis.count({
      where: { statut: { in: ["BROUILLON", "ENVOYE"] } },
    });
    const devisEnAttentePrev = await prisma.devis.count({
      where: {
        statut: { in: ["BROUILLON", "ENVOYE"] },
        createdAt: { lt: startOfMonth },
      },
    });

    // Aides en instruction
    const aidesEnInstruction = await prisma.aide.count({
      where: { statut: { in: ["EN_ATTENTE", "DEPOSE", "EN_INSTRUCTION"] } },
    });
    const aidesEnInstructionPrev = await prisma.aide.count({
      where: {
        statut: { in: ["EN_ATTENTE", "DEPOSE", "EN_INSTRUCTION"] },
        createdAt: { lt: startOfMonth },
      },
    });

    // Projets terminés
    const projetsTermines = await prisma.projet.count({
      where: { statut: "TERMINE" },
    });
    const projetsTerminesPrev = await prisma.projet.count({
      where: {
        statut: "TERMINE",
        updatedAt: { lt: startOfMonth },
      },
    });

    // ── Projets récents ────────────────────────────────────────

    const projetsRecents = await prisma.projet.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { client: { select: { nom: true, prenom: true } } },
    });

    return {
      row1: [
        {
          label: "Projets actifs",
          value: projetsActifs,
          change: computeChange(projetsActifs, projetsActifsPrev),
          changeLabel: "vs mois dernier",
          icon: "briefcase",
        },
        {
          label: "CA devis acceptés",
          value: formatEuro(caDevis),
          change: computeChange(caDevis, caDevisPrev),
          changeLabel: "vs mois dernier",
          icon: "trending",
        },
        {
          label: "Leads en cours",
          value: leadsEnCours,
          change: computeChange(leadsEnCours, leadsEnCoursPrev),
          changeLabel: "vs mois dernier",
          icon: "users",
        },
        {
          label: "Visites ce mois",
          value: visitesCeMois,
          change: computeChange(visitesCeMois, visitesMoisPrev),
          changeLabel: "vs mois dernier",
          icon: "calendar",
        },
      ],
      row2: [
        {
          label: "Taux de conversion",
          value: `${tauxConversion}%`,
          change: tauxConversion - tauxConversionPrev,
          changeLabel: "vs mois dernier",
          icon: "target",
        },
        {
          label: "Devis en attente",
          value: devisEnAttente,
          change: computeChange(devisEnAttente, devisEnAttentePrev),
          changeLabel: "vs mois dernier",
          icon: "filetext",
        },
        {
          label: "Aides en instruction",
          value: aidesEnInstruction,
          change: computeChange(aidesEnInstruction, aidesEnInstructionPrev),
          changeLabel: "vs mois dernier",
          icon: "handcoins",
        },
        {
          label: "Projets terminés",
          value: projetsTermines,
          change: computeChange(projetsTermines, projetsTerminesPrev),
          changeLabel: "vs mois dernier",
          icon: "check",
        },
      ],
      projetsRecents: projetsRecents.map((p) => ({
        id: p.id,
        titre: p.titre,
        clientNom: [p.client.prenom, p.client.nom].filter(Boolean).join(" "),
        statut: p.statut,
        updatedAt: p.updatedAt,
      })),
    };
  } catch {
    // Base de données indisponible : valeurs par défaut
    return {
      row1: [
        { label: "Projets actifs", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "briefcase" },
        { label: "CA devis acceptés", value: formatEuro(0), change: 0, changeLabel: "vs mois dernier", icon: "trending" },
        { label: "Leads en cours", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "users" },
        { label: "Visites ce mois", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "calendar" },
      ],
      row2: [
        { label: "Taux de conversion", value: "0%", change: 0, changeLabel: "vs mois dernier", icon: "target" },
        { label: "Devis en attente", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "filetext" },
        { label: "Aides en instruction", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "handcoins" },
        { label: "Projets terminés", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "check" },
      ],
      projetsRecents: [],
    };
  }
}

export default async function DashboardPage() {
  const { row1, row2, projetsRecents } = await fetchKpis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tk-text">Vue d&apos;ensemble</h1>
        <p className="text-tk-text-faint">
          Suivez vos indicateurs clés et l&apos;activité de votre bureau d&apos;étude
        </p>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {row1.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </div>

      {/* KPIs secondaires */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {row2.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i + 4} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadsChart />
        <AgentStatusCard />
      </div>

      <RecentLeads />

      {/* Projets récents */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-tk-text">
          Projets récents
        </h2>
        {projetsRecents.length === 0 ? (
          <p className="text-sm text-tk-text-faint">Aucun projet pour le moment.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {projetsRecents.map((projet) => (
              <li
                key={projet.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-tk-text">
                    {projet.titre}
                  </p>
                  <p className="text-xs text-tk-text-faint">
                    {projet.clientNom}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUT_COLORS[projet.statut] ?? "bg-gray-500/15 text-gray-400"
                    }`}
                  >
                    {STATUT_LABELS[projet.statut] ?? projet.statut}
                  </span>
                  <span className="whitespace-nowrap text-xs text-tk-text-faint">
                    {formatDateFr(projet.updatedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
