import { describe, it, expect } from "vitest";
import { calculer, type BarTh159Inputs } from "./BAR-TH-159";

const base: BarTh159Inputs = {
  surfaceHabitable: 120,
  zoneClimatique: "H1a — Nord",
  anneeConstruction: 1980,
  hauteurPlafond: 2.5,
  scopOrCop: 3.5,
  tBascule: -2,
  energieExistante: "Gaz naturel",
  typeChauffageExistant: "Chaudière standard",
  emetteursExistants: "Radiateurs haute température",
  coutInvestissement: 9000,
};

describe("BAR-TH-159 — PAC hybride", () => {
  it("ko si SCOP/COP absent", () => {
    const r = calculer({ ...base, scopOrCop: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("scop");
  });

  it("calcule un gain et un cumac > 0", () => {
    const r = calculer(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.gainMwh).toBeGreaterThan(0);
    expect(r.value.cumacKWh).toBeGreaterThan(0);
    expect(r.value.partPac).toBeGreaterThan(0);
    expect(r.value.partPac).toBeLessThanOrEqual(1);
  });

  it("part PAC plus élevée en zone H3 (moins d'heures sous bascule)", () => {
    const h1 = calculer({ ...base, zoneClimatique: "H1a — Nord" });
    const h3 = calculer({ ...base, zoneClimatique: "H3 — Méditerranée" });
    if (!h1.ok || !h3.ok) throw new Error("ko");
    expect(h3.value.partPac).toBeGreaterThan(h1.value.partPac);
  });

  it("HSP saisi modifie le besoin (test régression — bug fixé)", () => {
    const a = calculer({ ...base, hauteurPlafond: 2.5 });
    const b = calculer({ ...base, hauteurPlafond: 3.5 });
    if (!a.ok || !b.ok) throw new Error("ko");
    // Volume plus grand → besoin plus grand
    expect(b.value.besoinChauffage).toBeGreaterThan(a.value.besoinChauffage);
  });
});
