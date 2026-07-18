/**
 * Calibration énergétique — méthode degrés-heures + validation statistique.
 *
 * Approche double :
 *   1. Méthode physique (degrés-heures) : balayage de Pmax pour trouver la
 *      valeur qui reproduit au mieux l'énergie relevée sur la période.
 *          E_utile(Pmax) = Pmax × ΣDH / ΔT_base
 *          E_calc        = E_utile / η
 *          → écart % vs E_relevée
 *
 *   2. Régression linéaire sur points mensuels : E_mois = a × DH_mois + b
 *      → pente a = U_bat (kW/°C) × ΔT ratio → puissance calée à ΔT_base
 *      → validation R², RMSE, CV(RMSE), NMBE conformément ASHRAE Guideline 14.
 *
 * Verdict ASHRAE Guideline 14 (calage mensuel) :
 *   - CV(RMSE) ≤ 15 %
 *   - |NMBE|   ≤ 5 %
 */

import type { MeteoHoraireReel, DegreHeuresResultat } from "./meteo-era5";

export interface ReleveMensuel {
  /** YYYY-MM. */
  mois: string;
  /** Énergie relevée sur le mois (kWh, cohérent avec vecteur/PCS). */
  kwh: number;
}

export interface CalibrationInputs {
  /** Météo horaire ERA5 (déjà chargée). */
  meteo: MeteoHoraireReel;
  /** Résultat du calcul degrés-heures (déjà fait). */
  dhResult: DegreHeuresResultat;
  /** Relevés mensuels alignés (indexés par YYYY-MM). */
  releves: ReleveMensuel[];
  /** Rendement générateur (0-1, PCS pour gaz condensation ≈ 0,925). */
  rendement: number;
  /** ΔT base pour la formule physique = Ti_moyen_occupé − Te_base (°C). */
  deltaTBase: number;
  /** Puissances Pmax à tester (kW). Défaut : 50…600 par pas de 5. */
  puissancesAtestees?: number[];
}

export interface ScenarioCalibration {
  pmax: number;
  eUtileCalc: number;
  eGazCalc: number;
  eGazReleve: number;
  ecartPct: number;
  interpretation: "surdim" | "sousdim" | "bon" | "borderline";
}

export interface CalibrationResultat {
  /** Énergie relevée totale sur la période (kWh). */
  energieRelevee: number;
  /** Σ DH sur la période. */
  sommeDh: number;
  /** Tableau des scénarios testés. */
  scenarios: ScenarioCalibration[];
  /** Meilleur scénario (écart min). */
  meilleur: ScenarioCalibration;
  /** Régression mensuelle. */
  regression: {
    pente: number; // kWh_utile / °C·h
    intercept: number; // kWh
    r2: number;
    rmse: number;
    cvRmse: number; // %
    nmbe: number; // %
    points: Array<{ mois: string; dh: number; kwh: number; kwhCalc: number }>;
    pCaleeKw: number; // pente × ΔT_base (kW)
  };
  /** Écart entre méthode DH et méthode régression (%). */
  ecartMethodes: number;
  /** Verdict conformité ASHRAE G14. */
  conformeAshrae: boolean;
}

const DEFAULT_PUISSANCES = ((): number[] => {
  const arr: number[] = [];
  for (let p = 20; p <= 600; p += 5) arr.push(p);
  return arr;
})();

/** Interpole une plage lisible à partir de l'écart. */
function interpreter(ecartPct: number): ScenarioCalibration["interpretation"] {
  const abs = Math.abs(ecartPct);
  if (abs < 5) return "bon";
  if (abs < 10) return "borderline";
  return ecartPct < 0 ? "sousdim" : "surdim";
}

/**
 * Lance la calibration complète.
 */
export function calibrer(inputs: CalibrationInputs): CalibrationResultat {
  const {
    dhResult,
    releves,
    rendement,
    deltaTBase,
    puissancesAtestees = DEFAULT_PUISSANCES,
  } = inputs;

  const energieRelevee = releves.reduce((s, r) => s + r.kwh, 0);
  const sommeDh = dhResult.sommeDh;

  // ─── Méthode 1 : balayage Pmax ───────────────────────────────
  const scenarios: ScenarioCalibration[] = puissancesAtestees.map((pmax) => {
    const eUtileCalc = (pmax * sommeDh) / deltaTBase;
    const eGazCalc = eUtileCalc / rendement;
    const ecartPct = ((eGazCalc - energieRelevee) / energieRelevee) * 100;
    return {
      pmax,
      eUtileCalc,
      eGazCalc,
      eGazReleve: energieRelevee,
      ecartPct,
      interpretation: interpreter(ecartPct),
    };
  });

  const meilleur = scenarios.reduce((best, cur) =>
    Math.abs(cur.ecartPct) < Math.abs(best.ecartPct) ? cur : best,
  );

  // ─── Méthode 2 : régression sur points mensuels ─────────────
  // On aligne relevés vs DH mensuels par clé YYYY-MM
  const dhParMois = new Map(dhResult.mensuel.map((m) => [m.mois, m.sommeDh]));
  const points = releves
    .map((r) => ({ mois: r.mois, dh: dhParMois.get(r.mois) ?? 0, kwh: r.kwh }))
    .filter((p) => p.dh > 0);

  const n = points.length;
  let pente = 0;
  let intercept = 0;
  let r2 = 0;
  let rmse = 0;
  let cvRmse = 0;
  let nmbe = 0;
  let pointsCalc: Array<{ mois: string; dh: number; kwh: number; kwhCalc: number }> = [];

  if (n >= 2) {
    // Régression linéaire : kwh_utile = a × DH + b ; on convertit d'abord en utile
    const utilePoints = points.map((p) => ({ ...p, utile: p.kwh * rendement }));
    const meanX = utilePoints.reduce((s, p) => s + p.dh, 0) / n;
    const meanY = utilePoints.reduce((s, p) => s + p.utile, 0) / n;
    let num = 0;
    let den = 0;
    for (const p of utilePoints) {
      num += (p.dh - meanX) * (p.utile - meanY);
      den += (p.dh - meanX) ** 2;
    }
    pente = den > 0 ? num / den : 0;
    intercept = meanY - pente * meanX;

    // Métriques (retour en kWh combustible pour comparaison factures)
    let ssRes = 0;
    let ssTot = 0;
    let sumErr = 0;
    let sumSqErr = 0;
    const meanYComb = points.reduce((s, p) => s + p.kwh, 0) / n;
    pointsCalc = points.map((p) => {
      const utileCalc = pente * p.dh + intercept;
      const kwhCalc = utileCalc / rendement;
      const err = kwhCalc - p.kwh;
      ssRes += err * err;
      ssTot += (p.kwh - meanYComb) ** 2;
      sumErr += err;
      sumSqErr += err * err;
      return { mois: p.mois, dh: p.dh, kwh: p.kwh, kwhCalc };
    });
    r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    rmse = Math.sqrt(sumSqErr / n);
    cvRmse = meanYComb > 0 ? (rmse / meanYComb) * 100 : 0;
    nmbe = meanYComb > 0 ? (sumErr / n / meanYComb) * 100 : 0;
  }

  const pCaleeRegression = (pente * deltaTBase) / 1; // pente est en kWh_utile/°C·h ; × ΔT_base ⇒ kW

  const ecartMethodes =
    meilleur.pmax > 0
      ? Math.abs(((pCaleeRegression - meilleur.pmax) / meilleur.pmax) * 100)
      : 0;

  const conformeAshrae = n >= 2 && cvRmse <= 15 && Math.abs(nmbe) <= 5;

  return {
    energieRelevee,
    sommeDh,
    scenarios,
    meilleur,
    regression: {
      pente,
      intercept,
      r2,
      rmse,
      cvRmse,
      nmbe,
      points: pointsCalc,
      pCaleeKw: pCaleeRegression,
    },
    ecartMethodes,
    conformeAshrae,
  };
}
