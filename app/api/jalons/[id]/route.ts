import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  DESTRUCTIVE_ROLES,
  MUTATION_ROLES,
  ensureRole,
} from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateJalonSchema = z.object({
  titre: z.string().min(1).optional(),
  echeance: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Date d'échéance invalide",
    })
    .optional(),
  fait: z.boolean().optional(),
});

/** PATCH /api/jalons/[id] — Mettre à jour un jalon (toggle fait, renommer, etc.) */
export async function PATCH(request: Request, context: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateJalonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.titre !== undefined) data.titre = parsed.data.titre.trim();
  if (parsed.data.echeance !== undefined) data.echeance = new Date(parsed.data.echeance);
  if (parsed.data.fait !== undefined) data.fait = parsed.data.fait;

  try {
    const jalon = await prisma.jalon.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      id: jalon.id,
      titre: jalon.titre,
      echeance: jalon.echeance.toISOString(),
      fait: jalon.fait,
    });
  } catch (err) {
    console.error("[PATCH /api/jalons/[id]] prisma error", err);
    return NextResponse.json({ error: "Jalon introuvable" }, { status: 404 });
  }
}

/** DELETE /api/jalons/[id] — Supprimer un jalon (hard delete, sub-entité) */
export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  const { id } = await context.params;
  try {
    await prisma.jalon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Jalon introuvable" }, { status: 404 });
  }
}
