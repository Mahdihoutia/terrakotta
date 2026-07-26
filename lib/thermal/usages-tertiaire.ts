/**
 * A6 — Profils d'usage tertiaire (forfaits par destination de zone).
 *
 * La méthode 3CL-DPE logement utilise des forfaits résidentiels (ECS 17,78
 * kWh/m²·an, éclairage 1,4 kWh/m²·an, apports internes ≈ 14 kWh/m²·an). Ces
 * valeurs sont fausses pour du tertiaire : un bureau a un éclairage et des
 * apports internes (bureautique, occupants) bien supérieurs, une ECS quasi
 * nulle ; une salle de restauration a une ECS très élevée, etc.
 *
 * Ce module fournit, par ZoneUsage, des forfaits d'ordre de grandeur tertiaires
 * (RE2020 méthode Th-BCE, retours CEREN / ADEME parc tertiaire). Ils sont
 * pondérés par la surface de chaque zone pour obtenir un profil projet.
 *
 * Toutes les valeurs sont en kWh/m²·an d'énergie finale.
 *   - ecsKwhM2            : besoin ECS
 *   - apportsInternesKwhM2 : apports gratuits internes (occupants + équipements)
 *   - eclairageKwhM2       : consommation éclairage
 */

export interface UsageProfil {
  ecsKwhM2: number;
  apportsInternesKwhM2: number;
  eclairageKwhM2: number;
}

/** Profil de repli (usage inconnu / mixte). */
export const USAGE_PROFIL_DEFAUT: UsageProfil = {
  ecsKwhM2: 5,
  apportsInternesKwhM2: 18,
  eclairageKwhM2: 15,
};

/**
 * Forfaits par usage — clés = valeurs de l'enum Prisma ZoneUsage.
 * LOGEMENT reprend les conventions DPE logement (17,78 / ~14 / 1,4).
 */
export const USAGE_PROFILS: Record<string, UsageProfil> = {
  BUREAUX:       { ecsKwhM2: 5,    apportsInternesKwhM2: 30,  eclairageKwhM2: 20 },
  OPEN_SPACE:    { ecsKwhM2: 5,    apportsInternesKwhM2: 35,  eclairageKwhM2: 22 },
  SALLE_REUNION: { ecsKwhM2: 3,    apportsInternesKwhM2: 25,  eclairageKwhM2: 16 },
  SALLE_SERVEUR: { ecsKwhM2: 0,    apportsInternesKwhM2: 120, eclairageKwhM2: 10 },
  COMMERCE:      { ecsKwhM2: 6,    apportsInternesKwhM2: 30,  eclairageKwhM2: 40 },
  RESTAURATION:  { ecsKwhM2: 55,   apportsInternesKwhM2: 55,  eclairageKwhM2: 28 },
  HALL_ACCUEIL:  { ecsKwhM2: 2,    apportsInternesKwhM2: 15,  eclairageKwhM2: 20 },
  CIRCULATION:   { ecsKwhM2: 1,    apportsInternesKwhM2: 8,   eclairageKwhM2: 10 },
  ARCHIVES:      { ecsKwhM2: 0,    apportsInternesKwhM2: 5,   eclairageKwhM2: 8 },
  TECHNIQUE:     { ecsKwhM2: 1,    apportsInternesKwhM2: 10,  eclairageKwhM2: 8 },
  LOGEMENT:      { ecsKwhM2: 17.78, apportsInternesKwhM2: 14, eclairageKwhM2: 1.4 },
  AUTRE:         USAGE_PROFIL_DEFAUT,
};

export function getUsageProfil(usage: string | null | undefined): UsageProfil {
  if (!usage) return USAGE_PROFIL_DEFAUT;
  return USAGE_PROFILS[usage] ?? USAGE_PROFIL_DEFAUT;
}

/**
 * Profil projet pondéré par la surface de chaque zone.
 * Retourne null si aucune zone n'a de surface (rien à pondérer).
 */
export function profilUsagePondere(
  zones: Array<{ usage: string | null | undefined; surface: number }>,
): UsageProfil | null {
  let s = 0;
  let ecs = 0;
  let apports = 0;
  let ecl = 0;
  for (const z of zones) {
    const surf = z.surface;
    if (!(surf > 0)) continue;
    const p = getUsageProfil(z.usage);
    s += surf;
    ecs += p.ecsKwhM2 * surf;
    apports += p.apportsInternesKwhM2 * surf;
    ecl += p.eclairageKwhM2 * surf;
  }
  if (s <= 0) return null;
  return {
    ecsKwhM2: ecs / s,
    apportsInternesKwhM2: apports / s,
    eclairageKwhM2: ecl / s,
  };
}
