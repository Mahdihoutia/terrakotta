import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

/** Serialize a Projet row for JSON responses */
function serializeProjet(p: {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  typeClient: string;
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
  devis: { select: { id: true } },
  aides: { select: { id: true } },
};

/** GET /api/projets — Liste tous les projets avec filtrage optionnel par statut */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut");

  const projets = await prisma.projet.findMany({
    where: statut && statut !== "TOUS" ? { statut: statut as never } : undefined,
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
  typeTravaux: z.string().optional(),
  adresseChantier: z.string().optional(),
  budgetPrevu: z.number().nullable().optional(),
  dateDebut: z.string().datetime({ offset: true }).nullable().optional(),
  dateFin: z.string().datetime({ offset: true }).nullable().optional(),
  clientId: z.string().min(1, "Le client est requis"),
});

/** POST /api/projets — Créer un nouveau projet */
export async function POST(request: Request) {
  const body: unknown = await request.json();
  const result = createProjetSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

  // Verify client exists
  const clientExists = await prisma.client.findUnique({
    where: { id: data.clientId },
    select: { id: true },
  });

  if (!clientExists) {
    return NextResponse.json(
      { error: "Client introuvable" },
      { status: 400 }
    );
  }

  const projet = await prisma.projet.create({
    data: {
      titre: data.titre,
      description: data.description || null,
      statut: data.statut,
      typeClient: data.typeClient,
      typeTravaux: data.typeTravaux || null,
      adresseChantier: data.adresseChantier || null,
      budgetPrevu: data.budgetPrevu ?? null,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
      dateFin: data.dateFin ? new Date(data.dateFin) : null,
      clientId: data.clientId,
    },
    include: includeRelations,
  });

  return NextResponse.json(serializeProjet(projet), { status: 201 });
}
