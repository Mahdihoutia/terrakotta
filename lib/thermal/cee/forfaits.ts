/**
 * Forfaits CEE — kWh cumac par unité (m² ou kW selon la fiche).
 *
 * **Versioning réglementaire** : chaque entrée porte
 *  - `arrete` : référence de l'arrêté JO/BOAMP en vigueur
 *  - `dateApplication` : date d'entrée en application (ISO)
 *  - `source` : URL BOAMP / Légifrance pour audit a posteriori
 *  - `verifiedAt` : dernière date de vérification manuelle par l'équipe
 *
 * ⚠️ Ces forfaits sont des **ordres de grandeur** pour le pré-calcul du
 * dossier. Pour le **dépôt CEE**, vérifier impérativement la version en
 * vigueur au moment de l'engagement de l'opération sur le site
 * https://www.ecologie.gouv.fr/fiches-doperations-standardisees-cee
 */

import type { FicheId, ZoneH } from "../types";

export interface ForfaitMeta {
  /** Référence de l'arrêté en vigueur. */
  arrete: string;
  /** Date d'application (ISO YYYY-MM-DD). */
  dateApplication: string;
  /** URL BOAMP / Légifrance / texte source. */
  source: string;
  /** Dernière vérification manuelle (ISO YYYY-MM-DD). */
  verifiedAt: string;
  /** Notes libres (ajustements, dérogations…). */
  notes?: string;
}

/** Forfait par zone climatique (cas des fiches résidentielles). */
export interface ForfaitParZone extends ForfaitMeta {
  unite: string;
  H1: number;
  H2: number;
  H3: number;
}

/** Forfait à valeur unique (cas des fiches tertiaires sans zonage). */
export interface ForfaitFlat extends ForfaitMeta {
  unite: string;
  base: number;
}

/** Forfait à variantes par classe (GTB classes A/B/C/D). */
export interface ForfaitParClasse extends ForfaitMeta {
  unite: string;
  baseA: number;
  baseB: number;
}

export type Forfait = ForfaitParZone | ForfaitFlat | ForfaitParClasse;

/* ─── Catalogue ────────────────────────────────────────────────
 * Les `verifiedAt` sont initialisés à la date de migration. À mettre
 * à jour à chaque revue de l'arrêté JO concerné.
 */

const BOAMP_BASE = "https://www.ecologie.gouv.fr/fiches-doperations-standardisees-cee";
const VERIFIED_INIT = "2026-05-06";

export const FORFAITS_CEE: {
  "BAT-TH-134": ForfaitFlat;
  "BAT-TH-163": ForfaitParZone;
  "BAT-TH-142": ForfaitParZone;
  "BAT-TH-139": ForfaitFlat;
  "BAR-TH-171": ForfaitParZone;
  "BAR-TH-159": ForfaitParZone;
  "BAR-EN-101": ForfaitParZone;
  "BAR-EN-102": ForfaitParZone;
  "BAR-EN-103": ForfaitParZone;
  "BAT-TH-116": ForfaitParClasse;
} = {
  "BAT-TH-134": {
    unite: "kW puissance froid",
    base: 250,
    arrete: "Arrêté du 22 décembre 2014 modifié",
    dateApplication: "2015-01-01",
    source: BOAMP_BASE,
    verifiedAt: VERIFIED_INIT,
    notes: "Ordre de grandeur — à confirmer pour chaque dossier.",
  },
  "BAT-TH-163": {
    unite: "kW PAC",
    H1: 1500, H2: 1300, H3: 1100,
    arrete: "Arrêté du 22 décembre 2014 modifié",
    dateApplication: "2015-01-01",
    source: BOAMP_BASE,
    verifiedAt: VERIFIED_INIT,
  },
  "BAT-TH-142": {
    unite: "m² au sol",
    H1: 80, H2: 65, H3: 50,
    arrete: "Arrêté du 22 décembre 2014 modifié",
    dateApplication: "2015-01-01",
    source: BOAMP_BASE,
    verifiedAt: VERIFIED_INIT,
  },
  "BAT-TH-139": {
    unite: "kW puissance froid",
    base: 1200,
    arrete: "Arrêté du 22 décembre 2014 modifié",
    dateApplication: "2015-01-01",
    source: BOAMP_BASE,
    verifiedAt: VERIFIED_INIT,
  },
  "BAR-TH-171": {
    unite: "m² chauffé",
    H1: 5500, H2: 4500, H3: 2500,
    arrete: "Arrêté du 22 décembre 2014 modifié — fiche BAR-TH-171",
    dateApplication: "2022-04-01",
    source: BOAMP_BASE + "/bar-th-171",
    verifiedAt: VERIFIED_INIT,
    notes: "Fiche révisée 5e période CEE. Maison individuelle uniquement.",
  },
  "BAR-TH-159": {
    unite: "m² chauffé",
    H1: 4400, H2: 3500, H3: 2000,
    arrete: "Arrêté du 22 décembre 2014 modifié — fiche BAR-TH-159",
    dateApplication: "2022-04-01",
    source: BOAMP_BASE + "/bar-th-159",
    verifiedAt: VERIFIED_INIT,
    notes: "PAC hybride — couplage PAC + chaudière condensation existante.",
  },
  "BAR-EN-101": {
    unite: "m² isolé",
    H1: 1900, H2: 1500, H3: 700,
    arrete: "Arrêté du 22 décembre 2014 modifié — fiche BAR-EN-101",
    dateApplication: "2022-04-01",
    source: BOAMP_BASE + "/bar-en-101",
    verifiedAt: VERIFIED_INIT,
    notes: "Isolation des combles / toitures.",
  },
  "BAR-EN-102": {
    unite: "m² isolé",
    H1: 4400, H2: 3500, H3: 1700,
    arrete: "Arrêté du 22 décembre 2014 modifié — fiche BAR-EN-102",
    dateApplication: "2022-04-01",
    source: BOAMP_BASE + "/bar-en-102",
    verifiedAt: VERIFIED_INIT,
    notes: "Isolation des murs (ITE / ITI).",
  },
  "BAR-EN-103": {
    unite: "m² isolé",
    H1: 1900, H2: 1500, H3: 700,
    arrete: "Arrêté du 22 décembre 2014 modifié — fiche BAR-EN-103",
    dateApplication: "2022-04-01",
    source: BOAMP_BASE + "/bar-en-103",
    verifiedAt: VERIFIED_INIT,
    notes: "Isolation d'un plancher bas.",
  },
  "BAT-TH-116": {
    unite: "m² (selon classe)",
    baseA: 300,
    baseB: 180,
    arrete: "Arrêté du 22 décembre 2014 modifié — fiche BAT-TH-116",
    dateApplication: "2015-01-01",
    source: BOAMP_BASE + "/bat-th-116",
    verifiedAt: VERIFIED_INIT,
    notes: "GTB classes A/B (NF EN 15232 / ISO 52120-1).",
  },
};

/** Récupère le forfait pour une fiche zonée (BAR-TH-171, BAR-EN-*, etc.). */
export function getForfaitParZone(
  ficheId: FicheId,
  zoneH: ZoneH,
): { valeur: number; meta: ForfaitMeta; unite: string } | null {
  const f = FORFAITS_CEE[ficheId as keyof typeof FORFAITS_CEE];
  if (!f) return null;
  if ("H1" in f) {
    return { valeur: f[zoneH], meta: f, unite: f.unite };
  }
  return null;
}
