/**
 * Tests de sanité — module aides financières.
 * Exécution : `npx tsx lib/aides/__tests__/sanity.ts`
 */

import {
  calculerAides,
  categorieMaPrimeRenov,
  TVA_REDUITE,
  type Geste,
  type FoyerDemandeur,
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

function near(a: number, b: number, tol = 1): boolean {
  return Math.abs(a - b) <= tol;
}

console.log("\n— Test 1 : Catégorisation MPR par zone et composition —");
{
  // Foyer 1 personne, RFR 16 000 €, province → BLEU (≤ 17 009)
  assert(
    categorieMaPrimeRenov(16000, 1, "AUTRES") === "BLEU",
    "1 pers RFR 16 000 € province → BLEU",
  );
  // Foyer 1 personne, RFR 22 000 €, province → JAUNE (≤ 21 805 → non, > → JAUNE non plus, ≤ 30 549 VIOLET)
  assert(
    categorieMaPrimeRenov(22000, 1, "AUTRES") === "VIOLET",
    "1 pers RFR 22 000 € province → VIOLET",
  );
  // Foyer 4 personnes province : seuils BLEU = 17009 + 3×2491 = 24 482
  assert(
    categorieMaPrimeRenov(20000, 4, "AUTRES") === "BLEU",
    "4 pers RFR 20 000 € province → BLEU",
  );
  // IDF 4 pers : BLEU = 23541 + 3×3454 = 33 903. 35 000 > → JAUNE.
  assert(
    categorieMaPrimeRenov(35000, 4, "IDF") === "JAUNE",
    "4 pers RFR 35 000 € IDF → JAUNE (au-dessus seuil BLEU)",
  );
  // 32 000 < 33 903 → BLEU
  assert(
    categorieMaPrimeRenov(32000, 4, "IDF") === "BLEU",
    "4 pers RFR 32 000 € IDF → BLEU (sous seuil BLEU)",
  );
}

console.log("\n— Test 2 : ITE seule, foyer JAUNE 4 pers province —");
{
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 4, rfr: 28000 };
  const gestes: Geste[] = [
    { code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 },
  ];
  const r = calculerAides(gestes, foyer);
  assert(r.categorie === "JAUNE", "Catégorie JAUNE");
  assert(r.coutTravauxHT === 20000, "Coût HT 20 000 €");
  // TTC 5,5% → 21 100 €
  assert(near(r.coutTravauxTTC, 21100), `TTC ≈ 21 100 € (réel ${r.coutTravauxTTC})`);
  // MPR JAUNE ITE : 60 €/m² × 100 m² = 6 000 €
  const mpr = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "ISOLATION_MURS_ITE");
  assert(mpr?.montant === 6000, `MPR ITE 6 000 € (réel ${mpr?.montant})`);
  // CEE ITE JAUNE : 20 €/m² × 100 = 2 000 €
  const cee = r.lignes.find((l) => l.type === "CEE" && l.geste === "ISOLATION_MURS_ITE");
  assert(cee?.montant === 2000, `CEE ITE 2 000 € (réel ${cee?.montant})`);
  // TVA réduite : 20% - 5,5% = 14,5% × 20 000 = 2 900
  const tva = r.lignes.find((l) => l.type === "TVA_REDUITE");
  assert(near(tva?.montant ?? 0, 2900), `TVA réduite ≈ 2 900 € (réel ${tva?.montant})`);
}

console.log("\n— Test 3 : Plafond quantité ITE (100 m²) —");
{
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 2, rfr: 15000 };
  // BLEU 2 pers : 17009 + 2491 = 19 500 ⇒ BLEU
  const gestes: Geste[] = [
    { code: "ISOLATION_MURS_ITE", quantite: 200, coutHT: 40000 },
  ];
  const r = calculerAides(gestes, foyer);
  assert(r.categorie === "BLEU", "Catégorie BLEU");
  // BLEU 75 €/m² plafonné à 100 m² → 7 500 € (pas 15 000 €)
  const mpr = r.lignes.find((l) => l.type === "MAPRIMERENOV");
  assert(mpr?.montant === 7500, `MPR plafonné à 7 500 € (réel ${mpr?.montant})`);
  assert(
    (mpr?.base ?? "").includes("plafonné"),
    "Annotation 'plafonné' présente",
  );
}

console.log("\n— Test 4 : Catégorie ROSE → MPR ITE seulement, pas PAC —");
{
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 1, rfr: 80000 };
  const gestes: Geste[] = [
    { code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 },
    { code: "PAC_AIR_EAU", quantite: 1, coutHT: 14000 },
  ];
  const r = calculerAides(gestes, foyer);
  assert(r.categorie === "ROSE", "Catégorie ROSE");
  // ROSE ITE : 15 €/m² × 100 = 1 500 €
  const mprIte = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "ISOLATION_MURS_ITE");
  assert(mprIte?.montant === 1500, `MPR ITE ROSE 1 500 € (réel ${mprIte?.montant})`);
  // ROSE PAC : 0 € → ligne absente
  const mprPac = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "PAC_AIR_EAU");
  assert(mprPac === undefined, "MPR PAC absente pour ROSE");
}

console.log("\n— Test 5 : Plafond global MPR (60% TTC pour VIOLET) —");
{
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 1, rfr: 25000 };
  // 1 pers province : VIOLET (21805 < 25000 ≤ 30549)
  const gestes: Geste[] = [
    { code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 5000 },
  ];
  const r = calculerAides(gestes, foyer);
  assert(r.categorie === "VIOLET", "Catégorie VIOLET");
  // VIOLET ITE : 40 €/m² × 100 = 4 000 € — mais coût HT 5000 → TTC ≈ 5 275 → plafond 60% TTC = 3 165 €
  const mpr = r.lignes.find((l) => l.type === "MAPRIMERENOV" && l.geste === "ISOLATION_MURS_ITE");
  assert(
    (mpr?.montant ?? 0) <= 3200,
    `MPR écrêté ≤ 3 200 € (réel ${mpr?.montant})`,
  );
}

console.log("\n— Test 6 : Eco-PTZ — plafonds par nb actions —");
{
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 1, rfr: 20000 };
  const r1 = calculerAides(
    [{ code: "ISOLATION_MURS_ITE", quantite: 50, coutHT: 10000 }],
    foyer,
  );
  assert(r1.ecoPtzMax === 15000, `Eco-PTZ 1 action = 15 000 € (réel ${r1.ecoPtzMax})`);
  const r3 = calculerAides(
    [
      { code: "ISOLATION_MURS_ITE", quantite: 50, coutHT: 10000 },
      { code: "ISOLATION_COMBLES", quantite: 80, coutHT: 4000 },
      { code: "PAC_AIR_EAU", quantite: 1, coutHT: 14000 },
    ],
    foyer,
  );
  assert(r3.ecoPtzMax === 30000, `Eco-PTZ 3 actions = 30 000 € (réel ${r3.ecoPtzMax})`);
}

console.log("\n— Test 7 : Reste à charge cohérent —");
{
  const foyer: FoyerDemandeur = { zone: "AUTRES", nbPersonnes: 4, rfr: 28000 };
  const gestes: Geste[] = [
    { code: "ISOLATION_MURS_ITE", quantite: 100, coutHT: 20000 },
    { code: "PAC_AIR_EAU", quantite: 1, coutHT: 14000 },
  ];
  const r = calculerAides(gestes, foyer);
  assert(
    r.resteACharge === r.coutTravauxTTC - r.totalAides,
    "Reste à charge = TTC − Total aides",
  );
  assert(r.resteACharge >= 0, "Reste à charge ≥ 0");
}

console.log(`\n=== Résumé : ${ok} OK / ${ko} KO ===`);
process.exit(ko > 0 ? 1 : 0);
