import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

const VECTEURS = ["ELEC", "GAZ_NATUREL", "FIOUL", "BOIS", "PROPANE", "RESEAU_CHALEUR"] as const;
const SOURCES = ["R", "E", "F"] as const;

const createSchema = z.object({
  vecteur: z.enum(VECTEURS),
  periodeDebut: z.string().datetime().or(z.string().date()),
  periodeFin: z.string().datetime().or(z.string().date()),
  kwh: z.number().positive(),
  source: z.enum(SOURCES).default("R"),
  compteurRef: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const bulkSchema = z.object({ items: z.array(createSchema).min(1).max(60) });

interface Ctx {
  params: Promise<{ id: string }>;
}

function serialize(c: {
  id: string;
  vecteur: string;
  periodeDebut: Date;
  periodeFin: Date;
  kwh: { toString(): string };
  source: string;
  compteurRef: string | null;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: c.id,
    vecteur: c.vecteur,
    periodeDebut: c.periodeDebut.toISOString(),
    periodeFin: c.periodeFin.toISOString(),
    kwh: Number(c.kwh),
    source: c.source,
    compteurRef: c.compteurRef,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const list = await prisma.consoRelevee.findMany({
    where: { projetId: id, deletedAt: null },
    orderBy: [{ periodeDebut: "asc" }],
  });
  return NextResponse.json(list.map(serialize));
}

export async function POST(req: Request, ctx: Ctx) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const projet = await prisma.projet.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  // Bulk (import CSV) ou single
  const bulk = bulkSchema.safeParse(body);
  if (bulk.success) {
    const created = await prisma.$transaction(
      bulk.data.items.map((it) =>
        prisma.consoRelevee.create({
          data: {
            projetId: id,
            vecteur: it.vecteur,
            periodeDebut: new Date(it.periodeDebut),
            periodeFin: new Date(it.periodeFin),
            kwh: it.kwh,
            source: it.source,
            compteurRef: it.compteurRef ?? null,
            notes: it.notes ?? null,
          },
        }),
      ),
    );
    return NextResponse.json({ count: created.length, items: created.map(serialize) }, { status: 201 });
  }

  const single = createSchema.safeParse(body);
  if (!single.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: single.error.issues },
      { status: 422 },
    );
  }

  const created = await prisma.consoRelevee.create({
    data: {
      projetId: id,
      vecteur: single.data.vecteur,
      periodeDebut: new Date(single.data.periodeDebut),
      periodeFin: new Date(single.data.periodeFin),
      kwh: single.data.kwh,
      source: single.data.source,
      compteurRef: single.data.compteurRef ?? null,
      notes: single.data.notes ?? null,
    },
  });
  return NextResponse.json(serialize(created), { status: 201 });
}
