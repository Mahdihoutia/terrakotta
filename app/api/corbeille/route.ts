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

  const [clients, leads, projets, devis, documents, evenements] = await Promise.all([
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
  ]);

  return NextResponse.json({
    clients: clients.map((c) => ({ ...c, deletedAt: c.deletedAt?.toISOString() ?? null })),
    leads: leads.map((l) => ({ ...l, deletedAt: l.deletedAt?.toISOString() ?? null })),
    projets: projets.map((p) => ({ ...p, deletedAt: p.deletedAt?.toISOString() ?? null })),
    devis: devis.map((d) => ({ ...d, deletedAt: d.deletedAt?.toISOString() ?? null })),
    documents: documents.map((d) => ({ ...d, deletedAt: d.deletedAt?.toISOString() ?? null })),
    evenements: evenements.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      deletedAt: e.deletedAt?.toISOString() ?? null,
    })),
  });
}
