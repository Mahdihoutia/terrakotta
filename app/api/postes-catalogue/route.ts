import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";
import { createPosteCatalogueSchema } from "@/lib/validations/poste-catalogue";

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

/** GET /api/postes-catalogue — Liste les postes (filtre catégorie, recherche). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get("categorie");
  const search = searchParams.get("search")?.trim();

  const where: Record<string, unknown> = { deletedAt: null };
  if (categorie && categorie !== "TOUTES") where.categorie = categorie;
  if (search && search.length > 0) {
    where.OR = [
      { designation: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const postes = await prisma.posteCatalogue.findMany({
      where,
      orderBy: [{ categorie: "asc" }, { ordre: "asc" }, { designation: "asc" }],
    });
    return NextResponse.json(postes.map(serializePoste));
  } catch (err) {
    // Cas typique : table postes_catalogue absente (migration pas encore passée).
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const isMissingTable =
      message.includes("P2021") ||
      message.includes("does not exist in the current database");
    if (isMissingTable) {
      return NextResponse.json(
        {
          error: "MigrationPending",
          message:
            "La table postes_catalogue n'existe pas encore. Exécute la migration SQL dans Supabase (voir prisma/migrations/_manual/2026_04_26_add_postes_catalogue.sql).",
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

/** POST /api/postes-catalogue — Création d'un poste catalogue. */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const result = createPosteCatalogueSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }
  const data = result.data;

  const created = await prisma.posteCatalogue.create({
    data: {
      designation: data.designation,
      categorie: data.categorie ?? null,
      unite: data.unite,
      prixUnitHT: data.prixUnitHT,
      tauxTVA: data.tauxTVA,
      description: data.description ?? null,
      ordre: data.ordre,
    },
  });

  return NextResponse.json(serializePoste(created), { status: 201 });
}
