import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";

/** GET /api/leads — Liste tous les leads */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");

    const leads = await prisma.lead.findMany({
      where: {
        deletedAt: null,
        ...(statut && statut !== "TOUS" ? { statut: statut as never } : {}),
      },
      orderBy: { dateCreation: "desc" },
    });

    // Sérialise les Decimals pour le JSON
    const serialized = leads.map((lead) => ({
      ...lead,
      budgetEstime: lead.budgetEstime ? Number(lead.budgetEstime) : null,
      score: lead.score ?? 0,
      dateCreation: lead.dateCreation.toISOString().split("T")[0],
      dateMiseAJour: lead.dateMiseAJour.toISOString().split("T")[0],
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("[API /api/leads GET]", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

const createLeadSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().optional(),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  raisonSociale: z.string().optional(),
  siret: z.string().optional(),
  fonction: z.string().optional(),
  type: z.enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"]).default("PARTICULIER"),
  source: z.enum(["SITE_WEB", "RECOMMANDATION", "RESEAU", "DEMARCHAGE", "PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING", "SIRENE", "BODACC", "DPE_ADEME", "BOAMP", "PERMIS_CONSTRUIRE", "AUTRE"]).default("SITE_WEB"),
  statut: z.enum(["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"]).default("NOUVEAU"),
  budgetEstime: z.number().optional(),
  notes: z.string().optional(),
  score: z.number().min(0).max(5).optional(),
  roleCible: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  codePostal: z.string().optional(),
  departement: z.string().optional(),
  surfaceBatiment: z.number().optional(),
  sourceUrl: z.string().optional(),
});

/** POST /api/leads — Créer un nouveau lead */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const result = createLeadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }

  const data = result.data;
  const lead = await prisma.lead.create({
    data: {
      nom: data.nom,
      prenom: data.prenom ?? null,
      email: data.email,
      telephone: data.telephone ?? null,
      raisonSociale: data.raisonSociale ?? null,
      siret: data.siret ?? null,
      fonction: data.fonction ?? null,
      type: data.type,
      source: data.source,
      statut: data.statut,
      budgetEstime: data.budgetEstime ?? null,
      notes: data.notes ?? null,
      score: data.score ?? 0,
      roleCible: data.roleCible ?? null,
      adresse: data.adresse ?? null,
      ville: data.ville ?? null,
      codePostal: data.codePostal ?? null,
      departement: data.departement ?? null,
      surfaceBatiment: data.surfaceBatiment ?? null,
      sourceUrl: data.sourceUrl ?? null,
    },
  });

  return NextResponse.json(
    {
      ...lead,
      budgetEstime: lead.budgetEstime ? Number(lead.budgetEstime) : null,
      score: lead.score ?? 0,
      dateCreation: lead.dateCreation.toISOString().split("T")[0],
      dateMiseAJour: lead.dateMiseAJour.toISOString().split("T")[0],
    },
    { status: 201 }
  );
}
