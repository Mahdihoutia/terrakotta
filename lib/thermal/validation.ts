/**
 * Validations inline des saisies d'audit énergétique.
 */

export interface ValidationIssue {
  niveau: "info" | "warn" | "error";
  message: string;
}

/**
 * Vérifie que la somme des % de déperditions est proche de 100.
 * Tolérance ±2 pts.
 */
export function checkSommeDeperditions(values: Record<string, string>): ValidationIssue | null {
  const ids = [
    "deperd_murs", "deperd_toiture", "deperd_plancher", "deperd_menuiseries",
    "deperd_ponts", "deperd_ventilation", "deperd_infiltrations",
  ];
  const filled = ids.filter((id) => values[id]?.trim());
  if (filled.length === 0) return null;
  const total = ids.reduce((s, id) => s + (parseFloat(values[id] || "0") || 0), 0);
  if (total === 0) return null;
  const ecart = Math.abs(total - 100);
  if (ecart > 2) {
    return {
      niveau: ecart > 10 ? "error" : "warn",
      message: `Total des déperditions = ${total.toFixed(0)} % (cible 100 %).`,
    };
  }
  return null;
}

/**
 * Vérifie l'écart entre conso facture et conso calculée.
 */
export function checkEcartFactureCalc(
  consoFacture: number,
  consoCalculee: number,
): ValidationIssue | null {
  if (consoFacture <= 0 || consoCalculee <= 0) return null;
  const ratio = consoFacture / consoCalculee;
  if (ratio > 1.3 || ratio < 0.7) {
    return {
      niveau: "warn",
      message: `Écart facture / calcul important (${Math.round((ratio - 1) * 100)} %) — vérifier l'intermittence ou les rendements.`,
    };
  }
  return null;
}

/**
 * U mur incohérent avec l'isolation déclarée.
 */
export function checkCoherenceUMurs(
  uMurs: number,
  isolationLabel: string,
): ValidationIssue | null {
  if (uMurs <= 0 || !isolationLabel) return null;
  const s = isolationLabel.toLowerCase();
  if ((s.includes("extérieure") || s.includes("ite")) && uMurs > 0.6) {
    return { niveau: "warn", message: "U mur > 0,6 W/m²·K incohérent avec une ITE — vérifier l'épaisseur d'isolant." };
  }
  if (s.includes("intérieure") && uMurs > 1.0) {
    return { niveau: "warn", message: "U mur > 1,0 W/m²·K incohérent avec une ITI — vérifier l'épaisseur d'isolant." };
  }
  if (s.includes("non isolé") && uMurs < 1.5) {
    return { niveau: "warn", message: "U mur < 1,5 W/m²·K incohérent avec un mur non isolé." };
  }
  return null;
}

/**
 * Cohérence U toiture vs niveau d'isolation déclaré.
 */
export function checkCoherenceUToiture(
  uToiture: number,
  isolationLabel: string,
): ValidationIssue | null {
  if (uToiture <= 0 || !isolationLabel) return null;
  const s = isolationLabel.toLowerCase();
  if (s.includes("bien isol") && uToiture > 0.25) {
    return { niveau: "warn", message: "U toiture > 0,25 W/m²·K incohérent avec une toiture bien isolée (R ≥ 6)." };
  }
  if (s.includes("correctement") && (uToiture < 0.17 || uToiture > 0.35)) {
    return { niveau: "warn", message: "U toiture hors fourchette 0,17–0,35 attendue pour R 4–6." };
  }
  if (s.includes("insuff") && uToiture < 0.35) {
    return { niveau: "warn", message: "U toiture < 0,35 incohérent avec une isolation insuffisante." };
  }
  if (s.includes("non isol") && uToiture < 1.0) {
    return { niveau: "warn", message: "U toiture < 1,0 incohérent avec une toiture non isolée." };
  }
  return null;
}

/**
 * Plausibilité du n50 vs année de construction.
 */
export function checkN50PlausibilityVsAnneeConstruction(
  n50: number,
  anneeConstruction: number,
): ValidationIssue | null {
  if (n50 <= 0 || !anneeConstruction || anneeConstruction < 1800) return null;
  if (anneeConstruction < 1980 && n50 < 4) {
    return { niveau: "warn", message: `n50 = ${n50.toFixed(1)} vol/h très faible pour une construction d'avant 1980 (typique 6–15).` };
  }
  if (anneeConstruction >= 2012 && n50 > 2.5) {
    return { niveau: "warn", message: `n50 = ${n50.toFixed(1)} vol/h trop élevé pour une RT2012/RE2020 (cible < 1,5).` };
  }
  if (anneeConstruction >= 1990 && anneeConstruction < 2012 && n50 > 8) {
    return { niveau: "warn", message: `n50 = ${n50.toFixed(1)} vol/h élevé pour une construction post-1990 (typique 3–6).` };
  }
  return null;
}

/**
 * Cohérence DPE saisi vs DPE calculé (méthode 3CL).
 * Alerte si écart > 1 lettre.
 */
export function checkDpeSaisiVsCalcul(
  dpeSaisi: string,
  dpeCalcule: string,
): ValidationIssue | null {
  if (!dpeSaisi || !dpeCalcule) return null;
  const order = ["A", "B", "C", "D", "E", "F", "G"];
  const a = order.indexOf(dpeSaisi.charAt(0).toUpperCase());
  const b = order.indexOf(dpeCalcule.charAt(0).toUpperCase());
  if (a === -1 || b === -1) return null;
  const ecart = Math.abs(a - b);
  if (ecart > 1) {
    return {
      niveau: ecart > 2 ? "error" : "warn",
      message: `Écart de ${ecart} classes entre DPE saisi (${order[a]}) et DPE calculé (${order[b]}) — vérifier les saisies de consommation.`,
    };
  }
  return null;
}

/**
 * Surface plancher >= surface habitable (SHAB).
 */
export function checkSurfacesCoherence(
  surfaceHabitable: number,
  surfacePlancher: number,
): ValidationIssue | null {
  if (surfaceHabitable <= 0 || surfacePlancher <= 0) return null;
  if (surfacePlancher < surfaceHabitable) {
    return {
      niveau: "warn",
      message: `Surface de plancher (${surfacePlancher} m²) inférieure à la SHAB (${surfaceHabitable} m²) — la SP inclut normalement les murs intérieurs.`,
    };
  }
  if (surfacePlancher > surfaceHabitable * 1.6) {
    return {
      niveau: "warn",
      message: `Surface de plancher (${surfacePlancher} m²) très élevée par rapport à la SHAB (${surfaceHabitable} m²) — vérifier la définition (SHAB / SHON / SDP).`,
    };
  }
  return null;
}

/**
 * Cohérence Σ usages CEP vs conso totale saisie.
 * Alerte si écart relatif > 15 %.
 */
export function checkSommeUsagesVsConsoTotale(
  sommeUsages: number,
  consoTotale: number,
): ValidationIssue | null {
  if (sommeUsages <= 0 || consoTotale <= 0) return null;
  const ratio = sommeUsages / consoTotale;
  if (ratio > 1.15 || ratio < 0.85) {
    return {
      niveau: "warn",
      message: `Écart entre Σ des usages (${sommeUsages.toFixed(0)} kWh) et la conso totale saisie (${consoTotale.toFixed(0)} kWh) : ${Math.round((ratio - 1) * 100)} %.`,
    };
  }
  return null;
}

/**
 * Helper centralisant toutes les validations applicables pour un champ donné.
 * Permet l'affichage inline d'une alerte directement sous le champ concerné.
 */
export interface FieldIssueContext {
  /** DPE calculé par la méthode 3CL — lettre seule (ex: "E"). */
  dpeCalcule?: string;
  /** Conso totale dérivée du DPE (kWh EP/an), pour Σ usages. */
  consoTotaleCalculee?: number;
}

export function getFieldIssue(
  fieldId: string,
  values: Record<string, string>,
  ctx: FieldIssueContext = {},
): ValidationIssue | null {
  const num = (s: string | undefined) => {
    const n = parseFloat((s || "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  if (fieldId === "n50") {
    return checkN50PlausibilityVsAnneeConstruction(num(values.n50), num(values.annee_construction));
  }
  if (fieldId === "dpe_actuel" && ctx.dpeCalcule) {
    return checkDpeSaisiVsCalcul((values.dpe_actuel || "").charAt(0), ctx.dpeCalcule);
  }
  if (fieldId === "surface_plancher") {
    return checkSurfacesCoherence(num(values.surface_habitable), num(values.surface_plancher));
  }
  if (fieldId === "toiture_r" || fieldId === "toiture_isolation") {
    const r = num(values.toiture_r);
    const u = r > 0.1 ? 1 / (r + 0.17) : 0;
    if (u <= 0) return null;
    return checkCoherenceUToiture(u, values.toiture_isolation || "");
  }
  if (fieldId === "murs_r" || fieldId === "murs_isolation") {
    const r = num(values.murs_r);
    const u = r > 0.1 ? 1 / (r + 0.17) : 0;
    if (u <= 0) return null;
    return checkCoherenceUMurs(u, values.murs_isolation || "");
  }
  if (fieldId === "conso_totale" && ctx.consoTotaleCalculee) {
    const somme =
      num(values.poste_chauffage) +
      num(values.poste_ecs) +
      num(values.poste_refroidissement) +
      num(values.poste_eclairage) +
      num(values.poste_auxiliaires);
    if (somme > 0) {
      return checkSommeUsagesVsConsoTotale(somme, num(values.conso_totale));
    }
  }
  return null;
}
