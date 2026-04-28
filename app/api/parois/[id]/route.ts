import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  DESTRUCTIVE_ROLES,
  MUTATION_ROLES,
  ensureRole,
} from "@/lib/auth-helpers";
import { updateParoiSchema } from "@/lib/validations/paroi";
import { recalcParoiCache, serializeParoi } from "../route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const p = await prisma.paroi.findFirst({
    where: { id, deletedAt: null },
    include: {
      couches: {
        orderBy: { ordre: "asc" },
        include: { materiau: true },
      },
    },
  });
  if (!p) {
    return NextResponse.json({ error: "Paroi introuvable" }, { status: 404 });
  }
  return NextResponse.json(serializeParoi(p));
}

/**
 * PATCH /api/parois/[id]
 * Met à jour la paroi. Si `couches` est fourni, remplace intégralement les
 * couches existantes (delete+create) puis recalcule les caches.
 */
export async function PATCH(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = updateParoiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const existing = await prisma.paroi.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Paroi introuvable" }, { status: 404 });
  }

  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = {};
    if (d.nom !== undefined) updateData.nom = d.nom;
    if (d.type !== undefined) updateData.type = d.type;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.rsi !== undefined) updateData.rsi = d.rsi;
    if (d.rse !== undefined) updateData.rse = d.rse;

    if (Object.keys(updateData).length > 0) {
      await tx.paroi.update({ where: { id }, data: updateData });
    }

    if (d.couches !== undefined) {
      await tx.paroiCouche.deleteMany({ where: { paroiId: id } });
      if (d.couches.length > 0) {
        await tx.paroiCouche.createMany({
          data: d.couches.map((c) => ({
            paroiId: id,
            materiauId: c.materiauId,
            ordre: c.ordre,
            epaisseur: c.epaisseur,
          })),
        });
      }
    }
  });

  await recalcParoiCache(id);

  const reload = await prisma.paroi.findUnique({
    where: { id },
    include: {
      couches: {
        orderBy: { ordre: "asc" },
        include: { materiau: true },
      },
    },
  });
  return NextResponse.json(serializeParoi(reload!));
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  const existing = await prisma.paroi.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Paroi introuvable" }, { status: 404 });
  }
  await prisma.paroi.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
