/**
 * Helpers de sérialisation et calcul pour les bâtiments / zones / scénarios.
 * Extraits hors des fichiers route.ts car Next.js 15 App Router n'autorise
 * QUE les exports HTTP (GET, POST, …) dans `route.ts`.
 */

import { prisma } from "@/lib/db";
import { simulerZone, type ZoneInput, type ZoneResult } from "@/lib/thermal/zone-calc";
import { parsePatternJson, type OccupationPattern } from "@/lib/validations/scenario";

function n(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function nReq(v: unknown, fallback = 0): number {
  return n(v) ?? fallback;
}

export function serializeBatiment(b: {
  id: string;
  nom: string;
  description: string | null;
  zoneClimatique: string;
  altitude: unknown;
  orientation: string | null;
  projetId: string | null;
  auditDocumentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  zones?: Array<unknown>;
}) {
  return {
    id: b.id,
    nom: b.nom,
    description: b.description,
    zoneClimatique: b.zoneClimatique,
    altitude: n(b.altitude),
    orientation: b.orientation,
    projetId: b.projetId,
    auditDocumentId: b.auditDocumentId,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    zonesCount: b.zones?.length ?? 0,
  };
}

export interface ZoneRow {
  id: string;
  batimentId: string;
  nom: string;
  usage: string;
  surface: unknown;
  hauteurSousPlafond: unknown;
  consigneChauffageOcc: unknown;
  consigneChauffageRed: unknown;
  consigneClimOcc: unknown;
  consigneClimRed: unknown;
  densiteOccupation: unknown;
  apportsParPersonne: unknown;
  apportsEquipements: unknown;
  apportsEclairage: unknown;
  qVmcM3hM2: unknown;
  efficaciteDoubleFlux: unknown;
  scenarioId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parois?: ZoneParoiRow[];
}

export interface ZoneParoiRow {
  id: string;
  zoneId: string;
  paroiId: string;
  surface: unknown;
  orientation: string | null;
  inclinaison: unknown;
  cotePaire: boolean | null;
  paroi?: {
    id: string;
    nom: string;
    type: string;
    uCache: unknown;
    masseSurfaciqueCache: unknown;
  };
}

export function serializeZoneParoi(zp: ZoneParoiRow) {
  return {
    id: zp.id,
    zoneId: zp.zoneId,
    paroiId: zp.paroiId,
    surface: nReq(zp.surface),
    orientation: zp.orientation,
    inclinaison: n(zp.inclinaison),
    cotePaire: zp.cotePaire ?? false,
    paroi: zp.paroi
      ? {
          id: zp.paroi.id,
          nom: zp.paroi.nom,
          type: zp.paroi.type,
          uCache: n(zp.paroi.uCache),
          masseSurfaciqueCache: n(zp.paroi.masseSurfaciqueCache),
        }
      : null,
  };
}

export function serializeZone(z: ZoneRow) {
  return {
    id: z.id,
    batimentId: z.batimentId,
    nom: z.nom,
    usage: z.usage,
    surface: nReq(z.surface),
    hauteurSousPlafond: nReq(z.hauteurSousPlafond),
    consigneChauffageOcc: nReq(z.consigneChauffageOcc, 20),
    consigneChauffageRed: nReq(z.consigneChauffageRed, 16),
    consigneClimOcc: nReq(z.consigneClimOcc, 26),
    consigneClimRed: nReq(z.consigneClimRed, 28),
    densiteOccupation: nReq(z.densiteOccupation, 15),
    apportsParPersonne: nReq(z.apportsParPersonne, 80),
    apportsEquipements: nReq(z.apportsEquipements, 15),
    apportsEclairage: nReq(z.apportsEclairage, 8),
    qVmcM3hM2: nReq(z.qVmcM3hM2, 2.5),
    efficaciteDoubleFlux: nReq(z.efficaciteDoubleFlux, 0),
    scenarioId: z.scenarioId,
    createdAt: z.createdAt.toISOString(),
    updatedAt: z.updatedAt.toISOString(),
    parois: z.parois?.map(serializeZoneParoi) ?? [],
  };
}

export function serializeScenario(s: {
  id: string;
  nom: string;
  description: string | null;
  patternJson: string;
  preset: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const pattern = parsePatternJson(s.patternJson);
  return {
    id: s.id,
    nom: s.nom,
    description: s.description,
    pattern: pattern ?? createPatternVide(),
    preset: s.preset,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

/** Pattern vide 7×24 — tout INOCC. */
export function createPatternVide(): OccupationPattern {
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => "INOCC" as const),
  );
}

/**
 * Construit l'input ZoneInput pour le moteur 5R1C à partir d'une ligne BD.
 * Charge les parois associées et leur cache U.
 */
export async function buildZoneInputFromDb(
  zoneId: string,
  zoneClimatique: string,
): Promise<ZoneInput | null> {
  const z = await prisma.zone.findFirst({
    where: { id: zoneId, deletedAt: null },
    include: {
      parois: {
        include: { paroi: true },
      },
      scenario: true,
    },
  });
  if (!z) return null;

  // Pattern : si scénario absent, occupation continue par défaut.
  let pattern: OccupationPattern;
  if (z.scenario) {
    pattern =
      parsePatternJson(z.scenario.patternJson) ??
      Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, () => "OCC" as const),
      );
  } else {
    pattern = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => "OCC" as const),
    );
  }

  const parois = z.parois.map((zp) => {
    const u = nReq(zp.paroi.uCache, 1.5);
    const masse = nReq(zp.paroi.masseSurfaciqueCache, 100);
    const isVitrage =
      zp.paroi.type === "VITRAGE" || zp.paroi.type === "PORTE";
    return {
      surface: nReq(zp.surface),
      uValue: u,
      masseSurfacique: masse,
      cotePaire: zp.cotePaire ?? false,
      orientation: zp.orientation,
      isVitrage,
      facteurSolaireG: isVitrage ? 0.6 : undefined,
    };
  });

  return {
    surface: nReq(z.surface),
    hauteurSousPlafond: nReq(z.hauteurSousPlafond, 2.5),
    zoneClimatique,
    consigneChauffageOcc: nReq(z.consigneChauffageOcc, 20),
    consigneChauffageRed: nReq(z.consigneChauffageRed, 16),
    consigneClimOcc: nReq(z.consigneClimOcc, 26),
    consigneClimRed: nReq(z.consigneClimRed, 28),
    densiteOccupation: nReq(z.densiteOccupation, 15),
    apportsParPersonne: nReq(z.apportsParPersonne, 80),
    apportsEquipements: nReq(z.apportsEquipements, 15),
    apportsEclairage: nReq(z.apportsEclairage, 8),
    qVmcM3hM2: nReq(z.qVmcM3hM2, 2.5),
    efficaciteDoubleFlux: nReq(z.efficaciteDoubleFlux, 0),
    scenarioPattern: pattern,
    parois,
  };
}

/** Calcule le bilan d'un bâtiment entier (somme des zones). */
export async function calculerBilanBatiment(batimentId: string): Promise<{
  batimentId: string;
  zoneClimatique: string;
  zones: Array<{
    id: string;
    nom: string;
    usage: string;
    surface: number;
    result: ZoneResult;
  }>;
  total: {
    surface: number;
    besoinChauffageMWh: number;
    besoinClimMWh: number;
    apportsSolairesMWh: number;
    apportsInternesMWh: number;
    pertesEnveloppeMWh: number;
    pertesVentilationMWh: number;
    besoinChauffageKWhM2: number;
    besoinClimKWhM2: number;
  };
} | null> {
  const b = await prisma.batiment.findFirst({
    where: { id: batimentId, deletedAt: null },
    include: {
      zones: {
        where: { deletedAt: null },
        orderBy: { nom: "asc" },
      },
    },
  });
  if (!b) return null;

  const zonesResults = [];
  let totalSurface = 0;
  let totalBesoinChaud = 0;
  let totalBesoinClim = 0;
  let totalApportsSol = 0;
  let totalApportsInt = 0;
  let totalPertesEnv = 0;
  let totalPertesVent = 0;

  for (const z of b.zones) {
    const input = await buildZoneInputFromDb(z.id, b.zoneClimatique);
    if (!input) continue;
    const result = simulerZone(input);
    const surface = nReq(z.surface);
    totalSurface += surface;
    totalBesoinChaud += result.besoinChauffageMWh;
    totalBesoinClim += result.besoinClimMWh;
    totalApportsSol += result.apportsSolairesMWh;
    totalApportsInt += result.apportsInternesMWh;
    totalPertesEnv += result.pertesEnveloppeMWh;
    totalPertesVent += result.pertesVentilationMWh;
    zonesResults.push({
      id: z.id,
      nom: z.nom,
      usage: z.usage,
      surface,
      result,
    });
  }

  return {
    batimentId,
    zoneClimatique: b.zoneClimatique,
    zones: zonesResults,
    total: {
      surface: totalSurface,
      besoinChauffageMWh: totalBesoinChaud,
      besoinClimMWh: totalBesoinClim,
      apportsSolairesMWh: totalApportsSol,
      apportsInternesMWh: totalApportsInt,
      pertesEnveloppeMWh: totalPertesEnv,
      pertesVentilationMWh: totalPertesVent,
      besoinChauffageKWhM2:
        totalSurface > 0 ? (totalBesoinChaud * 1000) / totalSurface : 0,
      besoinClimKWhM2:
        totalSurface > 0 ? (totalBesoinClim * 1000) / totalSurface : 0,
    },
  };
}

const MIGRATION_TABLES = ["batiments", "zones", "zone_parois", "scenarios_occupation"];

export function isMigrationPendingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  if (!message) return false;
  // Détection stricte : code Prisma P2021 ou message officiel.
  // Évite les substrings larges qui matchaient à tort des erreurs sans rapport.
  if (message.includes("P2021")) return true;
  if (message.includes("does not exist in the current database")) return true;
  return false;
}
