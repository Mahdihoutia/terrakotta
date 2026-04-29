import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import { createZoneSchema } from "@/lib/validations/zone";
import { isMigrationPendingError, serializeZone } from "@/lib/api-helpers/batiment";

export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createZoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Vérifier que le bâtiment existe.
  const bat = await prisma.batiment.findFirst({
    where: { id: d.batimentId, deletedAt: null },
    select: { id: true },
  });
  if (!bat) {
    return NextResponse.json({ error: "Bâtiment introuvable" }, { status: 404 });
  }

  try {
    const created = await prisma.zone.create({
      data: {
        batimentId: d.batimentId,
        nom: d.nom,
        usage: d.usage,
        surface: d.surface,
        hauteurSousPlafond: d.hauteurSousPlafond,
        ...(d.consigneChauffageOcc !== undefined && { consigneChauffageOcc: d.consigneChauffageOcc }),
        ...(d.consigneChauffageRed !== undefined && { consigneChauffageRed: d.consigneChauffageRed }),
        ...(d.consigneClimOcc !== undefined && { consigneClimOcc: d.consigneClimOcc }),
        ...(d.consigneClimRed !== undefined && { consigneClimRed: d.consigneClimRed }),
        ...(d.densiteOccupation !== undefined && { densiteOccupation: d.densiteOccupation }),
        ...(d.apportsParPersonne !== undefined && { apportsParPersonne: d.apportsParPersonne }),
        ...(d.apportsEquipements !== undefined && { apportsEquipements: d.apportsEquipements }),
        ...(d.apportsEclairage !== undefined && { apportsEclairage: d.apportsEclairage }),
        ...(d.qVmcM3hM2 !== undefined && { qVmcM3hM2: d.qVmcM3hM2 }),
        ...(d.efficaciteDoubleFlux !== undefined && { efficaciteDoubleFlux: d.efficaciteDoubleFlux }),
        ...(d.scenarioId && { scenarioId: d.scenarioId }),
      },
    });
    return NextResponse.json(serializeZone({ ...created, parois: [] }), { status: 201 });
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
