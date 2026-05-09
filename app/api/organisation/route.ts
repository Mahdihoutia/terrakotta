import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

const READ_ROLES: Role[] = [Role.ADMIN, Role.COLLABORATEUR, Role.LECTURE_SEULE];
import { updateOrganisationSchema } from "@/lib/validations/organisation";

/** Sérialise une ligne organisation pour la réponse JSON. */
function serialize(o: {
  id: string;
  raisonSociale: string;
  formeJuridique: string | null;
  siret: string | null;
  codeApe: string | null;
  capital: Prisma.Decimal | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  pays: string | null;
  email: string | null;
  telephone: string | null;
  siteWeb: string | null;
  regimeTVA: string | null;
  mentionTVA: string | null;
  iban: string | null;
  bic: string | null;
  banqueNom: string | null;
  rgeNumero: string | null;
  rgeValiditeJusqu: Date | null;
  decennaleCompagnie: string | null;
  decennalePolice: string | null;
  rcpCompagnie: string | null;
  rcpPolice: string | null;
  certifications: Prisma.JsonValue;
  logoUrl: string | null;
  couleurAccent: string | null;
  conditionsPaiement: string | null;
  cgvUrl: string | null;
  prefixDevis: string | null;
  prefixFacture: string | null;
  formatAnnee: string | null;
  paddingNumero: number | null;
  tvaDefaut: Prisma.Decimal | null;
  delaiPaiementJours: number | null;
  penaliteRetardTaux: Prisma.Decimal | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...o,
    capital: o.capital ? Number(o.capital) : null,
    tvaDefaut: o.tvaDefaut ? Number(o.tvaDefaut) : null,
    penaliteRetardTaux: o.penaliteRetardTaux ? Number(o.penaliteRetardTaux) : null,
    rgeValiditeJusqu: o.rgeValiditeJusqu?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

/** GET /api/organisation — singleton ; 404 si jamais initialisé. */
export async function GET() {
  const guard = await ensureRole(READ_ROLES);
  if (guard) return guard;
  try {
    const org = await prisma.organisation.findFirst({ orderBy: { createdAt: "asc" } });
    if (!org) return NextResponse.json(null, { status: 200 });
    return NextResponse.json(serialize(org));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json(
        { error: "Migration manquante", message: "Exécute prisma/migrations/_manual/2026_05_09_add_organisation_and_invitations.sql" },
        { status: 503 },
      );
    }
    console.error("GET /api/organisation", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** PATCH /api/organisation — upsert sur l'unique ligne. */
export async function PATCH(req: NextRequest) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateOrganisationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // Normalise les "" → null. Le champ JSON `certifications` doit utiliser
  // `Prisma.DbNull` côté update et la sentinelle JsonNull côté create pour
  // distinguer "remettre à null" de "ne pas toucher" (Prisma JSON typing).
  const { certifications, ...rest } = data;
  const restNorm = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [k, v === "" ? null : v]),
  ) as typeof rest;

  const certifUpdate =
    certifications === undefined
      ? undefined
      : certifications === null
        ? Prisma.DbNull
        : (certifications as unknown as Prisma.InputJsonValue);
  const certifCreate =
    certifications === undefined || certifications === null
      ? Prisma.JsonNull
      : (certifications as unknown as Prisma.InputJsonValue);

  try {
    const existing = await prisma.organisation.findFirst({ orderBy: { createdAt: "asc" } });
    const saved = existing
      ? await prisma.organisation.update({
          where: { id: existing.id },
          data: { ...restNorm, certifications: certifUpdate },
        })
      : await prisma.organisation.create({
          data: {
            raisonSociale: restNorm.raisonSociale ?? "Mon bureau d'étude",
            ...restNorm,
            certifications: certifCreate,
          },
        });
    return NextResponse.json(serialize(saved));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json(
        { error: "Migration manquante", message: "Exécute prisma/migrations/_manual/2026_05_09_add_organisation_and_invitations.sql" },
        { status: 503 },
      );
    }
    console.error("PATCH /api/organisation", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
