/**
 * Coefficient d'utilisation des apports gratuits η_gn (Th-BCE 2008 / ISO 13790).
 *
 * Quand les apports gratuits (solaire + internes) approchent ou dépassent les
 * pertes, on ne peut pas tout récupérer (le bâti surchauffe et on ouvre les
 * fenêtres). η_gn corrige ça :
 *
 *   γ = (apports_gratuits) / (pertes_brutes)
 *   η_gn = (1 − γ^a) / (1 − γ^(a+1))     si γ ≠ 1
 *   η_gn = a / (a + 1)                   si γ = 1
 *
 * où l'exposant `a` dépend de la classe d'inertie :
 *   - Légère : a = 0.8
 *   - Moyenne : a = 1.0
 *   - Lourde : a = 2.5
 *
 * Source : Th-BCE 2008 §11.2.1 / ISO 13790:2008 §11.2.2.
 */

export type InertieClasse = "LEGERE" | "MOYENNE" | "LOURDE";

const A_PAR_INERTIE: Record<InertieClasse, number> = {
  LEGERE: 0.8,
  MOYENNE: 1.0,
  LOURDE: 2.5,
};

/** Calcule η_gn ∈ [0, 1] selon γ (ratio apports/pertes) et inertie. */
export function coefficientUtilisationApports(
  gamma: number,
  inertie: InertieClasse = "MOYENNE",
): number {
  if (!Number.isFinite(gamma) || gamma <= 0) return 1;
  const a = A_PAR_INERTIE[inertie];
  // Limite quand γ → 1 : η = a / (a + 1)
  if (Math.abs(gamma - 1) < 1e-6) return a / (a + 1);
  const num = 1 - Math.pow(gamma, a);
  const den = 1 - Math.pow(gamma, a + 1);
  if (!Number.isFinite(num / den)) return 1;
  return Math.max(0, Math.min(1, num / den));
}

/**
 * Nombre d'occupants équivalent (Nadeq) — méthode DPE 2021.
 * Pour un logement individuel :
 *   Nadeq = 1.75 + 0.01 × max(0, S_hab − 30)            si S_hab ≤ 70
 *   Nadeq = 0.025 × S_hab                                si 70 < S_hab ≤ 130
 *   Nadeq = 0.025 × S_hab × (1 + 0.001 × (S_hab − 130))  si S_hab > 130
 *
 * Si l'utilisateur saisit un nombre d'occupants réel, on l'utilise tel quel
 * (les valeurs Nadeq sont conventionnelles, peuvent être surévaluées).
 */
export function nadeqDepuisSurface(surfaceHabitable: number): number {
  if (surfaceHabitable <= 0) return 1;
  if (surfaceHabitable <= 70) return 1.75 + 0.01 * Math.max(0, surfaceHabitable - 30);
  if (surfaceHabitable <= 130) return 0.025 * surfaceHabitable;
  return 0.025 * surfaceHabitable * (1 + 0.001 * (surfaceHabitable - 130));
}

/**
 * Besoin annuel d'ECS — méthode DPE 2021 simplifiée (kWh/an).
 *
 * Le forfait DPE est de 17.78 kWh/m²·an pour un logement de référence.
 * Quand on connaît le nb d'occupants réel, on l'ajuste par ratio
 * Nadeq_réel / Nadeq_référence(surface).
 *
 * Becs (kWh/an) = 17.78 × S_hab × (Nadeq / Nadeq_ref)
 *
 * Si Nadeq == Nadeq_ref → Becs = 17.78 × S (cas par défaut, 17.78 kWh/m²·an)
 * Si occupants surévalués (famille nombreuse) → Becs augmente
 * Si occupants sous-évalués (résidence secondaire 1 pers) → Becs diminue
 */
export function besoinECSAnnuel(surfaceHabitable: number, nadeq: number): number {
  if (surfaceHabitable <= 0) return 0;
  const nadeqRef = nadeqDepuisSurface(surfaceHabitable);
  const ratio = nadeqRef > 0 ? nadeq / nadeqRef : 1;
  return 17.78 * surfaceHabitable * ratio;
}

/**
 * Apports internes annuels (kWh/an) — Th-BCE 2008.
 * Forfait : 5 W/m² × S_hab + 80 W × Nadeq, intégré sur 8760 h × facteur 0.5
 *  ≈ 5 kWh/m²·an + 350 kWh/an par occupant équivalent.
 */
export function apportsInternesAnnuel(surfaceHabitable: number, nadeq: number): number {
  return 5 * surfaceHabitable + 350 * nadeq;
}
