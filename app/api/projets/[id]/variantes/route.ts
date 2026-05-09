import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

const createSchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.enum(["INITIAL", "VARIANTE"]).default("VARIANTE"),
  parentId: z.string().nullable().optional(),
  inputs: z.unknown().default({}),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const list = await prisma.variante.findMany({
    where: { projetId: id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, nom: true, description: true, type: true,
      parentId: true, inputsJson: true, createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json(list.map((v) => ({
    ...v,
    inputs: safeParse(v.inputsJson),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  })));
}

export async function POST(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ValidationError", issues: parsed.error.issues }, { status: 422 });
  }

  const projet = await prisma.projet.findFirst({
    where: { id, deletedAt: null }, select: { id: true },
  });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  if (parsed.data.parentId) {
    const parent = await prisma.variante.findFirst({
      where: { id: parsed.data.parentId, projetId: id, deletedAt: null },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "ValidationError", message: "parentId ne correspond à aucune variante de ce projet" },
        { status: 422 },
      );
    }
  }

  try {
    const created = await prisma.variante.create({
      data: {
        projetId: id,
        type: parsed.data.type,
        nom: parsed.data.nom,
        description: parsed.data.description ?? null,
        parentId: parsed.data.parentId ?? null,
        inputsJson: JSON.stringify(parsed.data.inputs ?? {}),
      },
      select: {
        id: true, nom: true, description: true, type: true,
        parentId: true, inputsJson: true, createdAt: true,
      },
    });
    return NextResponse.json({
      ...created,
      inputs: safeParse(created.inputsJson),
      createdAt: created.createdAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    console.error("[/api/projets/:id/variantes POST]", err);
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
