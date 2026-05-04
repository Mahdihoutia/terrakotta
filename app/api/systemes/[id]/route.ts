import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES, DESTRUCTIVE_ROLES } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  type: z.enum(["CHAUFFAGE", "ECS", "VENTILATION", "CLIMATISATION"]).optional(),
  vecteur: z.enum(["ELEC", "GAZ_NATUREL", "FIOUL", "BOIS", "PROPANE", "RESEAU_CHALEUR"]).optional(),
  nom: z.string().min(1).optional(),
  rendement: z.number().positive().optional(),
  partCouverture: z.number().min(0).max(1).optional(),
  cop: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

interface RouteContext { params: Promise<{ id: string }>; }

export async function PATCH(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ValidationError", issues: parsed.error.issues }, { status: 422 });
  try {
    const updated = await prisma.systeme.update({ where: { id }, data: parsed.data });
    return NextResponse.json({
      id: updated.id, type: updated.type, vecteur: updated.vecteur, nom: updated.nom,
      rendement: Number(updated.rendement), partCouverture: Number(updated.partCouverture),
      cop: updated.cop != null ? Number(updated.cop) : null, notes: updated.notes,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: "ServerError", message: m }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;
  await prisma.systeme.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
