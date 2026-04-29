import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import { createZoneParoiSchema } from "@/lib/validations/zone";
import { serializeZoneParoi } from "@/lib/api-helpers/batiment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const list = await prisma.zoneParoi.findMany({
    where: { zoneId: id },
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
  });
  return NextResponse.json(list.map(serializeZoneParoi));
}

export async function POST(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createZoneParoiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;

  const zone = await prisma.zone.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!zone) return NextResponse.json({ error: "Zone introuvable" }, { status: 404 });

  const paroi = await prisma.paroi.findFirst({
    where: { id: d.paroiId, deletedAt: null },
    select: { id: true },
  });
  if (!paroi) return NextResponse.json({ error: "Paroi introuvable" }, { status: 404 });

  const created = await prisma.zoneParoi.create({
    data: {
      zoneId: id,
      paroiId: d.paroiId,
      surface: d.surface,
      orientation: d.orientation,
      inclinaison: d.inclinaison ?? 90,
      cotePaire: d.cotePaire ?? false,
    },
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
  });
  return NextResponse.json(serializeZoneParoi(created), { status: 201 });
}
