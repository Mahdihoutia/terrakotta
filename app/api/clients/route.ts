import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

/** GET /api/clients — Liste tous les clients */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const clients = await prisma.client.findMany({
    where: type && type !== "TOUS" ? { type: type as never } : undefined,
    include: {
      projets: { select: { id: true } },
      devis: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = clients.map((c) => ({
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
  }));

  return NextResponse.json(serialized);
}

const createClientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  raisonSociale: z.string().optional(),
  siret: z.string().optional(),
  fonction: z.string().optional(),
  type: z.enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"]).default("PARTICULIER"),
  source: z.enum(["SITE_WEB", "RECOMMANDATION", "RESEAU", "DEMARCHAGE", "AUTRE"]).default("SITE_WEB"),
  statut: z.enum(["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"]).default("NOUVEAU"),
  budgetEstime: z.number().nullable().optional(),
  notes: z.string().optional(),
});

/** POST /api/clients — Créer un nouveau client */
export async function POST(request: Request) {
  const body: unknown = await request.json();
  const result = createClientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Données invalides", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;
  const client = await prisma.client.create({
    data: {
      nom: data.nom,
      prenom: data.prenom || null,
      email: data.email || null,
      telephone: data.telephone || null,
      adresse: data.adresse || null,
      raisonSociale: data.raisonSociale || null,
      siret: data.siret || null,
      fonction: data.fonction || null,
      type: data.type,
      source: data.source,
      statut: data.statut,
      budgetEstime: data.budgetEstime ?? null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(
    {
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse,
      raisonSociale: client.raisonSociale,
      siret: client.siret,
      fonction: client.fonction,
      type: client.type,
      source: client.source,
      statut: client.statut,
      budgetEstime: client.budgetEstime ? Number(client.budgetEstime) : null,
      notes: client.notes,
      projetsCount: 0,
      devisCount: 0,
      dateCreation: client.createdAt.toISOString().split("T")[0],
      dateMiseAJour: client.updatedAt.toISOString().split("T")[0],
    },
    { status: 201 }
  );
}
