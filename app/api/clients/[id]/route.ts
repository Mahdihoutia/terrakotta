import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function serializeClient(c: {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  raisonSociale: string | null;
  siret: string | null;
  fonction: string | null;
  type: string;
  source: string;
  statut: string;
  budgetEstime: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  projets: { id: string }[];
  devis: { id: string }[];
}) {
  return {
    id: c.id,
    nom: c.nom,
    prenom: c.prenom,
    email: c.email,
    telephone: c.telephone,
    adresse: c.adresse,
    raisonSociale: c.raisonSociale,
    siret: c.siret,
    fonction: c.fonction,
    type: c.type,
    source: c.source,
    statut: c.statut,
    budgetEstime: c.budgetEstime ? Number(c.budgetEstime) : null,
    notes: c.notes,
    projetsCount: c.projets.length,
    devisCount: c.devis.length,
    dateCreation: c.createdAt.toISOString().split("T")[0],
    dateMiseAJour: c.updatedAt.toISOString().split("T")[0],
  };
}

const includeRelations = {
  projets: { select: { id: true } },
  devis: { select: { id: true } },
};

/** GET /api/clients/[id] */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: includeRelations,
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  return NextResponse.json(serializeClient(client));
}

const updateClientSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  telephone: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  raisonSociale: z.string().nullable().optional(),
  siret: z.string().nullable().optional(),
  fonction: z.string().nullable().optional(),
  type: z.enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"]).optional(),
  source: z.enum(["SITE_WEB", "RECOMMANDATION", "RESEAU", "DEMARCHAGE", "AUTRE"]).optional(),
  statut: z.enum(["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"]).optional(),
  budgetEstime: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/** PATCH /api/clients/[id] */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body: unknown = await request.json();
  const result = updateClientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: result.data,
      include: includeRelations,
    });
    return NextResponse.json(serializeClient(client));
  } catch {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }
}

/** DELETE /api/clients/[id] */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }
}
