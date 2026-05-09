import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES, getSession } from "@/lib/auth-helpers";

type Resource =
  | "clients"
  | "leads"
  | "projets"
  | "devis"
  | "factures"
  | "documents"
  | "evenements"
  | "materiaux"
  | "parois"
  | "users";

const ALLOWED: Resource[] = [
  "clients",
  "leads",
  "projets",
  "devis",
  "factures",
  "documents",
  "evenements",
  "materiaux",
  "parois",
  "users",
];

/**
 * POST /api/corbeille/{resource}/{id}/restore
 * Restaure un élément soft-deleted en remettant deletedAt à null.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { resource, id } = await ctx.params;
  if (!ALLOWED.includes(resource as Resource)) {
    return NextResponse.json({ error: "Ressource inconnue" }, { status: 404 });
  }

  // La restauration d'un utilisateur est réservée aux ADMIN.
  if (resource === "users") {
    const session = await getSession();
    if (session?.user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  try {
    const data = { deletedAt: null };
    switch (resource as Resource) {
      case "clients":
        await prisma.client.update({ where: { id }, data });
        break;
      case "leads":
        await prisma.lead.update({ where: { id }, data });
        break;
      case "projets": {
        // Restaure le projet ET la cohorte d'enfants soft-deletés au
        // même instant (±1s) — voir DELETE /api/projets/[id].
        const projet = await prisma.projet.findUnique({ where: { id }, select: { deletedAt: true } });
        if (!projet?.deletedAt) {
          return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
        }
        const t = projet.deletedAt;
        const lo = new Date(t.getTime() - 1000);
        const hi = new Date(t.getTime() + 1000);
        const cohort = { projetId: id, deletedAt: { gte: lo, lte: hi } };
        await prisma.$transaction([
          prisma.projet.update({ where: { id }, data }),
          prisma.devis.updateMany({ where: cohort, data }),
          prisma.facture.updateMany({ where: cohort, data }),
          prisma.aide.updateMany({ where: cohort, data }),
          prisma.document.updateMany({ where: cohort, data }),
          prisma.batiment.updateMany({ where: cohort, data }),
          prisma.systeme.updateMany({ where: cohort, data }),
          prisma.variante.updateMany({ where: cohort, data }),
        ]);
        break;
      }
      case "devis":
        await prisma.devis.update({ where: { id }, data });
        break;
      case "factures":
        await prisma.facture.update({ where: { id }, data });
        break;
      case "documents":
        await prisma.document.update({ where: { id }, data });
        break;
      case "evenements":
        await prisma.evenement.update({ where: { id }, data });
        break;
      case "materiaux":
        await prisma.materiau.update({ where: { id }, data });
        break;
      case "parois":
        await prisma.paroi.update({ where: { id }, data });
        break;
      case "users":
        await prisma.user.update({ where: { id }, data });
        break;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });
  }
}
