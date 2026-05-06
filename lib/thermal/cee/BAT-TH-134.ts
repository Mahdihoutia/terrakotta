/**
 * BAT-TH-134 — Haute pression flottante sur groupes froids tertiaires.
 *
 * 3 méthodes :
 *  - BIN     : COP par bin pondéré (Carnot corrigé), méthode NF EN 14825.
 *  - CARNOT  : ratio Carnot simplifié sur T° extérieure moyenne pondérée.
 *  - FORFAIT : forfait kWh cumac / kW × P_froid totale.
 *
 * Référence : Arrêté du 22 décembre 2014 modifié — fiche BAT-TH-134.
 */

import {
  type FicheCalculResult,
  type MethodeCalcul,
  type Result,
  ok,
  ko,
} from "../types";
import { computeCumac, coefActualisation, DUREE_VIE_CONV } from "../methodes/cumac";
import { PRIX_ELEC_KWH } from "../constants";
import { getZoneData } from "../zones";
import { FORFAITS_CEE } from "./forfaits";

export interface GroupeFroid {
  /** Puissance froid (kW). */
  puissanceFroid: number;
  /** Puissance électrique absorbée (kW). */
  puissanceAbsorbee: number;
  /** T° de condensation fixe AVANT (°C). */
  tCondFixe: number;
}

export interface BatTh134Inputs {
  zoneClimatique: string;
  /** Liste des groupes froids (1 ou plusieurs). */
  groupes: GroupeFroid[];
  /** Conso électrique AVANT (MWh/an). */
  consoAvant: number;
  /** T° condensation min HP flottante (°C, défaut 25). */
  tCondMin?: number;
  /** Écart d'approche du condenseur (K, défaut 10). */
  ecartApproche?: number;
  /** Heures de fonctionnement (h/an, défaut 6500). */
  heuresFonctionnement?: number;
  /** T° évaporation poste positif (défaut -8°C). */
  tEvapPos?: number;
  /** T° évaporation poste négatif (défaut -30°C). */
  tEvapNeg?: number;
  /** Régime de froid (libellé). */
  regimeFroid?: string;
  coutInvestissement?: number;
  methode: MethodeCalcul;
}

export interface BatTh134Result extends FicheCalculResult {
  copMoyenAvant: number;
  copMoyenApres: number;
}

function tEvapMoyen(v: BatTh134Inputs): number {
  const pos = v.tEvapPos ?? -8;
  const neg = v.tEvapNeg ?? -30;
  const r = v.regimeFroid ?? "";
  if (r.includes("négatif uniquement")) return neg;
  if (r.includes("positif + négatif"))  return (pos + neg) / 2;
  return pos;
}

/** Agrège les groupes froids en valeurs totales pondérées. */
function aggrege(groupes: GroupeFroid[]) {
  let pf = 0, pa = 0, tCondAccum = 0;
  for (const g of groupes) {
    if (g.puissanceFroid > 0 && g.puissanceAbsorbee > 0) {
      pf += g.puissanceFroid;
      pa += g.puissanceAbsorbee;
      tCondAccum += g.tCondFixe * g.puissanceFroid;
    }
  }
  return {
    puissanceFroidTotale: pf,
    puissanceAbsorbeeTotale: pa,
    tCondFixeMoyenne: pf > 0 ? tCondAccum / pf : 0,
  };
}

export function calculer(v: BatTh134Inputs): Result<BatTh134Result> {
  switch (v.methode) {
    case "CARNOT":          return calculerCarnot(v);
    case "FORFAITAIRE_CEE": return calculerForfait(v);
    case "BIN":
    default:                return calculerBin(v);
  }
}

/* ─── BIN ─────────────────────────────────────────────────────── */

export function calculerBin(v: BatTh134Inputs): Result<BatTh134Result> {
  const missing: string[] = [];
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (!Number.isFinite(v.consoAvant) || v.consoAvant <= 0) missing.push("conso_electrique_avant");
  const agg = aggrege(v.groupes);
  if (agg.puissanceFroidTotale === 0) missing.push("groupes_froids");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const tCondMin = v.tCondMin ?? 25;
  const ecartApproche = v.ecartApproche ?? 10;
  const heuresFonctionnement = v.heuresFonctionnement ?? 6500;
  const tEvap = tEvapMoyen(v);

  const copMoyenAvant = agg.puissanceFroidTotale / agg.puissanceAbsorbeeTotale;
  const etaCarnot = copMoyenAvant / ((273.15 + tEvap) / (agg.tCondFixeMoyenne - tEvap));

  let heuresPonderees = 0;
  let copPondereApres = 0;
  const detailBins: string[] = [];
  for (const bin of zoneData.bins) {
    const heuresBin = bin.heures * (heuresFonctionnement / 8760);
    if (heuresBin <= 0) continue;
    const tCondFlottante = Math.max(bin.tExt + ecartApproche, tCondMin);
    const deltaT = tCondFlottante - tEvap;
    if (deltaT <= 0) continue;
    const copBin = (etaCarnot * (273.15 + tEvap)) / deltaT;
    copPondereApres += copBin * heuresBin;
    heuresPonderees += heuresBin;
    detailBins.push(`T°ext=${bin.tExt}°C → T°cond=${tCondFlottante.toFixed(1)}°C → COP=${copBin.toFixed(2)} (${Math.round(heuresBin)}h)`);
  }
  if (heuresPonderees === 0) return ko(["bins_invalides"]);

  const copMoyenApres = copPondereApres / heuresPonderees;
  const ratioGain = copMoyenApres > copMoyenAvant ? 1 - copMoyenAvant / copMoyenApres : 0;
  const consoApres = v.consoAvant * (1 - ratioGain);
  const gainMwh = Math.max(0, v.consoAvant - consoApres);
  const gainPct = ratioGain * 100;
  const economiEuros = gainMwh * 1000 * PRIX_ELEC_KWH;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAT-TH-134", gainMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Méthode bin — Zone ${v.zoneClimatique}`,
    `${v.groupes.length} groupe(s) · P_froid totale = ${agg.puissanceFroidTotale} kW`,
    `COP moyen AVANT (HP fixe ${agg.tCondFixeMoyenne.toFixed(1)}°C) = ${copMoyenAvant.toFixed(2)}`,
    `Écart d'approche : ${ecartApproche} K · T_cond_min = ${tCondMin}°C · η_Carnot corrigé = ${(etaCarnot * 100).toFixed(1)} %`,
    "",
    "Détail par bin :",
    ...detailBins,
    "",
    `COP moyen APRÈS (HP flottante) = ${copMoyenApres.toFixed(2)}`,
    `Gain = 1 − (${copMoyenAvant.toFixed(2)} / ${copMoyenApres.toFixed(2)}) = ${gainPct.toFixed(1)} %`,
    `Conso AVANT : ${v.consoAvant} MWh/an → APRÈS : ${consoApres.toFixed(1)} MWh/an`,
    `Économie : ${gainMwh.toFixed(1)} MWh/an · ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${cumac.cumacMWh.toFixed(0)} MWh cumac (${cumac.duree} ans · coef ${cumac.coefActu.toFixed(3)})` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: v.consoAvant,
    consoAvant: v.consoAvant,
    consoApres,
    gainMwh,
    gainPct,
    reductionCo2: gainMwh * 0.079, // élec → kg/kWh, MWh × kg/kWh = t
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    copMoyenAvant,
    copMoyenApres,
  });
}

/* ─── CARNOT simplifié ─────────────────────────────────────────── */

export function calculerCarnot(v: BatTh134Inputs): Result<BatTh134Result> {
  const missing: string[] = [];
  const zoneData = getZoneData(v.zoneClimatique);
  if (!zoneData) missing.push("zone_climatique");
  if (!Number.isFinite(v.consoAvant) || v.consoAvant <= 0) missing.push("conso_electrique_avant");
  const agg = aggrege(v.groupes);
  if (agg.puissanceFroidTotale === 0) missing.push("groupes_froids");
  if (missing.length > 0 || !zoneData) return ko(missing);

  const tCondMin = v.tCondMin ?? 25;
  const ecartApproche = v.ecartApproche ?? 10;
  const tEvap = tEvapMoyen(v);

  let totalH = 0, tExtMoyen = 0;
  for (const bin of zoneData.bins) {
    totalH += bin.heures;
    tExtMoyen += bin.tExt * bin.heures;
  }
  tExtMoyen = totalH > 0 ? tExtMoyen / totalH : 10;

  const copMoyenAvant = agg.puissanceFroidTotale / agg.puissanceAbsorbeeTotale;
  const tCondApres = Math.max(tExtMoyen + ecartApproche, tCondMin);
  const deltaAvant = agg.tCondFixeMoyenne - tEvap;
  const deltaApres = tCondApres - tEvap;
  if (deltaAvant <= 0 || deltaApres <= 0) return ko(["delta_t_invalide"]);

  const copMoyenApres = copMoyenAvant * (deltaAvant / deltaApres);
  const ratioGain = copMoyenApres > copMoyenAvant ? 1 - copMoyenAvant / copMoyenApres : 0;
  const consoApres = v.consoAvant * (1 - ratioGain);
  const gainMwh = Math.max(0, v.consoAvant - consoApres);
  const gainPct = ratioGain * 100;
  const economiEuros = gainMwh * 1000 * PRIX_ELEC_KWH;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;
  const cumac = computeCumac("BAT-TH-134", gainMwh);
  const cumacKWh = cumac?.cumacKWh ?? 0;

  const detailMethode = [
    `Calcul Carnot simplifié — Zone ${v.zoneClimatique}`,
    `${v.groupes.length} groupe(s) · P_froid = ${agg.puissanceFroidTotale} kW · P_élec = ${agg.puissanceAbsorbeeTotale} kW`,
    `COP moyen AVANT = ${copMoyenAvant.toFixed(2)} (HP fixe ${agg.tCondFixeMoyenne.toFixed(1)}°C)`,
    `T° ext moyenne pondérée : ${tExtMoyen.toFixed(1)}°C → T° cond après = max(${tExtMoyen.toFixed(1)} + ${ecartApproche}, ${tCondMin}) = ${tCondApres.toFixed(1)}°C`,
    `T° évap retenue : ${tEvap}°C`,
    "",
    `COP_ap / COP_av = (${agg.tCondFixeMoyenne.toFixed(1)} − ${tEvap}) / (${tCondApres.toFixed(1)} − ${tEvap}) = ${(deltaAvant / deltaApres).toFixed(3)}`,
    `COP moyen APRÈS = ${copMoyenAvant.toFixed(2)} × ${(deltaAvant / deltaApres).toFixed(3)} = ${copMoyenApres.toFixed(2)}`,
    "",
    `Gain = ${gainPct.toFixed(1)} % · ${gainMwh.toFixed(1)} MWh/an · ${Math.round(economiEuros)} €/an`,
    cumac ? `Volume CEE = ${cumac.cumacMWh.toFixed(0)} MWh cumac` : "",
  ].filter(Boolean).join("\n");

  return ok({
    besoinChauffage: v.consoAvant,
    consoAvant: v.consoAvant,
    consoApres,
    gainMwh,
    gainPct,
    reductionCo2: gainMwh * 0.079,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    copMoyenAvant,
    copMoyenApres,
  });
}

/* ─── FORFAIT CEE ─────────────────────────────────────────────── */

export function calculerForfait(v: BatTh134Inputs): Result<BatTh134Result> {
  const missing: string[] = [];
  const agg = aggrege(v.groupes);
  if (agg.puissanceFroidTotale === 0) missing.push("groupes_froids");
  if (!Number.isFinite(v.consoAvant) || v.consoAvant <= 0) missing.push("conso_electrique_avant");
  if (missing.length > 0) return ko(missing);

  const forfaitDef = FORFAITS_CEE["BAT-TH-134"];
  const forfait = forfaitDef.base; // kWh cumac / kW
  const cumacKWh = forfait * agg.puissanceFroidTotale;
  const duree = DUREE_VIE_CONV["BAT-TH-134"];
  const coef = coefActualisation(duree);
  const gainMwh = cumacKWh / (1000 * duree * coef);

  const consoApres = Math.max(0, v.consoAvant - gainMwh);
  const copMoyenAvant = agg.puissanceFroidTotale / agg.puissanceAbsorbeeTotale;
  const ratio = v.consoAvant > 0 ? gainMwh / v.consoAvant : 0;
  const copMoyenApres = ratio > 0 && ratio < 1 ? copMoyenAvant / (1 - ratio) : copMoyenAvant;
  const gainPct = ratio * 100;
  const economiEuros = gainMwh * 1000 * PRIX_ELEC_KWH;
  const coutInvest = v.coutInvestissement ?? 0;
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const detailMethode = [
    `Forfait CEE — fiche BAT-TH-134`,
    `Référence : ${forfaitDef.arrete} (application ${forfaitDef.dateApplication})`,
    `P_froid totale : ${agg.puissanceFroidTotale} kW · ${v.groupes.length} groupe(s)`,
    `Forfait : ${forfait} kWh cumac / kW`,
    "",
    `Volume CEE = ${forfait} × ${agg.puissanceFroidTotale} = ${cumacKWh.toFixed(0)} kWh cumac (${(cumacKWh / 1000).toFixed(0)} MWh cumac)`,
    `Durée : ${duree} ans · coef : ${coef.toFixed(3)}`,
    `Gain énergie finale = cumac / (1000 × ${duree} × ${coef.toFixed(3)}) = ${gainMwh.toFixed(1)} MWh/an`,
    "",
    `Conso AVANT : ${v.consoAvant} MWh/an → APRÈS : ${consoApres.toFixed(1)} MWh/an (${gainPct.toFixed(1)} %)`,
    `Économie : ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  return ok({
    besoinChauffage: v.consoAvant,
    consoAvant: v.consoAvant,
    consoApres,
    gainMwh,
    gainPct,
    reductionCo2: gainMwh * 0.079,
    economiEuros,
    dureeRetour,
    cumacKWh,
    detailMethode,
    copMoyenAvant,
    copMoyenApres,
  });
}
