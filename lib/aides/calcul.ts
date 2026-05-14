/**
 * Calcul des aides financières pour une variante de rénovation.
 *
 * Stratégie : on additionne par geste (MPR + CEE), on plafonne par les règles
 * réglementaires (plafond quantité MPR, plafond global pourcentage TTC),
 * puis on agrège.
 */

import type {
  AideLigne,
  AidesResult,
  CategorieRessources,
  FoyerDemandeur,
  Geste,
  GesteCode,
} from "./types";
import {
  ECO_PTZ_BOUQUET_GLOBAL,
  ECO_PTZ_PLAFONDS,
  FORFAITS_CEE,
  FORFAITS_MPR,
  GESTES_TVA_REDUITE,
  PLAFOND_MPR_PCT_TTC,
  TVA_NORMALE,
  TVA_REDUITE,
  categorieMaPrimeRenov,
  type ForfaitGeste,
} from "./baremes";

const LIBELLES_GESTES: Record<GesteCode, string> = {
  ISOLATION_MURS_ITE: "Isolation murs par l'extérieur",
  ISOLATION_MURS_ITI: "Isolation murs par l'intérieur",
  ISOLATION_COMBLES: "Isolation combles perdus",
  ISOLATION_PLANCHER_BAS: "Isolation plancher bas",
  ISOLATION_TOITURE_TERRASSE: "Isolation toiture-terrasse",
  MENUISERIES: "Remplacement menuiseries",
  VMC_DOUBLE_FLUX: "VMC double flux",
  VMC_SIMPLE_FLUX: "VMC simple flux",
  PAC_AIR_EAU: "Pompe à chaleur air/eau",
  PAC_GEOTHERMIQUE: "Pompe à chaleur géothermique",
  PAC_AIR_AIR: "Pompe à chaleur air/air",
  CHAUDIERE_BIOMASSE: "Chaudière biomasse",
  POELE_GRANULES: "Poêle à granulés",
  POELE_BUCHES: "Poêle à bûches",
  CHAUFFE_EAU_THERMODYNAMIQUE: "Chauffe-eau thermodynamique",
  CHAUFFE_EAU_SOLAIRE: "Chauffe-eau solaire",
  DEPOSE_CUVE_FIOUL: "Dépose cuve fioul",
  AUDIT_ENERGETIQUE: "Audit énergétique",
};

function appliquerForfait(
  forfait: ForfaitGeste,
  geste: Geste,
  categorie: CategorieRessources,
): { montant: number; base: string } {
  const tarifUnit = forfait.parCategorie[categorie];
  if (tarifUnit === 0) return { montant: 0, base: "Catégorie non éligible" };

  const quantiteEligible = forfait.plafondQuantite
    ? Math.min(geste.quantite, forfait.plafondQuantite)
    : geste.quantite;

  if (forfait.unite === "FORFAIT") {
    return {
      montant: tarifUnit,
      base: `Forfait ${tarifUnit.toLocaleString("fr-FR")} €`,
    };
  }

  const unite = forfait.unite === "M2" ? "m²" : "u.";
  const montant = tarifUnit * quantiteEligible;
  const plafondNote = forfait.plafondQuantite && geste.quantite > forfait.plafondQuantite
    ? ` (plafonné à ${forfait.plafondQuantite} ${unite})`
    : "";
  return {
    montant,
    base: `${tarifUnit} €/${unite} × ${quantiteEligible} ${unite}${plafondNote}`,
  };
}

/**
 * Calcule l'ensemble des aides applicables à une liste de gestes pour un foyer.
 */
export function calculerAides(
  gestes: Geste[],
  foyer?: FoyerDemandeur,
): AidesResult {
  // MPR n'est calculé que pour un foyer particulier identifié.
  const categorie: CategorieRessources | null = foyer
    ? categorieMaPrimeRenov(foyer.rfr, foyer.nbPersonnes, foyer.zone)
    : null;
  const lignes: AideLigne[] = [];

  /* TVA ----------------------------------------------------------------- */
  let coutTravauxHT = 0;
  let coutTravauxTTC = 0;
  let economieTVA = 0;
  for (const g of gestes) {
    const tauxTva = GESTES_TVA_REDUITE.has(g.code) ? TVA_REDUITE : TVA_NORMALE;
    const tvaPayee = g.coutHT * tauxTva;
    const tvaSiNormale = g.coutHT * TVA_NORMALE;
    coutTravauxHT += g.coutHT;
    coutTravauxTTC += g.coutHT + tvaPayee;
    if (tauxTva < TVA_NORMALE) {
      economieTVA += tvaSiNormale - tvaPayee;
    }
  }
  if (economieTVA > 0) {
    lignes.push({
      type: "TVA_REDUITE",
      geste: null,
      libelle: "TVA réduite 5,5 %",
      montant: economieTVA,
      base: `Économie vs TVA 20 % sur gestes éligibles`,
    });
  }

  /* MaPrimeRénov' par geste — uniquement pour foyer particulier --------- */
  if (categorie) {
    let totalMPRBrut = 0;
    for (const g of gestes) {
      const forfait = FORFAITS_MPR[g.code];
      if (!forfait) continue;
      const { montant, base } = appliquerForfait(forfait, g, categorie);
      if (montant <= 0) continue;
      totalMPRBrut += montant;
      lignes.push({
        type: "MAPRIMERENOV",
        geste: g.code,
        libelle: `MaPrimeRénov' — ${LIBELLES_GESTES[g.code]}`,
        montant,
        base,
      });
    }

    /* Plafond global MPR : % du coût TTC -------------------------------- */
    const plafondMPR = coutTravauxTTC * PLAFOND_MPR_PCT_TTC[categorie];
    if (totalMPRBrut > plafondMPR) {
      const ecreteur = plafondMPR / totalMPRBrut;
      for (const l of lignes) {
        if (l.type === "MAPRIMERENOV") l.montant = Math.round(l.montant * ecreteur);
      }
      lignes.push({
        type: "MAPRIMERENOV",
        geste: null,
        libelle: `Écrêtement plafond MPR (${(PLAFOND_MPR_PCT_TTC[categorie] * 100).toFixed(0)}% TTC)`,
        montant: 0,
        base: `Plafond appliqué : ${plafondMPR.toFixed(0)} €`,
      });
    }
  }

  /* CEE par geste — barème indépendant du foyer (catégorie ressources
   * MPR utilisée comme proxy ; en l'absence, on prend ROSE par défaut). */
  const categorieCEE: CategorieRessources = categorie ?? "ROSE";
  for (const g of gestes) {
    const forfait = FORFAITS_CEE[g.code];
    if (!forfait) continue;
    const { montant, base } = appliquerForfait(forfait, g, categorieCEE);
    if (montant <= 0) continue;
    lignes.push({
      type: "CEE",
      geste: g.code,
      libelle: `CEE — ${LIBELLES_GESTES[g.code]}`,
      montant,
      base,
    });
  }

  /* Eco-PTZ — plafond informatif (prêt, pas une aide directe) ----------- */
  const nbActionsEligibles = gestes.filter(
    (g) => FORFAITS_MPR[g.code] !== undefined && g.code !== "AUDIT_ENERGETIQUE",
  ).length;
  let ecoPtzMax = 0;
  if (nbActionsEligibles >= 3) ecoPtzMax = ECO_PTZ_PLAFONDS[3];
  else if (nbActionsEligibles >= 2) ecoPtzMax = ECO_PTZ_PLAFONDS[2];
  else if (nbActionsEligibles >= 1) ecoPtzMax = ECO_PTZ_PLAFONDS[1];

  /* Total + reste à charge --------------------------------------------- */
  const totalAides = lignes.reduce((s, l) => s + l.montant, 0);
  const resteACharge = Math.max(0, coutTravauxTTC - totalAides);

  return {
    categorie,
    coutTravauxHT,
    coutTravauxTTC,
    totalAides,
    resteACharge,
    ecoPtzMax,
    lignes,
  };
}

/**
 * Bonus rénovation globale (gain ≥ 35%) — alternative au cumul par geste.
 * À appeler en lieu et place de calculerAides quand une étude DPE prouve
 * un saut de classe + gain ≥ 35%.
 */
export const ECO_PTZ_RENOVATION_GLOBALE = ECO_PTZ_BOUQUET_GLOBAL;
