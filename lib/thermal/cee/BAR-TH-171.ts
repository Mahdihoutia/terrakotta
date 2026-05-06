/**
 * BAR-TH-171 — Pompe à chaleur de type air/eau (résidentiel).
 *
 * Trois méthodes de calcul :
 *  - DJU              : besoins = G × V × DJU × 24, conso après = besoins / SCOP
 *  - SCOP_DETAILLE    : SCOP effectif pondéré sur 4 bins normatifs (NF EN 14825)
 *  - FORFAITAIRE_CEE  : forfait kWh cumac / m² × surface chauffée selon zone H
 *
 * Référence réglementaire : Arrêté du 22 décembre 2014 modifié — fiche
 * BAR-TH-171 (publication 5e période CEE).
 *
 * Module pur — pas de React, pas de DOM.
 */

import {
  type FicheCalculResult,
  type MethodeCalcul,
  type Result,
  ok,
  ko,
} from "../types";
import { coeffGFromAnnee } from "../methodes/coef-g";
import { computeCumac } from "../methodes/cumac";
import {
  FACTEUR_CO2_ELEC_CHAUFFAGE,
  PRIX_ELEC_KWH,
  prixEnergie,
} from "../constants";
import { getZoneData } from "../zones";
import { FORFAITS_CEE } from "./forfaits";
import {
  zoneToHKey,
  rendementGenerateur,
  rendementEmetteursFrom,
  facteurCo2Lookup as facteurCo2,
} from "./helpers";

/* ─── Inputs typés ─────────────────────────────────────────────── */

export interface BarTh171Inputs {
  surfaceHabitable: number;            // m²
  zoneClimatique: string;              // libellé "H1a — Nord", etc.
  anneeConstruction?: number;
  hauteurPlafond?: number;             // m, défaut 2.5
  scop: number;                        // SCOP de la PAC déclaré (méthode DJU/SCOP)
  energieExistante?: string;           // libellé EnergieExistante
  typeChauffageExistant?: string;      // libellé TypeGenerateur
  emetteursExistants?: string;         // libellé d'émetteurs (basse temp, plancher chauffant…)
  coutInvestissement?: number;         // €
  methode: MethodeCalcul;
}

/* ─── Garde-fous : seuils d'éligibilité de la fiche ───────────── */

export interface EligibilityIssue {
  code: "SURFACE_MIN" | "SCOP_MIN" | "ZONE_INCONNUE" | "TYPE_BATIMENT";
  message: string;
}

/**
 * Vérifie l'éligibilité de l'opération à la fiche BAR-TH-171 avant calcul.
 * Sources : arrêté en vigueur — voir `forfaits.ts`.
 */
export function checkEligibilite(inputs: BarTh171Inputs): EligibilityIssue[] {
  const issues: EligibilityIssue[] = [];
  if (!inputs.zoneClimatique || !getZoneData(inputs.zoneClimatique)) {
    issues.push({ code: "ZONE_INCONNUE", message: "Zone climatique non renseignée ou inconnue." });
  }
  if (!Number.isFinite(inputs.surfaceHabitable) || inputs.surfaceHabitable <= 0) {
    issues.push({ code: "SURFACE_MIN", message: "Surface chauffée doit être > 0 m²." });
  }
  // Seuil SCOP : la fiche BAR-TH-171 exige un SCOP ≥ 3,9 (PAC moyenne température)
  // ou 2,5 (haute température). On retient 2,5 comme seuil minimal de bon sens.
  if (inputs.methode !== "FORFAITAIRE_CEE") {
    if (!Number.isFinite(inputs.scop) || inputs.scop < 2.5) {
      issues.push({
        code: "SCOP_MIN",
        message: "SCOP < 2,5 — la fiche BAR-TH-171 exige typiquement SCOP ≥ 3,9 (basse/moyenne T°) ou ≥ 2,5 (haute T°).",
      });
    }
  }
  return issues;
}

/* ─── API publique ─────────────────────────────────────────────── */

export function calculer(inputs: BarTh171Inputs): Result<FicheCalculResult> {
  switch (inputs.methode) {
    case "FORFAITAIRE_CEE": return calculerForfait(inputs);
    case "SCOP_DETAILLE":   return calculerScopDetaille(inputs);
    case "DJU":
    default:                return calculerDJU(inputs);
  }
}

/* ─── Méthode 1 : DJU + besoins thermiques ─────────────────────── */

export function calculerDJU(v: BarTh171Inputs): Result<FicheCalculResult> {
  const missing: string[] = [];
  if (!Number.isFinite(v.surfaceHabitable) || v.surfaceHabitable <= 0) missing.push("surface_habitable");
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (!Number.isFinite(v.scop) || v.scop <= 0) missing.push("scop");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const surface = v.surfaceHabitable;
  const annee = v.anneeConstruction ?? 0;
  const hsp = v.hauteurPlafond ?? 2.5;
  const volume = surface * hsp;
  const G = coeffGFromAnnee(annee);

  // Besoin brut (kWh/an) = G × V × DJU × 24 / 1000 ; apports gratuits 15 %.
  const besoinBrutKwh = (G * volume * zoneData.dju * 24) / 1000;
  const besoinKwh = besoinBrutKwh * 0.85;
  const besoinMwh = besoinKwh / 1000;

  const energieExistante = v.energieExistante ?? "Gaz naturel";
  const rendGen = rendementGenerateur(v.typeChauffageExistant);
  const rendEmet = rendementEmetteursFrom(v.emetteursExistants);
  const rendExistant = rendGen * rendEmet;

  const consoAvantKwh = besoinKwh / rendExistant;
  const consoApresKwh = besoinKwh / v.scop;

  const consoAvant = consoAvantKwh / 1000;
  const consoApres = consoApresKwh / 1000;
  const gainMwh = consoAvant - consoApres;
  const gainPct = consoAvant > 0 ? (gainMwh / consoAvant) * 100 : 0;

  // CO₂
  const facteurAvant = facteurCo2(energieExistante);
  const reductionCo2 = (consoAvantKwh * facteurAvant - consoApresKwh * FACTEUR_CO2_ELEC_CHAUFFAGE) / 1000;

  // Coûts
  const prixAvant = prixEnergie(energieExistante);
  const coutAvant = consoAvantKwh * prixAvant;
  const coutApres = consoApresKwh * PRIX_ELEC_KWH;
  const economiEuros = coutAvant - coutApres;

  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const cumac = computeCumac("BAR-TH-171", gainMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Méthode DJU × déperditions (G × V × DJU) — Zone ${v.zoneClimatique}`,
    `Surface: ${surface} m² · HSP: ${hsp} m · Volume: ${volume.toFixed(0)} m³`,
    `Année construction: ${Number.isFinite(annee) && annee > 0 ? annee : "?"} → G estimé: ${G.toFixed(2)} W/m³.K`,
    `DJU base 18°C zone ${v.zoneClimatique}: ${zoneData.dju}`,
    "",
    `Besoin brut = G × V × DJU × 24 / 1000 = ${G.toFixed(2)} × ${volume.toFixed(0)} × ${zoneData.dju} × 24 / 1000 = ${besoinBrutKwh.toFixed(0)} kWh/an`,
    `Apports gratuits 15 % → besoin net = ${besoinKwh.toFixed(0)} kWh/an (${besoinMwh.toFixed(1)} MWh/an)`,
    "",
    `AVANT : ${energieExistante}, gén. "${v.typeChauffageExistant ?? "?"}" (η=${rendGen.toFixed(2)}), émet. "${v.emetteursExistants ?? "?"}" (η=${rendEmet.toFixed(2)}) → η global=${rendExistant.toFixed(2)}`,
    `  Conso AVANT = ${besoinKwh.toFixed(0)} / ${rendExistant.toFixed(2)} = ${consoAvantKwh.toFixed(0)} kWh/an (${consoAvant.toFixed(1)} MWh/an)`,
    "",
    `APRÈS : PAC air/eau — SCOP = ${v.scop.toFixed(2)}`,
    `  Conso APRÈS = ${besoinKwh.toFixed(0)} / ${v.scop.toFixed(2)} = ${consoApresKwh.toFixed(0)} kWh/an (${consoApres.toFixed(1)} MWh/an)`,
    "",
    `Gain énergétique = ${gainMwh.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %)`,
    `Réduction CO₂ = ${reductionCo2.toFixed(2)} tCO₂e/an (facteurs ${facteurAvant} → ${FACTEUR_CO2_ELEC_CHAUFFAGE} kgCO₂e/kWh)`,
    `Économie = ${Math.round(coutAvant)} € (avant) − ${Math.round(coutApres)} € (après) = ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${gainMwh.toFixed(1)} MWh × ${cumac.duree} ans × ${cumac.coefActu.toFixed(3)} = ${cumac.cumacMWh.toFixed(0)} MWh cumac` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: besoinMwh,
    consoAvant,
    consoApres,
    gainMwh,
    gainPct,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
  });
}

/* ─── Méthode 2 : SCOP NF EN 14825 — 4 bins normatifs ─────────── */

const REPARTITION_BINS_PAR_ZONE: Record<"H1" | "H2" | "H3", { tExt: number; pct: number }[]> = {
  H1: [{ tExt: -7, pct: 0.10 }, { tExt: 2, pct: 0.45 }, { tExt: 7, pct: 0.30 }, { tExt: 12, pct: 0.15 }],
  H2: [{ tExt: -7, pct: 0.05 }, { tExt: 2, pct: 0.40 }, { tExt: 7, pct: 0.35 }, { tExt: 12, pct: 0.20 }],
  H3: [{ tExt: -7, pct: 0.02 }, { tExt: 2, pct: 0.30 }, { tExt: 7, pct: 0.40 }, { tExt: 12, pct: 0.28 }],
};

/** Correction COP empirique : -2.2 % par °C en dessous de 7°C de référence. */
function correctionCopParTemperature(scop7: number, tExt: number): number {
  const correction = 1 - Math.max(0, 7 - tExt) * 0.022;
  return scop7 * Math.max(0.4, correction);
}

export function calculerScopDetaille(v: BarTh171Inputs): Result<FicheCalculResult> {
  const baseR = calculerDJU(v);
  if (!baseR.ok) return baseR;
  const base = baseR.value;

  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) return ok(base); // fallback : on renvoie le DJU brut
  if (!Number.isFinite(v.scop) || v.scop <= 0) return ok(base);

  const hKey = zoneToHKey(v.zoneClimatique);
  const profil = REPARTITION_BINS_PAR_ZONE[hKey];

  let scopEff = 0;
  const lignes: string[] = [];
  for (const p of profil) {
    const cop = correctionCopParTemperature(v.scop, p.tExt);
    scopEff += cop * p.pct;
    lignes.push(`  ${p.tExt}°C → COP=${cop.toFixed(2)} × ${(p.pct * 100).toFixed(0)}%`);
  }

  const consoApresKwh = (base.besoinChauffage * 1000) / scopEff;
  const consoApres = consoApresKwh / 1000;
  const gainMwh = base.consoAvant - consoApres;
  const gainPct = base.consoAvant > 0 ? (gainMwh / base.consoAvant) * 100 : 0;
  const economiEuros =
    base.consoAvant * 1000 * prixEnergie(v.energieExistante ?? "Gaz naturel") - consoApresKwh * PRIX_ELEC_KWH;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAR-TH-171", gainMwh);

  const detailMethode = [
    `Méthode SCOP NF EN 14825 — 4 bins normatifs · Zone ${hKey}`,
    `SCOP nominal déclaré (7°C) : ${v.scop.toFixed(2)}`,
    `Besoin net (méthode DJU) : ${base.besoinChauffage.toFixed(1)} MWh/an`,
    "",
    `Pondération sur 4 températures normatives (zone ${hKey}) :`,
    ...lignes,
    "",
    `SCOP effectif = ${scopEff.toFixed(2)}`,
    `Conso APRÈS = ${(base.besoinChauffage * 1000).toFixed(0)} / ${scopEff.toFixed(2)} = ${consoApresKwh.toFixed(0)} kWh/an (${consoApres.toFixed(1)} MWh/an)`,
    `Conso AVANT (DJU) : ${base.consoAvant.toFixed(1)} MWh/an`,
    `Gain : ${gainMwh.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %) · ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE : ${cumac.cumacMWh.toFixed(0)} MWh cumac` : "",
  ].filter(Boolean).join("\n");

  return ok({
    ...base,
    consoApres,
    gainMwh,
    gainPct,
    economiEuros,
    dureeRetour,
    cumacKWh: cumac?.cumacKWh ?? 0,
    detailMethode,
  });
}

/* ─── Méthode 3 : Forfait CEE (kWh cumac / m² × surface) ───────── */

export function calculerForfait(v: BarTh171Inputs): Result<FicheCalculResult> {
  const missing: string[] = [];
  if (!Number.isFinite(v.surfaceHabitable) || v.surfaceHabitable <= 0) missing.push("surface_habitable");
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const surface = v.surfaceHabitable;
  const hKey = zoneToHKey(v.zoneClimatique);
  const forfaitDef = FORFAITS_CEE["BAR-TH-171"];
  const forfait = forfaitDef[hKey];
  const cumacKWh = forfait * surface;

  const cumac = computeCumac("BAR-TH-171", cumacKWh / 1000); // dummy pour avoir duree+coef
  const duree = cumac?.duree ?? 17;
  const coef = cumac?.coefActu ?? 1;
  const gainMwh = cumacKWh / (1000 * duree * coef);

  // Reconstruction d'un avant/après cohérent (DJU) pour le %
  const annee = v.anneeConstruction ?? 0;
  const G = coeffGFromAnnee(annee);
  const hsp = v.hauteurPlafond ?? 2.5;
  const volume = surface * hsp;
  const besoinKwh = (G * volume * zoneData.dju * 24) / 1000 * 0.85;
  const besoinMwh = besoinKwh / 1000;
  const energieExistante = v.energieExistante ?? "Gaz naturel";
  const rendGen = rendementGenerateur(v.typeChauffageExistant);
  const rendEmet = rendementEmetteursFrom(v.emetteursExistants);
  const rendExistant = rendGen * rendEmet;
  const consoAvant = besoinKwh / rendExistant / 1000;
  const consoApres = Math.max(0, consoAvant - gainMwh);
  const gainPct = consoAvant > 0 ? (gainMwh / consoAvant) * 100 : 0;
  const facteurAvant = facteurCo2(energieExistante);
  const reductionCo2 =
    consoAvant * facteurAvant - consoApres * FACTEUR_CO2_ELEC_CHAUFFAGE;
  const economiEuros =
    consoAvant * 1000 * prixEnergie(energieExistante) - consoApres * 1000 * PRIX_ELEC_KWH;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const detailMethode = [
    `Forfait CEE — fiche BAR-TH-171 (zone ${hKey})`,
    `Référence : ${forfaitDef.arrete} (application ${forfaitDef.dateApplication})`,
    `Surface chauffée : ${surface} m² · Forfait : ${forfait} kWh cumac/m²`,
    "",
    `Volume CEE = ${forfait} × ${surface} = ${cumacKWh.toFixed(0)} kWh cumac (${(cumacKWh / 1000).toFixed(0)} MWh cumac)`,
    `Durée : ${duree} ans · coef : ${coef.toFixed(3)} → gain EF = ${gainMwh.toFixed(1)} MWh/an`,
    "",
    `Conso de référence (G × V × DJU avec G=${G.toFixed(2)}) : ${consoAvant.toFixed(1)} MWh/an`,
    `Conso APRÈS (forfait) : ${consoApres.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %)`,
    `Économie estimée : ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  return ok({
    besoinChauffage: besoinMwh,
    consoAvant,
    consoApres,
    gainMwh,
    gainPct,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
  });
}
