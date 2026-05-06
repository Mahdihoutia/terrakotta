import { describe, it, expect } from "vitest";
import { calculer, calculerDeltaU, calculerForfait, PAROIS_DEFAULTS, type IsolationInputs } from "./BAR-EN-isolation";

const baseCombles: IsolationInputs = {
  surface: 100,
  zoneClimatique: "H1a — Nord",
  rApres: 7.0, // R = 7 m².K/W (combles bien isolés)
  energieExistante: "Gaz naturel",
  coutInvestissement: 4000,
  methode: "REGLEMENTAIRE_DELTA_U",
};

describe("BAR-EN — méthode ΔU", () => {
  it("retourne ko si zone manquante", () => {
    const r = calculerDeltaU({ ...baseCombles, zoneClimatique: "" }, PAROIS_DEFAULTS["BAR-EN-101"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("zone_climatique");
  });

  it("calcule ΔU positif et gain > 0 — combles non isolés (101)", () => {
    const r = calculerDeltaU(baseCombles, PAROIS_DEFAULTS["BAR-EN-101"]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.deltaU).toBeGreaterThan(2.5); // U_avant 3.0, U_après ~0.14
    expect(r.value.gainMwh).toBeGreaterThan(0);
    expect(r.value.cumacKWh).toBeGreaterThan(0);
  });

  it("gain proportionnel à la surface", () => {
    const a = calculerDeltaU({ ...baseCombles, surface: 100 }, PAROIS_DEFAULTS["BAR-EN-101"]);
    const b = calculerDeltaU({ ...baseCombles, surface: 200 }, PAROIS_DEFAULTS["BAR-EN-101"]);
    if (!a.ok || !b.ok) throw new Error("calc ko");
    expect(b.value.gainMwh / a.value.gainMwh).toBeCloseTo(2, 1);
  });

  it("retourne ko si ΔU négatif (R_après ≤ R_avant)", () => {
    // R_avant 1/3.0 = 0.33 ; on saisit R_après plus faible → U_après > U_avant.
    const r = calculerDeltaU({ ...baseCombles, rApres: 0.2 }, PAROIS_DEFAULTS["BAR-EN-101"]);
    expect(r.ok).toBe(false);
  });
});

describe("BAR-EN — forfait CEE", () => {
  it("cumac H1 = 1900 × surface (BAR-EN-101)", () => {
    const r = calculerForfait(
      { ...baseCombles, methode: "FORFAITAIRE_CEE", surface: 100 },
      PAROIS_DEFAULTS["BAR-EN-101"],
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.cumacKWh).toBe(1900 * 100);
  });

  it("cumac H1 BAR-EN-102 = 4400 × surface", () => {
    const r = calculerForfait(
      { ...baseCombles, methode: "FORFAITAIRE_CEE", surface: 100 },
      PAROIS_DEFAULTS["BAR-EN-102"],
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.cumacKWh).toBe(4400 * 100);
  });

  it("cumac H3 < cumac H1", () => {
    const h1 = calculerForfait(
      { ...baseCombles, zoneClimatique: "H1a — Nord", methode: "FORFAITAIRE_CEE" },
      PAROIS_DEFAULTS["BAR-EN-101"],
    );
    const h3 = calculerForfait(
      { ...baseCombles, zoneClimatique: "H3 — Méditerranée", methode: "FORFAITAIRE_CEE" },
      PAROIS_DEFAULTS["BAR-EN-101"],
    );
    if (!h1.ok || !h3.ok) throw new Error("ko");
    expect(h3.value.cumacKWh).toBeLessThan(h1.value.cumacKWh);
  });
});

describe("BAR-EN — calculer() route", () => {
  it("route DeltaU par défaut", () => {
    const r = calculer({ ...baseCombles, methode: "REGLEMENTAIRE_DELTA_U" }, PAROIS_DEFAULTS["BAR-EN-101"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.detailMethode).toContain("ΔU × S × DJU");
  });

  it("route Forfait", () => {
    const r = calculer({ ...baseCombles, methode: "FORFAITAIRE_CEE" }, PAROIS_DEFAULTS["BAR-EN-101"]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.detailMethode).toContain("Forfait CEE");
  });
});
