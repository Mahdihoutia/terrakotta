/**
 * lib/thermal — moteur de calcul thermique réglementaire.
 *
 * Modules :
 *   - constants.ts        : U-values, rendements, FE CO₂, prix.
 *   - zones.ts            : DJU, T_base, bins par zone climatique H1a…H3.
 *   - ponts-thermiques.ts : bibliothèque ψ Th-U (RT existant).
 *   - deperditions.ts     : A1 — H_paroi, %, Ubat, H_total.
 *   - apports-solaires.ts : A5 — F·g·H_g par orientation.
 *   - besoins-chauffage.ts: A3 — méthode DJU, coef G.
 *   - dpe.ts              : A4 — méthode 3CL-DPE 2021 (5 usages, EP, GES).
 *   - validation.ts       : cohérence Σ%, écart facture/calc, U incohérent.
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
