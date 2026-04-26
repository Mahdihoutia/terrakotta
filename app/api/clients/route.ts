import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";

/** GET /api/clients — Liste tous les clients */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const clients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      ...(type && type !== "TOUS" ? { type: type as never } : {}),
    },
    include: {
      projets: { where: { deletedAt: null }, select: { id: true } },
      devis: { where: { deletedAt: null }, select: { id: true } },
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
  }));

  return NextResponse.json(serialized);
}

// Helpers : accepte string | null | undefined | "" et renvoie string | null
const nullableString = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() !== "" ? v : null));

const nullableEmail = z
  .union([z.string().email("Email invalide"), z.literal(""), z.null()])
  .nullish()
  .transform((v) => (v && v !== "" ? v : null));

const createClientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: nullableString,
  email: nullableEmail,
  telephone: nullableString,
  adresse: nullableString,
  ville: nullableString,
  codePostal: nullableString,
  departement: nullableString,
  raisonSociale: nullableString,
  siret: nullableString,
  fonction: nullableString,
  type: z.enum(["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"]).default("PARTICULIER"),
  source: z.enum(["SITE_WEB", "RECOMMANDATION", "RESEAU", "DEMARCHAGE", "AUTRE"]).default("SITE_WEB"),
  statut: z.enum(["NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"]).default("NOUVEAU"),
  budgetEstime: z.number().nullish(),
  notes: nullableString,
});

/** POST /api/clients — Créer un nouveau client */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON invalide" },
      { status: 400 }
    );
  }

  const result = createClientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: result.error.issues },
      { status: 422 }
    );
  }

  const data = result.data;

  let client;
  try {
    client = await prisma.client.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        adresse: data.adresse,
        ville: data.ville,
        codePostal: data.codePostal,
        departement: data.departement,
        raisonSociale: data.raisonSociale,
        siret: data.siret,
        fonction: data.fonction,
        type: data.type,
        source: data.source,
        statut: data.statut,
        budgetEstime: data.budgetEstime ?? null,
        notes: data.notes,
      },
    });
  } catch (err) {
    console.error("[POST /api/clients] prisma error", err);
    return NextResponse.json(
      { error: "Impossible de créer le contact" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse,
      ville: client.ville,
      codePostal: client.codePostal,
      departement: client.departement,
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
