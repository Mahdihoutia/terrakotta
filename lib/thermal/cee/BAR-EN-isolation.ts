/**
 * BAR-EN-101 / 102 / 103 — Isolations résidentielles.
 *
 * Calcul commun (méthode ΔU réglementaire) avec paramétrage par paroi :
 *  - BAR-EN-101 : combles / toiture
 *  - BAR-EN-102 : murs (ITE / ITI)
 *  - BAR-EN-103 : plancher bas
 *
 * Formules :
 *  - Réglementaire : Gain (kWh/an) = ΔU × S × DJU × 24 / (η_install × 1000)
 *  - Forfait       : cumac = forfait_zone × S, durée et coef d'actualisation
 *                    permettent de remonter au gain annuel.
 *
 * Module pur — pas de React. Référence : Arrêté du 22 décembre 2014
 * modifié, fiches BAR-EN-101 / 102 / 103.
 */

import {
  type FicheCalculResult,
  type MethodeCalcul,
  type Result,
  ok,
  ko,
} from "../types";

/** Sortie isolation — étend le résultat commun avec ΔU/U/surface. */
export interface IsolationResult extends FicheCalculResult {
  uAvant: number;
  uApres: number;
  deltaU: number;
  surface: number;
}
import { computeCumac } from "../methodes/cumac";
import { prixEnergie } from "../constants";
import { getZoneData } from "../zones";
import { FORFAITS_CEE } from "./forfaits";
import { zoneToHKey, facteurCo2Lookup as facteurCo2 } from "./helpers";

/* ─── Inputs typés ─────────────────────────────────────────────── */

export type IsolationFicheId = "BAR-EN-101" | "BAR-EN-102" | "BAR-EN-103";

export interface IsolationInputs {
  /** Surface isolée (m²). */
  surface: number;
  /** Zone climatique (libellé "H1a — Nord", etc.). */
  zoneClimatique: string;
  /** Résistance thermique R_après (m².K/W) — performance retenue. */
  rApres: number;
  /** Résistance thermique R_avant si saisie ; sinon défaut paroi appliqué. */
  rAvantSaisi?: number;
  /** Énergie de chauffage avant travaux (libellé). */
  energieExistante?: string;
  /** Coût investissement (€). */
  coutInvestissement?: number;
  /** Méthode de calcul. */
  methode: MethodeCalcul;
}

/** Caractéristiques par défaut d'une paroi non isolée — méthode 3CL-DPE. */
export interface ParoiDefaults {
  ficheId: IsolationFicheId;
  /** Nom de la paroi pour le détail rédigé. */
  paroi: string;
  /** U_avant typique d'une paroi non isolée (W/m²·K) — fallback si R_avant non saisi. */
  uAvantDefaut: number;
  /** U_après typique post-travaux (à titre indicatif dans le détail). */
  uApresDefaut: number;
}

export const PAROIS_DEFAULTS: Record<IsolationFicheId, ParoiDefaults> = {
  "BAR-EN-101": { ficheId: "BAR-EN-101", paroi: "Combles / toiture", uAvantDefaut: 3.0, uApresDefaut: 0.14 },
  "BAR-EN-102": { ficheId: "BAR-EN-102", paroi: "Murs",              uAvantDefaut: 2.0, uApresDefaut: 0.27 },
  "BAR-EN-103": { ficheId: "BAR-EN-103", paroi: "Plancher bas",      uAvantDefaut: 2.0, uApresDefaut: 0.33 },
};

/** Rendement forfaitaire d'installation chauffage (émetteurs + générateur). */
const RENDEMENT_INSTALLATION = 0.85;

/* ─── API publique ─────────────────────────────────────────────── */

export function calculer(
  inputs: IsolationInputs,
  defaults: ParoiDefaults,
): Result<IsolationResult> {
  return inputs.methode === "FORFAITAIRE_CEE"
    ? calculerForfait(inputs, defaults)
    : calculerDeltaU(inputs, defaults);
}

/* ─── Méthode 1 : ΔU × S × DJU × 24 ─────────────────────────────── */

export function calculerDeltaU(
  v: IsolationInputs,
  defaults: ParoiDefaults,
): Result<IsolationResult> {
  const missing: string[] = [];
  if (!Number.isFinite(v.surface) || v.surface <= 0) missing.push("surface");
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (!Number.isFinite(v.rApres) || v.rApres <= 0) missing.push("r_thermique");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const surface = v.surface;
  const rAvant = v.rAvantSaisi && v.rAvantSaisi > 0 ? v.rAvantSaisi : 1 / defaults.uAvantDefaut;
  const uAvant = 1 / rAvant;
  const uApres = 1 / v.rApres;
  const deltaU = uAvant - uApres;
  if (deltaU <= 0) return ko(["delta_u_negatif"]);

  const dju = zoneData.dju;
  const deperditionsEviteesKwh = (deltaU * surface * dju * 24) / (RENDEMENT_INSTALLATION * 1000);
  const gainMwh = deperditionsEviteesKwh / 1000;
  const consoAvantKwh = (uAvant * surface * dju * 24) / (RENDEMENT_INSTALLATION * 1000);
  const gainPct = consoAvantKwh > 0 ? (deperditionsEviteesKwh / consoAvantKwh) * 100 : 0;

  const energieExistante = v.energieExistante ?? "Gaz naturel";
  const facteur = facteurCo2(energieExistante);
  const reductionCo2 = (deperditionsEviteesKwh * facteur) / 1000;
  const prix = prixEnergie(energieExistante);
  const economiEuros = deperditionsEviteesKwh * prix;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac(defaults.ficheId, gainMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Méthode ΔU × S × DJU × 24 / η — ${defaults.paroi} — Zone ${v.zoneClimatique}`,
    `DJU base 18°C: ${dju}`,
    "",
    `R_avant: ${v.rAvantSaisi && v.rAvantSaisi > 0 ? `${v.rAvantSaisi.toFixed(2)} m².K/W (saisie)` : `défaut ${(1 / defaults.uAvantDefaut).toFixed(2)} m².K/W`} → U_avant = ${uAvant.toFixed(2)} W/m².K`,
    `R_après: ${v.rApres.toFixed(2)} m².K/W → U_après = ${uApres.toFixed(2)} W/m².K`,
    `ΔU = ${uAvant.toFixed(2)} − ${uApres.toFixed(2)} = ${deltaU.toFixed(2)} W/m².K`,
    "",
    `Surface concernée: ${surface} m²`,
    `Rendement installation chauffage (forfait): ${RENDEMENT_INSTALLATION}`,
    "",
    `Gain = ΔU × S × DJU × 24 / (η × 1000)`,
    `     = ${deltaU.toFixed(2)} × ${surface} × ${dju} × 24 / (${RENDEMENT_INSTALLATION} × 1000)`,
    `     = ${deperditionsEviteesKwh.toFixed(0)} kWh EF/an (${gainMwh.toFixed(1)} MWh/an)`,
    `Conso de référence sur la paroi: ${consoAvantKwh.toFixed(0)} kWh/an → gain ≈ ${gainPct.toFixed(1)} %`,
    "",
    `Énergie substituée: ${energieExistante} (prix ${prix} €/kWh · CO₂ ${facteur} kgCO₂e/kWh)`,
    `Réduction CO₂ = ${reductionCo2.toFixed(2)} tCO₂e/an`,
    `Économie = ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${cumac.cumacMWh.toFixed(0)} MWh cumac (${cumac.duree} ans · coef ${cumac.coefActu.toFixed(3)})` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: consoAvantKwh / 1000,
    consoAvant: consoAvantKwh / 1000,
    consoApres: (consoAvantKwh - deperditionsEviteesKwh) / 1000,
    gainMwh,
    gainPct,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    uAvant,
    uApres,
    deltaU,
    surface,
  });
}

/* ─── Méthode 2 : Forfait CEE ──────────────────────────────────── */

export function calculerForfait(
  v: IsolationInputs,
  defaults: ParoiDefaults,
): Result<IsolationResult> {
  const missing: string[] = [];
  if (!Number.isFinite(v.surface) || v.surface <= 0) missing.push("surface");
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const hKey = zoneToHKey(v.zoneClimatique);
  const forfaitDef = FORFAITS_CEE[defaults.ficheId];
  const forfait = forfaitDef[hKey];
  const cumacKWh = forfait * v.surface;

  // computeCumac avec gain temporaire pour récupérer durée + coef.
  const dummy = computeCumac(defaults.ficheId, 1);
  const duree = dummy?.duree ?? 30;
  const coef = dummy?.coefActu ?? 1;
  const gainKwh = cumacKWh / (duree * coef);
  const gainMwh = gainKwh / 1000;

  const energieExistante = v.energieExistante ?? "Gaz naturel";
  const facteur = facteurCo2(energieExistante);
  const reductionCo2 = (gainKwh * facteur) / 1000;
  const prix = prixEnergie(energieExistante);
  const economiEuros = gainKwh * prix;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const detailMethode = [
    `Forfait CEE — fiche ${defaults.ficheId} (${defaults.paroi}, zone ${hKey})`,
    `Référence : ${forfaitDef.arrete} (application ${forfaitDef.dateApplication})`,
    `Surface isolée : ${v.surface} m² · Forfait : ${forfait} kWh cumac/m²`,
    "",
    `Volume CEE = ${forfait} × ${v.surface} = ${cumacKWh.toFixed(0)} kWh cumac (${(cumacKWh / 1000).toFixed(0)} MWh cumac)`,
    `Durée conventionnelle : ${duree} ans · coef actualisation : ${coef.toFixed(3)}`,
    `Gain énergie finale = cumac / (durée × coef) = ${gainKwh.toFixed(0)} kWh/an (${gainMwh.toFixed(1)} MWh/an)`,
    "",
    `Énergie substituée : ${energieExistante} (prix ${prix} €/kWh · CO₂ ${facteur} kgCO₂e/kWh)`,
    `Réduction CO₂ : ${reductionCo2.toFixed(2)} tCO₂e/an`,
    `Économie : ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  const rAvantSaisi = v.rAvantSaisi ?? 0;
  const uApres = v.rApres > 0 ? 1 / v.rApres : 0;
  const uAvant = rAvantSaisi > 0 ? 1 / rAvantSaisi : 0;
  const deltaU = Math.max(0, uAvant - uApres);

  return ok({
    besoinChauffage: gainMwh,
    consoAvant: gainMwh,
    consoApres: 0,
    gainMwh,
    gainPct: 0,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    uAvant,
    uApres,
    deltaU,
    surface: v.surface,
  });
}
