import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { SCENARIOS_SEED } from "@/prisma/seeds/scenarios";

/**
 * POST /api/admin/seed-scenarios
 * Upsert tous les scénarios d'occupation presets. Idempotent par nom.
 * Réservé aux ADMIN.
 */
export async function POST() {
  const guard = await ensureRole([Role.ADMIN]);
  if (guard) return guard;

  let created = 0;
  let skipped = 0;

  for (const s of SCENARIOS_SEED) {
    const existing = await prisma.scenarioOccupation.findFirst({
      where: { nom: s.nom, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.scenarioOccupation.create({
      data: {
        nom: s.nom,
        description: s.description,
        patternJson: JSON.stringify(s.pattern),
        preset: true,
      },
    });
    created += 1;
  }

  return NextResponse.json({
    ok: true,
    total: SCENARIOS_SEED.length,
    created,
    skipped,
  });
}
