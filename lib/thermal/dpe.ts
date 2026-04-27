/**
 * A4 — DPE 5 usages (méthode 3CL-DPE 2021).
 *
 * Sources : arrêté du 31 mars 2021 — méthode de calcul DPE logement,
 * arrêté du 25 octobre 2021 — méthode pour bâtiments tertiaires.
 *
 * Cep (kWh EP/m²·an) = Σ (kWh EF × coef_EP) / S_hab
 * GES (kg CO₂e/m²·an) = Σ (kWh EF × FE_CO2) / S_hab
 * Étiquette finale = max(classe_DPE, classe_GES) — règle officielle DPE 2021.
 */

export type Vecteur =
  | "elec"
  | "gaz_naturel"
  | "fioul"
  | "bois"
  | "propane"
  | "reseau_chaleur";

/** Coefficient EP/EF — arrêté 31 mars 2021. */
export const COEF_EP: Record<Vecteur, number> = {
  elec: 2.3,
  gaz_naturel: 1.0,
  fioul: 1.0,
  bois: 0.6,
  propane: 1.0,
  reseau_chaleur: 1.0,
};

/** Facteurs CO₂ DPE 2021 (kg CO₂e / kWh EF). */
export const FACTEUR_CO2_DPE: Record<Vecteur, number> = {
  elec: 0.079,
  gaz_naturel: 0.227,
  fioul: 0.324,
  bois: 0.030,
  propane: 0.272,
  reseau_chaleur: 0.180,
};

export type ClasseDpe = "A" | "B" | "C" | "D" | "E" | "F" | "G";

/** Seuils DPE 2021 — étiquette énergie (kWh EP/m²·an). */
export function computeDpeLetter(kwhEpM2: number): ClasseDpe {
  if (kwhEpM2 <= 70) return "A";
  if (kwhEpM2 <= 110) return "B";
  if (kwhEpM2 <= 180) return "C";
  if (kwhEpM2 <= 250) return "D";
  if (kwhEpM2 <= 330) return "E";
  if (kwhEpM2 <= 420) return "F";
  return "G";
}

/** Seuils GES 2021 (kg CO₂e/m²·an). */
export function computeGesLetter(co2M2: number): ClasseDpe {
  if (co2M2 <= 6) return "A";
  if (co2M2 <= 11) return "B";
  if (co2M2 <= 30) return "C";
  if (co2M2 <= 50) return "D";
  if (co2M2 <= 70) return "E";
  if (co2M2 <= 100) return "F";
  return "G";
}

/** Compare deux classes (A < B < … < G) et retourne la plus défavorable. */
export function pireClasse(a: ClasseDpe, b: ClasseDpe): ClasseDpe {
  const order: ClasseDpe[] = ["A", "B", "C", "D", "E", "F", "G"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

export interface DpeUsages {
  chauffage_kwh: number;
  chauffage_vecteur: Vecteur;
  ecs_kwh: number;
  ecs_vecteur: Vecteur;
  /** Refroidissement / clim — toujours électrique. */
  refroidissement_kwh: number;
  /** Éclairage — électrique. */
  eclairage_kwh: number;
  /** Auxiliaires (VMC, circulateurs) — électrique. */
  auxiliaires_kwh: number;
}

export interface DpeDetailLine {
  usage: string;
  ef_kwh: number;
  ep_kwh: number;
  co2_kg: number;
  vecteur: Vecteur;
}

export interface DpeResult {
  cep_kwh: number;
  cep_kwh_m2: number;
  ges_kg: number;
  ges_kg_m2: number;
  classe_dpe: ClasseDpe;
  classe_ges: ClasseDpe;
  classe_finale: ClasseDpe;
  detail: DpeDetailLine[];
}

export function calculerDpe(usages: DpeUsages, surfaceHabitable: number): DpeResult {
  const lines: Array<{ usage: string; ef: number; v: Vecteur }> = [
    { usage: "Chauffage", ef: usages.chauffage_kwh, v: usages.chauffage_vecteur },
    { usage: "ECS", ef: usages.ecs_kwh, v: usages.ecs_vecteur },
    { usage: "Refroidissement", ef: usages.refroidissement_kwh, v: "elec" },
    { usage: "Éclairage", ef: usages.eclairage_kwh, v: "elec" },
    { usage: "Auxiliaires", ef: usages.auxiliaires_kwh, v: "elec" },
  ];

  const detail: DpeDetailLine[] = lines.map((l) => ({
    usage: l.usage,
    vecteur: l.v,
    ef_kwh: l.ef,
    ep_kwh: l.ef * COEF_EP[l.v],
    co2_kg: l.ef * FACTEUR_CO2_DPE[l.v],
  }));

  const cep_kwh = detail.reduce((s, d) => s + d.ep_kwh, 0);
  const ges_kg = detail.reduce((s, d) => s + d.co2_kg, 0);
  const surface = Math.max(1, surfaceHabitable);
  const cep_kwh_m2 = cep_kwh / surface;
  const ges_kg_m2 = ges_kg / surface;

  const classe_dpe = computeDpeLetter(cep_kwh_m2);
  const classe_ges = computeGesLetter(ges_kg_m2);

  return {
    cep_kwh,
    cep_kwh_m2,
    ges_kg,
    ges_kg_m2,
    classe_dpe,
    classe_ges,
    classe_finale: pireClasse(classe_dpe, classe_ges),
    detail,
  };
}

/**
 * Mappe le libellé du formulaire (chauffage_type, ecs_type) vers un Vecteur DPE.
 */
export function vecteurFromLabel(label: string | undefined | null): Vecteur {
  if (!label) return "gaz_naturel";
  const s = label.toLowerCase();
  if (s.includes("fioul")) return "fioul";
  if (s.includes("bois") || s.includes("granulé") || s.includes("granule") || s.includes("poêle")) return "bois";
  if (s.includes("propane") || s.includes("gpl")) return "propane";
  if (s.includes("réseau") || s.includes("reseau")) return "reseau_chaleur";
  if (s.includes("gaz")) return "gaz_naturel";
  if (s.includes("électr") || s.includes("electr") || s.includes("pac") || s.includes("convecteur") || s.includes("ballon")) return "elec";
  return "gaz_naturel";
}
