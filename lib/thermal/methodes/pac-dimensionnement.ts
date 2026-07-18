/**
 * Moteur de dimensionnement PAC air/eau (tertiaire & résidentiel collectif).
 *
 * Prend en entrée la puissance calée d'une calibration (méthode degrés-heures ERA5),
 * la série météo horaire réelle et une configuration PAC candidate ; simule heure par
 * heure la puissance thermique disponible et le besoin réel, en calculant :
 *
 *   • la puissance à recommander (avec marges relance + distribution + grand froid)
 *   • la fourchette commerciale standard la plus proche
 *   • la température de bivalence (T° où P_PAC(T) = besoin(T))
 *   • le taux de couverture PAC vs appoint
 *   • le SCOP saisonnier estimé (moyenne pondérée du COP horaire par les besoins)
 *   • le bilan carbone Avant/Après (facteurs ADEME)
 *
 * Approche voulue robuste et lisible : formules explicites, pas de boîte noire.
 * Les courbes COP(T) et capacité(T) sont approximées par droites affines calées sur
 * les points constructeurs les plus courants (7°C, 2°C, -7°C, -15°C au condensateur 35°C).
 */

import type { DegreHeuresResultat, MeteoHoraireReel } from "../meteo-era5";

// ─── Bibliothèque de courbes PAC ───────────────────────────────

/** Type de régime de température des émetteurs — impacte fortement le COP. */
export type RegimePAC = "BT" | "MT" | "HT";

/**
 * Points de référence constructeur (moyenne marché — Daikin/Atlantic/Panasonic 2024-2026).
 * Format : [T_ext_evap °C, COP, ratio_capacite_utile]
 *
 * Ces points sont utilisés pour interpoler linéairement le COP et le facteur de
 * déclassement en puissance selon la température extérieure.
 */
const COURBES_PAC: Record<RegimePAC, Array<{ tExt: number; cop: number; ratioP: number }>> = {
  // Basse température (plancher chauffant / ventilo-convecteurs 35°C)
  BT: [
    { tExt: 12, cop: 5.2, ratioP: 1.05 },
    { tExt: 7, cop: 4.5, ratioP: 1.0 },
    { tExt: 2, cop: 3.6, ratioP: 0.88 },
    { tExt: -7, cop: 2.5, ratioP: 0.72 },
    { tExt: -15, cop: 1.7, ratioP: 0.55 },
  ],
  // Moyenne température (radiateurs 55°C)
  MT: [
    { tExt: 12, cop: 4.2, ratioP: 1.0 },
    { tExt: 7, cop: 3.6, ratioP: 0.95 },
    { tExt: 2, cop: 2.9, ratioP: 0.82 },
    { tExt: -7, cop: 2.1, ratioP: 0.68 },
    { tExt: -15, cop: 1.5, ratioP: 0.52 },
  ],
  // Haute température (radiateurs anciens 65-70°C)
  HT: [
    { tExt: 12, cop: 3.4, ratioP: 0.95 },
    { tExt: 7, cop: 2.9, ratioP: 0.9 },
    { tExt: 2, cop: 2.4, ratioP: 0.78 },
    { tExt: -7, cop: 1.8, ratioP: 0.62 },
    { tExt: -15, cop: 1.3, ratioP: 0.48 },
  ],
};

/** Interpole une valeur y=f(x) sur une courbe de points triés par x. */
function interp(x: number, pts: Array<{ tExt: number; [k: string]: number }>, key: string): number {
  if (x >= pts[0].tExt) return pts[0][key];
  if (x <= pts[pts.length - 1].tExt) return pts[pts.length - 1][key];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (x <= a.tExt && x >= b.tExt) {
      const t = (a.tExt - x) / (a.tExt - b.tExt);
      return a[key] * (1 - t) + b[key] * t;
    }
  }
  return pts[pts.length - 1][key];
}

/** COP instantané d'une PAC selon T° extérieure et régime émetteur. */
export function copPAC(tExt: number, regime: RegimePAC): number {
  return interp(tExt, COURBES_PAC[regime], "cop");
}

/** Puissance thermique restituée d'une PAC selon T° extérieure (déclassement). */
export function puissancePAC(pNom: number, tExt: number, regime: RegimePAC): number {
  return pNom * interp(tExt, COURBES_PAC[regime], "ratioP");
}

// ─── Fourchette commerciale ─────────────────────────────────────

/** Puissances nominales standard PAC A/E disponibles au catalogue (kW). */
const CATALOGUE_PAC_KW = [
  6, 8, 11, 14, 16, 20, 25, 30, 35, 40, 50, 65, 80, 100, 130, 150, 165, 195, 220, 250, 300, 400,
];

/** Retourne les puissances catalogue tombant dans [min, max]. */
export function fourchetteCommerciale(minKw: number, maxKw: number): number[] {
  return CATALOGUE_PAC_KW.filter((p) => p >= minKw && p <= maxKw);
}

// ─── Marges de dimensionnement ─────────────────────────────────

export interface MargesDimensionnement {
  /** Relance matinale locaux inoccupés la nuit (10-15 % typique). */
  relance: number;
  /** Pertes réseau distribution (4-6 % selon longueur). */
  distribution: number;
}

export const MARGES_DEFAUT: MargesDimensionnement = {
  relance: 0.12,
  distribution: 0.05,
};

// ─── Configuration scénario ────────────────────────────────────

export type TypeAppoint = "GAZ" | "ELEC" | "AUCUN";

export interface ScenarioPACInput {
  /** Nom lisible (ex. "PAC 195 kW cascade 65+130"). */
  nom: string;
  /** Régime émetteurs. */
  regime: RegimePAC;
  /** Puissances nominales des unités PAC en cascade (kW). */
  unites: number[];
  /** Type d'appoint utilisé quand la PAC ne suffit pas. */
  typeAppoint: TypeAppoint;
  /**
   * Température de bivalence forcée (°C) — en dessous, la PAC est stoppée et l'appoint prend
   * 100 %. Si null, la PAC fonctionne jusqu'à -20°C, l'appoint complète en écrêtage.
   */
  tBivalenceForcee: number | null;
  /** Rendement de la chaudière gaz d'appoint (0-1, PCS). */
  rendementGaz: number;
}

// ─── Résultat simulation horaire ───────────────────────────────

export interface ScenarioPACResultat {
  scenario: ScenarioPACInput;
  puissanceInstallee: number;
  energieBesoin: number; // kWh utile
  energiePAC: number; // kWh utile fournis par la PAC
  energieAppoint: number; // kWh utile fournis par appoint
  tauxCouverturePAC: number; // 0-1
  scop: number; // moyenne pondérée par énergie utile
  consoElecPAC: number; // kWh élec
  consoAppointGaz: number; // kWh gaz PCS (si appoint gaz)
  consoAppointElec: number; // kWh élec (si appoint élec)
  temperatureBivalence: number | null; // °C — point d'équilibre calculé
  emissionsCO2AvantKg: number;
  emissionsCO2ApresKg: number;
  reductionCO2Pct: number;
  /** Histogramme couverture par plage de T°ext. */
  histoTemperature: Array<{
    tRange: string;
    heures: number;
    besoinKwh: number;
    pacKwh: number;
    appointKwh: number;
    copMoyen: number;
  }>;
}

// ─── Facteurs CO2 (ADEME) ──────────────────────────────────────

/** kgCO2/kWh — Base Empreinte ADEME 2024 (méthode ACV). */
const FACTEURS_CO2 = {
  GAZ_PCI: 0.227,
  ELEC: 0.055,
};

// ─── Simulation ────────────────────────────────────────────────

export interface SimulationInputs {
  meteo: MeteoHoraireReel;
  dhResult: DegreHeuresResultat;
  /** Puissance calée en régime établi (issue de la calibration ERA5), kW. */
  puissanceCalee: number;
  /** ΔT_base = Ti_occupé − Te_base (°C). */
  deltaTBase: number;
  /** Rendement chaudière existante (0-1) pour bilan Avant. */
  rendementExistant: number;
  /** Facteurs de conversion Avant (vecteur existant). */
  facteurCO2Avant?: number;
  /** Marges appliquées au calcul de "puissance recommandée". */
  marges?: MargesDimensionnement;
}

export interface DimensionnementResultat {
  puissanceCalee: number;
  puissanceRecommandeeMin: number;
  puissanceRecommandeeMax: number;
  fourchetteCommerciale: number[];
  marges: MargesDimensionnement;
  scenarios: ScenarioPACResultat[];
  /** Consommation gaz Avant équivalente (kWh PCS/an extrapolé sur la période). */
  consoGazAvantPeriode: number;
  emissionsAvantPeriode: number;
}

/**
 * Simule un scénario PAC heure par heure.
 * Retourne les indicateurs consolidés.
 */
function simulerScenario(
  scenario: ScenarioPACInput,
  inputs: SimulationInputs,
): ScenarioPACResultat {
  const { meteo, dhResult, puissanceCalee, deltaTBase } = inputs;
  const pMaxPACSomme = scenario.unites.reduce((s, u) => s + u, 0);

  // Pour chaque heure : besoin thermique = P_calee × (Ti(h) - Te(h)) / ΔT_base
  //                    P_PAC_dispo(h)   = Σ P_nom_i × ratioP(Te(h), regime)
  //                    Fourniture PAC(h) = min(besoin, P_PAC_dispo) si Te >= T_bivalence
  //                    Sinon 0 (PAC arrêtée)

  let energieBesoin = 0;
  let energiePAC = 0;
  let energieAppoint = 0;
  let sommeCopPondere = 0;

  // Buckets histo par plage de 3°C
  const buckets = new Map<
    string,
    { heures: number; besoinKwh: number; pacKwh: number; appointKwh: number; sumCop: number }
  >();
  const bucketOf = (t: number): string => {
    const b = Math.floor(t / 3) * 3;
    return `${b}..${b + 3}`;
  };

  for (let i = 0; i < meteo.tExt.length; i++) {
    const te = meteo.tExt[i];
    if (!Number.isFinite(te)) continue;
    const dh = dhResult.dhHoraire[i];
    if (dh <= 0) continue;

    const besoin = (puissanceCalee * dh) / deltaTBase; // kWh utile pour cette heure

    // PAC disponible
    let pPacDispo = 0;
    for (const u of scenario.unites) {
      pPacDispo += puissancePAC(u, te, scenario.regime);
    }
    const cop = copPAC(te, scenario.regime);

    // Décision bivalence
    const pacActive =
      scenario.tBivalenceForcee == null ? te > -20 : te >= scenario.tBivalenceForcee;

    let fournitPAC = 0;
    let fournitAppoint = 0;
    if (pacActive && scenario.typeAppoint !== "AUCUN") {
      fournitPAC = Math.min(besoin, pPacDispo);
      fournitAppoint = besoin - fournitPAC;
    } else if (pacActive) {
      // Pas d'appoint → PAC seule (écrêtage besoin non couvert)
      fournitPAC = Math.min(besoin, pPacDispo);
      fournitAppoint = 0;
    } else {
      fournitAppoint = besoin;
    }

    energieBesoin += besoin;
    energiePAC += fournitPAC;
    energieAppoint += fournitAppoint;
    sommeCopPondere += cop * fournitPAC;

    const key = bucketOf(te);
    const b = buckets.get(key) ?? {
      heures: 0,
      besoinKwh: 0,
      pacKwh: 0,
      appointKwh: 0,
      sumCop: 0,
    };
    b.heures++;
    b.besoinKwh += besoin;
    b.pacKwh += fournitPAC;
    b.appointKwh += fournitAppoint;
    b.sumCop += cop;
    buckets.set(key, b);
  }

  const scop = energiePAC > 0 ? sommeCopPondere / energiePAC : 0;
  const consoElecPAC = scop > 0 ? energiePAC / scop : 0;
  const consoAppointGaz =
    scenario.typeAppoint === "GAZ" ? energieAppoint / scenario.rendementGaz : 0;
  const consoAppointElec = scenario.typeAppoint === "ELEC" ? energieAppoint : 0;

  const facteurCO2Avant = inputs.facteurCO2Avant ?? FACTEURS_CO2.GAZ_PCI / inputs.rendementExistant;
  const consoGazAvant = energieBesoin / inputs.rendementExistant;
  const emissionsAvant = consoGazAvant * facteurCO2Avant;
  const emissionsApres =
    consoElecPAC * FACTEURS_CO2.ELEC +
    consoAppointGaz * (FACTEURS_CO2.GAZ_PCI / scenario.rendementGaz) +
    consoAppointElec * FACTEURS_CO2.ELEC;
  const reductionCO2Pct =
    emissionsAvant > 0 ? ((emissionsAvant - emissionsApres) / emissionsAvant) * 100 : 0;

  // Estimation T° bivalence : plus grande Te pour laquelle P_PAC(Te) ≥ besoin_pic(Te)
  // On approxime : besoin(Te) = P_calee × (Ti_moy - Te) / ΔT_base
  // Ti_moy est estimée comme moyenne des Ti(h) sur les heures actives.
  let sumTi = 0;
  let nTi = 0;
  for (let i = 0; i < dhResult.dhHoraire.length; i++) {
    if (dhResult.dhHoraire[i] > 0) {
      sumTi += dhResult.tiHoraireArr[i];
      nTi++;
    }
  }
  const tiMoy = nTi > 0 ? sumTi / nTi : 20;
  let tBivalence: number | null = null;
  for (let t = 15; t >= -20; t -= 0.5) {
    const besoinT = (puissanceCalee * (tiMoy - t)) / deltaTBase;
    const pDispo = scenario.unites.reduce(
      (s, u) => s + puissancePAC(u, t, scenario.regime),
      0,
    );
    if (pDispo < besoinT) {
      tBivalence = t + 0.5;
      break;
    }
  }

  const histoTemperature = Array.from(buckets.entries())
    .sort(([a], [b]) => {
      const na = parseInt(a.split("..")[0], 10);
      const nb = parseInt(b.split("..")[0], 10);
      return na - nb;
    })
    .map(([tRange, v]) => ({
      tRange,
      heures: v.heures,
      besoinKwh: v.besoinKwh,
      pacKwh: v.pacKwh,
      appointKwh: v.appointKwh,
      copMoyen: v.heures > 0 ? v.sumCop / v.heures : 0,
    }));

  return {
    scenario,
    puissanceInstallee: pMaxPACSomme,
    energieBesoin,
    energiePAC,
    energieAppoint,
    tauxCouverturePAC: energieBesoin > 0 ? energiePAC / energieBesoin : 0,
    scop,
    consoElecPAC,
    consoAppointGaz,
    consoAppointElec,
    temperatureBivalence: tBivalence,
    emissionsCO2AvantKg: emissionsAvant,
    emissionsCO2ApresKg: emissionsApres,
    reductionCO2Pct,
    histoTemperature,
  };
}

/**
 * Point d'entrée : dimensionne + simule les scénarios candidats.
 */
export function dimensionnerPAC(
  inputs: SimulationInputs,
  scenarios: ScenarioPACInput[],
): DimensionnementResultat {
  const marges = inputs.marges ?? MARGES_DEFAUT;

  // Puissance recommandée = calée × (1 + relance) × (1 + distribution)
  //   fourchette min : marges basses (10 % + 4 %)
  //   fourchette max : marges hautes (15 % + 6 %)
  const facteurMin = (1 + Math.max(0.1, marges.relance - 0.02)) * (1 + Math.max(0.04, marges.distribution - 0.01));
  const facteurMax = (1 + marges.relance + 0.03) * (1 + marges.distribution + 0.01);
  const puissanceRecommandeeMin = Math.round(inputs.puissanceCalee * facteurMin);
  const puissanceRecommandeeMax = Math.round(inputs.puissanceCalee * facteurMax);

  const fourchette = fourchetteCommerciale(puissanceRecommandeeMin, puissanceRecommandeeMax);

  const scenariosResult = scenarios.map((s) => simulerScenario(s, inputs));

  const consoGazAvantPeriode = scenariosResult[0]?.energieBesoin
    ? scenariosResult[0].energieBesoin / inputs.rendementExistant
    : 0;
  const facteurCO2Avant = inputs.facteurCO2Avant ?? FACTEURS_CO2.GAZ_PCI / inputs.rendementExistant;
  const emissionsAvantPeriode = consoGazAvantPeriode * facteurCO2Avant;

  return {
    puissanceCalee: inputs.puissanceCalee,
    puissanceRecommandeeMin,
    puissanceRecommandeeMax,
    fourchetteCommerciale: fourchette,
    marges,
    scenarios: scenariosResult,
    consoGazAvantPeriode,
    emissionsAvantPeriode,
  };
}
