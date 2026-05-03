/**
 * Barèmes 2025 — MaPrimeRénov' / CEE / Eco-PTZ.
 *
 * Sources :
 *   - Décret n°2020-26 du 14 janvier 2020 modifié, arrêtés annuels.
 *   - Site officiel maprimerenov.gouv.fr (barèmes MAJ janvier 2025).
 *   - Arrêté du 22 décembre 2014 modifié (CEE) — fiches d'opérations standardisées.
 *
 * IMPORTANT : ces barèmes évoluent chaque année. Versionner par année et
 * dater chaque changement explicitement.
 */

import type {
  CategorieRessources,
  GesteCode,
  ZoneGeographique,
} from "./types";

export const BAREMES_VERSION = "2025-01-01";

/* ─── Plafonds de ressources MaPrimeRénov' 2025 ────────────────── */
/** Seuils RFR (€/an) par catégorie, foyer 1 personne, zone IDF. */
const PLAFONDS_IDF: Record<CategorieRessources, number> = {
  BLEU: 23541,
  JAUNE: 28657,
  VIOLET: 40018,
  ROSE: Number.POSITIVE_INFINITY,
};

const PLAFONDS_AUTRES: Record<CategorieRessources, number> = {
  BLEU: 17009,
  JAUNE: 21805,
  VIOLET: 30549,
  ROSE: Number.POSITIVE_INFINITY,
};

/** Majoration par personne supplémentaire au-delà de la 1ère. */
const MAJ_PERSONNE_IDF: Record<CategorieRessources, number> = {
  BLEU: 3454,
  JAUNE: 4205,
  VIOLET: 5781,
  ROSE: 0,
};
const MAJ_PERSONNE_AUTRES: Record<CategorieRessources, number> = {
  BLEU: 2491,
  JAUNE: 3188,
  VIOLET: 4413,
  ROSE: 0,
};

/** Détermine la catégorie MPR du foyer en fonction du RFR et de la composition. */
export function categorieMaPrimeRenov(
  rfr: number,
  nbPersonnes: number,
  zone: ZoneGeographique,
): CategorieRessources {
  const seuils = zone === "IDF" ? PLAFONDS_IDF : PLAFONDS_AUTRES;
  const maj = zone === "IDF" ? MAJ_PERSONNE_IDF : MAJ_PERSONNE_AUTRES;
  const supp = Math.max(0, nbPersonnes - 1);

  for (const cat of ["BLEU", "JAUNE", "VIOLET"] as const) {
    const plafond = seuils[cat] + supp * maj[cat];
    if (rfr <= plafond) return cat;
  }
  return "ROSE";
}

/* ─── Forfaits MaPrimeRénov' par geste — 2025 ──────────────────── */
/**
 * Montants forfaitaires en €, par catégorie de ressources.
 * Selon le geste, l'unité est m² (isolation), unité (menuiseries),
 * ou forfait global (PAC, chaudière).
 */
export interface ForfaitGeste {
  /** Type d'unité du forfait. */
  unite: "M2" | "UNITE" | "FORFAIT";
  /** Plafond de surface/quantité éligible (m² ou unités). null = sans limite. */
  plafondQuantite: number | null;
  /** Forfait par catégorie ressources, en € par unité. */
  parCategorie: Record<CategorieRessources, number>;
}

export const FORFAITS_MPR: Partial<Record<GesteCode, ForfaitGeste>> = {
  /* Isolation */
  ISOLATION_MURS_ITE: {
    unite: "M2",
    plafondQuantite: 100,
    parCategorie: { BLEU: 75, JAUNE: 60, VIOLET: 40, ROSE: 15 },
  },
  ISOLATION_MURS_ITI: {
    unite: "M2",
    plafondQuantite: 100,
    parCategorie: { BLEU: 25, JAUNE: 20, VIOLET: 15, ROSE: 7 },
  },
  ISOLATION_COMBLES: {
    unite: "M2",
    plafondQuantite: null,
    parCategorie: { BLEU: 25, JAUNE: 20, VIOLET: 15, ROSE: 7 },
  },
  ISOLATION_PLANCHER_BAS: {
    unite: "M2",
    plafondQuantite: null,
    parCategorie: { BLEU: 30, JAUNE: 25, VIOLET: 20, ROSE: 10 },
  },
  ISOLATION_TOITURE_TERRASSE: {
    unite: "M2",
    plafondQuantite: null,
    parCategorie: { BLEU: 75, JAUNE: 60, VIOLET: 40, ROSE: 15 },
  },
  MENUISERIES: {
    unite: "UNITE",
    plafondQuantite: null,
    parCategorie: { BLEU: 100, JAUNE: 80, VIOLET: 40, ROSE: 0 },
  },

  /* Ventilation */
  VMC_DOUBLE_FLUX: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 2500, JAUNE: 2000, VIOLET: 1500, ROSE: 0 },
  },

  /* Production de chaleur */
  PAC_AIR_EAU: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 5000, JAUNE: 4000, VIOLET: 3000, ROSE: 0 },
  },
  PAC_GEOTHERMIQUE: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 11000, JAUNE: 9000, VIOLET: 6000, ROSE: 0 },
  },
  CHAUDIERE_BIOMASSE: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 7000, JAUNE: 5500, VIOLET: 3000, ROSE: 0 },
  },
  POELE_GRANULES: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 2500, JAUNE: 2000, VIOLET: 1500, ROSE: 0 },
  },
  POELE_BUCHES: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 2000, JAUNE: 1500, VIOLET: 800, ROSE: 0 },
  },
  CHAUFFE_EAU_THERMODYNAMIQUE: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 1200, JAUNE: 800, VIOLET: 400, ROSE: 0 },
  },
  CHAUFFE_EAU_SOLAIRE: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 4000, JAUNE: 3000, VIOLET: 2000, ROSE: 0 },
  },
  DEPOSE_CUVE_FIOUL: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 1200, JAUNE: 800, VIOLET: 400, ROSE: 0 },
  },

  /* Audit */
  AUDIT_ENERGETIQUE: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 500, JAUNE: 400, VIOLET: 300, ROSE: 0 },
  },
};

/* ─── CEE — coup de pouce 2025 (forfaits indicatifs en €) ──────── */
/**
 * Forfaits CEE moyens 2025 (offre publique standard, hors bonifications
 * "Coup de pouce chauffage"). Variables selon obligé / mandataire.
 * Ces valeurs sont des ordres de grandeur réalistes pour pré-estimation.
 */
export const FORFAITS_CEE: Partial<Record<GesteCode, ForfaitGeste>> = {
  ISOLATION_MURS_ITE: {
    unite: "M2",
    plafondQuantite: null,
    parCategorie: { BLEU: 20, JAUNE: 20, VIOLET: 15, ROSE: 12 },
  },
  ISOLATION_MURS_ITI: {
    unite: "M2",
    plafondQuantite: null,
    parCategorie: { BLEU: 15, JAUNE: 15, VIOLET: 10, ROSE: 8 },
  },
  ISOLATION_COMBLES: {
    unite: "M2",
    plafondQuantite: null,
    parCategorie: { BLEU: 12, JAUNE: 12, VIOLET: 10, ROSE: 8 },
  },
  ISOLATION_PLANCHER_BAS: {
    unite: "M2",
    plafondQuantite: null,
    parCategorie: { BLEU: 15, JAUNE: 15, VIOLET: 12, ROSE: 10 },
  },
  PAC_AIR_EAU: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 5000, JAUNE: 5000, VIOLET: 2500, ROSE: 2500 },
  },
  CHAUDIERE_BIOMASSE: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 4500, JAUNE: 4500, VIOLET: 2500, ROSE: 2500 },
  },
  POELE_GRANULES: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 800, JAUNE: 800, VIOLET: 500, ROSE: 500 },
  },
  CHAUFFE_EAU_SOLAIRE: {
    unite: "FORFAIT",
    plafondQuantite: 1,
    parCategorie: { BLEU: 800, JAUNE: 800, VIOLET: 400, ROSE: 400 },
  },
};

/* ─── Plafond global MPR ──────────────────────────────────────── */
/** % du coût TTC plafonné par catégorie ressources (rénovation par geste). */
export const PLAFOND_MPR_PCT_TTC: Record<CategorieRessources, number> = {
  BLEU: 0.90,
  JAUNE: 0.75,
  VIOLET: 0.60,
  ROSE: 0.40,
};

/* ─── Eco-PTZ — plafonds prêt à 0% ─────────────────────────────── */
/** Plafond Eco-PTZ par nombre d'actions. */
export const ECO_PTZ_PLAFONDS: Record<number, number> = {
  1: 15000,
  2: 25000,
  3: 30000,
};
/** Plafond bouquet rénovation globale gain ≥ 35%. */
export const ECO_PTZ_BOUQUET_GLOBAL = 50000;

/* ─── TVA réduite 5,5% ────────────────────────────────────────── */
export const TVA_NORMALE = 0.20;
export const TVA_REDUITE = 0.055;
/** Gestes éligibles à la TVA réduite 5,5% (logement principal > 2 ans). */
export const GESTES_TVA_REDUITE: ReadonlySet<GesteCode> = new Set([
  "ISOLATION_MURS_ITE",
  "ISOLATION_MURS_ITI",
  "ISOLATION_COMBLES",
  "ISOLATION_PLANCHER_BAS",
  "ISOLATION_TOITURE_TERRASSE",
  "MENUISERIES",
  "VMC_DOUBLE_FLUX",
  "VMC_SIMPLE_FLUX",
  "PAC_AIR_EAU",
  "PAC_GEOTHERMIQUE",
  "CHAUDIERE_BIOMASSE",
  "POELE_GRANULES",
  "POELE_BUCHES",
  "CHAUFFE_EAU_THERMODYNAMIQUE",
  "CHAUFFE_EAU_SOLAIRE",
  "DEPOSE_CUVE_FIOUL",
]);
