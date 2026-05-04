/**
 * Simulateur de variantes — applique l'effet thermique de gestes de travaux
 * sur la baseline d'un projet et recalcule Cep/Cef/GES.
 *
 * Méthode :
 *   1. Construire un BaselineState depuis le projet (parois agrégées + systèmes)
 *   2. Pour chaque geste, modifier le state (U-values cibles, rendements
 *      systèmes, vecteurs) — applyGesteToState (pure)
 *   3. Recalculer déperditions + besoins + conso EF par usage + Cep + DPE
 *
 * Hypothèses cibles RT existant (U finaux post-travaux) :
 *   - ITE : U_mur = 0.20 W/m²K
 *   - ITI : U_mur = 0.30 (ponts thermiques résiduels)
 *   - Combles : U_toiture = 0.15
 *   - Plancher bas : U_plancher = 0.20
 *   - Toiture-terrasse : U_toiture = 0.18
 *   - Menuiseries : U_vitree = 1.3 (double vitrage performant)
 */

import {
  calculerDeperditions,
  calculerDpe,
  coefficientUtilisationApports,
  nadeqDepuisSurface,
  besoinECSAnnuel,
  apportsInternesAnnuel,
  getZoneData,
  type Vecteur,
  type ClasseDpe,
  type InertieClasse,
} from "./thermal";
import type { Geste, GesteCode } from "./aides";

function djuAnnuelZone(zoneClim: string): number {
  return getZoneData(zoneClim)?.dju ?? 2500;
}

export interface BaselineState {
  zoneClimatique: string;
  surfaceHabitable: number;
  volumeChauffe: number;
  // Enveloppe
  surfaceMurs: number;
  surfaceToiture: number;
  surfacePlancher: number;
  surfaceVitree: number;
  uMurs: number;
  uToiture: number;
  uPlancher: number;
  uVitree: number;
  // Ventilation / hygro
  renouvellementAir: number;
  efficaciteDoubleFlux: number;
  // Régulation
  consigneInt: number;
  tBase: number;
  /** Programmation chauffage — réduit Bch ~10 %. */
  intermittenceChauffage: boolean;
  /** Inertie thermique — exposant a du η_gn (Th-BCE 2008). */
  inertie: InertieClasse;
  /** Nombre d'occupants saisi. Si non fourni, calculé via Nadeq surface. */
  nbOccupants?: number | null;
  // Systèmes (rendement effectif = SCOP saisonnier si PAC)
  chauffageEff: number;
  chauffageVecteur: Vecteur;
  ecsEff: number;
  ecsVecteur: Vecteur;
  /** Part solaire ECS — réduit le besoin ECS net (0..1). */
  partSolaireECS: number;
  hasClim: boolean;
  /** Calibration facture — facteur correcteur à appliquer au Bch calculé. */
  calibrationFactor?: number;
}

export interface VarianteIndicators {
  cep: number;       // kWhEP/m²·an
  cef: number;       // kWhEF/m²·an
  ges: number;       // kgCO2/m²·an
  dpe: ClasseDpe;
  ges_class: ClasseDpe;
  besoinChauffage: number;  // kWh/m²·an net
  besoinECS: number;        // kWh/m²·an net
  besoinClim: number;
  /** GV (W/K) après travaux. */
  gv: number;
  /** Conso finale tous usages (kWh/m²·an). */
  consoFinaleM2: number;
  /** Économie annuelle estimée vs baseline (€). */
  economieAnnuelle: number;
}

/* ─── Cibles RT existant — U finaux après travaux (W/m²·K) ────── */
const U_TARGETS: Partial<Record<GesteCode, Partial<BaselineState>>> = {
  ISOLATION_MURS_ITE:           { uMurs: 0.20 },
  ISOLATION_MURS_ITI:           { uMurs: 0.30 },
  ISOLATION_COMBLES:            { uToiture: 0.15 },
  ISOLATION_PLANCHER_BAS:       { uPlancher: 0.20 },
  ISOLATION_TOITURE_TERRASSE:   { uToiture: 0.18 },
  MENUISERIES:                  { uVitree: 1.3 },
  VMC_DOUBLE_FLUX:              { efficaciteDoubleFlux: 0.85 },
};

/* ─── Effet sur les systèmes ─────────────────────────────────── */
function applyGesteToState(state: BaselineState, geste: Geste): BaselineState {
  const target = U_TARGETS[geste.code];
  let s = target ? { ...state, ...target } : { ...state };

  switch (geste.code) {
    case "PAC_AIR_EAU":
      s = { ...s, chauffageEff: 3.0, chauffageVecteur: "elec" };
      break;
    case "PAC_GEOTHERMIQUE":
      s = { ...s, chauffageEff: 4.0, chauffageVecteur: "elec" };
      break;
    case "PAC_AIR_AIR":
      s = { ...s, chauffageEff: 3.0, chauffageVecteur: "elec", hasClim: true };
      break;
    case "CHAUDIERE_BIOMASSE":
      s = { ...s, chauffageEff: 0.85, chauffageVecteur: "bois" };
      break;
    case "POELE_GRANULES":
      s = { ...s, chauffageEff: 0.80, chauffageVecteur: "bois" };
      break;
    case "POELE_BUCHES":
      s = { ...s, chauffageEff: 0.75, chauffageVecteur: "bois" };
      break;
    case "CHAUFFE_EAU_THERMODYNAMIQUE":
      s = { ...s, ecsEff: 2.5, ecsVecteur: "elec" };
      break;
    case "CHAUFFE_EAU_SOLAIRE":
      // Couverture solaire 50 % du besoin ECS, complément électrique
      s = { ...s, partSolaireECS: 0.5, ecsEff: Math.max(s.ecsEff, 1.0) };
      break;
    case "DEPOSE_CUVE_FIOUL":
      // Pas d'effet thermique direct — sera explicité par le système substitué (PAC/biomasse)
      break;
    default:
      // ITE/ITI/COMBLES/etc. : le target U a déjà été appliqué plus haut
      break;
  }
  return s;
}

/** Applique une liste de gestes dans l'ordre. Le dernier geste sur un poste gagne. */
export function applyGestesToBaseline(
  baseline: BaselineState,
  gestes: Geste[],
): BaselineState {
  return gestes.reduce<BaselineState>((s, g) => applyGesteToState(s, g), baseline);
}

/**
 * Calcule les indicateurs énergétiques d'un state (déperditions → besoin → Cep → DPE).
 * Pure function — pas d'effet de bord.
 *
 * Méthode :
 *   1. Déperditions H_total (W/K) via calculerDeperditions (Th-BCE)
 *   2. DJU annuel × H_total → Bch_brut
 *   3. Apports gratuits = solaires + internes (Nadeq)
 *   4. η_gn = Th-BCE selon γ et inertie → Bch_net = Bch_brut − η × apports
 *   5. Intermittence : Bch_net × 0.90 si activée
 *   6. Calibration facture : ×k si fournie
 *   7. Conso EF = besoinNet / SCOP, par usage, vecteur
 *   8. calculerDpe → Cep, GES, étiquettes
 */
export function computeIndicatorsFromState(
  state: BaselineState,
  /** Tarifs énergie (€/kWh) pour estimer l'économie. */
  tarifsBaseline?: { tarifChauffage: number; tarifECS: number },
  consoBaselineM2?: number,
): VarianteIndicators {
  // Forfait ponts thermiques RT existant : 5 % de Σ A_paroi opaque
  const hPT = 0.05 * (state.surfaceMurs + state.surfaceToiture + state.surfacePlancher);
  const dep = calculerDeperditions({
    surfaceMurs:    state.surfaceMurs,
    surfaceToiture: state.surfaceToiture,
    surfacePlancher: state.surfacePlancher,
    surfaceVitree:  state.surfaceVitree,
    uMurs:    state.uMurs,
    uToiture: state.uToiture,
    uPlancher: state.uPlancher,
    uVitree:  state.uVitree,
    hPontsThermiques: hPT,
    volumeChauffe: state.volumeChauffe,
    renouvellementAir: state.renouvellementAir,
    efficaciteDoubleFlux: state.efficaciteDoubleFlux,
    deltaT: state.consigneInt - state.tBase,
  });

  // Nadeq (occupants équivalents) — si saisi par utilisateur, sinon Nadeq surface
  const nadeq = state.nbOccupants && state.nbOccupants > 0
    ? state.nbOccupants
    : nadeqDepuisSurface(state.surfaceHabitable);

  let besoinChauffageNet = 0;
  if (state.surfaceHabitable > 0 && dep.surfaceDeperditiveTotale > 0) {
    // DJU mensuels approximés : DJU annuel zone × 1 (calculerBesoinsChauffage utilise zone clim)
    // On reproduit ici Bch_brut = H_total × DJU × 24 / 1000 mais simplifié sans calculerBesoinsChauffage
    // pour pouvoir injecter η_gn correctement.
    const dju = djuAnnuelZone(state.zoneClimatique);
    const besoinBrut = (dep.hTotal * dju * 24) / 1000; // kWh/an

    // Apports gratuits — internes (forfait Th-BCE basé sur Nadeq) + solaires (forfait simple)
    const apportsInternes = apportsInternesAnnuel(state.surfaceHabitable, nadeq);
    // Forfait apports solaires simple : 80 kWh/m² vitré × surface vitrée × période chauffe (0.4)
    const apportsSolaires = 80 * state.surfaceVitree * 0.4;
    const apportsTotaux = apportsInternes + apportsSolaires;

    // Coefficient utilisation η_gn (Th-BCE / ISO 13790)
    const gamma = besoinBrut > 0 ? apportsTotaux / besoinBrut : 0;
    const eta_gn = coefficientUtilisationApports(gamma, state.inertie);

    besoinChauffageNet = Math.max(0, besoinBrut - eta_gn * apportsTotaux);

    // Intermittence (consigne réduite) : −10 % sur le Bch
    if (state.intermittenceChauffage) {
      besoinChauffageNet *= 0.90;
    }

    // Calibration facture — applique le facteur correcteur si défini
    if (state.calibrationFactor && state.calibrationFactor > 0) {
      besoinChauffageNet *= state.calibrationFactor;
    }
  }

  // Besoin ECS — formule DPE 2021 ajustée par Nadeq vs surface
  const besoinECSBrut = besoinECSAnnuel(state.surfaceHabitable, nadeq); // kWh/an
  const besoinECSNet = besoinECSBrut * (1 - state.partSolaireECS);

  const chauffage_kwh = state.chauffageEff > 0 ? besoinChauffageNet / state.chauffageEff : 0;
  const ecs_kwh = state.ecsEff > 0 ? besoinECSNet / state.ecsEff : 0;
  const aux_kwh = state.surfaceHabitable * 5;
  const ecl_kwh = state.surfaceHabitable * 1.4;
  const refr_kwh = state.hasClim ? state.surfaceHabitable * 12 : 0;

  const dpe = calculerDpe(
    {
      chauffage_kwh,
      chauffage_vecteur: state.chauffageVecteur,
      ecs_kwh,
      ecs_vecteur: state.ecsVecteur,
      refroidissement_kwh: refr_kwh,
      eclairage_kwh: ecl_kwh,
      auxiliaires_kwh: aux_kwh,
    },
    Math.max(state.surfaceHabitable, 1),
  );

  const consoFinaleTotal = chauffage_kwh + ecs_kwh + aux_kwh + ecl_kwh + refr_kwh;
  const consoFinaleM2 = state.surfaceHabitable > 0 ? consoFinaleTotal / state.surfaceHabitable : 0;

  // Économie annuelle estimée (€/an) = (conso baseline − conso variante) × tarif moyen
  let economieAnnuelle = 0;
  if (consoBaselineM2 != null && tarifsBaseline) {
    const delta = consoBaselineM2 - consoFinaleM2;
    economieAnnuelle = Math.max(0, delta * state.surfaceHabitable * tarifsBaseline.tarifChauffage);
  }

  return {
    cep: dpe.cep_kwh_m2,
    cef: consoFinaleM2,
    ges: dpe.ges_kg_m2,
    dpe: dpe.classe_dpe,
    ges_class: dpe.classe_ges,
    besoinChauffage: state.surfaceHabitable > 0 ? besoinChauffageNet / state.surfaceHabitable : 0,
    besoinECS: state.surfaceHabitable > 0 ? besoinECSNet / state.surfaceHabitable : 0,
    besoinClim: state.hasClim ? 12 : 0,
    gv: dep.hTotal,
    consoFinaleM2,
    economieAnnuelle,
  };
}

/**
 * Tarifs moyens 2025 (TTC) pour estimation économies.
 * Source : prix médian France métropolitaine, ordres de grandeur.
 */
export const TARIFS_ENERGIE_2025: Record<Vecteur, number> = {
  elec:           0.255, // €/kWh — tarif bleu base
  gaz_naturel:    0.110,
  fioul:          0.130,
  bois:           0.075,
  propane:        0.165,
  reseau_chaleur: 0.105,
};
