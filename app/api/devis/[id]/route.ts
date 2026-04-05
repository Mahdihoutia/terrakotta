import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Serialize a detailed Devis row for JSON responses */
function serializeDevisDetail(d: {
  id: string;
  numero: string;
  objet: string | null;
  statut: string;
  montantHT: unknown;
  tauxTVA: unknown;
  dateEmis: Date;
  dateValide: Date | null;
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
    lignes: d.lignes.map((l) => ({
      id: l.id,
      designation: l.designation,
      unite: l.unite,
      quantite: Number(l.quantite),
      prixUnitHT: Number(l.prixUnitHT),
      tauxTVA: Number(l.tauxTVA),
      ordre: l.ordre,
    })),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
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

/** GET /api/devis/[id] — Détail d'un devis avec relations complètes */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const devis = await prisma.devis.findUnique({
    where: { id },
    include: includeDetailRelations,
  });

  if (!devis) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  return NextResponse.json(serializeDevisDetail(devis));
}

const ligneSchema = z.object({
  designation: z.string().min(1, "La désignation est requise"),
  unite: z.string().default("U"),
  quantite: z.number().default(1),
  prixUnitHT: z.number().min(0, "Le prix unitaire doit être positif"),
  tauxTVA: z.number().default(20),
  ordre: z.number().int().default(0),
});

const updateDevisSchema = z.object({
  objet: z.string().nullable().optional(),
  montantHT: z.number().min(0).optional(),
  tauxTVA: z.number().optional(),
  statut: z.enum(["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"]).optional(),
  clientId: z.string().min(1).optional(),
  projetId: z.string().nullable().optional(),
  dateValide: z.string().datetime({ offset: true }).nullable().optional(),
  lignes: z.array(ligneSchema).optional(),
});

/** PATCH /api/devis/[id] — Mettre à jour un devis */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body: unknown = await request.json();
  const result = updateDevisSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { lignes, ...data } = result.data;

  // If clientId is being changed, verify the new client exists
  if (data.clientId) {
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
  }

  // If projetId is being changed, verify the new projet exists
  if (data.projetId) {
    const projetExists = await prisma.projet.findUnique({
      where: { id: data.projetId },
      select: { id: true },
    });
    if (!projetExists) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 400 }
      );
    }
  }

  // Build Prisma update data
  const prismaData: Record<string, unknown> = { ...data };
  if (data.dateValide !== undefined) {
    prismaData.dateValide = data.dateValide ? new Date(data.dateValide) : null;
  }

  try {
    const devis = await prisma.$transaction(async (tx) => {
      // Update devis fields
      await tx.devis.update({
        where: { id },
        data: prismaData,
      });

      // Replace lignes if provided
      if (lignes !== undefined) {
        await tx.ligneDevis.deleteMany({ where: { devisId: id } });

        if (lignes.length > 0) {
          await tx.ligneDevis.createMany({
            data: lignes.map((l, index) => ({
              devisId: id,
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

      return tx.devis.findUniqueOrThrow({
        where: { id },
        include: includeDetailRelations,
      });
    });

    return NextResponse.json(serializeDevisDetail(devis));
  } catch {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
}

/** DELETE /api/devis/[id] — Supprimer un devis (lignes supprimées en cascade) */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.devis.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
}
