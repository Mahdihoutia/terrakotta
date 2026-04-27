import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  DESTRUCTIVE_ROLES,
  MUTATION_ROLES,
  ensureRole,
} from "@/lib/auth-helpers";
import { updatePosteCatalogueSchema } from "@/lib/validations/poste-catalogue";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PosteRow {
  id: string;
  designation: string;
  categorie: string | null;
  unite: string;
  prixUnitHT: unknown;
  tauxTVA: unknown;
  description: string | null;
  ordre: number;
  createdAt: Date;
  updatedAt: Date;
}

function serializePoste(p: PosteRow) {
  return {
    id: p.id,
    designation: p.designation,
    categorie: p.categorie,
    unite: p.unite,
    prixUnitHT: Number(p.prixUnitHT),
    tauxTVA: Number(p.tauxTVA),
    description: p.description,
    ordre: p.ordre,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const poste = await prisma.posteCatalogue.findFirst({
    where: { id, deletedAt: null },
  });
  if (!poste) {
    return NextResponse.json({ error: "Poste introuvable" }, { status: 404 });
  }
  return NextResponse.json(serializePoste(poste));
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
  const parsed = updatePosteCatalogueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const existing = await prisma.posteCatalogue.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Poste introuvable" }, { status: 404 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.designation !== undefined) updateData.designation = data.designation;
  if (data.categorie !== undefined) updateData.categorie = data.categorie;
  if (data.unite !== undefined) updateData.unite = data.unite;
  if (data.prixUnitHT !== undefined) updateData.prixUnitHT = data.prixUnitHT;
  if (data.tauxTVA !== undefined) updateData.tauxTVA = data.tauxTVA;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.ordre !== undefined) updateData.ordre = data.ordre;

  const updated = await prisma.posteCatalogue.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(serializePoste(updated));
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  const existing = await prisma.posteCatalogue.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Poste introuvable" }, { status: 404 });
  }
  await prisma.posteCatalogue.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
