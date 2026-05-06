/**
 * BAT-TH-116 — Système de gestion technique du bâtiment (GTB).
 *
 * Méthode forfaitaire NF EN ISO 52120-1 / EN 15232 :
 *  - Classe A : 30 % chauffage / 20 % climatisation.
 *  - Classe B : 18 % chauffage / 14 % climatisation.
 *
 * Conso de référence (kWh EF/m²·an, classe C) :
 *  - Chauffage : 110 (tertiaire moyen — ADEME/CEREN).
 *  - Clim     : 25 (si présente).
 *
 * Référence : Arrêté du 22 décembre 2014 modifié — fiche BAT-TH-116.
 */

import {
  type FicheCalculResult,
  type Result,
  ok,
  ko,
} from "../types";
import { computeCumac } from "../methodes/cumac";
import {
  FACTEUR_CO2_ELEC_CHAUFFAGE,
  PRIX_ELEC_KWH,
  PRIX_GAZ_KWH,
} from "../constants";
import { facteurCo2Lookup as facteurCo2 } from "./helpers";

export interface BatTh116Inputs {
  surfaceBatiment: number;
  /** Classe GTB cible : "A" ou "B" (libellé tolérant). */
  classeGtb: string;
  /** Présence d'une régulation clim existante (libellé). Si "Aucune…" → pas de gain clim. */
  regulationClimExistante?: string;
  /** Type de bâtiment (pour le détail). */
  typeBatiment?: string;
  zoneClimatique?: string;
  coutInvestissement?: number;
}

export interface BatTh116Result extends FicheCalculResult {
  classe: "A" | "B";
  surface: number;
  consoAvantChauffKwh: number;
  consoAvantClimKwh: number;
  gainChauffKwh: number;
  gainClimKwh: number;
}

const RATIO_CHAUFFAGE_REF = 110; // kWh/m²·an
const RATIO_CLIM_REF = 25;       // kWh/m²·an

const FACTEURS_PAR_CLASSE: Record<"A" | "B", { chauff: number; clim: number }> = {
  A: { chauff: 0.30, clim: 0.20 },
  B: { chauff: 0.18, clim: 0.14 },
};

export function calculer(v: BatTh116Inputs): Result<BatTh116Result> {
  const missing: string[] = [];
  if (!Number.isFinite(v.surfaceBatiment) || v.surfaceBatiment <= 0) missing.push("surface_batiment");
  if (missing.length > 0) return ko(missing);

  const classe: "A" | "B" = (v.classeGtb ?? "").includes("A") ? "A" : "B";
  const facteurs = FACTEURS_PAR_CLASSE[classe];

  const hasClim =
    !!v.regulationClimExistante &&
    !v.regulationClimExistante.toLowerCase().includes("aucune");
  const ratioClim = hasClim ? RATIO_CLIM_REF : 0;

  const consoAvantChauffKwh = v.surfaceBatiment * RATIO_CHAUFFAGE_REF;
  const consoAvantClimKwh = v.surfaceBatiment * ratioClim;

  const gainChauffKwh = consoAvantChauffKwh * facteurs.chauff;
  const gainClimKwh = consoAvantClimKwh * facteurs.clim;
  const gainTotalKwh = gainChauffKwh + gainClimKwh;
  const gainMwh = gainTotalKwh / 1000;

  const consoTotaleAvantKwh = consoAvantChauffKwh + consoAvantClimKwh;
  const gainPct = consoTotaleAvantKwh > 0 ? (gainTotalKwh / consoTotaleAvantKwh) * 100 : 0;

  // Hypothèse : chauffage = gaz, clim = élec (mix usuel tertiaire)
  const reductionCo2 = (gainChauffKwh * facteurCo2("Gaz naturel") + gainClimKwh * FACTEUR_CO2_ELEC_CHAUFFAGE) / 1000;
  const economiEuros = gainChauffKwh * PRIX_GAZ_KWH + gainClimKwh * PRIX_ELEC_KWH;

  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAT-TH-116", gainMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Méthode forfaitaire NF EN ISO 52120-1 / EN 15232 — Classe ${classe}`,
    `Bâtiment : ${v.typeBatiment ?? "?"} · Surface : ${v.surfaceBatiment} m² · Zone : ${v.zoneClimatique ?? "?"}`,
    "",
    `Conso de référence (tertiaire moyen, base classe C = 1) :`,
    `  Chauffage : ${RATIO_CHAUFFAGE_REF} kWh/m²·an × ${v.surfaceBatiment} = ${consoAvantChauffKwh.toFixed(0)} kWh/an`,
    `  Clim      : ${ratioClim} kWh/m²·an × ${v.surfaceBatiment} = ${consoAvantClimKwh.toFixed(0)} kWh/an${hasClim ? "" : " (pas de clim)"}`,
    "",
    `Facteurs de réduction classe ${classe} :`,
    `  Chauffage : ${(facteurs.chauff * 100).toFixed(0)} % → gain = ${gainChauffKwh.toFixed(0)} kWh/an`,
    `  Clim      : ${(facteurs.clim * 100).toFixed(0)} % → gain = ${gainClimKwh.toFixed(0)} kWh/an`,
    "",
    `Gain total = ${gainTotalKwh.toFixed(0)} kWh/an (${gainMwh.toFixed(1)} MWh/an) · ${gainPct.toFixed(1)} % de la réf.`,
    `Réduction CO₂ : ${reductionCo2.toFixed(2)} tCO₂e/an`,
    `Économie : gaz ${Math.round(gainChauffKwh * PRIX_GAZ_KWH)} € + élec ${Math.round(gainClimKwh * PRIX_ELEC_KWH)} € = ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${cumac.cumacMWh.toFixed(0)} MWh cumac (${cumac.duree} ans · coef ${cumac.coefActu.toFixed(3)})` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: consoAvantChauffKwh / 1000,
    consoAvant: consoTotaleAvantKwh / 1000,
    consoApres: (consoTotaleAvantKwh - gainTotalKwh) / 1000,
    gainMwh,
    gainPct,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    classe,
    surface: v.surfaceBatiment,
    consoAvantChauffKwh,
    consoAvantClimKwh,
    gainChauffKwh,
    gainClimKwh,
  });
}
