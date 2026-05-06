import { describe, it, expect } from "vitest";
import { calculer, calculerBin, calculerCarnot, calculerForfait, type BatTh134Inputs, type GroupeFroid } from "./BAT-TH-134";

const groupes: GroupeFroid[] = [
  { puissanceFroid: 100, puissanceAbsorbee: 30, tCondFixe: 45 },
  { puissanceFroid: 50,  puissanceAbsorbee: 16, tCondFixe: 45 },
];

const base: BatTh134Inputs = {
  zoneClimatique: "H1a — Nord",
  groupes,
  consoAvant: 200, // MWh élec/an
  tCondMin: 25,
  ecartApproche: 10,
  heuresFonctionnement: 6500,
  tEvapPos: -8,
  tEvapNeg: -30,
  regimeFroid: "Froid positif uniquement (> 0°C)",
  coutInvestissement: 30000,
  methode: "BIN",
};

describe("BAT-TH-134 — HP flottante", () => {
  it("ko si groupes vides", () => {
    const r = calculerBin({ ...base, groupes: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("groupes_froids");
  });

  it("BIN : COP_avant pondéré et gain > 0", () => {
    const r = calculerBin(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // COP avant = 150/46 ≈ 3.26
    expect(r.value.copMoyenAvant).toBeCloseTo(150 / 46, 1);
    expect(r.value.copMoyenApres).toBeGreaterThan(r.value.copMoyenAvant);
    expect(r.value.gainMwh).toBeGreaterThan(0);
  });

  it("CARNOT : ratio COP > 1 → gain", () => {
    const r = calculerCarnot({ ...base, methode: "CARNOT" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.gainMwh).toBeGreaterThan(0);
  });

  it("FORFAIT : cumac = 250 × P_froid totale", () => {
    const r = calculerForfait({ ...base, methode: "FORFAITAIRE_CEE" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.cumacKWh).toBe(250 * 150);
  });

  it("router calculer() respecte la méthode demandée", () => {
    const bin = calculer({ ...base, methode: "BIN" });
    const carnot = calculer({ ...base, methode: "CARNOT" });
    const forfait = calculer({ ...base, methode: "FORFAITAIRE_CEE" });
    if (!bin.ok || !carnot.ok || !forfait.ok) throw new Error("ko");
    expect(bin.value.detailMethode).toContain("Méthode bin");
    expect(carnot.value.detailMethode).toContain("Carnot");
    expect(forfait.value.detailMethode).toContain("Forfait CEE");
  });
});
