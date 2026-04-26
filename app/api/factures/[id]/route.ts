import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  DESTRUCTIVE_ROLES,
  MUTATION_ROLES,
  ensureRole,
} from "@/lib/auth-helpers";
import { updateFactureSchema } from "@/lib/validations/facture";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface FactureDetailRow {
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
  client: {
    id: string;
    nom: string;
    prenom: string | null;
    email: string | null;
    telephone: string | null;
    type: string;
  };
  projetId: string | null;
  projet: { id: string; titre: string; statut: string } | null;
  devisOrigineId: string | null;
  devisOrigine: { id: string; numero: string } | null;
  lignes: {
    id: string;
    designation: string;
    unite: string;
    quantite: unknown;
    prixUnitHT: unknown;
    tauxTVA: unknown;
    ordre: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

function serializeFactureDetail(f: FactureDetailRow) {
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
    lignes: f.lignes.map((l) => ({
      id: l.id,
      designation: l.designation,
      unite: l.unite,
      quantite: Number(l.quantite),
      prixUnitHT: Number(l.prixUnitHT),
      tauxTVA: Number(l.tauxTVA),
      ordre: l.ordre,
    })),
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

const includeDetailRelations = {
  client: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      type: true,
    },
  },
  projet: { select: { id: true, titre: true, statut: true } },
  devisOrigine: { select: { id: true, numero: true } },
  lignes: {
    select: {
      id: true,
      designation: true,
      unite: true,
      quantite: true,
      prixUnitHT: true,
      tauxTVA: true,
      ordre: true,
    },
    orderBy: { ordre: "asc" as const },
  },
};

/** GET /api/factures/[id] — Détail d'une facture. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const facture = await prisma.facture.findFirst({
    where: { id, deletedAt: null },
    include: includeDetailRelations,
  });

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  return NextResponse.json(serializeFactureDetail(facture));
}

/** PATCH /api/factures/[id] — Mise à jour d'une facture. */
export async function PATCH(request: Request, context: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const result = updateFactureSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }

  const existing = await prisma.facture.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const { lignes, ...data } = result.data;

  if (data.clientId) {
    const ok = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 400 });
    }
  }
  if (data.projetId) {
    const ok = await prisma.projet.findUnique({
      where: { id: data.projetId },
      select: { id: true },
    });
    if (!ok) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 400 });
    }
  }

  const prismaData: Record<string, unknown> = { ...data };
  if (data.dateEcheance !== undefined) {
    prismaData.dateEcheance = data.dateEcheance ? new Date(data.dateEcheance) : null;
  }
  if (data.datePaiement !== undefined) {
    prismaData.datePaiement = data.datePaiement ? new Date(data.datePaiement) : null;
  }

  try {
    const facture = await prisma.$transaction(async (tx) => {
      await tx.facture.update({ where: { id }, data: prismaData });

      if (lignes !== undefined) {
        await tx.ligneFacture.deleteMany({ where: { factureId: id } });
        if (lignes.length > 0) {
          await tx.ligneFacture.createMany({
            data: lignes.map((l, index) => ({
              factureId: id,
              designation: l.designation,
              unite: l.unite,
              quantite: l.quantite,
              prixUnitHT: l.prixUnitHT,
              tauxTVA: l.tauxTVA,
              ordre: l.ordre ?? index,
            })),
          });
        }
      }

      return tx.facture.findUniqueOrThrow({
        where: { id },
        include: includeDetailRelations,
      });
    });

    return NextResponse.json(serializeFactureDetail(facture));
  } catch {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
}

/** DELETE /api/factures/[id] — Soft delete (corbeille). */
export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  const { id } = await context.params;
  try {
    await prisma.facture.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
}
