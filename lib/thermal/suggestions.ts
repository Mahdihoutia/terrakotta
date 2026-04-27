/**
 * Suggestions intelligentes de pré-remplissage cross-sections pour
 * l'audit énergétique. Les valeurs sont proposées (jamais écrasées
 * sans consentement) — l'UI affiche la rationale et permet d'appliquer
 * suggestion par suggestion ou en bloc.
 */

import type { DeperditionsResult, DpeResult } from "./index";

export interface FormValuesLike {
  [key: string]: string;
}

export interface ThermalCalcLike {
  deperditions: DeperditionsResult | null;
  dpe: DpeResult | null;
}

export interface Suggestion {
  fieldId: string;
  label: string;
  value: string;
  unit?: string;
  rationale: string;
}

function num(v: string | undefined): number {
  const n = parseFloat((v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function isEmpty(v: string | undefined): boolean {
  return !v || !v.trim();
}

/**
 * Rendement attendu d'un générateur selon son type et son année.
 * Retourne un % entier (ex: 88 pour 88 %).
 */
function rendementParTypeEtAnnee(type: string, annee: number): number | null {
  const t = (type || "").toLowerCase();
  if (t.includes("condens")) return 95;
  if (t.includes("basse t")) return 88;
  if (t.includes("pac")) return 300;
  if (t.includes("convect") || t.includes("électr") || t.includes("electr") || t.includes("radiateur électr")) return 100;
  if (t.includes("poêle") || t.includes("poele") || t.includes("granulé") || t.includes("bois")) return 75;
  if (t.includes("gaz")) {
    if (annee >= 2005) return 88;
    if (annee >= 1990) return 80;
    if (annee > 0) return 70;
    return 80;
  }
  if (t.includes("fioul")) {
    if (annee >= 1990) return 80;
    if (annee > 0) return 65;
    return 75;
  }
  return null;
}

/**
 * R typique selon libellé d'isolation toiture.
 */
function rTypiqueToiture(label: string): number | null {
  const s = (label || "").toLowerCase();
  if (s.includes("non isol")) return 0.5;
  if (s.includes("insuff")) return 3;
  if (s.includes("correctement")) return 5;
  if (s.includes("bien isol")) return 7;
  return null;
}

/**
 * R typique selon libellé d'isolation murs.
 */
function rTypiqueMurs(label: string): number | null {
  const s = (label || "").toLowerCase();
  if (s.includes("non isol")) return 0.5;
  if (s.includes("extérieure")) return 4;
  if (s.includes("intérieure")) return 2.8;
  if (s.includes("répartie")) return 1.5;
  return null;
}

/**
 * U vitrage selon type de menuiserie.
 */
function uVitrageTypique(label: string): number | null {
  const s = (label || "").toLowerCase();
  if (s.includes("simple")) return 5.0;
  if (s.includes("ancien")) return 2.8;
  if (s.includes("triple")) return 0.8;
  if (s.includes("récent") || s.includes("double")) return 1.4;
  return null;
}

export function computeSuggestions(values: FormValuesLike, calc: ThermalCalcLike): Suggestion[] {
  const out: Suggestion[] = [];

  // 1. Volume chauffé = SHAB × HSP × niveaux
  const shab = num(values.surface_habitable);
  const hsp = num(values.hauteur_plafond);
  const nbN = num(values.nb_niveaux);
  if (isEmpty(values.volume_chauffe) && shab > 0 && hsp > 0 && nbN > 0) {
    const v = Math.round(shab * hsp * nbN);
    out.push({
      fieldId: "volume_chauffe",
      label: "Volume chauffé",
      value: String(v),
      unit: "m³",
      rationale: `SHAB × HSP × niveaux = ${shab} × ${hsp} × ${nbN}`,
    });
  } else if (isEmpty(values.volume_chauffe) && shab > 0 && hsp > 0) {
    const v = Math.round(shab * hsp);
    out.push({
      fieldId: "volume_chauffe",
      label: "Volume chauffé",
      value: String(v),
      unit: "m³",
      rationale: `SHAB × HSP = ${shab} × ${hsp}`,
    });
  }

  // 2. Rendement chauffage par type & âge
  if (isEmpty(values.chauffage_rendement) && values.chauffage_type) {
    const annee = num(values.chauffage_annee);
    const r = rendementParTypeEtAnnee(values.chauffage_type, annee);
    if (r !== null) {
      out.push({
        fieldId: "chauffage_rendement",
        label: "Rendement chauffage",
        value: String(r),
        unit: "%",
        rationale: `Typique pour ${values.chauffage_type}${annee ? ` (${annee})` : ""}`,
      });
    }
  }

  // 3. R toiture par isolation
  if (isEmpty(values.toiture_r) && values.toiture_isolation) {
    const r = rTypiqueToiture(values.toiture_isolation);
    if (r !== null) {
      out.push({
        fieldId: "toiture_r",
        label: "R toiture estimée",
        value: String(r),
        unit: "m².K/W",
        rationale: `Typique pour « ${values.toiture_isolation} »`,
      });
    }
  }

  // 4. R murs par isolation
  if (isEmpty(values.murs_r) && values.murs_isolation) {
    const r = rTypiqueMurs(values.murs_isolation);
    if (r !== null) {
      out.push({
        fieldId: "murs_r",
        label: "R murs estimée",
        value: String(r),
        unit: "m².K/W",
        rationale: `Typique pour « ${values.murs_isolation} »`,
      });
    }
  }

  // 5. U vitrage par type
  if (isEmpty(values.menuiseries_u) && values.menuiseries_type) {
    const u = uVitrageTypique(values.menuiseries_type);
    if (u !== null) {
      out.push({
        fieldId: "menuiseries_u",
        label: "U vitrage",
        value: String(u),
        unit: "W/m²·K",
        rationale: `Typique pour « ${values.menuiseries_type} »`,
      });
    }
  }

  // 6. conso/m² depuis conso_totale & SHAB
  const consoTot = num(values.conso_totale);
  if (isEmpty(values.conso_par_m2) && consoTot > 0 && shab > 0) {
    const v = Math.round(consoTot / shab);
    out.push({
      fieldId: "conso_par_m2",
      label: "Conso par m²",
      value: String(v),
      unit: "kWh/m²/an",
      rationale: `Conso totale ÷ SHAB = ${consoTot} ÷ ${shab}`,
    });
  }

  // 7. CO₂/m²
  const co2Tot = num(values.emissions_co2);
  if (isEmpty(values.emissions_co2_m2) && co2Tot > 0 && shab > 0) {
    const v = Math.round(co2Tot / shab);
    out.push({
      fieldId: "emissions_co2_m2",
      label: "Émissions CO₂ par m²",
      value: String(v),
      unit: "kgCO₂/m²/an",
      rationale: `Émissions ÷ SHAB = ${co2Tot} ÷ ${shab}`,
    });
  }

  // 8 & 9. DPE / GES depuis le calcul
  const dpe = calc.dpe;
  if (dpe) {
    const dpeMatch = [
      "A — ≤ 70 kWhEP/m²/an",
      "B — 71 à 110",
      "C — 111 à 180",
      "D — 181 à 250",
      "E — 251 à 330",
      "F — 331 à 420",
      "G — > 420",
    ].find((opt) => opt.startsWith(dpe.classe_dpe));
    if (dpeMatch && (values.dpe_actuel || "").charAt(0) !== dpe.classe_dpe) {
      out.push({
        fieldId: "dpe_actuel",
        label: "Classe DPE actuelle",
        value: dpeMatch,
        rationale: `Calculé 3CL : Cep = ${dpe.cep_kwh_m2.toFixed(0)} kWh EP/m²/an`,
      });
    }
    const gesMatch = [
      "A — ≤ 6 kgCO₂/m²/an",
      "B — 7 à 11",
      "C — 12 à 30",
      "D — 31 à 50",
      "E — 51 à 70",
      "F — 71 à 100",
      "G — > 100",
    ].find((opt) => opt.startsWith(dpe.classe_ges));
    if (gesMatch && (values.ges_actuel || "").charAt(0) !== dpe.classe_ges) {
      out.push({
        fieldId: "ges_actuel",
        label: "Classe GES actuelle",
        value: gesMatch,
        rationale: `Calculé : ${dpe.ges_kg_m2.toFixed(1)} kg CO₂/m²/an`,
      });
    }
  }

  // 10. Ubat depuis déperditions
  if (calc.deperditions && isEmpty(values.ubat) && calc.deperditions.ubatMoyen > 0) {
    out.push({
      fieldId: "ubat",
      label: "Ubat (coefficient moyen)",
      value: calc.deperditions.ubatMoyen.toFixed(2),
      unit: "W/m²·K",
      rationale: "Pondération des U et surfaces de l'enveloppe",
    });
  }

  // 11. Répartition des déperditions (un seul bouton « Tout appliquer » côté UI)
  if (calc.deperditions) {
    const d = calc.deperditions;
    const map: Array<[string, number, string]> = [
      ["deperd_murs", d.pctMurs, "Murs"],
      ["deperd_toiture", d.pctToiture, "Toiture"],
      ["deperd_plancher", d.pctPlancher, "Plancher"],
      ["deperd_menuiseries", d.pctVitree, "Menuiseries"],
      ["deperd_ponts", d.pctPontsThermiques, "Ponts thermiques"],
      ["deperd_ventilation", d.pctVentilation, "Ventilation"],
      ["deperd_infiltrations", d.pctInfiltrations, "Infiltrations"],
    ];
    for (const [id, pct, label] of map) {
      if (isEmpty(values[id]) && pct > 0) {
        out.push({
          fieldId: id,
          label: `Part ${label}`,
          value: pct.toFixed(0),
          unit: "%",
          rationale: "Issu du calcul d'enveloppe (Th-BCE)",
        });
      }
    }
  }

  return out;
}
