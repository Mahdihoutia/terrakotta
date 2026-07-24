import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES, DESTRUCTIVE_ROLES } from "@/lib/auth-helpers";

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  inputs: z.unknown().optional(),
});

interface RouteContext {
  params: Promise<{ id: string; varianteId: string }>;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** PATCH /api/projets/[id]/variantes/[varianteId] — modifier une variante. */
export async function PATCH(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id, varianteId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const variante = await prisma.variante.findFirst({
    where: { id: varianteId, projetId: id, deletedAt: null },
    select: { id: true },
  });
  if (!variante) {
    return NextResponse.json({ error: "Variante introuvable" }, { status: 404 });
  }

  const data: {
    nom?: string;
    description?: string | null;
    inputsJson?: string;
  } = {};
  if (parsed.data.nom !== undefined) data.nom = parsed.data.nom;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.inputs !== undefined) data.inputsJson = JSON.stringify(parsed.data.inputs);

  try {
    const updated = await prisma.variante.update({
      where: { id: varianteId },
      data,
      select: {
        id: true, nom: true, description: true, type: true,
        parentId: true, inputsJson: true, createdAt: true, updatedAt: true,
      },
    });
    return NextResponse.json({
      ...updated,
      inputs: safeParse(updated.inputsJson),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    console.error("[/api/projets/:id/variantes/:varianteId PATCH]", err);
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}

/** DELETE /api/projets/[id]/variantes/[varianteId] — soft-delete. */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  const { id, varianteId } = await ctx.params;
  const variante = await prisma.variante.findFirst({
    where: { id: varianteId, projetId: id, deletedAt: null },
    select: { id: true },
  });
  if (!variante) {
    return NextResponse.json({ error: "Variante introuvable" }, { status: 404 });
  }
  await prisma.variante.update({
    where: { id: varianteId },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
