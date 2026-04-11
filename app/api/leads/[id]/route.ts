import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/leads/[id] — Détail d'un lead */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    ...lead,
    budgetEstime: lead.budgetEstime ? Number(lead.budgetEstime) : null,
    score: lead.score ?? 0,
    dateCreation: lead.dateCreation.toISOString().split("T")[0],
    dateMiseAJour: lead.dateMiseAJour.toISOString().split("T")[0],
  });
}

const updateLeadSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().nullable().optional(),
  email: z.string().email().optional(),
  telephone: z.string().nullable().optional(),
  raisonSociale: z.string().nullable().optional(),
  siret: z.string().nullable().optional(),
  fonction: z.string().nullable().optional(),
  type: z.enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"]).optional(),
  source: z.enum(["SITE_WEB", "RECOMMANDATION", "RESEAU", "DEMARCHAGE", "PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING", "AUTRE"]).optional(),
  statut: z.enum(["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"]).optional(),
  budgetEstime: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  score: z.number().min(0).max(5).nullable().optional(),
  roleCible: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  codePostal: z.string().nullable().optional(),
  departement: z.string().nullable().optional(),
  surfaceBatiment: z.number().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
});

/** PATCH /api/leads/[id] — Mettre à jour un lead */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body: unknown = await request.json();
  const result = updateLeadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({
      ...lead,
      budgetEstime: lead.budgetEstime ? Number(lead.budgetEstime) : null,
      score: lead.score ?? 0,
      dateCreation: lead.dateCreation.toISOString().split("T")[0],
      dateMiseAJour: lead.dateMiseAJour.toISOString().split("T")[0],
    });
  } catch {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
}

/** DELETE /api/leads/[id] — Supprimer un lead */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
}
