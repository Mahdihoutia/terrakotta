import { describe, it, expect } from "vitest";
import { calculer, type BatTh139Inputs } from "./BAT-TH-139";

const base: BatTh139Inputs = {
  puissanceFroid: 100,    // kW
  puissanceAbsorbee: 30,  // kW élec
  heures: 5000,
  tauxChargePct: 60,
  tauxRecupPct: 50,
  sourceActuelle: "Chaudière gaz",
  consoActuelle: 1500,
  marqueGroupe: "Demo",
  coutInvestissement: 25000,
};

describe("BAT-TH-139 — récupération chaleur", () => {
  it("ko si une puissance manque", () => {
    const r = calculer({ ...base, puissanceFroid: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("puissance_froid");
  });

  it("calcule chaleur condenseur, récupérée et conso évitée", () => {
    const r = calculer(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // (100+30) × 5000 × 0.6 / 1000 = 390 MWh
    expect(r.value.chaleurRejetee).toBeCloseTo(390, 0);
    expect(r.value.chaleurRecuperee).toBeCloseTo(195, 0);
    // 195 / 0.9 (gaz) ≈ 216.67
    expect(r.value.consoEvitee).toBeCloseTo(195 / 0.9, 0);
  });

  it("retourne un cumacKWh > 0", () => {
    const r = calculer(base);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.cumacKWh).toBeGreaterThan(0);
  });

  it("source fioul → rendement 0.85 → conso évitée plus grande", () => {
    const gaz = calculer({ ...base, sourceActuelle: "Chaudière gaz" });
    const fioul = calculer({ ...base, sourceActuelle: "fioul domestique" });
    if (!gaz.ok || !fioul.ok) throw new Error("ko");
    expect(fioul.value.consoEvitee).toBeGreaterThan(gaz.value.consoEvitee);
  });
});
