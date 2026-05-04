import { describe, it, expect } from "vitest";
import {
  calculerDpe,
  computeDpeLetter,
  computeGesLetter,
  pireClasse,
  vecteurFromLabel,
  COEF_EP,
  FACTEUR_CO2_DPE,
} from "./dpe";

describe("computeDpeLetter — seuils arrêté DPE 2021", () => {
  it.each([
    [50,  "A"],
    [70,  "A"],
    [71,  "B"],
    [110, "B"],
    [111, "C"],
    [180, "C"],
    [181, "D"],
    [250, "D"],
    [251, "E"],
    [330, "E"],
    [331, "F"],
    [420, "F"],
    [421, "G"],
    [500, "G"],
  ])("Cep %d kWhEP/m²·an → %s", (cep, expected) => {
    expect(computeDpeLetter(cep)).toBe(expected);
  });
});

describe("computeGesLetter — seuils arrêté DPE 2021", () => {
  it.each([
    [3,   "A"],
    [6,   "A"],
    [7,   "B"],
    [11,  "B"],
    [12,  "C"],
    [30,  "C"],
    [31,  "D"],
    [50,  "D"],
    [51,  "E"],
    [70,  "E"],
    [71,  "F"],
    [100, "F"],
    [101, "G"],
  ])("GES %d kgCO2/m²·an → %s", (ges, expected) => {
    expect(computeGesLetter(ges)).toBe(expected);
  });
});

describe("pireClasse — règle DPE 2021 (max énergie/climat)", () => {
  it("retourne la classe la moins favorable", () => {
    expect(pireClasse("C", "E")).toBe("E");
    expect(pireClasse("F", "B")).toBe("F");
    expect(pireClasse("A", "A")).toBe("A");
  });
});

describe("COEF_EP / FACTEUR_CO2 — coefficients arrêté 31 mars 2021", () => {
  it("électricité : 2,3 EP, 0,079 kgCO2/kWh", () => {
    expect(COEF_EP.elec).toBe(2.3);
    expect(FACTEUR_CO2_DPE.elec).toBe(0.079);
  });

  it("gaz naturel : 1,0 EP, 0,227 kgCO2/kWh", () => {
    expect(COEF_EP.gaz_naturel).toBe(1.0);
    expect(FACTEUR_CO2_DPE.gaz_naturel).toBe(0.227);
  });

  it("fioul : 1,0 EP, 0,324 kgCO2/kWh (le plus carboné des fossiles)", () => {
    expect(COEF_EP.fioul).toBe(1.0);
    expect(FACTEUR_CO2_DPE.fioul).toBe(0.324);
  });

  it("bois : 0,6 EP (préférentiel), 0,030 kgCO2/kWh (faible)", () => {
    expect(COEF_EP.bois).toBe(0.6);
    expect(FACTEUR_CO2_DPE.bois).toBe(0.030);
  });
});

describe("calculerDpe — cas complet maison fioul", () => {
  it("calcule Cep, GES et étiquette finale (cas E typique)", () => {
    const r = calculerDpe(
      {
        chauffage_kwh: 22000,
        chauffage_vecteur: "fioul",
        ecs_kwh: 1800,
        ecs_vecteur: "elec",
        refroidissement_kwh: 0,
        eclairage_kwh: 199,
        auxiliaires_kwh: 710,
      },
      142,
    );
    // Cep total :  22000×1.0 + 1800×2.3 + 0 + 199×2.3 + 710×2.3 = 22000+4140+458+1633 ≈ 28230
    // Cep/m² ≈ 199 kWhEP/m²·an → C (≤ 180 ? non) → D (≤ 250 ✓)
    expect(r.cep_kwh).toBeCloseTo(28231, 0);
    expect(r.cep_kwh_m2).toBeCloseTo(199, 0);
    expect(r.classe_dpe).toBe("D");

    // GES : 22000×0.324 + 1800×0.079 + 199×0.079 + 710×0.079 = 7128+142+16+56 = 7342
    // GES/m² ≈ 51,7 → E (≤ 70 ✓)
    expect(r.ges_kg).toBeCloseTo(7342, 0);
    expect(r.ges_kg_m2).toBeCloseTo(51.7, 1);
    expect(r.classe_ges).toBe("E");

    // Étiquette finale = pireClasse(D, E) = E
    expect(r.classe_finale).toBe("E");
  });

  it("PAC électrique + chauffe-eau thermo → classe favorable", () => {
    const r = calculerDpe(
      {
        chauffage_kwh: 4500,
        chauffage_vecteur: "elec",
        ecs_kwh: 800,
        ecs_vecteur: "elec",
        refroidissement_kwh: 0,
        eclairage_kwh: 199,
        auxiliaires_kwh: 710,
      },
      142,
    );
    // Cep ≈ (4500+800+199+710) × 2.3 = 14272 / 142 ≈ 100,6 → B (≤ 110)
    expect(r.cep_kwh_m2).toBeGreaterThan(100);
    expect(r.cep_kwh_m2).toBeLessThan(101);
    expect(r.classe_dpe).toBe("B");
  });

  it("retourne le détail par usage avec EF/EP/CO2", () => {
    const r = calculerDpe(
      {
        chauffage_kwh: 10000,
        chauffage_vecteur: "gaz_naturel",
        ecs_kwh: 2000,
        ecs_vecteur: "gaz_naturel",
        refroidissement_kwh: 0,
        eclairage_kwh: 200,
        auxiliaires_kwh: 500,
      },
      100,
    );
    expect(r.detail).toHaveLength(5);
    const chauf = r.detail.find((d) => d.usage === "Chauffage")!;
    expect(chauf.ef_kwh).toBe(10000);
    expect(chauf.ep_kwh).toBe(10000); // gaz coef 1
    expect(chauf.co2_kg).toBeCloseTo(2270, 0); // 10000 × 0.227
  });

  it("gère surface 0 sans diviser par 0", () => {
    const r = calculerDpe(
      { chauffage_kwh: 1000, chauffage_vecteur: "elec",
        ecs_kwh: 0, ecs_vecteur: "elec",
        refroidissement_kwh: 0, eclairage_kwh: 0, auxiliaires_kwh: 0 },
      0,
    );
    expect(Number.isFinite(r.cep_kwh_m2)).toBe(true);
  });
});

describe("vecteurFromLabel — heuristique mapping libellés FR", () => {
  it.each([
    ["Chaudière fioul", "fioul"],
    ["PAC air/eau", "elec"],
    ["Poêle à granulés", "bois"],
    ["Chaudière gaz à condensation", "gaz_naturel"],
    ["Réseau de chaleur urbain", "reseau_chaleur"],
    ["Cuve propane", "propane"],
    ["Convecteurs électriques", "elec"],
    [null, "gaz_naturel"], // fallback
    [undefined, "gaz_naturel"],
  ])("'%s' → %s", (label, expected) => {
    expect(vecteurFromLabel(label)).toBe(expected);
  });
});
