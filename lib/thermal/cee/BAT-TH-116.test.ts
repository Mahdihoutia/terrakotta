import { describe, it, expect } from "vitest";
import { calculer, type BatTh116Inputs } from "./BAT-TH-116";

const base: BatTh116Inputs = {
  surfaceBatiment: 2000,
  classeGtb: "Classe A",
  regulationClimExistante: "Climatisation à débit variable",
  typeBatiment: "Bureau",
  zoneClimatique: "H1a — Nord",
  coutInvestissement: 80000,
};

describe("BAT-TH-116 — GTB", () => {
  it("ko si surface manquante", () => {
    const r = calculer({ ...base, surfaceBatiment: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("surface_batiment");
  });

  it("classe A : 30 % chauffage, 20 % clim", () => {
    const r = calculer(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // chauffage : 110 × 2000 × 0.30 = 66000 kWh ; clim : 25 × 2000 × 0.20 = 10000
    expect(r.value.gainChauffKwh).toBe(66000);
    expect(r.value.gainClimKwh).toBe(10000);
  });

  it("classe B : 18 % / 14 %", () => {
    const r = calculer({ ...base, classeGtb: "Classe B" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.gainChauffKwh).toBe(110 * 2000 * 0.18);
    expect(r.value.gainClimKwh).toBe(25 * 2000 * 0.14);
  });

  it("Aucune climatisation → pas de gain clim", () => {
    const r = calculer({ ...base, regulationClimExistante: "Aucune climatisation" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.gainClimKwh).toBe(0);
  });

  it("retourne un cumacKWh > 0", () => {
    const r = calculer(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.cumacKWh).toBeGreaterThan(0);
  });
});
