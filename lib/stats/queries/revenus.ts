import { prisma } from "@/lib/db";
import type { CategorieCible } from "@prisma/client";
import { diffDays, median, monthKey, monthlyBuckets, rollingTwelveMonths } from "../utils";

export interface RevenusStats {
  kpis: {
    caPrevisionnel: number;
    caAccepte: number;
    caFacture: number;
    caEncaisse: number;
    creancesOuvertes: number;
    dso: number | null;
  };
  monthly: {
    label: string;
    emis: number;
    accepte: number;
    facture: number;
    encaisse: number;
  }[];
  acceptationDevis: { accepte: number; refuse: number; enCours: number };
  aging: { bucket: string; count: number; montant: number }[];
  topClients: { clientId: string; nom: string; total: number }[];
  retards: {
    id: string;
    numero: string;
    clientNom: string;
    montantHT: number;
    dateEcheance: Date | null;
    joursRetard: number;
  }[];
}

const UNPAID_STATUTS = ["EMISE", "PAYEE_PARTIELLEMENT", "EN_RETARD"] as const;
const FACTURE_ACTIVE = ["EMISE", "PAYEE_PARTIELLEMENT", "PAYEE", "EN_RETARD"] as const;

export async function getRevenusStats(
  period: { start: Date; end: Date },
  categories: CategorieCible[],
): Promise<RevenusStats> {
  // Le filtre catégorie passe via le projet lié (projet?.categorieCible)
  const projetFilter = categories.length > 0
    ? { projet: { is: { categorieCible: { in: categories } } } }
    : {};

  const prevAgg = await prisma.devis.aggregate({
    _sum: { montantHT: true },
    where: { deletedAt: null, statut: "ENVOYE", dateEmis: { gte: period.start, lte: period.end }, ...projetFilter },
  });
  const caPrevisionnel = Number(prevAgg._sum.montantHT ?? 0);

  const accAgg = await prisma.devis.aggregate({
    _sum: { montantHT: true },
    where: { deletedAt: null, statut: "ACCEPTE", dateEmis: { gte: period.start, lte: period.end }, ...projetFilter },
  });
  const caAccepte = Number(accAgg._sum.montantHT ?? 0);

  const factAgg = await prisma.facture.aggregate({
    _sum: { montantHT: true },
    where: {
      deletedAt: null,
      statut: { in: [...FACTURE_ACTIVE] },
      dateEmis: { gte: period.start, lte: period.end },
      ...projetFilter,
    },
  });
  const caFacture = Number(factAgg._sum.montantHT ?? 0);

  const encAgg = await prisma.facture.aggregate({
    _sum: { montantHT: true },
    where: { deletedAt: null, statut: "PAYEE", dateEmis: { gte: period.start, lte: period.end }, ...projetFilter },
  });
  const caEncaisse = Number(encAgg._sum.montantHT ?? 0);

  // Créances ouvertes — stock (non filtré par période)
  const creancesAgg = await prisma.facture.aggregate({
    _sum: { montantHT: true },
    where: { deletedAt: null, statut: { in: [...UNPAID_STATUTS] }, ...projetFilter },
  });
  const creancesOuvertes = Number(creancesAgg._sum.montantHT ?? 0);

  // DSO : médiane (datePaiement - dateEmis)
  const payees = await prisma.facture.findMany({
    where: {
      deletedAt: null,
      statut: "PAYEE",
      dateEmis: { gte: period.start, lte: period.end },
      datePaiement: { not: null },
      ...projetFilter,
    },
    select: { dateEmis: true, datePaiement: true },
  });
  const dsos = payees
    .filter((f) => f.datePaiement)
    .map((f) => diffDays(f.datePaiement!, f.dateEmis));
  const dso = dsos.length >= 3 ? median(dsos) : null;

  // Évolution mensuelle
  const { start: rollStart, end: rollEnd } = rollingTwelveMonths();
  const buckets = monthlyBuckets(rollStart, rollEnd);

  const devisRoll = await prisma.devis.findMany({
    where: {
      deletedAt: null,
      statut: { in: ["ENVOYE", "ACCEPTE"] },
      dateEmis: { gte: rollStart, lte: rollEnd },
      ...projetFilter,
    },
    select: { dateEmis: true, montantHT: true, statut: true },
  });
  const facturesRoll = await prisma.facture.findMany({
    where: {
      deletedAt: null,
      statut: { in: [...FACTURE_ACTIVE] },
      dateEmis: { gte: rollStart, lte: rollEnd },
      ...projetFilter,
    },
    select: { dateEmis: true, montantHT: true, statut: true },
  });

  const emisM = new Map<string, number>();
  const accM = new Map<string, number>();
  const factM = new Map<string, number>();
  const encM = new Map<string, number>();
  for (const d of devisRoll) {
    const k = monthKey(d.dateEmis);
    const v = Number(d.montantHT);
    emisM.set(k, (emisM.get(k) ?? 0) + v);
    if (d.statut === "ACCEPTE") accM.set(k, (accM.get(k) ?? 0) + v);
  }
  for (const f of facturesRoll) {
    const k = monthKey(f.dateEmis);
    const v = Number(f.montantHT);
    factM.set(k, (factM.get(k) ?? 0) + v);
    if (f.statut === "PAYEE") encM.set(k, (encM.get(k) ?? 0) + v);
  }
  const monthly = buckets.map((b) => ({
    label: b.label,
    emis: emisM.get(b.key) ?? 0,
    accepte: accM.get(b.key) ?? 0,
    facture: factM.get(b.key) ?? 0,
    encaisse: encM.get(b.key) ?? 0,
  }));

  // Taux acceptation devis
  const devisPeriode = await prisma.devis.groupBy({
    by: ["statut"],
    _count: { _all: true },
    where: { deletedAt: null, dateEmis: { gte: period.start, lte: period.end }, ...projetFilter },
  });
  const statMap = new Map<string, number>();
  for (const g of devisPeriode) statMap.set(g.statut, g._count._all);
  const acceptationDevis = {
    accepte: statMap.get("ACCEPTE") ?? 0,
    refuse: statMap.get("REFUSE") ?? 0,
    enCours: (statMap.get("ENVOYE") ?? 0) + (statMap.get("BROUILLON") ?? 0),
  };

  // Aging factures non payées
  const unpaid = await prisma.facture.findMany({
    where: { deletedAt: null, statut: { in: [...UNPAID_STATUTS] }, ...projetFilter },
    select: { montantHT: true, dateEcheance: true },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const agingBuckets = {
    "À échoir": { count: 0, montant: 0 },
    "1-30 j": { count: 0, montant: 0 },
    "31-60 j": { count: 0, montant: 0 },
    "60+ j": { count: 0, montant: 0 },
  };
  for (const f of unpaid) {
    const m = Number(f.montantHT);
    if (!f.dateEcheance || f.dateEcheance >= today) {
      agingBuckets["À échoir"].count += 1;
      agingBuckets["À échoir"].montant += m;
    } else {
      const days = diffDays(today, f.dateEcheance);
      if (days <= 30) {
        agingBuckets["1-30 j"].count += 1;
        agingBuckets["1-30 j"].montant += m;
      } else if (days <= 60) {
        agingBuckets["31-60 j"].count += 1;
        agingBuckets["31-60 j"].montant += m;
      } else {
        agingBuckets["60+ j"].count += 1;
        agingBuckets["60+ j"].montant += m;
      }
    }
  }
  const aging = Object.entries(agingBuckets).map(([bucket, v]) => ({
    bucket,
    count: v.count,
    montant: v.montant,
  }));

  // Top clients par CA facturé
  const factParClient = await prisma.facture.groupBy({
    by: ["clientId"],
    _sum: { montantHT: true },
    where: {
      deletedAt: null,
      statut: { in: [...FACTURE_ACTIVE] },
      dateEmis: { gte: period.start, lte: period.end },
      ...projetFilter,
    },
    orderBy: { _sum: { montantHT: "desc" } },
    take: 5,
  });
  const clientIds = factParClient.map((x) => x.clientId);
  const clients = clientIds.length > 0
    ? await prisma.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, nom: true, prenom: true, raisonSociale: true },
      })
    : [];
  const clientMap = new Map(
    clients.map((c) => [c.id, c.raisonSociale || [c.prenom, c.nom].filter(Boolean).join(" ") || c.nom]),
  );
  const topClients = factParClient.map((x) => ({
    clientId: x.clientId,
    nom: clientMap.get(x.clientId) ?? "—",
    total: Number(x._sum.montantHT ?? 0),
  }));

  // Factures en retard
  const retardsRaw = await prisma.facture.findMany({
    where: {
      deletedAt: null,
      statut: { in: [...UNPAID_STATUTS] },
      dateEcheance: { lt: today },
      ...projetFilter,
    },
    orderBy: { dateEcheance: "asc" },
    take: 20,
    include: { client: { select: { nom: true, prenom: true, raisonSociale: true } } },
  });
  const retards = retardsRaw.map((f) => ({
    id: f.id,
    numero: f.numero,
    clientNom:
      f.client.raisonSociale ||
      [f.client.prenom, f.client.nom].filter(Boolean).join(" ") ||
      f.client.nom,
    montantHT: Number(f.montantHT),
    dateEcheance: f.dateEcheance,
    joursRetard: f.dateEcheance ? diffDays(today, f.dateEcheance) : 0,
  }));

  return {
    kpis: { caPrevisionnel, caAccepte, caFacture, caEncaisse, creancesOuvertes, dso },
    monthly,
    acceptationDevis,
    aging,
    topClients,
    retards,
  };
}
