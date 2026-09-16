import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import TodayWidget from "@/components/dashboard/TodayWidget";
import LeadsChart from "@/components/dashboard/LeadsChart";
import RecentLeads from "@/components/dashboard/RecentLeads";
import AgentStatusCard from "@/components/dashboard/AgentStatusCard";
import SectionHeader from "@/components/dashboard/SectionHeader";
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

/** Chip par statut projet */
const STATUT_CHIP: Record<string, string> = {
  EN_ATTENTE: "chip chip-warning chip-dot",
  EN_COURS:   "chip chip-primary chip-dot",
  EN_PAUSE:   "chip chip-warning chip-dot",
  TERMINE:    "chip chip-success chip-dot",
  ANNULE:     "chip chip-danger chip-dot",
};

/** Couleur d'accent par statut pour avatar */
const STATUT_AVATAR: Record<string, string> = {
  EN_ATTENTE: "#f59e0b",
  EN_COURS:   "#2563eb",
  EN_PAUSE:   "#f97316",
  TERMINE:    "#16a34a",
  ANNULE:     "#dc2626",
};

/** Initiales client pour avatar */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function fetchKpis() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Flux du mois courant : [startOfMonth, now]
  // Flux du mois précédent : [startOfPrevMonth, endOfPrevMonth]
  const monthRange = { gte: startOfMonth };
  const prevMonthRange = { gte: startOfPrevMonth, lte: endOfPrevMonth };

  try {
    // ── Ligne 1 : Activité du mois (KPIs de flux) ──────────────

    // Nouveaux projets créés ce mois
    const nouveauxProjets = await prisma.projet.count({
      where: { createdAt: monthRange, deletedAt: null },
    });
    const nouveauxProjetsPrev = await prisma.projet.count({
      where: { createdAt: prevMonthRange, deletedAt: null },
    });

    // CA devis acceptés émis ce mois
    const caDevisResult = await prisma.devis.aggregate({
      _sum: { montantHT: true },
      where: { statut: "ACCEPTE", dateEmis: monthRange, deletedAt: null },
    });
    const caDevis = Number(caDevisResult._sum.montantHT ?? 0);
    const caDevisPrevResult = await prisma.devis.aggregate({
      _sum: { montantHT: true },
      where: { statut: "ACCEPTE", dateEmis: prevMonthRange, deletedAt: null },
    });
    const caDevisPrev = Number(caDevisPrevResult._sum.montantHT ?? 0);

    // Nouveaux leads créés ce mois
    const nouveauxLeads = await prisma.lead.count({
      where: { dateCreation: monthRange, deletedAt: null },
    });
    const nouveauxLeadsPrev = await prisma.lead.count({
      where: { dateCreation: prevMonthRange, deletedAt: null },
    });

    // Visites ce mois
    const visitesCeMois = await prisma.evenement.count({
      where: { type: "VISITE", date: monthRange, deletedAt: null },
    });
    const visitesMoisPrev = await prisma.evenement.count({
      where: { type: "VISITE", date: prevMonthRange, deletedAt: null },
    });

    // ── Ligne 2 : Conversion & production (KPIs de flux) ───────

    // Taux de conversion : leads gagnés / leads créés sur le mois
    const leadsGagnesMois = await prisma.lead.count({
      where: { statut: "GAGNE", dateCreation: monthRange, deletedAt: null },
    });
    const leadsGagnesPrevMois = await prisma.lead.count({
      where: { statut: "GAGNE", dateCreation: prevMonthRange, deletedAt: null },
    });
    const tauxConversion = nouveauxLeads > 0
      ? Math.round((leadsGagnesMois / nouveauxLeads) * 100)
      : 0;
    const tauxConversionPrev = nouveauxLeadsPrev > 0
      ? Math.round((leadsGagnesPrevMois / nouveauxLeadsPrev) * 100)
      : 0;

    // Devis émis ce mois (tous statuts confondus, hors corbeille)
    const devisEmis = await prisma.devis.count({
      where: { dateEmis: monthRange, deletedAt: null },
    });
    const devisEmisPrev = await prisma.devis.count({
      where: { dateEmis: prevMonthRange, deletedAt: null },
    });

    // Aides déposées ce mois
    const aidesDeposees = await prisma.aide.count({
      where: { createdAt: monthRange, deletedAt: null },
    });
    const aidesDeposeesPrev = await prisma.aide.count({
      where: { createdAt: prevMonthRange, deletedAt: null },
    });

    // Projets passés à TERMINE ce mois (proxy via updatedAt — quand le statut a basculé)
    const projetsTermines = await prisma.projet.count({
      where: { statut: "TERMINE", updatedAt: monthRange, deletedAt: null },
    });
    const projetsTerminesPrev = await prisma.projet.count({
      where: { statut: "TERMINE", updatedAt: prevMonthRange, deletedAt: null },
    });

    // ── Projets récents ────────────────────────────────────────

    const projetsRecents = await prisma.projet.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { client: { select: { nom: true, prenom: true } } },
    });

    return {
      row1: [
        {
          label: "Nouveaux projets",
          value: nouveauxProjets,
          change: computeChange(nouveauxProjets, nouveauxProjetsPrev),
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
          label: "Nouveaux leads",
          value: nouveauxLeads,
          change: computeChange(nouveauxLeads, nouveauxLeadsPrev),
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
          label: "Devis émis",
          value: devisEmis,
          change: computeChange(devisEmis, devisEmisPrev),
          changeLabel: "vs mois dernier",
          icon: "filetext",
        },
        {
          label: "Aides déposées",
          value: aidesDeposees,
          change: computeChange(aidesDeposees, aidesDeposeesPrev),
          changeLabel: "vs mois dernier",
          icon: "handcoins",
        },
        {
          label: "Projets livrés",
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
        { label: "Nouveaux projets", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "briefcase" },
        { label: "CA devis acceptés", value: formatEuro(0), change: 0, changeLabel: "vs mois dernier", icon: "trending" },
        { label: "Nouveaux leads", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "users" },
        { label: "Visites ce mois", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "calendar" },
      ],
      row2: [
        { label: "Taux de conversion", value: "0%", change: 0, changeLabel: "vs mois dernier", icon: "target" },
        { label: "Devis émis", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "filetext" },
        { label: "Aides déposées", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "handcoins" },
        { label: "Projets livrés", value: 0, change: 0, changeLabel: "vs mois dernier", icon: "check" },
      ],
      projetsRecents: [],
    };
  }
}

export default async function DashboardPage() {
  const { row1, row2, projetsRecents } = await fetchKpis();

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-tk-border bg-tk-surface p-6 lg:p-8">
        {/* Halo bleu top-right (theme-aware) */}
        <div
          className="hero-halo pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full"
          aria-hidden="true"
        />
        {/* Dot grid fond */}
        <div
          className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40 dark:opacity-25"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="chip chip-primary mb-3">
              <Sparkles className="h-3 w-3" />
              Pilotage Kilowater
            </span>
            <h1 className="section-title text-[1.75rem] lg:text-[2rem]">
              Vue d&apos;ensemble
            </h1>
            <p className="section-subtitle max-w-2xl">
              Suivez vos indicateurs clés, l&apos;activité commerciale de votre
              bureau d&apos;étude et l&apos;avancement de vos projets en
              rénovation énergétique.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/dashboard/leads" className="btn-ghost focus-ring">
              Leads
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/dashboard/stats" className="btn-ghost focus-ring">
              Statistiques
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── À faire aujourd'hui ─────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          kicker="Aujourd'hui"
          title="Ce qu'il vous reste à faire"
          subtitle="Jalons, devis, rendez-vous et leads à traiter en priorité"
        />
        <TodayWidget />
      </section>

      {/* ── KPIs principaux ─────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          kicker="Indicateurs · Mois en cours"
          title="KPIs principaux"
          subtitle="Projets, chiffre d'affaires, leads et activité terrain"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {row1.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i} />
          ))}
        </div>
      </section>

      {/* ── KPIs secondaires ────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          kicker="Indicateurs · Secondaire"
          title="Conversion & production"
          subtitle="Taux de conversion, devis, aides et projets livrés"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {row2.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i + 4} />
          ))}
        </div>
      </section>

      {/* ── Graphiques & Agents ─────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <LeadsChart />
        <AgentStatusCard />
      </section>

      {/* ── Derniers leads ──────────────────────────────────── */}
      <section>
        <RecentLeads />
      </section>

      {/* ── Projets récents — liste enrichie ────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          kicker="Activité"
          title="Projets récents"
          subtitle="Les 5 derniers projets mis à jour"
          action={
            <Link
              href="/dashboard/projets"
              className="btn-ghost focus-ring"
            >
              Tous les projets
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="card-premium overflow-hidden p-0">
          {projetsRecents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tk-hover text-tk-text-faint">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-tk-text">
                Aucun projet pour le moment
              </p>
              <p className="text-xs text-tk-text-faint">
                Créez un projet pour suivre son avancement ici.
              </p>
              <Link
                href="/dashboard/projets"
                className="btn-ghost mt-2 focus-ring"
              >
                Créer un projet
              </Link>
            </div>
          ) : (
            <ul role="list">
              {projetsRecents.map((projet, i) => {
                const clientNom = projet.clientNom || "—";
                const accent    = STATUT_AVATAR[projet.statut] ?? "#6b5b50";
                return (
                  <li
                    key={projet.id}
                    className="row-in group flex items-center gap-4 border-b border-tk-border px-5 py-3.5 transition-colors last:border-0 hover:bg-tk-hover"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Avatar initiales */}
                    <div
                      className="avatar-initials h-9 w-9"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                      }}
                      aria-hidden="true"
                    >
                      {getInitials(clientNom)}
                    </div>
                    {/* Titre + client */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/projets/${projet.id}`}
                        className="truncate text-sm font-semibold text-tk-text transition-colors group-hover:text-tk-primary"
                      >
                        {projet.titre}
                      </Link>
                      <p className="truncate text-xs text-tk-text-faint">
                        {clientNom}
                      </p>
                    </div>
                    {/* Statut + date */}
                    <div className="hidden items-center gap-3 sm:flex">
                      <span
                        className={
                          STATUT_CHIP[projet.statut] ?? "chip chip-dot"
                        }
                      >
                        {STATUT_LABELS[projet.statut] ?? projet.statut}
                      </span>
                      <span className="tabular whitespace-nowrap text-xs text-tk-text-faint">
                        {formatDateFr(projet.updatedAt)}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-tk-text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
