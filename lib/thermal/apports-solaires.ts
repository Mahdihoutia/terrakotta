/**
 * A5 — Apports solaires gratuits (méthode F·g·H_g).
 *
 * Apport_orient_mois = S_vitré × g × F_ombre × H_g(orient, mois) × F_zone
 *
 * H_g : ensoleillement global moyen mensuel sur surface verticale (kWh/m²/mois).
 * Source : valeurs Météo France TRY simplifiées (référence H1a).
 * F_zone : facteur d'ajustement zone climatique.
 *
 * Saison de chauffe France : OCT → AVR (7 mois).
 * Saison chaude : MAI → SEP (5 mois).
 */

export type Orientation = "S" | "SE" | "SO" | "E" | "O" | "NE" | "NO" | "N";
export type Mois =
  | "JAN" | "FEV" | "MAR" | "AVR" | "MAI" | "JUN"
  | "JUL" | "AOU" | "SEP" | "OCT" | "NOV" | "DEC";

export const MOIS_ORDER: Mois[] = ["JAN", "FEV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOU", "SEP", "OCT", "NOV", "DEC"];
export const MOIS_CHAUFFE: Mois[] = ["OCT", "NOV", "DEC", "JAN", "FEV", "MAR", "AVR"];
export const MOIS_CHAUDE: Mois[] = ["MAI", "JUN", "JUL", "AOU", "SEP"];

/** kWh/m²·mois sur surface verticale, zone H1a (référence). */
export const HG_MENSUEL_VERTICAL: Record<Orientation, Record<Mois, number>> = {
  S:  { JAN: 60, FEV: 70, MAR: 90, AVR: 95, MAI: 95, JUN: 95, JUL: 100, AOU: 100, SEP: 95, OCT: 80, NOV: 60, DEC: 50 },
  SE: { JAN: 45, FEV: 55, MAR: 75, AVR: 85, MAI: 90, JUN: 90, JUL:  90, AOU:  90, SEP: 80, OCT: 65, NOV: 45, DEC: 38 },
  SO: { JAN: 45, FEV: 55, MAR: 75, AVR: 85, MAI: 90, JUN: 90, JUL:  90, AOU:  90, SEP: 80, OCT: 65, NOV: 45, DEC: 38 },
  E:  { JAN: 25, FEV: 38, MAR: 55, AVR: 70, MAI: 80, JUN: 85, JUL:  85, AOU:  78, SEP: 65, OCT: 45, NOV: 28, DEC: 22 },
  O:  { JAN: 25, FEV: 38, MAR: 55, AVR: 70, MAI: 80, JUN: 85, JUL:  85, AOU:  78, SEP: 65, OCT: 45, NOV: 28, DEC: 22 },
  NE: { JAN: 15, FEV: 22, MAR: 35, AVR: 50, MAI: 65, JUN: 75, JUL:  72, AOU:  60, SEP: 42, OCT: 28, NOV: 18, DEC: 13 },
  NO: { JAN: 15, FEV: 22, MAR: 35, AVR: 50, MAI: 65, JUN: 75, JUL:  72, AOU:  60, SEP: 42, OCT: 28, NOV: 18, DEC: 13 },
  N:  { JAN: 12, FEV: 18, MAR: 30, AVR: 45, MAI: 55, JUN: 60, JUL:  58, AOU:  48, SEP: 35, OCT: 22, NOV: 14, DEC: 10 },
};

export const FACTEUR_ZONE: Record<string, number> = {
  H1a: 0.95, H1b: 0.95, H1c: 1.00,
  H2a: 1.00, H2b: 1.05, H2c: 1.10, H2d: 1.05,
  H3:  1.20,
};

export interface ApportSolaireInput {
  surfacesParOrientation: Record<Orientation, number>;
  facteurSolaireG: number;
  facteurOmbre: number;
  /** Code zone court : "H1a", "H2c"... (utiliser parseZone() depuis zones.ts). */
  zone: string;
}

export interface ApportSolaireResult {
  apportAnnuel: number;
  apportSaisonChauffe: number;
  apportSaisonChaude: number;
  detailParOrientation: Record<Orientation, number>;
  detailMensuel: Record<Mois, number>;
  /** Risque de surchauffe estivale : > 80 kWh/m²·an saison chaude rapporté à S_vitrée. */
  risqueSurchauffe: boolean;
}

export function calculerApportsSolaires(input: ApportSolaireInput): ApportSolaireResult {
  const { surfacesParOrientation, facteurSolaireG, facteurOmbre, zone } = input;
  const fZone = FACTEUR_ZONE[zone] ?? 1.0;
  const g = Math.min(Math.max(facteurSolaireG, 0), 1);
  const f = Math.min(Math.max(facteurOmbre, 0), 1);

  const orientations: Orientation[] = ["S", "SE", "SO", "E", "O", "NE", "NO", "N"];

  const detailParOrientation: Record<Orientation, number> = {
    S: 0, SE: 0, SO: 0, E: 0, O: 0, NE: 0, NO: 0, N: 0,
  };
  const detailMensuel: Record<Mois, number> = {
    JAN: 0, FEV: 0, MAR: 0, AVR: 0, MAI: 0, JUN: 0,
    JUL: 0, AOU: 0, SEP: 0, OCT: 0, NOV: 0, DEC: 0,
  };

  for (const o of orientations) {
    const surface = surfacesParOrientation[o] || 0;
    if (surface <= 0) continue;
    for (const m of MOIS_ORDER) {
      const hg = HG_MENSUEL_VERTICAL[o][m] * fZone;
      const apport = surface * g * f * hg;
      detailParOrientation[o] += apport;
      detailMensuel[m] += apport;
    }
  }

  const apportAnnuel = MOIS_ORDER.reduce((s, m) => s + detailMensuel[m], 0);
  const apportSaisonChauffe = MOIS_CHAUFFE.reduce((s, m) => s + detailMensuel[m], 0);
  const apportSaisonChaude = MOIS_CHAUDE.reduce((s, m) => s + detailMensuel[m], 0);

  const surfaceVitreeTotale = orientations.reduce((s, o) => s + (surfacesParOrientation[o] || 0), 0);
  const ratioSurchauffe = surfaceVitreeTotale > 0 ? apportSaisonChaude / surfaceVitreeTotale : 0;
  const risqueSurchauffe = ratioSurchauffe > 80;

  return {
    apportAnnuel,
    apportSaisonChauffe,
    apportSaisonChaude,
    detailParOrientation,
    detailMensuel,
    risqueSurchauffe,
  };
}
