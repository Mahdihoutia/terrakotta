import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

/**
 * GET /api/corbeille — Liste tous les éléments soft-deleted, par catégorie.
 * (À implémenter via cron Vercel : purge automatique au-delà de 90j.)
 */
export async function GET() {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  // Helper : retourne [] si la table n'existe pas encore.
  async function safe<T>(p: Promise<T[]>): Promise<T[]> {
    try {
      return await p;
    } catch {
      return [] as T[];
    }
  }

  const [
    clients,
    leads,
    projets,
    devis,
    factures,
    documents,
    evenements,
    materiaux,
    parois,
    batiments,
    zones,
    scenarios,
  ] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, nom: true, prenom: true, type: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.lead.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, nom: true, prenom: true, email: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.projet.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, titre: true, statut: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.devis.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, numero: true, objet: true, statut: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.facture.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, numero: true, objet: true, statut: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, titre: true, reference: true, type: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.evenement.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, titre: true, date: true, type: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.materiau.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, nom: true, categorie: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.paroi.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, nom: true, type: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    safe(
      prisma.batiment.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, nom: true, zoneClimatique: true, deletedAt: true },
        orderBy: { deletedAt: "desc" },
      }),
    ),
    safe(
      prisma.zone.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, nom: true, usage: true, deletedAt: true },
        orderBy: { deletedAt: "desc" },
      }),
    ),
    safe(
      prisma.scenarioOccupation.findMany({
        where: { deletedAt: { not: null }, preset: false },
        select: { id: true, nom: true, deletedAt: true },
        orderBy: { deletedAt: "desc" },
      }),
    ),
  ]);

  return NextResponse.json({
    clients: clients.map((c) => ({ ...c, deletedAt: c.deletedAt?.toISOString() ?? null })),
    leads: leads.map((l) => ({ ...l, deletedAt: l.deletedAt?.toISOString() ?? null })),
    projets: projets.map((p) => ({ ...p, deletedAt: p.deletedAt?.toISOString() ?? null })),
    devis: devis.map((d) => ({ ...d, deletedAt: d.deletedAt?.toISOString() ?? null })),
    factures: factures.map((f) => ({ ...f, deletedAt: f.deletedAt?.toISOString() ?? null })),
    documents: documents.map((d) => ({ ...d, deletedAt: d.deletedAt?.toISOString() ?? null })),
    evenements: evenements.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      deletedAt: e.deletedAt?.toISOString() ?? null,
    })),
    materiaux: materiaux.map((m) => ({ ...m, deletedAt: m.deletedAt?.toISOString() ?? null })),
    parois: parois.map((p) => ({ ...p, deletedAt: p.deletedAt?.toISOString() ?? null })),
    batiments: batiments.map((b) => ({ ...b, deletedAt: b.deletedAt?.toISOString() ?? null })),
    zones: zones.map((z) => ({ ...z, deletedAt: z.deletedAt?.toISOString() ?? null })),
    scenarios: scenarios.map((s) => ({ ...s, deletedAt: s.deletedAt?.toISOString() ?? null })),
  });
}
