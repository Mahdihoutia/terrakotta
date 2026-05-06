/**
 * Coefficient de déperditions volumiques G (W/m³.K) — approche RT/DPE.
 *
 * Utilisé en méthode 3CL-DPE pour estimer les besoins de chauffage en
 * l'absence de mesures détaillées (B = G × V × DJU × 24).
 *
 * Sources : seuils RT successives (RT 1974, RT 1988, RT 2000/2005, RT 2012,
 * RE 2020) et calibration empirique sur les retours d'audit DPE 2021.
 */

export interface CoefGEntry {
  /** Valeur G en W/m³.K */
  valeur: number;
  /** Étiquette d'âge / réglementation correspondante */
  reglementation: string;
}

export const COEF_G_PAR_PERIODE: Array<{
  anneeMin: number;
  anneeMax: number;
  entry: CoefGEntry;
}> = [
  { anneeMin: 0,    anneeMax: 1947, entry: { valeur: 1.8,  reglementation: "Maçonnerie ancienne non isolée" } },
  { anneeMin: 1948, anneeMax: 1974, entry: { valeur: 1.5,  reglementation: "Pré première réglementation" } },
  { anneeMin: 1975, anneeMax: 1988, entry: { valeur: 1.1,  reglementation: "RT 1974" } },
  { anneeMin: 1989, anneeMax: 2000, entry: { valeur: 0.85, reglementation: "RT 1988" } },
  { anneeMin: 2001, anneeMax: 2012, entry: { valeur: 0.65, reglementation: "RT 2000 / 2005" } },
  { anneeMin: 2013, anneeMax: 9999, entry: { valeur: 0.45, reglementation: "RT 2012 / RE 2020" } },
];

/** Coefficient G (W/m³.K) estimé à partir de l'année de construction. */
export function coeffGFromAnnee(annee: number): number {
  if (!Number.isFinite(annee) || annee <= 0) return 1.4; // fallback
  const found = COEF_G_PAR_PERIODE.find(
    (p) => annee >= p.anneeMin && annee <= p.anneeMax,
  );
  return found?.entry.valeur ?? 1.4;
}

/** Métadonnée complète (valeur + libellé réglementaire) pour affichage. */
export function coeffGEntryFromAnnee(annee: number): CoefGEntry {
  if (!Number.isFinite(annee) || annee <= 0) {
    return { valeur: 1.4, reglementation: "Année inconnue (fallback)" };
  }
  const found = COEF_G_PAR_PERIODE.find(
    (p) => annee >= p.anneeMin && annee <= p.anneeMax,
  );
  return found?.entry ?? { valeur: 1.4, reglementation: "Hors période" };
}
