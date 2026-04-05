import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Serialize a detailed Projet row (with full relations) for JSON responses */
function serializeProjetDetail(p: {
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
  client: {
    id: string;
    nom: string;
    prenom: string | null;
    email: string | null;
    telephone: string | null;
    type: string;
  };
  jalons: {
    id: string;
    titre: string;
    echeance: Date;
    fait: boolean;
  }[];
  devis: {
    id: string;
    numero: string;
    objet: string | null;
    statut: string;
    montantHT: unknown;
    tauxTVA: unknown;
    dateEmis: Date;
    dateValide: Date | null;
    lignes: {
      id: string;
      designation: string;
      unite: string;
      quantite: unknown;
      prixUnitHT: unknown;
      tauxTVA: unknown;
      ordre: number;
    }[];
  }[];
  aides: {
    id: string;
    type: string;
    nom: string;
    montant: unknown;
    numeroDossier: string | null;
    statut: string;
    dateDepot: Date | null;
    dateAccord: Date | null;
    notes: string | null;
  }[];
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
    jalons: p.jalons.map((j) => ({
      id: j.id,
      titre: j.titre,
      echeance: j.echeance.toISOString(),
      fait: j.fait,
    })),
    devis: p.devis.map((d) => ({
      id: d.id,
      numero: d.numero,
      objet: d.objet,
      statut: d.statut,
      montantHT: Number(d.montantHT),
      tauxTVA: Number(d.tauxTVA),
      dateEmis: d.dateEmis.toISOString(),
      dateValide: d.dateValide ? d.dateValide.toISOString() : null,
      lignes: d.lignes.map((l) => ({
        id: l.id,
        designation: l.designation,
        unite: l.unite,
        quantite: Number(l.quantite),
        prixUnitHT: Number(l.prixUnitHT),
        tauxTVA: Number(l.tauxTVA),
        ordre: l.ordre,
      })),
    })),
    aides: p.aides.map((a) => ({
      id: a.id,
      type: a.type,
      nom: a.nom,
      montant: a.montant ? Number(a.montant) : null,
      numeroDossier: a.numeroDossier,
      statut: a.statut,
      dateDepot: a.dateDepot ? a.dateDepot.toISOString() : null,
      dateAccord: a.dateAccord ? a.dateAccord.toISOString() : null,
      notes: a.notes,
    })),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
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
  jalons: {
    select: { id: true, titre: true, echeance: true, fait: true },
    orderBy: { echeance: "asc" as const },
  },
  devis: {
    select: {
      id: true,
      numero: true,
      objet: true,
      statut: true,
      montantHT: true,
      tauxTVA: true,
      dateEmis: true,
      dateValide: true,
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
    },
    orderBy: { dateEmis: "desc" as const },
  },
  aides: {
    select: {
      id: true,
      type: true,
      nom: true,
      montant: true,
      numeroDossier: true,
      statut: true,
      dateDepot: true,
      dateAccord: true,
      notes: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
};

/** GET /api/projets/[id] — Détail d'un projet avec relations complètes */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const projet = await prisma.projet.findUnique({
    where: { id },
    include: includeDetailRelations,
  });

  if (!projet) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  return NextResponse.json(serializeProjetDetail(projet));
}

const updateProjetSchema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  statut: z
    .enum(["EN_ATTENTE", "EN_COURS", "EN_PAUSE", "TERMINE", "ANNULE"])
    .optional(),
  typeClient: z
    .enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"])
    .optional(),
  typeTravaux: z.string().nullable().optional(),
  adresseChantier: z.string().nullable().optional(),
  budgetPrevu: z.number().nullable().optional(),
  budgetDepense: z.number().nullable().optional(),
  dateDebut: z.string().datetime({ offset: true }).nullable().optional(),
  dateFin: z.string().datetime({ offset: true }).nullable().optional(),
  clientId: z.string().min(1).optional(),
});

/** PATCH /api/projets/[id] — Mettre à jour un projet */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body: unknown = await request.json();
  const result = updateProjetSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

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

  // Convert date strings to Date objects for Prisma
  const prismaData: Record<string, unknown> = { ...data };
  if (data.dateDebut !== undefined) {
    prismaData.dateDebut = data.dateDebut ? new Date(data.dateDebut) : null;
  }
  if (data.dateFin !== undefined) {
    prismaData.dateFin = data.dateFin ? new Date(data.dateFin) : null;
  }

  try {
    const projet = await prisma.projet.update({
      where: { id },
      data: prismaData,
      include: includeDetailRelations,
    });
    return NextResponse.json(serializeProjetDetail(projet));
  } catch {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
}

/** DELETE /api/projets/[id] — Supprimer un projet */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.projet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
}
