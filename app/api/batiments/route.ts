import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import { createBatimentSchema } from "@/lib/validations/batiment";
import { isMigrationPendingError, serializeBatiment } from "@/lib/api-helpers/batiment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projetId = searchParams.get("projetId");

  const where: Record<string, unknown> = { deletedAt: null };
  if (projetId) where.projetId = projetId;

  try {
    const list = await prisma.batiment.findMany({
      where,
      orderBy: { nom: "asc" },
      include: { zones: { where: { deletedAt: null }, select: { id: true } } },
    });
    return NextResponse.json(list.map(serializeBatiment));
  } catch (err) {
    if (isMigrationPendingError(err)) {
      return NextResponse.json(
        {
          error: "MigrationPending",
          message:
            "Les tables de zoning n'existent pas encore. Exécute la migration prisma/migrations/_manual/2026_04_28_add_zoning_thermique.sql.",
        },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createBatimentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;
  try {
    const created = await prisma.batiment.create({
      data: {
        nom: d.nom,
        description: d.description,
        zoneClimatique: d.zoneClimatique,
        altitude: d.altitude ?? null,
        orientation: d.orientation,
        projetId: d.projetId,
        auditDocumentId: d.auditDocumentId,
      },
    });
    return NextResponse.json(serializeBatiment({ ...created, zones: [] }), { status: 201 });
  } catch (err) {
    if (isMigrationPendingError(err)) {
      return NextResponse.json(
        { error: "MigrationPending", message: "Migration zoning manquante." },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}
