import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  createMateriauSchema,
  MATERIAU_CATEGORIES,
} from "@/lib/validations/materiau";

interface MateriauRow {
  id: string;
  nom: string;
  categorie: string;
  marque: string | null;
  reference: string | null;
  conductivite: unknown;
  masseVolumique: unknown;
  capaciteThermique: unknown;
  resistanceVapeur: unknown;
  resistanceFixe: unknown;
  carboneACV: unknown;
  carboneFinDeVie: unknown;
  origineFdes: string | null;
  source: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function serializeMateriau(m: MateriauRow) {
  return {
    id: m.id,
    nom: m.nom,
    categorie: m.categorie,
    marque: m.marque,
    reference: m.reference,
    conductivite: num(m.conductivite) ?? 0,
    masseVolumique: num(m.masseVolumique) ?? 0,
    capaciteThermique: num(m.capaciteThermique) ?? 0,
    resistanceVapeur: num(m.resistanceVapeur),
    resistanceFixe: num(m.resistanceFixe),
    carboneACV: num(m.carboneACV),
    carboneFinDeVie: num(m.carboneFinDeVie),
    origineFdes: m.origineFdes,
    source: m.source,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

/** GET /api/materiaux — Liste filtrable. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get("categorie");
  const search = searchParams.get("search")?.trim();

  const where: Record<string, unknown> = { deletedAt: null };
  if (
    categorie &&
    categorie !== "TOUTES" &&
    (MATERIAU_CATEGORIES as readonly string[]).includes(categorie)
  ) {
    where.categorie = categorie;
  }
  if (search && search.length > 0) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { marque: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const list = await prisma.materiau.findMany({
      where,
      orderBy: [{ categorie: "asc" }, { nom: "asc" }],
    });
    return NextResponse.json(list.map(serializeMateriau));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const isMissingTable =
      message.includes("materiaux") ||
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("P2021");
    if (isMissingTable) {
      return NextResponse.json(
        {
          error: "MigrationPending",
          message:
            "La table materiaux n'existe pas encore. Exécute la migration SQL (prisma/migrations/_manual/2026_04_28_add_bibliotheque_materiaux.sql) puis POST /api/admin/seed-materiaux.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "ServerError", message },
      { status: 500 },
    );
  }
}

/** POST /api/materiaux — Création. */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createMateriauSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const created = await prisma.materiau.create({
    data: {
      nom: d.nom,
      categorie: d.categorie,
      marque: d.marque,
      reference: d.reference,
      conductivite: d.conductivite,
      masseVolumique: d.masseVolumique,
      capaciteThermique: d.capaciteThermique,
      resistanceVapeur: d.resistanceVapeur,
      resistanceFixe: d.resistanceFixe,
      carboneACV: d.carboneACV,
      carboneFinDeVie: d.carboneFinDeVie,
      origineFdes: d.origineFdes,
      source: d.source,
      notes: d.notes,
    },
  });
  return NextResponse.json(serializeMateriau(created), { status: 201 });
}
