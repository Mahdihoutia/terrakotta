/**
 * lib/thermal — moteur de calcul thermique réglementaire + CEE.
 *
 * Modules historiques (audit énergétique) :
 *   - constants.ts        : U-values, rendements, FE CO₂, prix.
 *   - zones.ts            : DJU, T_base, bins par zone climatique H1a…H3.
 *   - ponts-thermiques.ts : bibliothèque ψ Th-U (RT existant).
 *   - deperditions.ts     : A1 — H_paroi, %, Ubat, H_total.
 *   - apports-solaires.ts : A5 — F·g·H_g par orientation.
 *   - besoins-chauffage.ts: A3 — méthode DJU, coef G.
 *   - dpe.ts              : A4 — méthode 3CL-DPE 2021 (5 usages, EP, GES).
 *   - validation.ts       : cohérence Σ%, écart facture/calc, U incohérent.
 *
 * Modules CEE (chantier 1, extraction de NoteDimensionnement.tsx) :
 *   - types.ts            : FicheId, MethodeCalcul, Result<T>, FicheCalculResult.
 *   - methodes/coef-g.ts  : G estimé par âge de construction (estimation 3CL).
 *   - methodes/cumac.ts   : durées de vie conv. + coef actualisation.
 *   - cee/forfaits.ts     : forfaits CEE versionnés (arrêté + dateApplication).
 *   - cee/BAR-TH-171.ts   : PAC air/eau résidentiel (DJU, SCOP, Forfait).
 */

export * from "./constants";
export * from "./zones";
export * from "./ponts-thermiques";
export * from "./deperditions";
export * from "./apports-solaires";
export * from "./besoins-chauffage";
export * from "./dpe";
export * from "./validation";
export * from "./suggestions";
export * from "./coefficient-utilisation";

// ─── CEE / fiches d'opérations standardisées ──────────────────
export type {
  FicheId,
  MethodeCalcul,
  ZoneH,
  Result,
  FicheCalculResult,
} from "./types";
export { ok, ko } from "./types";

export {
  COEF_G_PAR_PERIODE,
  coeffGFromAnnee,
  coeffGEntryFromAnnee,
} from "./methodes/coef-g";
export type { CoefGEntry } from "./methodes/coef-g";

export {
  DUREE_VIE_CONV,
  coefActualisation,
  computeCumac,
} from "./methodes/cumac";
export type { CumacResult } from "./methodes/cumac";

export {
  FORFAITS_CEE,
  getForfaitParZone,
} from "./cee/forfaits";
export type {
  Forfait,
  ForfaitMeta,
  ForfaitParZone,
  ForfaitFlat,
  ForfaitParClasse,
} from "./cee/forfaits";

// Fiches CEE migrées (namespace par fiche pour éviter les collisions de noms).
export * as BAR_TH_171 from "./cee/BAR-TH-171";
