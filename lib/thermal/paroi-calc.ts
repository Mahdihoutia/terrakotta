/**
 * Moteur de calcul des performances d'une paroi multicouche.
 * Conforme NF EN ISO 6946 (R thermique, U) avec une approximation pour
 * le déphasage thermique (méthode CSTB simplifiée — ordre de grandeur).
 */

export interface CoucheCalc {
  materiauId: string;
  nom: string;
  categorie: string;
  /** Épaisseur en mètres. */
  epaisseur: number;
  /** λ — conductivité (W/m·K). Ignoré si resistanceFixe est fournie. */
  conductivite: number;
  masseVolumique: number;
  capaciteThermique: number;
  /** Résistance forfaitaire (m²·K/W) — utilisée pour les lames d'air. */
  resistanceFixe?: number | null;
  carboneACV?: number | null;
}

export interface ParoiMetrics {
  /** Transmission thermique surfacique U (W/m²·K). */
  uValue: number;
  /** Résistance totale Rsi + Σ R + Rse (m²·K/W). */
  rTotal: number;
  /** Résistance des couches uniquement. */
  rNu: number;
  /** kg/m². */
  masseSurfacique: number;
  /** Heures (méthode simplifiée). */
  dephasage: number;
  /** 0..1 — facteur d'amortissement de l'amplitude thermique. */
  amortissement: number;
  /** kgCO₂e/m² — production matériaux (A1-A3) si dispo. */
  carboneACVm2: number;
  /** J/m²·K — capacité thermique surfacique cumulée. */
  capaciteThermiqueSurfacique: number;
  /** Détail couche par couche (utile pour debug / UI). */
  details: Array<{
    materiauId: string;
    nom: string;
    epaisseur: number;
    r: number;
    masse: number;
    capacite: number;
    carbone: number;
  }>;
}

/**
 * Calcule la résistance d'une couche (m²·K/W).
 * - Si `resistanceFixe` est définie (lame d'air), elle est retournée telle quelle.
 * - Sinon R = e / λ.
 */
function resistanceCouche(c: CoucheCalc): number {
  if (c.resistanceFixe != null && c.resistanceFixe > 0) {
    return c.resistanceFixe;
  }
  if (c.conductivite <= 0) return 0;
  return c.epaisseur / c.conductivite;
}

/**
 * Calcule l'ensemble des indicateurs d'une paroi multicouche.
 *
 * @param couches Liste des couches (ordre 0 = intérieur → N = extérieur).
 * @param rsi Résistance superficielle intérieure (m²·K/W).
 * @param rse Résistance superficielle extérieure (m²·K/W).
 */
export function calculerParoi(
  couches: CoucheCalc[],
  rsi: number,
  rse: number,
): ParoiMetrics {
  let rNu = 0;
  let masseSurfacique = 0;
  let capaciteThermiqueSurfacique = 0;
  let carboneACVm2 = 0;

  const details: ParoiMetrics["details"] = [];

  for (const c of couches) {
    const r = resistanceCouche(c);
    const masse = c.epaisseur * c.masseVolumique;
    const capacite = masse * c.capaciteThermique; // J/m²·K
    const carbone = c.carboneACV != null ? c.epaisseur * c.carboneACV : 0;

    rNu += r;
    masseSurfacique += masse;
    capaciteThermiqueSurfacique += capacite;
    carboneACVm2 += carbone;

    details.push({
      materiauId: c.materiauId,
      nom: c.nom,
      epaisseur: c.epaisseur,
      r,
      masse,
      capacite,
      carbone,
    });
  }

  const rTotal = rsi + rNu + rse;
  const uValue = rTotal > 0 ? 1 / rTotal : 0;

  // Déphasage simplifié (méthode CSTB) — ordre de grandeur.
  // φ ≈ 0.0086 × √(M × C / 1000) × √(R_total) × 24 / 1.4
  // Approximation calibrée sur valeurs de référence (Pleiades/Comfie) :
  //   - mur béton 20cm seul (M=460, C≈1000) → ~6h
  //   - mur ITE laine bois 14cm + parpaing → ~14h
  const dephasage =
    masseSurfacique > 0 && rTotal > 0
      ? Math.min(
          24,
          0.027 *
            Math.sqrt(
              (masseSurfacique * capaciteThermiqueSurfacique) / 1_000_000,
            ) *
            Math.sqrt(rTotal) *
            24,
        )
      : 0;

  // Amortissement : facteur de réduction de l'amplitude thermique sur 24h.
  // Approximation : 1 / (1 + 2π × C × R / 86400)
  const tau = (capaciteThermiqueSurfacique * rTotal) / 86400; // jours
  const amortissement = 1 / (1 + 2 * Math.PI * tau);

  return {
    uValue,
    rTotal,
    rNu,
    masseSurfacique,
    dephasage,
    amortissement,
    carboneACVm2,
    capaciteThermiqueSurfacique,
    details,
  };
}

/**
 * Renvoie une qualification visuelle de la performance U (FR ré-énovation).
 * Seuils alignés sur RT2012 / RE2020 / réglementations parois opaques.
 */
export function qualifierU(u: number): {
  niveau: "EXCELLENT" | "BON" | "MOYEN" | "FAIBLE";
  label: string;
} {
  if (u < 0.2) return { niveau: "EXCELLENT", label: "Très performant (BBC)" };
  if (u < 0.4) return { niveau: "BON", label: "Performant (RT2012)" };
  if (u < 0.8) return { niveau: "MOYEN", label: "Standard" };
  return { niveau: "FAIBLE", label: "Peu performant" };
}

export function qualifierDephasage(h: number): {
  niveau: "EXCELLENT" | "BON" | "MOYEN" | "FAIBLE";
  label: string;
} {
  if (h >= 12) return { niveau: "EXCELLENT", label: "Confort été optimal" };
  if (h >= 10) return { niveau: "BON", label: "Bon confort été" };
  if (h >= 8) return { niveau: "MOYEN", label: "Confort été moyen" };
  return { niveau: "FAIBLE", label: "Faible inertie" };
}
