import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";
import { generateFactureNumero } from "@/lib/numerotation";
import { createFactureSchema } from "@/lib/validations/facture";

interface FactureRow {
  id: string;
  numero: string;
  objet: string | null;
  statut: string;
  montantHT: unknown;
  tauxTVA: unknown;
  dateEmis: Date;
  dateEcheance: Date | null;
  datePaiement: Date | null;
  modePaiement: string | null;
  reference: string | null;
  clientId: string;
  client: { id: string; nom: string; prenom: string | null; type: string };
  projetId: string | null;
  projet: { id: string; titre: string; statut: string } | null;
  devisOrigineId: string | null;
  devisOrigine: { id: string; numero: string } | null;
  lignes: { id: string }[];
  createdAt: Date;
  updatedAt: Date;
}

/** Sérialise une facture pour réponse JSON. */
function serializeFacture(f: FactureRow) {
  const montantHT = Number(f.montantHT);
  const tauxTVA = Number(f.tauxTVA);

  return {
    id: f.id,
    numero: f.numero,
    objet: f.objet,
    statut: f.statut,
    montantHT,
    tauxTVA,
    montantTTC: montantHT * (1 + tauxTVA / 100),
    dateEmis: f.dateEmis.toISOString(),
    dateEcheance: f.dateEcheance ? f.dateEcheance.toISOString() : null,
    datePaiement: f.datePaiement ? f.datePaiement.toISOString() : null,
    modePaiement: f.modePaiement,
    reference: f.reference,
    clientId: f.clientId,
    client: f.client,
    projetId: f.projetId,
    projet: f.projet,
    devisOrigineId: f.devisOrigineId,
    devisOrigine: f.devisOrigine,
    lignesCount: f.lignes.length,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

const includeRelations = {
  client: { select: { id: true, nom: true, prenom: true, type: true } },
  projet: { select: { id: true, titre: true, statut: true } },
  devisOrigine: { select: { id: true, numero: true } },
  lignes: { select: { id: true } },
};

/** GET /api/factures — Liste les factures actives avec filtres optionnels. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut");
  const clientId = searchParams.get("clientId");

  const where: Record<string, unknown> = { deletedAt: null };
  if (statut && statut !== "TOUS") where.statut = statut;
  if (clientId) where.clientId = clientId;

  const factures = await prisma.facture.findMany({
    where,
    include: includeRelations,
    orderBy: { dateEmis: "desc" },
  });

  return NextResponse.json(factures.map(serializeFacture));
}

/** POST /api/factures — Création manuelle d'une facture. */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const result = createFactureSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }
  const data = result.data;

  const clientExists = await prisma.client.findFirst({
    where: { id: data.clientId, deletedAt: null },
    select: { id: true },
  });
  if (!clientExists) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 400 });
  }

  if (data.projetId) {
    const projetExists = await prisma.projet.findFirst({
      where: { id: data.projetId, deletedAt: null },
      select: { id: true },
    });
    if (!projetExists) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 400 });
    }
  }

  const numero = await generateFactureNumero();

  const facture = await prisma.$transaction(async (tx) => {
    const created = await tx.facture.create({
      data: {
        numero,
        objet: data.objet || null,
        statut: data.statut,
        montantHT: data.montantHT,
        tauxTVA: data.tauxTVA,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        datePaiement: data.datePaiement ? new Date(data.datePaiement) : null,
        modePaiement: data.modePaiement ?? null,
        reference: data.reference ?? null,
        clientId: data.clientId,
        projetId: data.projetId || null,
      },
    });

    if (data.lignes && data.lignes.length > 0) {
      await tx.ligneFacture.createMany({
        data: data.lignes.map((l, index) => ({
          factureId: created.id,
          designation: l.designation,
          unite: l.unite,
          quantite: l.quantite,
          prixUnitHT: l.prixUnitHT,
          tauxTVA: l.tauxTVA,
          ordre: l.ordre ?? index,
        })),
      });
    }

    return tx.facture.findUniqueOrThrow({
      where: { id: created.id },
      include: includeRelations,
    });
  });

  return NextResponse.json(serializeFacture(facture), { status: 201 });
}
