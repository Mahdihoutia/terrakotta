import { describe, it, expect } from "vitest";
import { calculer, calculerDJU, calculerBin, calculerForfait, type BatTh163Inputs } from "./BAT-TH-163";

const base: BatTh163Inputs = {
  surfaceChauffee: 1000,
  zoneClimatique: "H1a — Nord",
  tempBase: -7,
  tempInterieure: 19,
  nbNiveaux: 2,
  hauteurSousPlafond: 3,
  isolationMurs: "Isolation intérieure (ITE)",
  isolationToiture: "Combles perdus isolés",
  typeVitrage: "Double vitrage performant",
  tauxRenouvellementAir: 0.7,
  partApportsGratuitsPct: 15,
  typeGenerateurExistant: "Chaudière standard",
  energieExistante: "Gaz naturel",
  scop: 3.5,
  tauxCouverturePct: 90,
  coutInvestissement: 50000,
  methode: "DJU",
};

describe("BAT-TH-163 — PAC tertiaire", () => {
  it("ko si SCOP absent", () => {
    const r = calculerDJU({ ...base, scop: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("scop");
  });

  it("DJU : déperditions > 0 et G cohérent", () => {
    const r = calculerDJU(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.deperditionsTotales).toBeGreaterThan(0);
    expect(r.value.coeffG).toBeGreaterThan(0);
    expect(r.value.gainMwh).toBeGreaterThan(0);
  });

  it("BIN : SCOP effectif < SCOP nominal en zone froide", () => {
    const dju = calculerDJU(base);
    const bin = calculerBin({ ...base, methode: "BIN" });
    if (!dju.ok || !bin.ok) throw new Error("ko");
    // Conso après en BIN doit être ≥ DJU (SCOP eff plus faible en H1)
    expect(bin.value.consoApres).toBeGreaterThanOrEqual(dju.value.consoApres - 0.1);
  });

  it("FORFAIT : cumac calculé via puissancePac saisie ou déperditions", () => {
    const r = calculerForfait({ ...base, methode: "FORFAITAIRE_CEE", puissancePac: 50 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.cumacKWh).toBe(1500 * 50); // forfait H1 BAT-TH-163
  });

  it("router : DJU par défaut", () => {
    const r = calculer(base);
    if (!r.ok) throw new Error("ko");
    expect(r.value.detailMethode).toContain("G × V × DJU");
  });
});
