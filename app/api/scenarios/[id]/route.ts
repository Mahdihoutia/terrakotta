import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DESTRUCTIVE_ROLES, MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";
import { updateScenarioSchema } from "@/lib/validations/scenario";
import { serializeScenario } from "@/lib/api-helpers/batiment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const s = await prisma.scenarioOccupation.findFirst({
    where: { id, deletedAt: null },
  });
  if (!s) return NextResponse.json({ error: "Scénario introuvable" }, { status: 404 });
  return NextResponse.json(serializeScenario(s));
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

  const parsed = updateScenarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const existing = await prisma.scenarioOccupation.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, preset: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Scénario introuvable" }, { status: 404 });
  }
  if (existing.preset) {
    return NextResponse.json(
      { error: "Les scénarios presets ne sont pas modifiables." },
      { status: 403 },
    );
  }

  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.nom !== undefined) data.nom = d.nom;
  if (d.description !== undefined) data.description = d.description;
  if (d.pattern !== undefined) data.patternJson = JSON.stringify(d.pattern);

  const updated = await prisma.scenarioOccupation.update({ where: { id }, data });
  return NextResponse.json(serializeScenario(updated));
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;

  const existing = await prisma.scenarioOccupation.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, preset: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Scénario introuvable" }, { status: 404 });
  }
  if (existing.preset) {
    return NextResponse.json(
      { error: "Les scénarios presets ne sont pas supprimables." },
      { status: 403 },
    );
  }
  await prisma.scenarioOccupation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
