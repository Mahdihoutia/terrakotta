/**
 * Calcul du volume de CEE (kWh cumac).
 *
 * cumac = gain annuel (kWh EF) × durée de vie conventionnelle × coef. d'actualisation.
 *
 *   Coef. actualisation a(N) = (1 - (1+r)^-N) / (1 - (1+r)^-1)   avec r = 4 %
 *
 * Source : code de l'énergie (art. R.221-15) et arrêtés JO d'éligibilité.
 */

import type { FicheId } from "../types";

/** Durée de vie conventionnelle (années) par fiche CEE. */
export const DUREE_VIE_CONV: Record<FicheId, number> = {
  "BAT-TH-134": 15, // Haute pression flottante
  "BAT-TH-163": 17, // PAC air/eau tertiaire
  "BAT-TH-142": 10, // Déstratification air
  "BAT-TH-139": 15, // Récupération de chaleur sur GF
  "BAR-TH-171": 17, // PAC air/eau résidentiel
  "BAR-TH-159": 17, // PAC hybride résidentiel
  "BAR-EN-101": 30, // Isolation combles / toiture
  "BAR-EN-102": 25, // Isolation des murs
  "BAR-EN-103": 30, // Isolation d'un plancher
  "BAT-TH-116": 10, // GTB classes A/B
};

/** Coefficient d'actualisation (taux 4 %/an). */
export function coefActualisation(dureeVieAns: number): number {
  if (dureeVieAns <= 0) return 0;
  const r = 0.04;
  return (1 - Math.pow(1 + r, -dureeVieAns)) / (1 - Math.pow(1 + r, -1));
}

export interface CumacResult {
  cumacKWh: number;
  cumacMWh: number;
  duree: number;
  coefActu: number;
}

/**
 * Volume CEE en kWh cumac.
 * @returns null si la fiche est inconnue ou si le gain annuel n'est pas fini > 0.
 */
export function computeCumac(
  ficheId: FicheId,
  gainMWhAn: number,
): CumacResult | null {
  if (!ficheId || !Number.isFinite(gainMWhAn) || gainMWhAn <= 0) return null;
  const duree = DUREE_VIE_CONV[ficheId];
  if (!duree) return null;
  const coefActu = coefActualisation(duree);
  const cumacKWh = gainMWhAn * 1000 * duree * coefActu;
  return { cumacKWh, cumacMWh: cumacKWh / 1000, duree, coefActu };
}
