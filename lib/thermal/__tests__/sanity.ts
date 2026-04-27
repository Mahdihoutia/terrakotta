/**
 * Tests de sanité (ordres de grandeur) pour le moteur thermique.
 * Exécution : `npx tsx lib/thermal/__tests__/sanity.ts`
 */

import {
  calculerDeperditions,
  calculerBesoinsChauffage,
  calculerApportsSolaires,
  calculerDpe,
  calculerPontsThermiques,
  parseZone,
} from "../index";

let ok = 0;
let ko = 0;

function assert(cond: boolean, msg: string, extra?: unknown): void {
  if (cond) {
    ok++;
    console.log(`  PASS  ${msg}`);
  } else {
    ko++;
    console.error(`  FAIL  ${msg}`, extra ?? "");
  }
}

console.log("\n— Test 1 : maison 100 m² zone H1a, R≈4 partout, double vitrage —");
{
  const dep = calculerDeperditions({
    surfaceMurs: 90, surfaceToiture: 100, surfacePlancher: 100, surfaceVitree: 15,
    uMurs: 0.25, uToiture: 0.20, uPlancher: 0.25, uVitree: 1.4,
    hPontsThermiques: 8, // ITE faible
    volumeChauffe: 250, renouvellementAir: 0.5, efficaciteDoubleFlux: 0,
    deltaT: 26, // 19 - (-7)
  });
  console.log("  Ubat ≈", dep.ubatMoyen.toFixed(3), "W/m²·K");
  console.log("  H_total ≈", dep.hTotal.toFixed(1), "W/K");
  console.log("  Pertes T_base ≈", (dep.pertesT_base / 1000).toFixed(2), "kW");
  assert(dep.ubatMoyen < 0.5, "Ubat maison performante < 0.5", dep.ubatMoyen);
  assert(dep.hTotal > 60 && dep.hTotal < 200, "H_total dans la fourchette attendue", dep.hTotal);

  const apports = calculerApportsSolaires({
    surfacesParOrientation: { S: 8, SE: 0, SO: 0, E: 3, O: 3, NE: 0, NO: 0, N: 1 },
    facteurSolaireG: 0.55, facteurOmbre: 0.85, zone: "H1a",
  });
  console.log("  Apports solaires annuels ≈", apports.apportAnnuel.toFixed(0), "kWh");

  const besoins = calculerBesoinsChauffage({
    zone: "H1a — Nord",
    surfaceHabitable: 100, volumeChauffe: 250,
    ubat: dep.ubatMoyen, surfaceDeperditiveTotale: dep.surfaceDeperditiveTotale,
    renouvellementAir: 0.5,
    apportsSolairesGratuits: apports.apportAnnuel,
    apportsInternes: 100 * 5 * 24 * 365 / 1000 * 0.3, // ~5 W/m² × 30% utilisation
    rendementInstallation: 0.95,
  });
  const consoM2 = besoins.consoFinale / 100;
  console.log("  Besoin brut ≈", besoins.besoinBrut.toFixed(0), "kWh/an");
  console.log("  Conso finale ≈", besoins.consoFinale.toFixed(0), "kWh/an");
  console.log("  Conso /m² ≈", consoM2.toFixed(0), "kWh/m²/an");
  assert(consoM2 > 30 && consoM2 < 150, "Conso /m² maison BBC dans 30-150", consoM2);
}

console.log("\n— Test 2 : bureau tertiaire 1000 m² zone H2b, isolation moyenne —");
{
  const dep = calculerDeperditions({
    surfaceMurs: 600, surfaceToiture: 350, surfacePlancher: 350, surfaceVitree: 200,
    uMurs: 1.5, uToiture: 0.5, uPlancher: 1.5, uVitree: 2.9,
    hPontsThermiques: 80,
    volumeChauffe: 3000, renouvellementAir: 1.0, efficaciteDoubleFlux: 0,
    deltaT: 21, // 19 - (-2)
  });
  console.log("  Ubat ≈", dep.ubatMoyen.toFixed(3), "W/m²·K");
  console.log("  H_total ≈", dep.hTotal.toFixed(0), "W/K");
  console.log("  Pertes T_base ≈", (dep.pertesT_base / 1000).toFixed(1), "kW");
  assert(dep.ubatMoyen > 0.8 && dep.ubatMoyen < 2.5, "Ubat bureau ancien 0.8-2.5", dep.ubatMoyen);
  assert(dep.pertesT_base / 1000 > 30 && dep.pertesT_base / 1000 < 150, "Pertes 30-150 kW", dep.pertesT_base / 1000);
}

console.log("\n— Test 3 : DPE maison gaz 18 000 kWh/an + ECS élec 2 500 kWh —");
{
  const dpe = calculerDpe({
    chauffage_kwh: 18000, chauffage_vecteur: "gaz_naturel",
    ecs_kwh: 2500, ecs_vecteur: "elec",
    refroidissement_kwh: 0, eclairage_kwh: 800, auxiliaires_kwh: 400,
  }, 100);
  console.log("  Cep ≈", dpe.cep_kwh_m2.toFixed(0), "kWh EP/m² → classe", dpe.classe_dpe);
  console.log("  GES ≈", dpe.ges_kg_m2.toFixed(1), "kg CO₂/m² → classe", dpe.classe_ges);
  console.log("  Étiquette finale :", dpe.classe_finale);
  assert(["C", "D", "E"].includes(dpe.classe_dpe), "Classe DPE plausible", dpe.classe_dpe);
}

console.log("\n— Test 4 : ponts thermiques —");
{
  const r = calculerPontsThermiques([
    { typo: "MUR_PLANCHER_BAS", longueur: 40, isolation: "ITI" },
    { typo: "MUR_TOITURE", longueur: 40, isolation: "ITI" },
    { typo: "MENUISERIE_NU_INTERIEUR", longueur: 60, isolation: "ITI" },
  ]);
  console.log("  H_pt total ≈", r.hTotal.toFixed(1), "W/K");
  assert(r.hTotal > 30 && r.hTotal < 100, "H_pt ITI dans la fourchette", r.hTotal);
}

console.log("\n— Test 5 : parseZone —");
{
  assert(parseZone("H1a — Nord") === "H1a", "parseZone H1a");
  assert(parseZone("H2c — Sud-Ouest") === "H2C" || parseZone("H2c — Sud-Ouest") === "H2c", "parseZone H2c");
  assert(parseZone(undefined) === "H1a", "parseZone fallback");
}

console.log(`\n— Résultat : ${ok} OK, ${ko} KO —\n`);
process.exit(ko > 0 ? 1 : 0);
