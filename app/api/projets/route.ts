import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";

/** Serialize a Projet row for JSON responses */
function serializeProjet(p: {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  typeClient: string;
  categorieCible: string;
  typeTravaux: string | null;
  adresseChantier: string | null;
  budgetPrevu: unknown;
  budgetDepense: unknown;
  dateDebut: Date | null;
  dateFin: Date | null;
  clientId: string;
  client: { id: string; nom: string; prenom: string | null; type: string };
  jalons: { id: string }[];
  devis: { id: string }[];
  aides: { id: string }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    titre: p.titre,
    description: p.description,
    statut: p.statut,
    typeClient: p.typeClient,
    categorieCible: p.categorieCible,
    typeTravaux: p.typeTravaux,
    adresseChantier: p.adresseChantier,
    budgetPrevu: p.budgetPrevu ? Number(p.budgetPrevu) : null,
    budgetDepense: p.budgetDepense ? Number(p.budgetDepense) : null,
    dateDebut: p.dateDebut ? p.dateDebut.toISOString() : null,
    dateFin: p.dateFin ? p.dateFin.toISOString() : null,
    clientId: p.clientId,
    client: p.client,
    jalonsCount: p.jalons.length,
    devisCount: p.devis.length,
    aidesCount: p.aides.length,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const includeRelations = {
  client: { select: { id: true, nom: true, prenom: true, type: true } },
  jalons: { select: { id: true } },
  devis: { where: { deletedAt: null }, select: { id: true } },
  aides: { select: { id: true } },
};

const STATUTS_VALIDES = ["EN_ATTENTE", "EN_COURS", "EN_PAUSE", "TERMINE", "ANNULE"] as const;
const CATEGORIES_VALIDES = [
  "PARTICULIER",
  "RESIDENTIEL_COLLECTIF",
  "TERTIAIRE",
  "INDUSTRIE",
  "AGRICULTURE",
] as const;

function parsePositiveNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseIsoDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** GET /api/projets — Liste filtrable : statut, clientId, q (search),
 *  categorieCible, budgetMin/Max, dateDebutFrom/To. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut");
  const clientId = searchParams.get("clientId");
  const q = searchParams.get("q")?.trim();
  const categorieCible = searchParams.get("categorieCible");
  const budgetMin = parsePositiveNumber(searchParams.get("budgetMin"));
  const budgetMax = parsePositiveNumber(searchParams.get("budgetMax"));
  const dateDebutFrom = parseIsoDate(searchParams.get("dateDebutFrom"));
  const dateDebutTo = parseIsoDate(searchParams.get("dateDebutTo"));

  const where: Record<string, unknown> = { deletedAt: null };

  if (statut && statut !== "TOUS" && (STATUTS_VALIDES as readonly string[]).includes(statut)) {
    where.statut = statut;
  }
  if (clientId) where.clientId = clientId;
  if (
    categorieCible &&
    (CATEGORIES_VALIDES as readonly string[]).includes(categorieCible)
  ) {
    where.categorieCible = categorieCible;
  }

  // SQLite ne supporte pas `mode: "insensitive"` — on s'appuie sur le collation
  // par défaut (NOCASE) pour les champs texte usuels.
  if (q && q.length > 0) {
    where.OR = [
      { titre: { contains: q } },
      { description: { contains: q } },
      { adresseChantier: { contains: q } },
      { client: { is: { nom: { contains: q } } } },
      { client: { is: { prenom: { contains: q } } } },
    ];
  }

  if (budgetMin !== null || budgetMax !== null) {
    const range: Record<string, number> = {};
    if (budgetMin !== null) range.gte = budgetMin;
    if (budgetMax !== null) range.lte = budgetMax;
    where.budgetPrevu = range;
  }

  if (dateDebutFrom || dateDebutTo) {
    const range: Record<string, Date> = {};
    if (dateDebutFrom) range.gte = dateDebutFrom;
    if (dateDebutTo) range.lte = dateDebutTo;
    where.dateDebut = range;
  }

  const projets = await prisma.projet.findMany({
    where: where as never,
    include: includeRelations,
    orderBy: { updatedAt: "desc" },
  });

  const serialized = projets.map(serializeProjet);

  return NextResponse.json(serialized);
}

const createProjetSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  statut: z
    .enum(["EN_ATTENTE", "EN_COURS", "EN_PAUSE", "TERMINE", "ANNULE"])
    .default("EN_ATTENTE"),
  typeClient: z.enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"]),
  categorieCible: z.enum([
    "PARTICULIER",
    "RESIDENTIEL_COLLECTIF",
    "TERTIAIRE",
    "INDUSTRIE",
    "AGRICULTURE",
  ]),
  typeTravaux: z.string().optional(),
  adresseChantier: z.string().optional(),
  budgetPrevu: z.number().nullable().optional(),
  dateDebut: z.string().datetime({ offset: true }).nullable().optional(),
  dateFin: z.string().datetime({ offset: true }).nullable().optional(),
  clientId: z.string().min(1, "Le client est requis"),
  documentIds: z.array(z.string()).optional(),
  aides: z
    .array(
      z.object({
        fiche: z.string(),
        nom: z.string(),
        kwhCumac: z.number().nonnegative(),
        prixUnitaire: z.number().nonnegative().default(8),
        montant: z.number().nonnegative(),
      }),
    )
    .optional(),
});

/** POST /api/projets — Créer un nouveau projet */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const result = createProjetSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }

  const data = result.data;

  try {
    // Verify client exists
    const clientExists = await prisma.client.findFirst({
      where: { id: data.clientId, deletedAt: null },
      select: { id: true },
    });

    if (!clientExists) {
      return NextResponse.json(
        { error: "Client introuvable", message: `Aucun client actif avec l'id ${data.clientId}` },
        { status: 400 }
      );
    }

    const projet = await prisma.projet.create({
      data: {
        titre: data.titre,
        description: data.description || null,
        statut: data.statut,
        typeClient: data.typeClient,
        categorieCible: data.categorieCible,
        typeTravaux: data.typeTravaux || null,
        adresseChantier: data.adresseChantier || null,
        budgetPrevu: data.budgetPrevu ?? null,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        clientId: data.clientId,
        aides:
          data.aides && data.aides.length > 0
            ? {
                create: data.aides.map((a) => ({
                  type: "CEE" as const,
                  nom: a.nom,
                  fiche: a.fiche,
                  kwhCumac: a.kwhCumac,
                  prixUnitaire: a.prixUnitaire,
                  montant: a.montant,
                })),
              }
            : undefined,
      },
      include: includeRelations,
    });

    // Link documents to the newly created project (optional)
    if (data.documentIds && data.documentIds.length > 0) {
      await prisma.document.updateMany({
        where: { id: { in: data.documentIds } },
        data: { projetId: projet.id },
      });
    }

    return NextResponse.json(serializeProjet(projet), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[/api/projets POST] error:", err);

    // Erreurs Prisma fréquentes — retour 4xx avec message clair
    if (message.includes("P2003")) {
      return NextResponse.json(
        { error: "ForeignKeyConstraint", message: "Client ou document référencé inexistant." },
        { status: 400 },
      );
    }
    if (message.includes("P2021") || message.includes("does not exist in the current database")) {
      return NextResponse.json(
        { error: "MigrationPending", message: "Schéma de base désynchronisé — exécute les migrations Prisma." },
        { status: 503 },
      );
    }
    if (message.includes("P2002")) {
      return NextResponse.json(
        { error: "UniqueConstraint", message: "Un projet avec ces valeurs uniques existe déjà." },
        { status: 409 },
      );
    }
    if (message.includes("Can't reach database") || message.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "DatabaseUnreachable", message: "Base de données injoignable — vérifier DATABASE_URL." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "ServerError", message },
      { status: 500 },
    );
  }
}
