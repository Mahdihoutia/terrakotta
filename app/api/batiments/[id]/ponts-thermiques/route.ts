import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

const TYPO = [
  "MUR_DALLE_INTERMEDIAIRE", "MUR_PLANCHER_BAS", "MUR_TOITURE", "MUR_REFEND",
  "MENUISERIE_TUNNEL", "MENUISERIE_NU_INTERIEUR", "MENUISERIE_NU_EXTERIEUR",
  "BALCON_NON_ROMPU", "BALCON_RUPTEUR",
] as const;
const ISOLATION = ["ITE", "ITI", "ITR", "Aucune"] as const;

const createSchema = z.object({
  typo: z.enum(TYPO),
  isolation: z.enum(ISOLATION).default("Aucune"),
  longueur: z.number().positive(),
  psiOverride: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

interface RouteContext { params: Promise<{ id: string }>; }

function serialize(p: {
  id: string; typo: string; isolation: string;
  longueur: { toString(): string };
  psiOverride: { toString(): string } | null;
  notes: string | null;
}) {
  return {
    id: p.id,
    typo: p.typo,
    isolation: p.isolation,
    longueur: Number(p.longueur),
    psiOverride: p.psiOverride != null ? Number(p.psiOverride) : null,
    notes: p.notes,
  };
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const list = await prisma.pontThermiqueLiaison.findMany({
    where: { batimentId: id, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(list.map(serialize));
}

export async function POST(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ValidationError", issues: parsed.error.issues }, { status: 422 });
  try {
    const created = await prisma.pontThermiqueLiaison.create({
      data: { batimentId: id, ...parsed.data },
    });
    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "ServerError", message: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
