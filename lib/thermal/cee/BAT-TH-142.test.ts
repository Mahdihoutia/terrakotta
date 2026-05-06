import { describe, it, expect } from "vitest";
import { calculer, type BatTh142Inputs } from "./BAT-TH-142";

const base: BatTh142Inputs = {
  gradientAvant: 5,
  gradientApres: 1,
  consoAvant: 100, // MWh/an
  nbDestratificateurs: 4,
  puissanceUnitaire: 0.3, // kW
  heuresFonctionnement: 4000,
  hauteurSousPlafond: 8,
  surfaceLocal: 1500,
  energieChauffage: "Gaz naturel",
  coutInvestissement: 8000,
};

describe("BAT-TH-142 — déstratification", () => {
  it("ko si gradient_avant = 0", () => {
    const r = calculer({ ...base, gradientAvant: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("gradient_avant");
  });

  it("plafonne le gain à 30 % (réduction > 10°C)", () => {
    const r = calculer({ ...base, gradientAvant: 20, gradientApres: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.gainBrutPct).toBe(30);
  });

  it("3 % par °C : 4°C → 12 % gain brut", () => {
    const r = calculer(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.gainBrutPct).toBeCloseTo(12, 1);
  });

  it("retourne un cumacKWh et reductionCo2 > 0", () => {
    const r = calculer(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.cumacKWh).toBeGreaterThan(0);
    expect(r.value.reductionCo2).toBeGreaterThan(0);
  });

  it("alias gainNetMwh === gainMwh (compat UI)", () => {
    const r = calculer(base);
    if (!r.ok) throw new Error("ko");
    expect(r.value.gainNetMwh).toBe(r.value.gainMwh);
  });
});
