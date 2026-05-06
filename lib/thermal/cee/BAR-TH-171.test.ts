import { describe, it, expect } from "vitest";
import {
  calculer,
  calculerDJU,
  calculerScopDetaille,
  calculerForfait,
  checkEligibilite,
  type BarTh171Inputs,
} from "./BAR-TH-171";

/** Maison individuelle 100 m², zone H1a, 1985, gaz, SCOP 4. */
const baseInputs: BarTh171Inputs = {
  surfaceHabitable: 100,
  zoneClimatique: "H1a — Nord",
  anneeConstruction: 1985,
  hauteurPlafond: 2.5,
  scop: 4.0,
  energieExistante: "Gaz naturel",
  typeChauffageExistant: "Chaudière standard",
  emetteursExistants: "Radiateurs haute température",
  coutInvestissement: 12000,
  methode: "DJU",
};

/* ─── Garde-fous : champs manquants → Result ko ───────────── */

describe("BAR-TH-171 — Result<T> sur champs manquants", () => {
  it("retourne ko si la zone climatique est absente", () => {
    const r = calculerDJU({ ...baseInputs, zoneClimatique: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("zone_climatique");
  });

  it("retourne ko si la surface est ≤ 0", () => {
    const r = calculerDJU({ ...baseInputs, surfaceHabitable: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("surface_habitable");
  });

  it("retourne ko si SCOP est absent en méthode DJU", () => {
    const r = calculerDJU({ ...baseInputs, scop: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("scop");
  });

  it("le forfait n'a pas besoin du SCOP", () => {
    const r = calculerForfait({ ...baseInputs, scop: 0 });
    expect(r.ok).toBe(true);
  });
});

/* ─── Méthode DJU : cohérence physique ────────────────────── */

describe("BAR-TH-171 — méthode DJU", () => {
  it("calcule un gain et un cumac > 0 sur cas nominal", () => {
    const r = calculerDJU(baseInputs);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.gainMwh).toBeGreaterThan(0);
    expect(r.value.cumacKWh).toBeGreaterThan(0);
    expect(r.value.gainPct).toBeGreaterThan(0);
    expect(r.value.gainPct).toBeLessThan(100);
  });

  it("conso après < conso avant (PAC plus efficace)", () => {
    const r = calculerDJU(baseInputs);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.consoApres).toBeLessThan(r.value.consoAvant);
  });

  it("zone H3 produit moins de besoin que H1 (DJU plus faible)", () => {
    const h1 = calculerDJU({ ...baseInputs, zoneClimatique: "H1a — Nord" });
    const h3 = calculerDJU({ ...baseInputs, zoneClimatique: "H3 — Méditerranée" });
    expect(h1.ok && h3.ok).toBe(true);
    if (!h1.ok || !h3.ok) return;
    expect(h3.value.besoinChauffage).toBeLessThan(h1.value.besoinChauffage);
  });

  it("besoin proportionnel à la surface", () => {
    const a = calculerDJU({ ...baseInputs, surfaceHabitable: 100 });
    const b = calculerDJU({ ...baseInputs, surfaceHabitable: 200 });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    // Ratio besoin ≈ ratio surface (à 1 % près)
    expect(b.value.besoinChauffage / a.value.besoinChauffage).toBeCloseTo(2, 1);
  });

  it("durée de retour calculée si coût investissement renseigné", () => {
    const r = calculerDJU(baseInputs);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.dureeRetour).toBeGreaterThan(0);
  });
});

/* ─── Méthode SCOP détaillée ────────────────────────────── */

describe("BAR-TH-171 — méthode SCOP NF EN 14825", () => {
  it("SCOP effectif inférieur au SCOP nominal (correctifs froid)", () => {
    const r = calculerScopDetaille(baseInputs);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Le détail expose le SCOP effectif via texte ; on vérifie indirectement :
    // gainMwh SCOP_DETAILLE ≤ gainMwh DJU (parce que conso après plus élevée).
    const dju = calculerDJU(baseInputs);
    if (!dju.ok) throw new Error("DJU ko");
    expect(r.value.gainMwh).toBeLessThanOrEqual(dju.value.gainMwh);
  });
});

/* ─── Méthode forfaitaire CEE ───────────────────────────── */

describe("BAR-TH-171 — forfait CEE", () => {
  it("cumac H1 = 5500 × surface (BAR-TH-171, 5e période)", () => {
    const r = calculerForfait({ ...baseInputs, zoneClimatique: "H1a — Nord", surfaceHabitable: 100 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.cumacKWh).toBe(5500 * 100);
  });

  it("cumac H3 < cumac H1 pour même surface", () => {
    const h1 = calculerForfait({ ...baseInputs, zoneClimatique: "H1a — Nord" });
    const h3 = calculerForfait({ ...baseInputs, zoneClimatique: "H3 — Méditerranée" });
    expect(h1.ok && h3.ok).toBe(true);
    if (!h1.ok || !h3.ok) return;
    expect(h3.value.cumacKWh).toBeLessThan(h1.value.cumacKWh);
  });
});

/* ─── Routeur calculer() ─────────────────────────────────── */

describe("BAR-TH-171 — calculer() route correctement", () => {
  it("DJU par défaut", () => {
    const r = calculer({ ...baseInputs, methode: "DJU" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.detailMethode).toContain("DJU");
  });

  it("SCOP_DETAILLE", () => {
    const r = calculer({ ...baseInputs, methode: "SCOP_DETAILLE" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.detailMethode).toContain("NF EN 14825");
  });

  it("FORFAITAIRE_CEE", () => {
    const r = calculer({ ...baseInputs, methode: "FORFAITAIRE_CEE" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.detailMethode).toContain("Forfait");
  });
});

/* ─── Eligibilité ───────────────────────────────────────── */

describe("BAR-TH-171 — checkEligibilite", () => {
  it("OK sur cas nominal", () => {
    expect(checkEligibilite(baseInputs)).toEqual([]);
  });

  it("remonte ZONE_INCONNUE si zone vide", () => {
    const issues = checkEligibilite({ ...baseInputs, zoneClimatique: "" });
    expect(issues.some((i) => i.code === "ZONE_INCONNUE")).toBe(true);
  });

  it("remonte SCOP_MIN si SCOP < 2.5 (méthode non forfait)", () => {
    const issues = checkEligibilite({ ...baseInputs, scop: 2.0, methode: "DJU" });
    expect(issues.some((i) => i.code === "SCOP_MIN")).toBe(true);
  });

  it("ne remonte pas SCOP_MIN si méthode forfaitaire", () => {
    const issues = checkEligibilite({ ...baseInputs, scop: 0, methode: "FORFAITAIRE_CEE" });
    expect(issues.some((i) => i.code === "SCOP_MIN")).toBe(false);
  });
});
