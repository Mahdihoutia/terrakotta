/**
 * Helpers de sérialisation et recalcul cache pour les parois.
 * Extraits hors des fichiers route.ts car Next.js 15 App Router
 * n'autorise QUE les exports HTTP (GET, POST, …) dans `route.ts`.
 */

import { prisma } from "@/lib/db";
import { calculerParoi, type CoucheCalc } from "@/lib/thermal/paroi-calc";

export interface CoucheRow {
  id: string;
  ordre: number;
  epaisseur: unknown;
  materiauId: string;
  materiau: {
    id: string;
    nom: string;
    categorie: string;
    conductivite: unknown;
    masseVolumique: unknown;
    capaciteThermique: unknown;
    resistanceFixe: unknown;
    carboneACV: unknown;
  };
}

export interface ParoiRow {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  uCache: unknown;
  rCache: unknown;
  masseSurfaciqueCache: unknown;
  dephasageCache: unknown;
  carboneCache: unknown;
  rsi: unknown;
  rse: unknown;
  createdAt: Date;
  updatedAt: Date;
  couches?: CoucheRow[];
}

function n(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export function serializeParoi(p: ParoiRow) {
  return {
    id: p.id,
    nom: p.nom,
    type: p.type,
    description: p.description,
    uCache: n(p.uCache),
    rCache: n(p.rCache),
    masseSurfaciqueCache: n(p.masseSurfaciqueCache),
    dephasageCache: n(p.dephasageCache),
    carboneCache: n(p.carboneCache),
    rsi: n(p.rsi) ?? 0.13,
    rse: n(p.rse) ?? 0.04,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    couches: p.couches?.map((c) => ({
      id: c.id,
      ordre: c.ordre,
      epaisseur: n(c.epaisseur) ?? 0,
      materiauId: c.materiauId,
      materiau: {
        id: c.materiau.id,
        nom: c.materiau.nom,
        categorie: c.materiau.categorie,
        conductivite: n(c.materiau.conductivite) ?? 0,
        masseVolumique: n(c.materiau.masseVolumique) ?? 0,
        capaciteThermique: n(c.materiau.capaciteThermique) ?? 0,
        resistanceFixe: n(c.materiau.resistanceFixe),
        carboneACV: n(c.materiau.carboneACV),
      },
    })),
  };
}

/** Recalcule les indicateurs cache d'une paroi à partir de ses couches. */
export async function recalcParoiCache(paroiId: string): Promise<void> {
  const paroi = await prisma.paroi.findUnique({
    where: { id: paroiId },
    include: {
      couches: {
        orderBy: { ordre: "asc" },
        include: { materiau: true },
      },
    },
  });
  if (!paroi) return;

  const couchesCalc: CoucheCalc[] = paroi.couches.map((c) => ({
    materiauId: c.materiauId,
    nom: c.materiau.nom,
    categorie: c.materiau.categorie,
    epaisseur: Number(c.epaisseur),
    conductivite: Number(c.materiau.conductivite),
    masseVolumique: Number(c.materiau.masseVolumique),
    capaciteThermique: Number(c.materiau.capaciteThermique),
    resistanceFixe:
      c.materiau.resistanceFixe != null
        ? Number(c.materiau.resistanceFixe)
        : null,
    carboneACV:
      c.materiau.carboneACV != null ? Number(c.materiau.carboneACV) : null,
  }));

  const m = calculerParoi(
    couchesCalc,
    Number(paroi.rsi),
    Number(paroi.rse),
  );

  await prisma.paroi.update({
    where: { id: paroiId },
    data: {
      uCache: m.uValue,
      rCache: m.rTotal,
      masseSurfaciqueCache: m.masseSurfacique,
      dephasageCache: m.dephasage,
      carboneCache: m.carboneACVm2,
    },
  });
}
