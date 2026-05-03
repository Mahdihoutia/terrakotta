/**
 * Types — module aides financières rénovation énergétique.
 * Référence : barèmes MaPrimeRénov' 2025, CEE, Eco-PTZ.
 */

export type CategorieRessources =
  | "BLEU"      // très modestes
  | "JAUNE"     // modestes
  | "VIOLET"    // intermédiaires
  | "ROSE";     // supérieurs

export type ZoneGeographique = "IDF" | "AUTRES";

/** Codes des gestes de travaux subventionnés. */
export type GesteCode =
  | "ISOLATION_MURS_ITE"
  | "ISOLATION_MURS_ITI"
  | "ISOLATION_COMBLES"
  | "ISOLATION_PLANCHER_BAS"
  | "ISOLATION_TOITURE_TERRASSE"
  | "MENUISERIES"
  | "VMC_DOUBLE_FLUX"
  | "VMC_SIMPLE_FLUX"
  | "PAC_AIR_EAU"
  | "PAC_GEOTHERMIQUE"
  | "PAC_AIR_AIR"
  | "CHAUDIERE_BIOMASSE"
  | "POELE_GRANULES"
  | "POELE_BUCHES"
  | "CHAUFFE_EAU_THERMODYNAMIQUE"
  | "CHAUFFE_EAU_SOLAIRE"
  | "DEPOSE_CUVE_FIOUL"
  | "AUDIT_ENERGETIQUE";

/** Geste de travaux saisi pour une variante. */
export interface Geste {
  code: GesteCode;
  /** Quantité (m² isolés, nombre de menuiseries, etc.). */
  quantite: number;
  /** Coût HT du geste (€). */
  coutHT: number;
}

/** Foyer demandeur — sert au plafond ressources MaPrimeRénov'. */
export interface FoyerDemandeur {
  zone: ZoneGeographique;
  nbPersonnes: number;
  /** Revenu fiscal de référence (€/an). */
  rfr: number;
}

/** Détail d'une aide calculée. */
export interface AideLigne {
  type: "MAPRIMERENOV" | "CEE" | "ECO_PTZ" | "TVA_REDUITE";
  /** Code geste lié (null pour aides globales type Eco-PTZ). */
  geste: GesteCode | null;
  libelle: string;
  /** Montant en €, négatif (déduit du reste à charge). */
  montant: number;
  /** Détail méthodo (ex: "75 €/m² × 80 m²"). */
  base: string;
}

/** Synthèse aides pour une variante. */
export interface AidesResult {
  categorie: CategorieRessources;
  coutTravauxHT: number;
  coutTravauxTTC: number;
  totalAides: number;
  resteACharge: number;
  ecoPtzMax: number;
  lignes: AideLigne[];
}
