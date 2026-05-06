/**
 * BAR-TH-159 — Pompe à chaleur hybride résidentielle
 * (PAC air/eau + chaudière condensation appoint).
 *
 * Méthode DJU + bascule par bin climatique :
 *  - Besoin = G × V × DJU × 24, apports gratuits 15 %.
 *  - Répartition PAC ↔ chaudière selon T° de bascule (heures par bin).
 *  - SCOP effectif = SCOP_nominal × 0.85 (correction saisonnière prudente).
 *
 * Référence : Arrêté du 22 décembre 2014 modifié — fiche BAR-TH-159.
 */

import {
  type FicheCalculResult,
  type Result,
  ok,
  ko,
} from "../types";
import { coeffGFromAnnee } from "../methodes/coef-g";
import { computeCumac } from "../methodes/cumac";
import {
  FACTEUR_CO2_ELEC_CHAUFFAGE,
  PRIX_ELEC_KWH,
  PRIX_GAZ_KWH,
  prixEnergie,
} from "../constants";
import { getZoneData } from "../zones";
import {
  rendementGenerateur,
  rendementEmetteursFrom,
  facteurCo2Lookup as facteurCo2,
} from "./helpers";

export interface BarTh159Inputs {
  surfaceHabitable: number;
  zoneClimatique: string;
  anneeConstruction?: number;
  hauteurPlafond?: number;
  scopOrCop: number; // SCOP préféré, COP fallback
  tBascule?: number; // °C, défaut -2°C
  energieExistante?: string;
  typeChauffageExistant?: string;
  emetteursExistants?: string;
  coutInvestissement?: number;
}

export interface BarTh159Result extends FicheCalculResult {
  /** Fraction de la couverture chauffage assurée par la PAC (0-1). */
  partPac: number;
}

export function calculer(v: BarTh159Inputs): Result<BarTh159Result> {
  const missing: string[] = [];
  if (!Number.isFinite(v.surfaceHabitable) || v.surfaceHabitable <= 0) missing.push("surface_habitable");
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (!Number.isFinite(v.scopOrCop) || v.scopOrCop <= 0) missing.push("scop");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const surface = v.surfaceHabitable;
  const annee = v.anneeConstruction ?? 0;
  const hsp = v.hauteurPlafond ?? 2.5;
  const volume = surface * hsp;
  const G = coeffGFromAnnee(annee);
  const besoinBrutKwh = (G * volume * zoneData.dju * 24) / 1000;
  const besoinKwh = besoinBrutKwh * 0.85;
  const besoinMwh = besoinKwh / 1000;

  const tBascule = v.tBascule ?? -2;
  let heuresChaud = 0;
  let heuresPac = 0;
  for (const bin of zoneData.bins) {
    if (bin.tExt >= 18) continue;
    if (bin.tExt < tBascule) heuresChaud += bin.heures;
    else heuresPac += bin.heures;
  }
  const heuresChauffage = heuresChaud + heuresPac;
  const partPac = heuresChauffage > 0 ? heuresPac / heuresChauffage : 0.8;

  const besoinPac = besoinKwh * partPac;
  const besoinChaud = besoinKwh * (1 - partPac);
  const scopEff = v.scopOrCop * 0.85;
  const rendCondens = 0.95;

  const energieExistante = v.energieExistante ?? "Gaz naturel";
  const rendGenAvant = rendementGenerateur(v.typeChauffageExistant);
  const rendEmet = rendementEmetteursFrom(v.emetteursExistants);
  const rendAvant = rendGenAvant * rendEmet;

  const consoAvantKwh = besoinKwh / rendAvant;
  const consoPacKwh = besoinPac / scopEff;
  const consoChaudKwh = besoinChaud / rendCondens;
  const consoApresKwh = consoPacKwh + consoChaudKwh;

  const consoAvant = consoAvantKwh / 1000;
  const consoApres = consoApresKwh / 1000;
  const gainMwh = consoAvant - consoApres;
  const gainPct = consoAvant > 0 ? (gainMwh / consoAvant) * 100 : 0;

  const facteurAvant = facteurCo2(energieExistante);
  const facteurGaz = facteurCo2("Gaz naturel");
  const co2Avant = consoAvantKwh * facteurAvant;
  const co2Apres = consoPacKwh * FACTEUR_CO2_ELEC_CHAUFFAGE + consoChaudKwh * facteurGaz;
  const reductionCo2 = (co2Avant - co2Apres) / 1000;

  const prixAvant = prixEnergie(energieExistante);
  const coutAvant = consoAvantKwh * prixAvant;
  const coutApres = consoPacKwh * PRIX_ELEC_KWH + consoChaudKwh * PRIX_GAZ_KWH;
  const economiEuros = coutAvant - coutApres;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAR-TH-159", gainMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Méthode DJU + bascule PAC/chaudière par bins — Zone ${v.zoneClimatique}`,
    `Surface: ${surface} m² · Volume: ${volume.toFixed(0)} m³`,
    `G (année ${Number.isFinite(annee) && annee > 0 ? annee : "?"}) = ${G.toFixed(2)} W/m³.K · DJU = ${zoneData.dju}`,
    "",
    `Besoin brut = ${besoinBrutKwh.toFixed(0)} kWh · Apports 15 % → ${besoinKwh.toFixed(0)} kWh/an (${besoinMwh.toFixed(1)} MWh/an)`,
    "",
    `Répartition (bascule ${tBascule}°C) : ${heuresPac} h PAC (${(partPac * 100).toFixed(0)} %) · ${heuresChaud} h chaudière (${((1 - partPac) * 100).toFixed(0)} %)`,
    "",
    `AVANT : ${energieExistante} · gén. η=${rendGenAvant.toFixed(2)} · émet. η=${rendEmet.toFixed(2)} → η global=${rendAvant.toFixed(2)}`,
    `  Conso AVANT = ${consoAvantKwh.toFixed(0)} kWh/an`,
    `APRÈS :`,
    `  PAC : ${besoinPac.toFixed(0)} kWh / SCOP ${scopEff.toFixed(2)} = ${consoPacKwh.toFixed(0)} kWh élec`,
    `  Chaudière cond. : ${besoinChaud.toFixed(0)} kWh / ${rendCondens} = ${consoChaudKwh.toFixed(0)} kWh gaz`,
    `  Total = ${consoApresKwh.toFixed(0)} kWh/an`,
    "",
    `Gain = ${gainMwh.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %)`,
    `Réduction CO₂ = ${reductionCo2.toFixed(2)} tCO₂e/an`,
    `Économie = ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${cumac.cumacMWh.toFixed(0)} MWh cumac (${cumac.duree} ans · coef ${cumac.coefActu.toFixed(3)})` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: besoinMwh,
    partPac,
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
