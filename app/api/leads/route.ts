import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

/** GET /api/leads — Liste tous les leads */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");

    const leads = await prisma.lead.findMany({
      where: statut && statut !== "TOUS" ? { statut: statut as never } : undefined,
      orderBy: { dateCreation: "desc" },
    });

    // Sérialise les Decimals pour le JSON
    const serialized = leads.map((lead) => ({
      ...lead,
      budgetEstime: lead.budgetEstime ? Number(lead.budgetEstime) : null,
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
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  entreprise: z.string().optional(),
  type: z.enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"]).default("PARTICULIER"),
  source: z.enum(["SITE_WEB", "RECOMMANDATION", "RESEAU", "DEMARCHAGE", "AUTRE"]).default("SITE_WEB"),
  statut: z.enum(["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"]).default("NOUVEAU"),
  budgetEstime: z.number().optional(),
  notes: z.string().optional(),
});

/** POST /api/leads — Créer un nouveau lead */
export async function POST(request: Request) {
  const body: unknown = await request.json();
  const result = createLeadSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;
  const lead = await prisma.lead.create({
    data: {
      nom: data.nom,
      email: data.email,
      telephone: data.telephone ?? null,
      entreprise: data.entreprise ?? null,
      type: data.type,
      source: data.source,
      statut: data.statut,
      budgetEstime: data.budgetEstime ?? null,
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json(
    {
      ...lead,
      budgetEstime: lead.budgetEstime ? Number(lead.budgetEstime) : null,
      dateCreation: lead.dateCreation.toISOString().split("T")[0],
      dateMiseAJour: lead.dateMiseAJour.toISOString().split("T")[0],
    },
    { status: 201 }
  );
}
