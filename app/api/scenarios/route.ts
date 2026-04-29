import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import { createScenarioSchema } from "@/lib/validations/scenario";
import { isMigrationPendingError, serializeScenario } from "@/lib/api-helpers/batiment";

export async function GET() {
  try {
    const list = await prisma.scenarioOccupation.findMany({
      where: { deletedAt: null },
      orderBy: [{ preset: "desc" }, { nom: "asc" }],
    });
    return NextResponse.json(list.map(serializeScenario));
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
    const message = err instanceof Error ? err.message : "Erreur";
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

  const parsed = createScenarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const created = await prisma.scenarioOccupation.create({
    data: {
      nom: d.nom,
      description: d.description,
      patternJson: JSON.stringify(d.pattern),
      preset: false,
    },
  });
  return NextResponse.json(serializeScenario(created), { status: 201 });
}
