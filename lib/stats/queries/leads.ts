import { prisma } from "@/lib/db";
import type { LeadSource, LeadStatus } from "@prisma/client";
import { diffDays, median, monthKey, monthlyBuckets, rollingTwelveMonths } from "../utils";

export interface LeadsStats {
  kpis: {
    pipelineOuvert: number;
    tauxConversion: number | null;
    delaiMedian: number | null;
    scoreMoyen: number | null;
  };
  funnel: { statut: LeadStatus; count: number }[];
  perdus: number;
  monthly: { label: string; nouveaux: number }[];
  parSource: { source: LeadSource; count: number }[];
  conversionParSource: { source: LeadSource; taux: number; total: number }[];
  stagnants: {
    id: string;
    nom: string;
    source: LeadSource;
    statut: LeadStatus;
    score: number | null;
    budgetEstime: number | null;
    dateMiseAJour: Date;
  }[];
}

const OPEN_STATUTS: LeadStatus[] = ["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION"];
const FUNNEL_ORDER: LeadStatus[] = ["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE"];

export async function getLeadsStats(period: { start: Date; end: Date }): Promise<LeadsStats> {
  const pipelineAgg = await prisma.lead.aggregate({
    _sum: { budgetEstime: true },
    where: { deletedAt: null, statut: { in: OPEN_STATUTS } },
  });
  const pipelineOuvert = Number(pipelineAgg._sum.budgetEstime ?? 0);

  const closed = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      statut: { in: ["GAGNE", "PERDU"] },
      dateMiseAJour: { gte: period.start, lte: period.end },
    },
    select: { statut: true, dateCreation: true, dateMiseAJour: true, source: true },
  });
  const gagnes = closed.filter((l) => l.statut === "GAGNE");
  const tauxConversion = closed.length > 0 ? (gagnes.length / closed.length) * 100 : null;

  const delays = gagnes.map((l) => diffDays(l.dateMiseAJour, l.dateCreation));
  const delaiMedian = delays.length >= 3 ? median(delays) : null;

  const openLeads = await prisma.lead.findMany({
    where: { deletedAt: null, statut: { in: OPEN_STATUTS } },
    select: { score: true },
  });
  const scores = openLeads.map((l) => l.score ?? 0).filter((s) => s > 0);
  const scoreMoyen = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  // Funnel : counts par statut sur la période (création ou MAJ dans la période)
  const groupStatut = await prisma.lead.groupBy({
    by: ["statut"],
    _count: { _all: true },
    where: {
      deletedAt: null,
      OR: [
        { dateCreation: { gte: period.start, lte: period.end } },
        { dateMiseAJour: { gte: period.start, lte: period.end } },
      ],
    },
  });
  const statutMap = new Map<LeadStatus, number>();
  for (const g of groupStatut) statutMap.set(g.statut, g._count._all);
  const funnel = FUNNEL_ORDER.map((s) => ({ statut: s, count: statutMap.get(s) ?? 0 }));
  const perdus = statutMap.get("PERDU") ?? 0;

  // Évolution mensuelle nouveaux leads (12 mois roulants)
  const { start: rollStart, end: rollEnd } = rollingTwelveMonths();
  const buckets = monthlyBuckets(rollStart, rollEnd);
  const newLeads = await prisma.lead.findMany({
    where: { deletedAt: null, dateCreation: { gte: rollStart, lte: rollEnd } },
    select: { dateCreation: true },
  });
  const newByMonth = new Map<string, number>();
  for (const l of newLeads) {
    const k = monthKey(l.dateCreation);
    newByMonth.set(k, (newByMonth.get(k) ?? 0) + 1);
  }
  const monthly = buckets.map((b) => ({ label: b.label, nouveaux: newByMonth.get(b.key) ?? 0 }));

  // Répartition par source sur la période
  const groupSource = await prisma.lead.groupBy({
    by: ["source"],
    _count: { _all: true },
    where: { deletedAt: null, dateCreation: { gte: period.start, lte: period.end } },
    orderBy: { _count: { source: "desc" } },
    take: 10,
  });
  const parSource = groupSource.map((g) => ({ source: g.source, count: g._count._all }));

  // Taux conversion par source : sur leads clôturés dans la période
  const sourceMap = new Map<LeadSource, { gagne: number; total: number }>();
  for (const l of closed) {
    const entry = sourceMap.get(l.source) ?? { gagne: 0, total: 0 };
    entry.total += 1;
    if (l.statut === "GAGNE") entry.gagne += 1;
    sourceMap.set(l.source, entry);
  }
  const conversionParSource = Array.from(sourceMap.entries())
    .filter(([, v]) => v.total >= 3)
    .map(([source, v]) => ({ source, taux: (v.gagne / v.total) * 100, total: v.total }))
    .sort((a, b) => b.taux - a.taux);

  // Leads stagnants (> 30 jours sans MAJ, statut ouvert)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const stagnantsRaw = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      statut: { in: OPEN_STATUTS },
      dateMiseAJour: { lt: cutoff },
    },
    orderBy: { dateMiseAJour: "asc" },
    take: 20,
    select: {
      id: true, nom: true, prenom: true, source: true, statut: true,
      score: true, budgetEstime: true, dateMiseAJour: true,
    },
  });
  const stagnants = stagnantsRaw.map((l) => ({
    id: l.id,
    nom: [l.prenom, l.nom].filter(Boolean).join(" ") || l.nom,
    source: l.source,
    statut: l.statut,
    score: l.score ?? null,
    budgetEstime: l.budgetEstime ? Number(l.budgetEstime) : null,
    dateMiseAJour: l.dateMiseAJour,
  }));

  return {
    kpis: { pipelineOuvert, tauxConversion, delaiMedian, scoreMoyen },
    funnel,
    perdus,
    monthly,
    parSource,
    conversionParSource,
    stagnants,
  };
}
