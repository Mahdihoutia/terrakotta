/**
 * BAT-TH-163 — Pompe à chaleur de type air/eau pour le tertiaire.
 *
 * 3 méthodes :
 *  - DJU     : G × V × DJU + couverture PAC + appoint.
 *  - BIN     : SCOP effectif pondéré (NF EN 14825) sur les bins de la zone.
 *  - FORFAIT : kWh cumac/kW PAC × puissance.
 *
 * Référence : Arrêté du 22 décembre 2014 modifié — fiche BAT-TH-163.
 */

import {
  type FicheCalculResult,
  type MethodeCalcul,
  type Result,
  ok,
  ko,
} from "../types";
import {
  computeCumac,
  coefActualisation,
  DUREE_VIE_CONV,
} from "../methodes/cumac";
import {
  FACTEUR_CO2_ELEC_CHAUFFAGE,
  PRIX_ELEC_KWH,
  U_MURS,
  U_TOITURE,
  U_VITRAGE,
  prixEnergie,
} from "../constants";
import { getZoneData } from "../zones";
import { FORFAITS_CEE } from "./forfaits";
import {
  zoneToHKey,
  rendementGenerateur,
  facteurCo2Lookup as facteurCo2,
} from "./helpers";

export interface BatTh163Inputs {
  surfaceChauffee: number;
  zoneClimatique: string;
  tempBase?: number;
  tempInterieure?: number;
  nbNiveaux?: number;
  hauteurSousPlafond?: number;
  volumeChauffe?: number;
  surfaceToiture?: number;
  surfaceMursExt?: number;
  tauxVitragePct?: number;
  isolationMurs?: string;
  isolationToiture?: string;
  typeVitrage?: string;
  tauxRenouvellementAir?: number;
  partApportsGratuitsPct?: number;
  typeGenerateurExistant?: string;
  energieExistante?: string;
  scop: number;
  tauxCouverturePct?: number;
  /** Puissance PAC (kW) — utilisée par la méthode forfait, fallback déperditions. */
  puissancePac?: number;
  coutInvestissement?: number;
  methode: MethodeCalcul;
}

export interface BatTh163Result extends FicheCalculResult {
  volumeChauffe: number;
  deperditionsParois: number;
  deperditionsVentilation: number;
  deperditionsTotales: number;
  coeffG: number;
  deperditionsParM2: number;
}

export function calculer(v: BatTh163Inputs): Result<BatTh163Result> {
  switch (v.methode) {
    case "FORFAITAIRE_CEE": return calculerForfait(v);
    case "BIN":             return calculerBin(v);
    case "DJU":
    default:                return calculerDJU(v);
  }
}

/* ─── DJU ──────────────────────────────────────────────────────── */

export function calculerDJU(v: BatTh163Inputs): Result<BatTh163Result> {
  const missing: string[] = [];
  if (!Number.isFinite(v.surfaceChauffee) || v.surfaceChauffee <= 0) missing.push("surface_chauffee");
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (!Number.isFinite(v.scop) || v.scop <= 0) missing.push("scop");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const tempBase = v.tempBase ?? zoneData.tBase;
  const tempInt = v.tempInterieure ?? 19;
  const deltaT = tempInt - tempBase;
  if (deltaT <= 0) return ko(["delta_t_invalide"]);

  const nbNiveaux = v.nbNiveaux && v.nbNiveaux > 0 ? v.nbNiveaux : 1;
  const hsp = v.hauteurSousPlafond ?? 3;
  const volumeChauffe =
    v.volumeChauffe && v.volumeChauffe > 0 ? v.volumeChauffe : v.surfaceChauffee * hsp;

  const surfaceToiture = v.surfaceToiture ?? v.surfaceChauffee / nbNiveaux;
  const surfacePlancher = surfaceToiture;
  const perimetre = Math.sqrt(surfacePlancher) * 4;
  const hauteurTotale = hsp * nbNiveaux;
  const surfaceMursExt = v.surfaceMursExt ?? perimetre * hauteurTotale;
  const tauxVitrage = (v.tauxVitragePct ?? 25) / 100;
  const surfaceVitree = surfaceMursExt * tauxVitrage;
  const surfaceMursOpaques = surfaceMursExt - surfaceVitree;

  const uMur = U_MURS[v.isolationMurs ?? "Inconnu"] ?? 1.5;
  const uToiture = U_TOITURE[v.isolationToiture ?? "Inconnu"] ?? 1.5;
  const uVitrage = U_VITRAGE[v.typeVitrage ?? "Mixte"] ?? 2.5;
  const uPlancher = 0.8;

  const depMurs = surfaceMursOpaques * uMur * deltaT;
  const depToiture = surfaceToiture * uToiture * deltaT;
  const depVitrage = surfaceVitree * uVitrage * deltaT;
  const depPlancher = surfacePlancher * uPlancher * deltaT * 0.6;
  const deperditionsParois = (depMurs + depToiture + depVitrage + depPlancher) / 1000;

  const tauxRenouv = v.tauxRenouvellementAir ?? 0.7;
  const depVentilation = (0.34 * tauxRenouv * volumeChauffe * deltaT) / 1000;

  const deperditionsTotales = (deperditionsParois + depVentilation) * 1.15;
  const coeffG = (deperditionsTotales * 1000) / (volumeChauffe * deltaT);
  const deperditionsParM2 = (deperditionsTotales * 1000) / v.surfaceChauffee;

  const besoinBrut = (coeffG * volumeChauffe * zoneData.dju * 24) / 1e6;
  const partApports = (v.partApportsGratuitsPct ?? 15) / 100;
  const coefApports = Math.max(0, Math.min(0.35, partApports));
  const besoinChauffage = besoinBrut * (1 - coefApports);

  const rendExistant = rendementGenerateur(v.typeGenerateurExistant);
  const consoAvant = besoinChauffage / rendExistant;
  const tauxCouverture = (v.tauxCouverturePct ?? 90) / 100;
  const consoApres =
    (besoinChauffage * tauxCouverture) / v.scop +
    (besoinChauffage * (1 - tauxCouverture)) / rendExistant;

  const gainMwh = consoAvant - consoApres;
  const gainPct = consoAvant > 0 ? (gainMwh / consoAvant) * 100 : 0;

  const energie = v.energieExistante ?? "Gaz naturel";
  const facteurAvant = facteurCo2(energie);
  const reductionCo2 = consoAvant * facteurAvant - consoApres * FACTEUR_CO2_ELEC_CHAUFFAGE;

  const prixAvant = prixEnergie(energie);
  const coutAvant = consoAvant * 1000 * prixAvant;
  const coutApres = consoApres * 1000 * PRIX_ELEC_KWH;
  const economiEuros = coutAvant - coutApres;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAT-TH-163", gainMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Méthode G × V × DJU avec apports gratuits — Zone ${v.zoneClimatique}`,
    `DJU base 18°C : ${zoneData.dju} · T° base ${tempBase}°C · T° int ${tempInt}°C · ΔT = ${deltaT} K`,
    "",
    `Déperditions parois (kW) :`,
    `  Murs (${surfaceMursOpaques.toFixed(0)} m² × U=${uMur}) : ${(depMurs / 1000).toFixed(1)}`,
    `  Toiture (${surfaceToiture.toFixed(0)} m² × U=${uToiture}) : ${(depToiture / 1000).toFixed(1)}`,
    `  Vitrages (${surfaceVitree.toFixed(0)} m² × U=${uVitrage}) : ${(depVitrage / 1000).toFixed(1)}`,
    `  Plancher (${surfacePlancher.toFixed(0)} m² × U=${uPlancher} × 0.6) : ${(depPlancher / 1000).toFixed(1)}`,
    `  Sous-total : ${deperditionsParois.toFixed(1)} kW`,
    "",
    `Ventilation (${tauxRenouv} vol/h × ${volumeChauffe.toFixed(0)} m³) : ${depVentilation.toFixed(1)} kW`,
    `Ponts thermiques forfait +15 % → Total ${deperditionsTotales.toFixed(1)} kW · G = ${coeffG.toFixed(2)} W/m³.K`,
    "",
    `Besoin BRUT = G × V × DJU × 24 / 10⁶ = ${besoinBrut.toFixed(1)} MWh/an`,
    `Apports gratuits ${(coefApports * 100).toFixed(0)} % → Besoin NET = ${besoinChauffage.toFixed(1)} MWh/an`,
    `Conso AVANT = ${besoinChauffage.toFixed(1)} / η ${rendExistant.toFixed(2)} = ${consoAvant.toFixed(1)} MWh/an`,
    `Conso APRÈS = (${(besoinChauffage * tauxCouverture).toFixed(1)} / SCOP ${v.scop}) + appoint = ${consoApres.toFixed(1)} MWh/an`,
    `Gain : ${gainMwh.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %) · ${Math.round(economiEuros)} €/an`,
    `Réduction CO₂ : ${reductionCo2.toFixed(1)} tCO₂e/an`,
    cumac ? `Volume CEE = ${cumac.cumacMWh.toFixed(0)} MWh cumac` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage,
    consoAvant,
    consoApres,
    gainMwh,
    gainPct,
    reductionCo2,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    volumeChauffe,
    deperditionsParois,
    deperditionsVentilation: depVentilation,
    deperditionsTotales,
    coeffG,
    deperditionsParM2,
  });
}

/* ─── BIN ──────────────────────────────────────────────────────── */

export function calculerBin(v: BatTh163Inputs): Result<BatTh163Result> {
  const baseR = calculerDJU(v);
  if (!baseR.ok) return baseR;
  const base = baseR.value;
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) return ok(base);
  if (!Number.isFinite(v.scop) || v.scop <= 0) return ok(base);

  let h = 0;
  let pondere = 0;
  const lignes: string[] = [];
  for (const bin of zoneData.bins) {
    if (bin.tExt >= 18) continue;
    const correction = 1 - Math.max(0, 7 - bin.tExt) * 0.022;
    const cop = v.scop * Math.max(0.4, correction);
    pondere += cop * bin.heures;
    h += bin.heures;
    lignes.push(`  ${bin.tExt}°C → COP=${cop.toFixed(2)} (${bin.heures} h)`);
  }
  if (h === 0) return ok(base);

  const scopEff = pondere / h;
  const tauxCouv = (v.tauxCouverturePct ?? 90) / 100;
  const rendExistant = rendementGenerateur(v.typeGenerateurExistant);
  const consoApres =
    (base.besoinChauffage * tauxCouv) / scopEff +
    (base.besoinChauffage * (1 - tauxCouv)) / rendExistant;
  const gainMwh = base.consoAvant - consoApres;
  const gainPct = base.consoAvant > 0 ? (gainMwh / base.consoAvant) * 100 : 0;
  const economiEuros = gainMwh * 1000 * PRIX_ELEC_KWH;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAT-TH-163", gainMwh);

  const detailMethode = [
    `Méthode bin SCOP (NF EN 14825) — Zone ${v.zoneClimatique}`,
    `SCOP nominal (déclaré 7°C) : ${v.scop.toFixed(2)}`,
    `Déperditions : G = ${base.coeffG.toFixed(2)} W/m³.K · besoins nets ${base.besoinChauffage.toFixed(1)} MWh/an`,
    "",
    `Pondération horaire par bin (correction COP linéaire ≈ 2,2 %/°C entre 7°C et −7°C) :`,
    ...lignes,
    "",
    `SCOP effectif pondéré : ${scopEff.toFixed(2)}`,
    `Conso APRÈS = (${(base.besoinChauffage * tauxCouv).toFixed(1)} / ${scopEff.toFixed(2)}) + appoint = ${consoApres.toFixed(1)} MWh/an`,
    `Conso AVANT (réutilisée) : ${base.consoAvant.toFixed(1)} MWh/an`,
    `Gain : ${gainMwh.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %) · ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${cumac.cumacMWh.toFixed(0)} MWh cumac` : "",
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

/* ─── FORFAIT ─────────────────────────────────────────────────── */

export function calculerForfait(v: BatTh163Inputs): Result<BatTh163Result> {
  const baseR = calculerDJU(v);
  if (!baseR.ok) return baseR;
  const base = baseR.value;

  const puissance = v.puissancePac && v.puissancePac > 0 ? v.puissancePac : base.deperditionsTotales;
  if (puissance <= 0) return ok(base);

  const hKey = zoneToHKey(v.zoneClimatique);
  const forfaits = FORFAITS_CEE["BAT-TH-163"];
  const forfait = forfaits[hKey];
  const cumacKWh = forfait * puissance;
  const duree = DUREE_VIE_CONV["BAT-TH-163"];
  const coef = coefActualisation(duree);
  const gainMwh = cumacKWh / (1000 * duree * coef);
  const consoApres = Math.max(0, base.consoAvant - gainMwh);
  const gainPct = base.consoAvant > 0 ? (gainMwh / base.consoAvant) * 100 : 0;
  const energie = v.energieExistante ?? "Gaz naturel";
  const facteurAvant = facteurCo2(energie);
  const reductionCo2 = (base.consoAvant - consoApres) * facteurAvant;
  const economiEuros = gainMwh * 1000 * (prixEnergie(energie) - PRIX_ELEC_KWH * 0.4);
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const detailMethode = [
    `Forfait CEE — fiche BAT-TH-163`,
    `Référence : ${forfaits.arrete} (application ${forfaits.dateApplication})`,
    `Zone ${hKey} · Puissance PAC ${puissance.toFixed(1)} kW (saisie ou déperditions calculées)`,
    `Forfait zone ${hKey} : ${forfait} kWh cumac/kW`,
    "",
    `Volume CEE = ${forfait} × ${puissance.toFixed(1)} = ${cumacKWh.toFixed(0)} kWh cumac`,
    `Durée : ${duree} ans · coef : ${coef.toFixed(3)} → gain EF = ${gainMwh.toFixed(1)} MWh/an`,
    "",
    `Conso AVANT (DJU) : ${base.consoAvant.toFixed(1)} MWh/an → APRÈS forfait : ${consoApres.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %)`,
    `Économie estimée : ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  return ok({
    ...base,
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
