import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

interface Ctx {
  params: Promise<{ id: string; cid: string }>;
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id, cid } = await ctx.params;
  const c = await prisma.consoRelevee.findFirst({
    where: { id: cid, projetId: id, deletedAt: null },
  });
  if (!c) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.consoRelevee.update({
    where: { id: cid },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
