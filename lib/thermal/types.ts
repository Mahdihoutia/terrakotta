/**
 * Types CEE / fiches d'opérations standardisées.
 *
 * Module pur — pas de React. Les composants React adaptent leurs
 * `FormValues` vers ces types au point de branchement avec les calculs.
 */

/* ─── Catalogue ──────────────────────────────────────────────── */

export type FicheId =
  | "BAT-TH-134"
  | "BAT-TH-163"
  | "BAT-TH-142"
  | "BAT-TH-139"
  | "BAR-TH-171"
  | "BAR-TH-159"
  | "BAR-EN-101"
  | "BAR-EN-102"
  | "BAR-EN-103"
  | "BAT-TH-116";

export type MethodeCalcul =
  | "FORFAITAIRE_CEE"
  | "BIN"
  | "DJU"
  | "CARNOT"
  | "BILAN_THERMIQUE"
  | "SCOP_DETAILLE"
  | "EN_15232"
  | "REGLEMENTAIRE_DELTA_U";

export type ZoneH = "H1" | "H2" | "H3";

/* ─── Pattern de retour : Result<T> discriminé ─────────────────
 *
 * Les fonctions de calcul retournent un Result, pas un `T | null`. L'UI
 * peut remonter à l'utilisateur **ce qui manque** (champ absent, valeur
 * hors bornes…) au lieu d'un silence opaque.
 */

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; missing: string[] };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const ko = (missing: string[]): Result<never> => ({ ok: false, missing });

/* ─── Sortie commune des fiches CEE thermiques ────────────────── */

export interface FicheCalculResult {
  /** Besoin de chauffage net (MWh/an) */
  besoinChauffage: number;
  /** Conso d'énergie finale avant travaux (MWh/an) */
  consoAvant: number;
  /** Conso d'énergie finale après travaux (MWh/an) */
  consoApres: number;
  /** Gain énergétique (MWh/an) */
  gainMwh: number;
  /** Gain en pourcentage */
  gainPct: number;
  /** Réduction CO₂ (tCO₂e/an) */
  reductionCo2: number;
  /** Économie financière (€/an) */
  economiEuros: number;
  /** Durée de retour sur investissement (ans), null si données insuffisantes */
  dureeRetour: number | null;
  /** Volume CEE en kWh cumac */
  cumacKWh: number;
  /** Détail rédigé du calcul (multi-lignes, à afficher à l'utilisateur) */
  detailMethode: string;
}
