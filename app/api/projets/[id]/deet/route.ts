import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  calculerTrajectoire,
  simulerGestes,
  prochaineDeclarationOperat,
  type DeetActivite,
  type DeetMethode,
  type ZoneClimatique,
  type Geste,
} from "@/lib/deet";

const ACTIVITES = [
  "BUREAUX",
  "ENSEIGNEMENT",
  "HOSPITALIER",
  "HOTELLERIE_RESTAURATION",
  "COMMERCE",
  "LOGISTIQUE_INDUSTRIE",
  "SPORT_LOISIRS",
  "CULTURE",
  "AUTRE_TERTIAIRE",
] as const;

const upsertSchema = z.object({
  assujetti: z.boolean().default(true),
  methode: z.enum(["RELATIVE", "ABSOLUE"]).default("RELATIVE"),
  activite: z.enum(ACTIVITES),
  zoneClimatique: z.enum(["H1", "H2", "H3"]),
  surfacePlancher: z.number().positive(),
  anneeReference: z.number().int().min(2010).max(2019),
  consoReferenceKwhEfM2: z.number().positive(),
  consoActuelleKwhEfM2: z.number().positive().nullable().optional(),
  anneeActuelle: z.number().int().min(2010).max(2100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

const simulateSchema = z.object({
  gestes: z
    .array(
      z.object({
        nom: z.string(),
        gainPct: z.number().min(0).max(100),
        anneeMiseEnService: z.number().int().min(2020).max(2050),
      }),
    )
    .default([]),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

function serialize(profil: {
  id: string;
  assujetti: boolean;
  methode: string;
  activite: string;
  zoneClimatique: string;
  surfacePlancher: { toString(): string };
  anneeReference: number;
  consoReferenceKwhEfM2: { toString(): string };
  consoActuelleKwhEfM2: { toString(): string } | null;
  anneeActuelle: number | null;
  notes: string | null;
  updatedAt: Date;
}) {
  return {
    id: profil.id,
    assujetti: profil.assujetti,
    methode: profil.methode,
    activite: profil.activite,
    zoneClimatique: profil.zoneClimatique,
    surfacePlancher: Number(profil.surfacePlancher),
    anneeReference: profil.anneeReference,
    consoReferenceKwhEfM2: Number(profil.consoReferenceKwhEfM2),
    consoActuelleKwhEfM2:
      profil.consoActuelleKwhEfM2 != null ? Number(profil.consoActuelleKwhEfM2) : null,
    anneeActuelle: profil.anneeActuelle,
    notes: profil.notes,
    updatedAt: profil.updatedAt.toISOString(),
  };
}

function computeTrajectory(profil: {
  methode: string;
  activite: string;
  zoneClimatique: string;
  anneeReference: number;
  consoReferenceKwhEfM2: { toString(): string };
  consoActuelleKwhEfM2: { toString(): string } | null;
  anneeActuelle: number | null;
}) {
  return calculerTrajectoire({
    methode: profil.methode as DeetMethode,
    activite: profil.activite as DeetActivite,
    zone: profil.zoneClimatique as ZoneClimatique,
    anneeReference: profil.anneeReference,
    consoReferenceKwhEfM2: Number(profil.consoReferenceKwhEfM2),
    consoActuelleKwhEfM2:
      profil.consoActuelleKwhEfM2 != null ? Number(profil.consoActuelleKwhEfM2) : null,
    anneeActuelle: profil.anneeActuelle,
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const projet = await prisma.projet.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  const profil = await prisma.deetProfil.findUnique({ where: { projetId: id } });
  if (!profil) {
    return NextResponse.json({
      profil: null,
      trajectoire: null,
      prochaineDeclarationOperat: prochaineDeclarationOperat().toISOString(),
    });
  }
  return NextResponse.json({
    profil: serialize(profil),
    trajectoire: computeTrajectory(profil),
    prochaineDeclarationOperat: prochaineDeclarationOperat().toISOString(),
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = upsertSchema.safeParse(body);
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

  const data = parsed.data;
  const profil = await prisma.deetProfil.upsert({
    where: { projetId: id },
    create: {
      projetId: id,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({
    profil: serialize(profil),
    trajectoire: computeTrajectory(profil),
    prochaineDeclarationOperat: prochaineDeclarationOperat().toISOString(),
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;
  const { id } = await ctx.params;
  await prisma.deetProfil.deleteMany({ where: { projetId: id } });
  return NextResponse.json({ ok: true });
}

// POST /simulate — simule des gestes sur la trajectoire actuelle
export async function POST(req: Request, ctx: Ctx) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  const profil = await prisma.deetProfil.findUnique({ where: { projetId: id } });
  if (!profil) {
    return NextResponse.json(
      { error: "Aucun profil DEET — configurer d'abord le projet" },
      { status: 422 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = simulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const traj = computeTrajectory(profil);
  const pointsSimules = simulerGestes(traj, parsed.data.gestes as Geste[]);

  return NextResponse.json({ trajectoire: traj, pointsSimules });
}
