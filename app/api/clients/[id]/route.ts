import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  DESTRUCTIVE_ROLES,
  MUTATION_ROLES,
  ensureRole,
} from "@/lib/auth-helpers";

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
  ville: string | null;
  codePostal: string | null;
  departement: string | null;
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
    ville: c.ville,
    codePostal: c.codePostal,
    departement: c.departement,
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
  projets: { where: { deletedAt: null }, select: { id: true } },
  devis: { where: { deletedAt: null }, select: { id: true } },
};

/** GET /api/clients/[id] */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const client = await prisma.client.findFirst({
    where: { id, deletedAt: null },
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
  ville: z.string().nullable().optional(),
  codePostal: z.string().nullable().optional(),
  departement: z.string().nullable().optional(),
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
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const result = updateClientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }

  // S'assurer que le contact n'est pas dans la corbeille
  const existing = await prisma.client.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
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

/** DELETE /api/clients/[id] — soft delete */
export async function DELETE(_request: Request, context: RouteContext) {
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  const { id } = await context.params;
  try {
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }
}
