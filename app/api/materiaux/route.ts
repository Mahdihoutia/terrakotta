import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  createMateriauSchema,
  MATERIAU_CATEGORIES,
} from "@/lib/validations/materiau";
import { serializeMateriau } from "@/lib/api-helpers/materiau";

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
    // Détection stricte de la table manquante : P2021 est le code Prisma officiel
    // "The table does not exist in the current database". On évite les substrings
    // larges ("relation", "materiaux") qui matchaient à tort d'autres erreurs.
    const isMissingTable =
      message.includes("P2021") ||
      message.includes("does not exist in the current database");
    if (isMissingTable) {
      return NextResponse.json(
        {
          error: "MigrationPending",
          message:
            "La table materiaux n'existe pas encore. Exécute la migration SQL (prisma/migrations/_manual/2026_04_28_add_bibliotheque_materiaux.sql).",
        },
        { status: 503 },
      );
    }
    console.error("[/api/materiaux GET] error:", err);
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
