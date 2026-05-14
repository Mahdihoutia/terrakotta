import { prisma } from "@/lib/db";
import type { AideType, CategorieCible } from "@prisma/client";
import { diffDays, median, monthKey, monthlyBuckets, rollingTwelveMonths } from "../utils";

export interface AidesStats {
  kpis: {
    enInstruction: number;
    montantNotifie: number;
    kwhCumac: number;
    delaiMedian: number | null;
  };
  monthly: { label: string; deposees: number; accordees: number }[];
  parType: { type: AideType; count: number; montant: number }[];
  acceptation: { accorde: number; refuse: number; enInstruction: number };
  enAttente: {
    id: string;
    projetTitre: string;
    type: AideType;
    statut: string;
    montant: number | null;
    dateDepot: Date | null;
    joursAttente: number;
  }[];
}

// Mapping AideStatut → buckets sémantiques.
// "en instruction" = EN_ATTENTE | DEPOSE | EN_INSTRUCTION
// "notifié/accepté" = ACCORDE | VERSE (l'enum n'a pas NOTIFIE)
const INSTRUCTION_STATUTS = ["EN_ATTENTE", "DEPOSE", "EN_INSTRUCTION"] as const;
const ACCORDE_STATUTS = ["ACCORDE", "VERSE"] as const;

export async function getAidesStats(
  period: { start: Date; end: Date },
  categories: CategorieCible[],
): Promise<AidesStats> {
  const projetFilter = categories.length > 0
    ? { projet: { is: { categorieCible: { in: categories } } } }
    : {};

  const enInstruction = await prisma.aide.count({
    where: { deletedAt: null, statut: { in: [...INSTRUCTION_STATUTS] }, ...projetFilter },
  });

  const notifAgg = await prisma.aide.aggregate({
    _sum: { montant: true },
    where: {
      deletedAt: null,
      statut: { in: [...ACCORDE_STATUTS] },
      dateAccord: { gte: period.start, lte: period.end },
      ...projetFilter,
    },
  });
  const montantNotifie = Number(notifAgg._sum.montant ?? 0);

  const ceeAgg = await prisma.aide.aggregate({
    _sum: { kwhCumac: true },
    where: {
      deletedAt: null,
      type: "CEE",
      statut: { in: [...ACCORDE_STATUTS] },
      dateAccord: { gte: period.start, lte: period.end },
      ...projetFilter,
    },
  });
  const kwhCumac = Number(ceeAgg._sum.kwhCumac ?? 0);

  // Délai dépôt → accord (médiane)
  const accDelais = await prisma.aide.findMany({
    where: {
      deletedAt: null,
      dateDepot: { not: null, gte: period.start, lte: period.end },
      dateAccord: { not: null, gte: period.start, lte: period.end },
      ...projetFilter,
    },
    select: { dateDepot: true, dateAccord: true },
  });
  const delays = accDelais
    .filter((a) => a.dateDepot && a.dateAccord)
    .map((a) => diffDays(a.dateAccord!, a.dateDepot!));
  const delaiMedian = delays.length >= 3 ? median(delays) : null;

  // Évolution mensuelle déposées vs accordées
  const { start: rollStart, end: rollEnd } = rollingTwelveMonths();
  const buckets = monthlyBuckets(rollStart, rollEnd);
  const depots = await prisma.aide.findMany({
    where: { deletedAt: null, dateDepot: { gte: rollStart, lte: rollEnd }, ...projetFilter },
    select: { dateDepot: true },
  });
  const accords = await prisma.aide.findMany({
    where: { deletedAt: null, dateAccord: { gte: rollStart, lte: rollEnd }, ...projetFilter },
    select: { dateAccord: true },
  });
  const depM = new Map<string, number>();
  const accM = new Map<string, number>();
  for (const a of depots) if (a.dateDepot) {
    const k = monthKey(a.dateDepot);
    depM.set(k, (depM.get(k) ?? 0) + 1);
  }
  for (const a of accords) if (a.dateAccord) {
    const k = monthKey(a.dateAccord);
    accM.set(k, (accM.get(k) ?? 0) + 1);
  }
  const monthly = buckets.map((b) => ({
    label: b.label,
    deposees: depM.get(b.key) ?? 0,
    accordees: accM.get(b.key) ?? 0,
  }));

  // Répartition par type sur la période
  const groupType = await prisma.aide.groupBy({
    by: ["type"],
    _count: { _all: true },
    _sum: { montant: true },
    where: { deletedAt: null, createdAt: { gte: period.start, lte: period.end }, ...projetFilter },
  });
  const parType = groupType.map((g) => ({
    type: g.type,
    count: g._count._all,
    montant: Number(g._sum.montant ?? 0),
  }));

  // Taux acceptation sur aides créées dans la période
  const groupStatut = await prisma.aide.groupBy({
    by: ["statut"],
    _count: { _all: true },
    where: { deletedAt: null, createdAt: { gte: period.start, lte: period.end }, ...projetFilter },
  });
  let accorde = 0, refuse = 0, instr = 0;
  for (const g of groupStatut) {
    if ((ACCORDE_STATUTS as readonly string[]).includes(g.statut)) accorde += g._count._all;
    else if (g.statut === "REFUSE") refuse += g._count._all;
    else if ((INSTRUCTION_STATUTS as readonly string[]).includes(g.statut)) instr += g._count._all;
  }
  const acceptation = { accorde, refuse, enInstruction: instr };

  // Aides en instruction > 60 jours
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const raw = await prisma.aide.findMany({
    where: {
      deletedAt: null,
      statut: { in: [...INSTRUCTION_STATUTS] },
      OR: [
        { dateDepot: { lt: cutoff } },
        { AND: [{ dateDepot: null }, { createdAt: { lt: cutoff } }] },
      ],
      ...projetFilter,
    },
    orderBy: { createdAt: "asc" },
    take: 20,
    include: { projet: { select: { titre: true } } },
  });
  const today = new Date();
  const enAttente = raw.map((a) => {
    const ref = a.dateDepot ?? a.createdAt;
    return {
      id: a.id,
      projetTitre: a.projet.titre,
      type: a.type,
      statut: a.statut,
      montant: a.montant ? Number(a.montant) : null,
      dateDepot: a.dateDepot,
      joursAttente: diffDays(today, ref),
    };
  });

  return {
    kpis: { enInstruction, montantNotifie, kwhCumac, delaiMedian },
    monthly,
    parType,
    acceptation,
    enAttente,
  };
}
