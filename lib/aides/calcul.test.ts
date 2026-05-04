import { describe, it, expect } from "vitest";
import {
  calculerAides,
  categorieMaPrimeRenov,
  type Geste,
  type FoyerDemandeur,
} from "./index";

describe("categorieMaPrimeRenov", () => {
  it("classe 1 personne 16 000 € province en BLEU (≤ 17 009)", () => {
    expect(categorieMaPrimeRenov(16000, 1, "AUTRES")).toBe("BLEU");
  });

  it("classe 1 personne 22 000 € province en VIOLET (au-dessus JAUNE 21 805, ≤ 30 549)", () => {
    expect(categorieMaPrimeRenov(22000, 1, "AUTRES")).toBe("VIOLET");
  });

  it("majore correctement par personne supplémentaire (4 pers BLEU = 17009 + 3×2491)", () => {
    expect(categorieMaPrimeRenov(20000, 4, "AUTRES")).toBe("BLEU");
    expect(categorieMaPrimeRenov(25000, 4, "AUTRES")).toBe("JAUNE");
  });

  it("seuils IDF plus hauts (4 pers BLEU IDF = 23541 + 3×3454 = 33 903)", () => {
    expect(categorieMaPrimeRenov(32000, 4, "IDF")).toBe("BLEU");
    expect(categorieMaPrimeRenov(35000, 4, "IDF")).toBe("JAUNE");
  });

  it("classe en ROSE au-dessus du dernier plafond", () => {
    expect(categorieMaPrimeRenov(80000, 1, "AUTRES")).toBe("ROSE");
  });
});

describe("calculerAides — geste isolation murs ITE", () => {
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 4, rfr: 28000 };

  it("calcule MPR JAUNE 60 €/m² × 100 m² = 6 000 €", () => {
    const r = calculerAides(
      [{ code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 }],
      foyer,
    );
    expect(r.categorie).toBe("JAUNE");
    const mpr = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "ISOLATION_MURS_ITE");
    expect(mpr?.montant).toBe(6000);
  });

  it("plafonne la quantité éligible MPR à 100 m² même si saisie 200 m²", () => {
    const r = calculerAides(
      [{ code: "ISOLATION_MURS_ITE", quantite: 200, coutHT: 40000 }],
      { zone: "AUTRES", nbPersonnes: 2, rfr: 15000 },
    );
    expect(r.categorie).toBe("BLEU");
    const mpr = r.lignes.find((l) => l.type === "MAPRIMERENOV");
    // BLEU ITE 75 €/m² × 100 = 7 500 € (pas 15 000)
    expect(mpr?.montant).toBe(7500);
    expect(mpr?.base).toContain("plafonné");
  });

  it("calcule CEE en plus de MPR (additif)", () => {
    const r = calculerAides(
      [{ code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 }],
      foyer,
    );
    const cee = r.lignes.find((l) => l.type === "CEE" && l.geste === "ISOLATION_MURS_ITE");
    // CEE JAUNE 20 €/m² × 100 = 2 000 €
    expect(cee?.montant).toBe(2000);
  });

  it("applique TVA réduite 5,5% sur gestes éligibles (économie ≈ 14,5% du HT)", () => {
    const r = calculerAides(
      [{ code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 }],
      foyer,
    );
    const tva = r.lignes.find((l) => l.type === "TVA_REDUITE");
    expect(tva).toBeDefined();
    expect(tva!.montant).toBeCloseTo(2900, 0); // 20000 × (0.20 − 0.055)
  });
});

describe("calculerAides — catégorie ROSE (gestes non éligibles)", () => {
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 1, rfr: 80000 };

  it("MPR ITE ROSE = 15 €/m² (eligible mais réduit)", () => {
    const r = calculerAides(
      [{ code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 }],
      foyer,
    );
    expect(r.categorie).toBe("ROSE");
    const mpr = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "ISOLATION_MURS_ITE");
    expect(mpr?.montant).toBe(1500);
  });

  it("MPR PAC absent pour ROSE (forfait 0 €)", () => {
    const r = calculerAides(
      [
        { code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 },
        { code: "PAC_AIR_EAU", quantite: 1, coutHT: 14000 },
      ],
      foyer,
    );
    const mprPac = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "PAC_AIR_EAU");
    expect(mprPac).toBeUndefined();
  });
});

describe("calculerAides — plafond global MPR", () => {
  it("écrête à 60% TTC pour VIOLET", () => {
    const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 1, rfr: 25000 };
    const r = calculerAides(
      [{ code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 5000 }],
      foyer,
    );
    expect(r.categorie).toBe("VIOLET");
    const mpr = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "ISOLATION_MURS_ITE");
    // VIOLET ITE 40 €/m² × 100 = 4000 € — TTC ≈ 5275 → plafond 60% TTC = 3165 €
    expect(mpr!.montant).toBeLessThanOrEqual(3200);
  });
});

describe("calculerAides — Eco-PTZ", () => {
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 1, rfr: 20000 };

  it("plafond 15 000 € pour 1 action", () => {
    const r = calculerAides(
      [{ code: "ISOLATION_MURS_ITE", quantite: 50, coutHT: 10000 }],
      foyer,
    );
    expect(r.ecoPtzMax).toBe(15000);
  });

  it("plafond 30 000 € pour 3 actions", () => {
    const gestes: Geste[] = [
      { code: "ISOLATION_MURS_ITE", quantite: 50, coutHT: 10000 },
      { code: "ISOLATION_COMBLES", quantite: 80, coutHT: 4000 },
      { code: "PAC_AIR_EAU", quantite: 1, coutHT: 14000 },
    ];
    const r = calculerAides(gestes, foyer);
    expect(r.ecoPtzMax).toBe(30000);
  });

  it("ignore l'audit énergétique du compte d'actions", () => {
    const r = calculerAides(
      [
        { code: "AUDIT_ENERGETIQUE", quantite: 1, coutHT: 800 },
        { code: "ISOLATION_MURS_ITE", quantite: 50, coutHT: 10000 },
      ],
      foyer,
    );
    expect(r.ecoPtzMax).toBe(15000); // 1 action seulement, pas 2
  });
});

describe("calculerAides — invariants", () => {
  it("reste à charge = TTC − total aides, ≥ 0", () => {
    const r = calculerAides(
      [
        { code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 },
        { code: "PAC_AIR_EAU", quantite: 1, coutHT: 14000 },
      ],
      { zone: "AUTRES", nbPersonnes: 4, rfr: 28000 },
    );
    expect(r.resteACharge).toBe(r.coutTravauxTTC - r.totalAides);
    expect(r.resteACharge).toBeGreaterThanOrEqual(0);
  });

  it("aucun geste = aucune aide, reste à charge = 0", () => {
    const r = calculerAides([], { zone: "AUTRES", nbPersonnes: 1, rfr: 20000 });
    expect(r.coutTravauxHT).toBe(0);
    expect(r.totalAides).toBe(0);
    expect(r.resteACharge).toBe(0);
    expect(r.lignes.length).toBe(0);
  });
});
