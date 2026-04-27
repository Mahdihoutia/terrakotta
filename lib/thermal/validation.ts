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
