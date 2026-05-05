import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

const createSystemeSchema = z.object({
  type: z.enum(["CHAUFFAGE", "ECS", "VENTILATION", "CLIMATISATION", "PHOTOVOLTAIQUE"]),
  vecteur: z.enum(["ELEC", "GAZ_NATUREL", "FIOUL", "BOIS", "PROPANE", "RESEAU_CHALEUR"]),
  nom: z.string().min(1, "Nom requis"),
  rendement: z.number().positive().default(1),
  partCouverture: z.number().min(0).max(1).default(1),
  cop: z.number().positive().nullable().optional(),
  puissanceKwc: z.number().positive().nullable().optional(),
  tauxAutoconso: z.number().min(0).max(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

function serialize(s: {
  id: string; type: string; vecteur: string; nom: string;
  rendement: { toString(): string }; partCouverture: { toString(): string };
  cop: { toString(): string } | null;
  puissanceKwc?: { toString(): string } | null;
  tauxAutoconso?: { toString(): string } | null;
  notes: string | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: s.id,
    type: s.type,
    vecteur: s.vecteur,
    nom: s.nom,
    rendement: Number(s.rendement),
    partCouverture: Number(s.partCouverture),
    cop: s.cop != null ? Number(s.cop) : null,
    puissanceKwc: s.puissanceKwc != null ? Number(s.puissanceKwc) : null,
    tauxAutoconso: s.tauxAutoconso != null ? Number(s.tauxAutoconso) : null,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const list = await prisma.systeme.findMany({
    where: { projetId: id, deletedAt: null },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(list.map(serialize));
}

export async function POST(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const parsed = createSystemeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const projet = await prisma.projet.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  try {
    const created = await prisma.systeme.create({
      data: { projetId: id, ...parsed.data },
    });
    return NextResponse.json(serialize(created), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[/api/projets/:id/systemes POST] error:", err);
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}
