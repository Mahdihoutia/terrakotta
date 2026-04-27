/**
 * Données climatiques par zone (DJU base 18 °C, T° base, bins horaires).
 *
 * Sources :
 *  - DJU : Costic / méthode 3CL-DPE 2021 (annexe 3, §1.4).
 *  - T_base : NF EN 12831 — Annexe nationale française (cahier CSTB).
 *  - Bins horaires : agrégation simplifiée TRY Météo France 1991-2010.
 *
 * Les valeurs sont volontairement arrondies (audits non-réglementaires).
 * Pour une étude thermique réglementaire, utiliser les fichiers TRY officiels.
 */

export interface ZoneClimatiqueData {
  dju: number;
  tBase: number;
  bins: Array<{ tExt: number; heures: number }>;
}

export const ZONE_CLIMATIQUE_DATA: Record<string, ZoneClimatiqueData> = {
  "H1a — Nord": {
    dju: 2800, tBase: -7,
    bins: [{ tExt: -7, heures: 200 }, { tExt: -2, heures: 600 }, { tExt: 3, heures: 1200 }, { tExt: 8, heures: 1800 }, { tExt: 13, heures: 1500 }, { tExt: 18, heures: 1200 }, { tExt: 23, heures: 700 }, { tExt: 28, heures: 300 }, { tExt: 33, heures: 60 }],
  },
  "H1b — Nord-Est": {
    dju: 2700, tBase: -9,
    bins: [{ tExt: -9, heures: 150 }, { tExt: -4, heures: 500 }, { tExt: 1, heures: 1100 }, { tExt: 6, heures: 1700 }, { tExt: 11, heures: 1600 }, { tExt: 16, heures: 1300 }, { tExt: 21, heures: 900 }, { tExt: 26, heures: 400 }, { tExt: 31, heures: 100 }],
  },
  "H1c — Est": {
    dju: 2600, tBase: -10,
    bins: [{ tExt: -10, heures: 120 }, { tExt: -5, heures: 450 }, { tExt: 0, heures: 1000 }, { tExt: 5, heures: 1600 }, { tExt: 10, heures: 1600 }, { tExt: 15, heures: 1400 }, { tExt: 20, heures: 1000 }, { tExt: 25, heures: 450 }, { tExt: 30, heures: 100 }],
  },
  "H2a — Nord-Ouest": {
    dju: 2400, tBase: -4,
    bins: [{ tExt: -4, heures: 150 }, { tExt: 1, heures: 700 }, { tExt: 6, heures: 1400 }, { tExt: 11, heures: 1800 }, { tExt: 16, heures: 1600 }, { tExt: 21, heures: 1200 }, { tExt: 26, heures: 550 }, { tExt: 31, heures: 100 }],
  },
  "H2b — Ouest": {
    dju: 2200, tBase: -2,
    bins: [{ tExt: -2, heures: 100 }, { tExt: 3, heures: 600 }, { tExt: 8, heures: 1300 }, { tExt: 13, heures: 1800 }, { tExt: 18, heures: 1700 }, { tExt: 23, heures: 1200 }, { tExt: 28, heures: 500 }, { tExt: 33, heures: 100 }],
  },
  "H2c — Sud-Ouest": {
    dju: 2000, tBase: -3,
    bins: [{ tExt: -3, heures: 80 }, { tExt: 2, heures: 500 }, { tExt: 7, heures: 1200 }, { tExt: 12, heures: 1700 }, { tExt: 17, heures: 1700 }, { tExt: 22, heures: 1300 }, { tExt: 27, heures: 600 }, { tExt: 32, heures: 150 }],
  },
  "H2d — Centre": {
    dju: 2300, tBase: -5,
    bins: [{ tExt: -5, heures: 120 }, { tExt: 0, heures: 600 }, { tExt: 5, heures: 1300 }, { tExt: 10, heures: 1700 }, { tExt: 15, heures: 1600 }, { tExt: 20, heures: 1200 }, { tExt: 25, heures: 600 }, { tExt: 30, heures: 150 }],
  },
  "H3 — Méditerranée": {
    dju: 1400, tBase: 0,
    bins: [{ tExt: 0, heures: 50 }, { tExt: 5, heures: 400 }, { tExt: 10, heures: 1000 }, { tExt: 15, heures: 1600 }, { tExt: 20, heures: 1800 }, { tExt: 25, heures: 1500 }, { tExt: 30, heures: 700 }, { tExt: 35, heures: 200 }],
  },
};

/**
 * Extrait le code court d'une zone (ex: "H1a — Nord" → "H1a").
 * Retourne "H1a" par défaut si non reconnu.
 */
export function parseZone(label: string | undefined | null): string {
  if (!label) return "H1a";
  const m = label.match(/^(H[123][a-d]?)/i);
  if (!m) return "H1a";
  // Normalisation : H majuscule + chiffre + suffixe lettre minuscule.
  const raw = m[1];
  return raw[0].toUpperCase() + raw.slice(1).toLowerCase();
}

export function getZoneData(label: string | undefined | null): ZoneClimatiqueData | null {
  if (!label) return null;
  return ZONE_CLIMATIQUE_DATA[label] ?? null;
}

/**
 * Part mensuelle des DJU annuels (somme = 1.0).
 *
 * Approximation simple agrégée pour l'audit non-réglementaire — climat tempéré
 * français. Pour une étude réglementaire, utiliser les fichiers TRY officiels.
 *
 * Index 0 = Janvier, 11 = Décembre.
 */
export const DJU_MENSUEL_RATIO: readonly number[] = [
  0.18, // jan
  0.16, // fév
  0.13, // mar
  0.09, // avr
  0.05, // mai
  0.01, // jun
  0.00, // jul
  0.00, // aoû
  0.03, // sep
  0.08, // oct
  0.13, // nov
  0.14, // déc
] as const;

export const MOIS_LABELS_FR: readonly string[] = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
] as const;
