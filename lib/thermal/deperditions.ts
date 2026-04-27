/**
 * A1 — Déperditions thermiques par paroi (méthode Th-BCE / 3CL simplifiée).
 *
 * H_paroi = U × S (W/K)
 * H_ventilation = ρ·c × Q_v / 3600 ≈ 0.34 × Q_v (Q_v en m³/h)
 * H_total = Σ H_paroi + H_pt + H_v_VMC + H_v_inf
 * Pertes T_base (W) = H_total × ΔT
 *
 * Sources : NF EN 12831, méthode 3CL-DPE 2021 §2.1.
 */

import { RHO_C_AIR } from "./constants";

export interface DeperditionsInput {
  surfaceMurs: number;
  surfaceToiture: number;
  surfacePlancher: number;
  surfaceVitree: number;

  uMurs: number;
  uToiture: number;
  uPlancher: number;
  uVitree: number;

  /** Déperditions ponts thermiques (W/K). Calculé via ponts-thermiques.ts. */
  hPontsThermiques: number;

  /** Volume chauffé en m³. */
  volumeChauffe: number;
  /** Renouvellement d'air total (vol/h) — VMC + infiltrations. */
  renouvellementAir: number;
  /** Efficacité d'un éventuel récupérateur double-flux (0..1). */
  efficaciteDoubleFlux: number;

  /** Différence T_int - T_ext_base (K), ex: 19 - (-7) = 26. */
  deltaT: number;
}

export interface DeperditionsResult {
  hMurs: number;
  hToiture: number;
  hPlancher: number;
  hVitree: number;
  hPontsThermiques: number;
  hVentilation: number;
  hInfiltrations: number;

  hTotal: number;

  pctMurs: number;
  pctToiture: number;
  pctPlancher: number;
  pctVitree: number;
  pctPontsThermiques: number;
  pctVentilation: number;
  pctInfiltrations: number;

  ubatMoyen: number;
  surfaceDeperditiveTotale: number;

  pertesT_base: number;
}

/**
 * Sépare le renouvellement d'air entre VMC (≈ 70 %) et infiltrations (≈ 30 %)
 * quand l'utilisateur saisit une seule valeur globale.
 *
 * Le récupérateur double-flux n'agit que sur la part VMC.
 */
export function calculerDeperditions(input: DeperditionsInput): DeperditionsResult {
  const {
    surfaceMurs, surfaceToiture, surfacePlancher, surfaceVitree,
    uMurs, uToiture, uPlancher, uVitree,
    hPontsThermiques, volumeChauffe, renouvellementAir, efficaciteDoubleFlux,
    deltaT,
  } = input;

  const hMurs = uMurs * surfaceMurs;
  const hToiture = uToiture * surfaceToiture;
  const hPlancher = uPlancher * surfacePlancher;
  const hVitree = uVitree * surfaceVitree;

  // Q_v total (m³/h)
  const qvTotal = volumeChauffe * renouvellementAir;
  const qvVmc = qvTotal * 0.70;
  const qvInf = qvTotal * 0.30;

  const eff = Math.min(Math.max(efficaciteDoubleFlux, 0), 0.95);
  const hVentilation = RHO_C_AIR * qvVmc * (1 - eff);
  const hInfiltrations = RHO_C_AIR * qvInf;

  const hTotal = hMurs + hToiture + hPlancher + hVitree
    + hPontsThermiques + hVentilation + hInfiltrations;

  const surfaceDeperditiveTotale = surfaceMurs + surfaceToiture + surfacePlancher + surfaceVitree;
  const hParoisOpaques = hMurs + hToiture + hPlancher + hVitree;
  const ubatMoyen = surfaceDeperditiveTotale > 0
    ? hParoisOpaques / surfaceDeperditiveTotale
    : 0;

  const pct = (h: number) => (hTotal > 0 ? (h / hTotal) * 100 : 0);

  return {
    hMurs, hToiture, hPlancher, hVitree,
    hPontsThermiques, hVentilation, hInfiltrations,
    hTotal,
    pctMurs: pct(hMurs),
    pctToiture: pct(hToiture),
    pctPlancher: pct(hPlancher),
    pctVitree: pct(hVitree),
    pctPontsThermiques: pct(hPontsThermiques),
    pctVentilation: pct(hVentilation),
    pctInfiltrations: pct(hInfiltrations),
    ubatMoyen,
    surfaceDeperditiveTotale,
    pertesT_base: hTotal * deltaT,
  };
}
