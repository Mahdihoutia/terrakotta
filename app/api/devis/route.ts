import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";

/** Serialize a Devis row for JSON responses */
function serializeDevis(d: {
  id: string;
  numero: string;
  objet: string | null;
  statut: string;
  montantHT: unknown;
  tauxTVA: unknown;
  dateEmis: Date;
  dateValide: Date | null;
  clientId: string;
  client: { id: string; nom: string; prenom: string | null; type: string };
  projetId: string | null;
  projet: { id: string; titre: string; statut: string } | null;
  lignes: { id: string }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  const montantHT = Number(d.montantHT);
  const tauxTVA = Number(d.tauxTVA);

  return {
    id: d.id,
    numero: d.numero,
    objet: d.objet,
    statut: d.statut,
    montantHT,
    tauxTVA,
    montantTTC: montantHT * (1 + tauxTVA / 100),
    dateEmis: d.dateEmis.toISOString(),
    dateValide: d.dateValide ? d.dateValide.toISOString() : null,
    clientId: d.clientId,
    client: d.client,
    projetId: d.projetId,
    projet: d.projet,
    lignesCount: d.lignes.length,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

const includeRelations = {
  client: { select: { id: true, nom: true, prenom: true, type: true } },
  projet: { select: { id: true, titre: true, statut: true } },
  lignes: { select: { id: true } },
};

/** Generate a devis numero like "DV-2026-001" */
async function generateNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DV-${year}-`;

  const count = await prisma.devis.count({
    where: { numero: { startsWith: prefix } },
  });

  const nextNum = String(count + 1).padStart(3, "0");
  return `${prefix}${nextNum}`;
}

/** GET /api/devis — Liste tous les devis avec filtrage optionnel */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut");
  const clientId = searchParams.get("clientId");

  const where: Record<string, unknown> = { deletedAt: null };
  if (statut && statut !== "TOUS") {
    where.statut = statut;
  }
  if (clientId) {
    where.clientId = clientId;
  }

  const devis = await prisma.devis.findMany({
    where,
    include: includeRelations,
    orderBy: { dateEmis: "desc" },
  });

  const serialized = devis.map(serializeDevis);

  return NextResponse.json(serialized);
}

const ligneSchema = z.object({
  designation: z.string().min(1, "La désignation est requise"),
  unite: z.string().default("U"),
  quantite: z.number().default(1),
  prixUnitHT: z.number().min(0, "Le prix unitaire doit être positif"),
  tauxTVA: z.number().default(20),
  ordre: z.number().int().default(0),
});

const createDevisSchema = z.object({
  objet: z.string().optional(),
  montantHT: z.number().min(0, "Le montant HT doit être positif"),
  tauxTVA: z.number().default(20),
  statut: z
    .enum(["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"])
    .default("BROUILLON"),
  clientId: z.string().min(1, "Le client est requis"),
  projetId: z.string().optional(),
  dateValide: z.string().datetime({ offset: true }).nullable().optional(),
  lignes: z.array(ligneSchema).optional(),
});

/** POST /api/devis — Créer un nouveau devis */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const result = createDevisSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }

  const data = result.data;

  // Verify client exists
  const clientExists = await prisma.client.findFirst({
    where: { id: data.clientId, deletedAt: null },
    select: { id: true },
  });

  if (!clientExists) {
    return NextResponse.json(
      { error: "Client introuvable" },
      { status: 400 }
    );
  }

  // Verify projet exists if provided
  if (data.projetId) {
    const projetExists = await prisma.projet.findFirst({
      where: { id: data.projetId, deletedAt: null },
      select: { id: true },
    });
    if (!projetExists) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 400 }
      );
    }
  }

  const numero = await generateNumero();

  const devis = await prisma.$transaction(async (tx) => {
    const created = await tx.devis.create({
      data: {
        numero,
        objet: data.objet || null,
        statut: data.statut,
        montantHT: data.montantHT,
        tauxTVA: data.tauxTVA,
        dateValide: data.dateValide ? new Date(data.dateValide) : null,
        clientId: data.clientId,
        projetId: data.projetId || null,
      },
    });

    if (data.lignes && data.lignes.length > 0) {
      await tx.ligneDevis.createMany({
        data: data.lignes.map((l, index) => ({
          devisId: created.id,
          designation: l.designation,
          unite: l.unite,
          quantite: l.quantite,
          prixUnitHT: l.prixUnitHT,
          tauxTVA: l.tauxTVA,
          ordre: l.ordre ?? index,
        })),
      });
    }

    return tx.devis.findUniqueOrThrow({
      where: { id: created.id },
      include: includeRelations,
    });
  });

  return NextResponse.json(serializeDevis(devis), { status: 201 });
}
