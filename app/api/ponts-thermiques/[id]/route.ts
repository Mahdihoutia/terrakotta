import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, DESTRUCTIVE_ROLES } from "@/lib/auth-helpers";

interface RouteContext { params: Promise<{ id: string }>; }

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;
  await prisma.pontThermiqueLiaison.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
