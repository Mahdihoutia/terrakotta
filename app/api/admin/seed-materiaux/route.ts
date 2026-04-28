import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import { MATERIAUX_SEED } from "@/prisma/seeds/materiaux";

/**
 * POST /api/admin/seed-materiaux
 * Upsert tous les matériaux du seed initial dans la table.
 * Réservé aux ADMIN. Idempotent (recherche par nom + catégorie).
 */
export async function POST() {
  const guard = await ensureRole([Role.ADMIN]);
  if (guard) return guard;

  let created = 0;
  let skipped = 0;

  for (const m of MATERIAUX_SEED) {
    const existing = await prisma.materiau.findFirst({
      where: { nom: m.nom, categorie: m.categorie, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.materiau.create({
      data: {
        nom: m.nom,
        categorie: m.categorie,
        marque: m.marque ?? null,
        reference: m.reference ?? null,
        conductivite: m.conductivite,
        masseVolumique: m.masseVolumique,
        capaciteThermique: m.capaciteThermique,
        resistanceVapeur: m.resistanceVapeur ?? null,
        resistanceFixe: m.resistanceFixe ?? null,
        carboneACV: m.carboneACV ?? null,
        carboneFinDeVie: m.carboneFinDeVie ?? null,
        origineFdes: m.origineFdes ?? null,
        source: m.source ?? null,
        notes: m.notes ?? null,
      },
    });
    created += 1;
  }

  return NextResponse.json({
    ok: true,
    total: MATERIAUX_SEED.length,
    created,
    skipped,
  });
}
