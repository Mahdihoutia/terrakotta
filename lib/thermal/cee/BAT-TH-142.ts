/**
 * BAT-TH-142 — Déstratification de l'air par brassage tertiaire.
 *
 * Méthode forfaitaire : 3 % d'économie chauffage par °C de gradient
 * thermique réduit, plafonnée à 30 %. Soustraction de la conso élec
 * des déstratificateurs.
 *
 * Référence : Arrêté du 22 décembre 2014 modifié — fiche BAT-TH-142.
 */

import {
  type FicheCalculResult,
  type Result,
  ok,
  ko,
} from "../types";
import { computeCumac } from "../methodes/cumac";
import { FACTEUR_CO2_ELEC_CHAUFFAGE, prixEnergie } from "../constants";
import { facteurCo2Lookup as facteurCo2 } from "./helpers";

export interface BatTh142Inputs {
  /** Gradient AVANT (°C entre sol et sous toiture). */
  gradientAvant: number;
  /** Gradient APRÈS (°C cible). */
  gradientApres: number;
  /** Conso chauffage avant (MWh/an). */
  consoAvant: number;
  /** Nombre de déstratificateurs installés. */
  nbDestratificateurs: number;
  /** Puissance unitaire (kW). */
  puissanceUnitaire: number;
  /** Heures de fonctionnement annuelles (par défaut 4000h). */
  heuresFonctionnement?: number;
  /** Hauteur sous plafond (m, pour le détail). */
  hauteurSousPlafond?: number;
  /** Surface du local (m², pour le détail). */
  surfaceLocal?: number;
  /** Énergie de chauffage (libellé). */
  energieChauffage?: string;
  coutInvestissement?: number;
  tempSolMesuree?: number;
  tempSousToiture?: number;
}

export interface BatTh142Result extends FicheCalculResult {
  reductionGradient: number;
  gainBrutPct: number;
  consoDestrat: number;
  gainNetPct: number;
  /** Alias historique pour compat UI : === gainMwh. */
  gainNetMwh: number;
}

export function calculer(v: BatTh142Inputs): Result<BatTh142Result> {
  const missing: string[] = [];
  if (!Number.isFinite(v.gradientAvant) || v.gradientAvant <= 0) missing.push("gradient_avant");
  if (!Number.isFinite(v.consoAvant) || v.consoAvant <= 0) missing.push("conso_chauffage_avant");
  if (missing.length > 0) return ko(missing);

  const reductionGradient = v.gradientAvant - v.gradientApres;
  if (reductionGradient <= 0) return ko(["gradient_apres_superieur"]);

  const gainBrutPct = Math.min(30, reductionGradient * 3);
  const economieBrute = v.consoAvant * (gainBrutPct / 100);

  const heures = v.heuresFonctionnement ?? 4000;
  const consoDestrat = (v.nbDestratificateurs * v.puissanceUnitaire * heures) / 1000;

  const gainNetMwh = economieBrute - consoDestrat;
  const consoApres = v.consoAvant - gainNetMwh;
  const gainNetPct = (gainNetMwh / v.consoAvant) * 100;

  const energie = v.energieChauffage ?? "Gaz naturel";
  const prix = prixEnergie(energie);
  const economiEuros = gainNetMwh * 1000 * prix;
  const facteur = facteurCo2(energie);
  const reductionCo2 = (economieBrute * 1000 * facteur - consoDestrat * 1000 * FACTEUR_CO2_ELEC_CHAUFFAGE) / 1000;

  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAT-TH-142", gainNetMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Méthode forfaitaire — Règle des 3 %/°C plafonnée à 30 %`,
    `Hauteur SP : ${v.hauteurSousPlafond ?? "?"} m · Surface : ${v.surfaceLocal ?? "?"} m²`,
    "",
    `Stratification :`,
    `  T° sol : ${v.tempSolMesuree ?? "?"}°C · T° sous toiture : ${v.tempSousToiture ?? "?"}°C`,
    `  Gradient AVANT : ${v.gradientAvant.toFixed(1)}°C → APRÈS : ${v.gradientApres.toFixed(1)}°C → réduction ${reductionGradient.toFixed(1)}°C`,
    "",
    `Économie brute = ${reductionGradient.toFixed(1)} × 3 %/°C = ${gainBrutPct.toFixed(1)} % × ${v.consoAvant.toFixed(1)} = ${economieBrute.toFixed(1)} MWh/an`,
    `Conso déstratificateurs = ${v.nbDestratificateurs} × ${v.puissanceUnitaire} kW × ${heures} h / 1000 = ${consoDestrat.toFixed(2)} MWh/an`,
    `Gain NET = ${economieBrute.toFixed(1)} − ${consoDestrat.toFixed(2)} = ${gainNetMwh.toFixed(1)} MWh/an (${gainNetPct.toFixed(1)} %)`,
    "",
    `Conso AVANT : ${v.consoAvant.toFixed(1)} MWh/an → APRÈS : ${consoApres.toFixed(1)} MWh/an`,
    `Réduction CO₂ : ${reductionCo2.toFixed(2)} tCO₂e/an`,
    `Économie : ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${gainNetMwh.toFixed(1)} MWh × ${cumac.duree} ans × ${cumac.coefActu.toFixed(3)} = ${cumac.cumacMWh.toFixed(0)} MWh cumac` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: v.consoAvant,
    consoAvant: v.consoAvant,
    consoApres,
    gainMwh: gainNetMwh,
    gainPct: gainNetPct,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    reductionGradient,
    gainBrutPct,
    consoDestrat,
    gainNetPct,
    gainNetMwh, // alias historique pour compat UI
  });
}
