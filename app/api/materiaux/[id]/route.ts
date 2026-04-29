import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  DESTRUCTIVE_ROLES,
  MUTATION_ROLES,
  ensureRole,
} from "@/lib/auth-helpers";
import { updateMateriauSchema } from "@/lib/validations/materiau";
import { serializeMateriau } from "@/lib/api-helpers/materiau";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const m = await prisma.materiau.findFirst({
    where: { id, deletedAt: null },
  });
  if (!m) {
    return NextResponse.json({ error: "Matériau introuvable" }, { status: 404 });
  }
  return NextResponse.json(serializeMateriau(m));
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
  const parsed = updateMateriauSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const existing = await prisma.materiau.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Matériau introuvable" }, { status: 404 });
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (d.nom !== undefined) updateData.nom = d.nom;
  if (d.categorie !== undefined) updateData.categorie = d.categorie;
  if (d.marque !== undefined) updateData.marque = d.marque;
  if (d.reference !== undefined) updateData.reference = d.reference;
  if (d.conductivite !== undefined) updateData.conductivite = d.conductivite;
  if (d.masseVolumique !== undefined) updateData.masseVolumique = d.masseVolumique;
  if (d.capaciteThermique !== undefined) updateData.capaciteThermique = d.capaciteThermique;
  if (d.resistanceVapeur !== undefined) updateData.resistanceVapeur = d.resistanceVapeur;
  if (d.resistanceFixe !== undefined) updateData.resistanceFixe = d.resistanceFixe;
  if (d.carboneACV !== undefined) updateData.carboneACV = d.carboneACV;
  if (d.carboneFinDeVie !== undefined) updateData.carboneFinDeVie = d.carboneFinDeVie;
  if (d.origineFdes !== undefined) updateData.origineFdes = d.origineFdes;
  if (d.source !== undefined) updateData.source = d.source;
  if (d.notes !== undefined) updateData.notes = d.notes;

  const updated = await prisma.materiau.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(serializeMateriau(updated));
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  const existing = await prisma.materiau.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Matériau introuvable" }, { status: 404 });
  }
  // Vérifier qu'aucune paroi non-supprimée n'utilise ce matériau.
  const usage = await prisma.paroiCouche.count({
    where: { materiauId: id, paroi: { deletedAt: null } },
  });
  if (usage > 0) {
    return NextResponse.json(
      {
        error: "MateriauUtilise",
        message: `Ce matériau est utilisé dans ${usage} couche(s) de parois actives.`,
      },
      { status: 409 },
    );
  }
  await prisma.materiau.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
