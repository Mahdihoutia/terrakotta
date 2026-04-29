import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DESTRUCTIVE_ROLES, MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";
import { updateZoneSchema } from "@/lib/validations/zone";
import { serializeZone } from "@/lib/api-helpers/batiment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const z = await prisma.zone.findFirst({
    where: { id, deletedAt: null },
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
  });
  if (!z) return NextResponse.json({ error: "Zone introuvable" }, { status: 404 });
  return NextResponse.json(serializeZone(z));
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

  const parsed = updateZoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const existing = await prisma.zone.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Zone introuvable" }, { status: 404 });
  }

  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.nom !== undefined) data.nom = d.nom;
  if (d.usage !== undefined) data.usage = d.usage;
  if (d.surface !== undefined) data.surface = d.surface;
  if (d.hauteurSousPlafond !== undefined) data.hauteurSousPlafond = d.hauteurSousPlafond;
  if (d.consigneChauffageOcc !== undefined) data.consigneChauffageOcc = d.consigneChauffageOcc;
  if (d.consigneChauffageRed !== undefined) data.consigneChauffageRed = d.consigneChauffageRed;
  if (d.consigneClimOcc !== undefined) data.consigneClimOcc = d.consigneClimOcc;
  if (d.consigneClimRed !== undefined) data.consigneClimRed = d.consigneClimRed;
  if (d.densiteOccupation !== undefined) data.densiteOccupation = d.densiteOccupation;
  if (d.apportsParPersonne !== undefined) data.apportsParPersonne = d.apportsParPersonne;
  if (d.apportsEquipements !== undefined) data.apportsEquipements = d.apportsEquipements;
  if (d.apportsEclairage !== undefined) data.apportsEclairage = d.apportsEclairage;
  if (d.qVmcM3hM2 !== undefined) data.qVmcM3hM2 = d.qVmcM3hM2;
  if (d.efficaciteDoubleFlux !== undefined) data.efficaciteDoubleFlux = d.efficaciteDoubleFlux;
  if (d.scenarioId !== undefined) data.scenarioId = d.scenarioId;

  await prisma.zone.update({ where: { id }, data });
  const reload = await prisma.zone.findUnique({
    where: { id },
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
  });
  return NextResponse.json(serializeZone(reload!));
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;

  const existing = await prisma.zone.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Zone introuvable" }, { status: 404 });
  }
  await prisma.zone.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
