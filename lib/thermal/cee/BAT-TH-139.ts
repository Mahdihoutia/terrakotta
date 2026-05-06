/**
 * BAT-TH-139 — Récupération de chaleur sur groupe froid (tertiaire).
 *
 * Bilan thermique :
 *  - Chaleur au condenseur = (P_froid + P_élec) × heures × τ_charge.
 *  - Chaleur récupérée = chaleur condenseur × τ_récup.
 *  - Conso évitée = chaleur récupérée / η_générateur_remplacé.
 *
 * Référence : Arrêté du 22 décembre 2014 modifié — fiche BAT-TH-139.
 */

import {
  type FicheCalculResult,
  type Result,
  ok,
  ko,
} from "../types";
import { computeCumac } from "../methodes/cumac";
import { prixEnergie } from "../constants";
import { facteurCo2Lookup as facteurCo2 } from "./helpers";

export interface BatTh139Inputs {
  /** Puissance froid nominale (kW). */
  puissanceFroid: number;
  /** Puissance absorbée (kW électrique). */
  puissanceAbsorbee: number;
  /** Heures de fonctionnement annuelles (h). */
  heures: number;
  /** Taux de charge moyen (0-100 %). */
  tauxChargePct: number;
  /** Taux de récupération (0-100 %). */
  tauxRecupPct: number;
  /** Source de chaleur actuelle remplacée (libellé). */
  sourceActuelle?: string;
  /** Conso de chaleur actuelle (MWh/an, pour le %). */
  consoActuelle?: number;
  /** Marque/modèle (pour le détail rédigé). */
  marqueGroupe?: string;
  coutInvestissement?: number;
}

export interface BatTh139Result extends FicheCalculResult {
  chaleurRejetee: number;
  chaleurRecuperee: number;
  consoEvitee: number;
}

/** Rendement du générateur remplacé (forfait par source). */
function rendementGenerateurRemplace(source: string | undefined): number {
  if (!source) return 0.90;
  const s = source.toLowerCase();
  if (s.includes("fioul"))           return 0.85;
  if (s.includes("lectrique"))       return 1.0;
  if (s.includes("seau de chaleur")) return 0.95;
  return 0.90; // gaz par défaut
}

export function calculer(v: BatTh139Inputs): Result<BatTh139Result> {
  const missing: string[] = [];
  if (!Number.isFinite(v.puissanceFroid) || v.puissanceFroid <= 0) missing.push("puissance_froid");
  if (!Number.isFinite(v.puissanceAbsorbee) || v.puissanceAbsorbee <= 0) missing.push("puissance_absorbee");
  if (!Number.isFinite(v.heures) || v.heures <= 0) missing.push("heures_fonctionnement");
  if (!Number.isFinite(v.tauxChargePct) || v.tauxChargePct <= 0) missing.push("taux_charge_moyen");
  if (!Number.isFinite(v.tauxRecupPct) || v.tauxRecupPct <= 0) missing.push("taux_recuperation");
  if (missing.length > 0) return ko(missing);

  const tauxCharge = v.tauxChargePct / 100;
  const tauxRecup = v.tauxRecupPct / 100;

  const chaleurRejetee = ((v.puissanceFroid + v.puissanceAbsorbee) * v.heures * tauxCharge) / 1000;
  const chaleurRecuperee = chaleurRejetee * tauxRecup;

  const sourceActuelle = v.sourceActuelle ?? "Chaudière gaz";
  const rendementRemplace = rendementGenerateurRemplace(sourceActuelle);
  const consoEvitee = chaleurRecuperee / rendementRemplace;

  const consoActuelle = v.consoActuelle ?? 0;
  const gainPct = consoActuelle > 0 ? (consoEvitee / consoActuelle) * 100 : (chaleurRecuperee > 0 ? 100 : 0);

  const facteur = facteurCo2(sourceActuelle);
  const reductionCo2 = consoEvitee * facteur; // MWh × kg/kWh = t

  const prix = prixEnergie(sourceActuelle);
  const economiEuros = consoEvitee * 1000 * prix;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAT-TH-139", consoEvitee);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Bilan thermique de récupération de chaleur sur groupe froid`,
    `Groupe : ${v.marqueGroupe ?? "?"} · P_froid = ${v.puissanceFroid} kW · P_élec = ${v.puissanceAbsorbee} kW`,
    `Fonctionnement : ${v.heures} h/an · taux de charge ${(tauxCharge * 100).toFixed(0)} %`,
    "",
    `Chaleur au condenseur = (${v.puissanceFroid} + ${v.puissanceAbsorbee}) × ${v.heures} × ${(tauxCharge * 100).toFixed(0)}% / 1000 = ${chaleurRejetee.toFixed(1)} MWh/an`,
    `Chaleur récupérée = ${chaleurRejetee.toFixed(1)} × ${(tauxRecup * 100).toFixed(0)}% = ${chaleurRecuperee.toFixed(1)} MWh/an`,
    "",
    `Source remplacée : ${sourceActuelle} (η = ${(rendementRemplace * 100).toFixed(0)} %)`,
    `Conso évitée = ${chaleurRecuperee.toFixed(1)} / ${rendementRemplace.toFixed(2)} = ${consoEvitee.toFixed(1)} MWh/an`,
    "",
    `Réduction CO₂ : ${reductionCo2.toFixed(1)} tCO₂e/an`,
    `Économie : ${consoEvitee.toFixed(1)} MWh/an · ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${consoEvitee.toFixed(1)} MWh × ${cumac.duree} ans × ${cumac.coefActu.toFixed(3)} = ${cumac.cumacMWh.toFixed(0)} MWh cumac` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: chaleurRecuperee,
    consoAvant: consoActuelle,
    consoApres: Math.max(0, consoActuelle - consoEvitee),
    gainMwh: consoEvitee,
    gainPct,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    chaleurRejetee,
    chaleurRecuperee,
    consoEvitee,
  });
}
