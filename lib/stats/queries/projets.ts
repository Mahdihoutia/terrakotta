import { prisma } from "@/lib/db";
import type { CategorieCible, ProjetStatut } from "@prisma/client";
import { diffDays, median, monthKey, monthlyBuckets, rollingTwelveMonths } from "../utils";

export interface ProjetsStats {
  kpis: {
    portefeuilleActif: number;
    caCarnet: number;
    dureeMediane: number | null;
    tauxAchevement: number | null;
  };
  monthly: { label: string; crees: number; livres: number }[];
  parStatut: { statut: ProjetStatut; count: number }[];
  parCategorie: { categorie: CategorieCible; count: number }[];
  topTravaux: { type: string; count: number }[];
  topActifs: {
    id: string;
    titre: string;
    clientNom: string;
    statut: ProjetStatut;
    budgetPrevu: number | null;
    budgetDepense: number;
    derapage: number | null;
  }[];
}

const ACTIVE_STATUTS: ProjetStatut[] = ["EN_ATTENTE", "EN_COURS", "EN_PAUSE"];

export async function getProjetsStats(
  period: { start: Date; end: Date },
  categories: CategorieCible[],
): Promise<ProjetsStats> {
  const categFilter = categories.length > 0 ? { in: categories } : undefined;

  const portefeuilleActif = await prisma.projet.count({
    where: {
      deletedAt: null,
      statut: { in: ACTIVE_STATUTS },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
  });

  const caCarnetAgg = await prisma.projet.aggregate({
    _sum: { budgetPrevu: true },
    where: {
      deletedAt: null,
      statut: { in: ACTIVE_STATUTS },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
  });
  const caCarnet = Number(caCarnetAgg._sum.budgetPrevu ?? 0);

  // Durée médiane sur projets TERMINE avec dateFin dans la période
  const terminePeriode = await prisma.projet.findMany({
    where: {
      deletedAt: null,
      statut: "TERMINE",
      dateFin: { gte: period.start, lte: period.end },
      dateDebut: { not: null },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
    select: { dateDebut: true, dateFin: true },
  });
  const durees = terminePeriode
    .filter((p) => p.dateDebut && p.dateFin)
    .map((p) => diffDays(p.dateFin!, p.dateDebut!));
  const dureeMediane = durees.length >= 3 ? median(durees) : null;

  // Taux achèvement : TERMINE / (TERMINE + ANNULE) clôturés sur la période (proxy updatedAt)
  const closedInPeriod = await prisma.projet.findMany({
    where: {
      deletedAt: null,
      statut: { in: ["TERMINE", "ANNULE"] },
      updatedAt: { gte: period.start, lte: period.end },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
    select: { statut: true },
  });
  const nbTermine = closedInPeriod.filter((p) => p.statut === "TERMINE").length;
  const nbClos = closedInPeriod.length;
  const tauxAchevement = nbClos > 0 ? (nbTermine / nbClos) * 100 : null;

  // Évolution mensuelle : 12 mois roulants — créés vs livrés (statut TERMINE par dateFin)
  const { start: rollStart, end: rollEnd } = rollingTwelveMonths();
  const buckets = monthlyBuckets(rollStart, rollEnd);
  const created = await prisma.projet.findMany({
    where: {
      deletedAt: null,
      createdAt: { gte: rollStart, lte: rollEnd },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
    select: { createdAt: true },
  });
  const delivered = await prisma.projet.findMany({
    where: {
      deletedAt: null,
      statut: "TERMINE",
      dateFin: { gte: rollStart, lte: rollEnd },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
    select: { dateFin: true },
  });
  const createdByMonth = new Map<string, number>();
  for (const p of created) {
    const k = monthKey(p.createdAt);
    createdByMonth.set(k, (createdByMonth.get(k) ?? 0) + 1);
  }
  const deliveredByMonth = new Map<string, number>();
  for (const p of delivered) {
    if (!p.dateFin) continue;
    const k = monthKey(p.dateFin);
    deliveredByMonth.set(k, (deliveredByMonth.get(k) ?? 0) + 1);
  }
  const monthly = buckets.map((b) => ({
    label: b.label,
    crees: createdByMonth.get(b.key) ?? 0,
    livres: deliveredByMonth.get(b.key) ?? 0,
  }));

  // Répartition par statut sur la période (updatedAt sur la période, ou createdAt)
  const groupStatut = await prisma.projet.groupBy({
    by: ["statut"],
    _count: { _all: true },
    where: {
      deletedAt: null,
      OR: [
        { createdAt: { gte: period.start, lte: period.end } },
        { updatedAt: { gte: period.start, lte: period.end } },
      ],
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
  });
  const parStatut = groupStatut.map((g) => ({ statut: g.statut, count: g._count._all }));

  // Répartition par catégorie cible sur la période
  const groupCat = await prisma.projet.groupBy({
    by: ["categorieCible"],
    _count: { _all: true },
    where: {
      deletedAt: null,
      createdAt: { gte: period.start, lte: period.end },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
  });
  const parCategorie = groupCat.map((g) => ({ categorie: g.categorieCible, count: g._count._all }));

  // Top types de travaux
  const groupTravaux = await prisma.projet.groupBy({
    by: ["typeTravaux"],
    _count: { _all: true },
    where: {
      deletedAt: null,
      typeTravaux: { not: null },
      createdAt: { gte: period.start, lte: period.end },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
    orderBy: { _count: { typeTravaux: "desc" } },
    take: 5,
  });
  const topTravaux = groupTravaux
    .filter((g) => g.typeTravaux)
    .map((g) => ({ type: g.typeTravaux as string, count: g._count._all }));

  // Top projets actifs par budgetPrevu
  const topActifsRaw = await prisma.projet.findMany({
    where: {
      deletedAt: null,
      statut: { in: ACTIVE_STATUTS },
      budgetPrevu: { not: null },
      ...(categFilter ? { categorieCible: categFilter } : {}),
    },
    orderBy: { budgetPrevu: "desc" },
    take: 10,
    include: { client: { select: { nom: true, prenom: true } } },
  });
  const topActifs = topActifsRaw.map((p) => {
    const prevu = p.budgetPrevu ? Number(p.budgetPrevu) : null;
    const depense = Number(p.budgetDepense ?? 0);
    const derapage = prevu && prevu > 0 ? (depense / prevu) * 100 : null;
    return {
      id: p.id,
      titre: p.titre,
      clientNom: [p.client.prenom, p.client.nom].filter(Boolean).join(" ") || "—",
      statut: p.statut,
      budgetPrevu: prevu,
      budgetDepense: depense,
      derapage,
    };
  });

  return {
    kpis: { portefeuilleActif, caCarnet, dureeMediane, tauxAchevement },
    monthly,
    parStatut,
    parCategorie,
    topTravaux,
    topActifs,
  };
}
