import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DESTRUCTIVE_ROLES, MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";
import { updateZoneParoiSchema } from "@/lib/validations/zone";
import { serializeZoneParoi } from "@/lib/api-helpers/batiment";

interface RouteContext {
  params: Promise<{ id: string; paroiZoneId: string }>;
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;
  const { paroiZoneId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateZoneParoiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.surface !== undefined) data.surface = d.surface;
  if (d.orientation !== undefined) data.orientation = d.orientation;
  if (d.inclinaison !== undefined) data.inclinaison = d.inclinaison;
  if (d.cotePaire !== undefined) data.cotePaire = d.cotePaire;

  const updated = await prisma.zoneParoi.update({
    where: { id: paroiZoneId },
    data,
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
  return NextResponse.json(serializeZoneParoi(updated));
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;
  const { paroiZoneId } = await ctx.params;
  await prisma.zoneParoi.delete({ where: { id: paroiZoneId } });
  return NextResponse.json({ ok: true });
}
