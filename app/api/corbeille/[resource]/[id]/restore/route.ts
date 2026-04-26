import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

type Resource = "clients" | "leads" | "projets" | "devis" | "documents" | "evenements";

const ALLOWED: Resource[] = ["clients", "leads", "projets", "devis", "documents", "evenements"];

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

  try {
    const data = { deletedAt: null };
    switch (resource as Resource) {
      case "clients":
        await prisma.client.update({ where: { id }, data });
        break;
      case "leads":
        await prisma.lead.update({ where: { id }, data });
        break;
      case "projets":
        await prisma.projet.update({ where: { id }, data });
        break;
      case "devis":
        await prisma.devis.update({ where: { id }, data });
        break;
      case "documents":
        await prisma.document.update({ where: { id }, data });
        break;
      case "evenements":
        await prisma.evenement.update({ where: { id }, data });
        break;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });
  }
}
