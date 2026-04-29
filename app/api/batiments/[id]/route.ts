import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DESTRUCTIVE_ROLES, MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";
import { updateBatimentSchema } from "@/lib/validations/batiment";
import {
  isMigrationPendingError,
  serializeBatiment,
  serializeZone,
} from "@/lib/api-helpers/batiment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const b = await prisma.batiment.findFirst({
      where: { id, deletedAt: null },
      include: {
        zones: {
          where: { deletedAt: null },
          orderBy: { nom: "asc" },
          include: {
            parois: {
              include: {
                paroi: {
                  select: {
                    id: true,
                    nom: true,
                    type: true,
                    uCache: true,
                    masseSurfaciqueCache: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!b) return NextResponse.json({ error: "Bâtiment introuvable" }, { status: 404 });
    return NextResponse.json({
      ...serializeBatiment(b),
      zones: b.zones.map((z) => serializeZone(z)),
    });
  } catch (err) {
    if (isMigrationPendingError(err)) {
      return NextResponse.json(
        { error: "MigrationPending", message: "Migration zoning manquante." },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}

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

  const parsed = updateBatimentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const existing = await prisma.batiment.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Bâtiment introuvable" }, { status: 404 });
  }

  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.nom !== undefined) data.nom = d.nom;
  if (d.description !== undefined) data.description = d.description;
  if (d.zoneClimatique !== undefined) data.zoneClimatique = d.zoneClimatique;
  if (d.altitude !== undefined) data.altitude = d.altitude;
  if (d.orientation !== undefined) data.orientation = d.orientation;
  if (d.projetId !== undefined) data.projetId = d.projetId;
  if (d.auditDocumentId !== undefined) data.auditDocumentId = d.auditDocumentId;

  const updated = await prisma.batiment.update({
    where: { id },
    data,
  });
  return NextResponse.json(serializeBatiment({ ...updated, zones: [] }));
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;

  const existing = await prisma.batiment.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Bâtiment introuvable" }, { status: 404 });
  }
  await prisma.batiment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
