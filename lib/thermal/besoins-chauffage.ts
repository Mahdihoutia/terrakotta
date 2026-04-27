/**
 * A3 — Besoins de chauffage (méthode DJU simplifiée 3CL).
 *
 * G = Ubat + 0.34 × R    (W/m³·K, avec R = renouvellement d'air vol/h)
 * Besoin_brut = G × V × DJU × 24 / 1000   (kWh/an)
 * γ = Σ apports / Besoin_brut
 * η_apports = (1 - γ^a) / (1 - γ^(a+1))   avec a = 1 (résidentiel léger)
 *           ≈ 1 - exp(-1/(1+γ²)) approximation simple — voir Th-BCE 2008
 * Besoin_net = Besoin_brut - η × Σ apports
 * Conso_finale = Besoin_net / rendement_installation
 *
 * NB : on garde ici une formulation pédagogique. Pour un calcul ISO 13790
 * complet, utiliser la méthode mensuelle Th-BCE.
 */

import { getZoneData } from "./zones";

export interface BesoinsChauffageInput {
  zone: string;
  surfaceHabitable: number;
  volumeChauffe: number;
  /** Déperdition surfacique moyenne (W/m²·K). */
  ubat: number;
  surfaceDeperditiveTotale: number;
  /** Renouvellement d'air (vol/h). */
  renouvellementAir: number;
  /** kWh/an. */
  apportsSolairesGratuits: number;
  /** kWh/an (occupants + équipements). */
  apportsInternes: number;
  /** 0..1, ex: 0.85. */
  rendementInstallation: number;
}

export interface BesoinsChauffageResult {
  /** Coefficient volumique de déperdition (W/m³·K). */
  coefG: number;
  dju: number;
  besoinBrut: number;
  apportsUtilisables: number;
  besoinNet: number;
  consoFinale: number;
}

export function calculerBesoinsChauffage(input: BesoinsChauffageInput): BesoinsChauffageResult {
  const {
    zone, volumeChauffe, ubat, surfaceDeperditiveTotale, renouvellementAir,
    apportsSolairesGratuits, apportsInternes, rendementInstallation,
  } = input;

  const dju = getZoneData(zone)?.dju ?? 2400;

  // G en W/m³·K. Approximation : Ubat × (S/V) + 0.34 × R.
  const ratioSV = volumeChauffe > 0 ? surfaceDeperditiveTotale / volumeChauffe : 1;
  const coefG = ubat * ratioSV + 0.34 * renouvellementAir;

  // Besoin brut chauffage, kWh/an
  const besoinBrut = (coefG * volumeChauffe * dju * 24) / 1000;

  const apportsTotaux = Math.max(0, apportsSolairesGratuits + apportsInternes);
  const gamma = besoinBrut > 0 ? apportsTotaux / besoinBrut : 0;
  // Coefficient d'utilisation η_apports — approximation Th-BCE.
  const eta = gamma <= 0 ? 0
    : gamma >= 1
      ? 1 / (gamma + 0.5)
      : 1 - Math.exp(-1 / (1 + gamma * gamma));

  const apportsUtilisables = eta * apportsTotaux;
  const besoinNet = Math.max(0, besoinBrut - apportsUtilisables);
  const rendement = Math.max(0.3, rendementInstallation);
  const consoFinale = besoinNet / rendement;

  return {
    coefG,
    dju,
    besoinBrut,
    apportsUtilisables,
    besoinNet,
    consoFinale,
  };
}
