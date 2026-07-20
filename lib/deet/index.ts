/**
 * Décret Tertiaire (DEET / Éco Énergie Tertiaire) — moteur de trajectoire.
 *
 * Base réglementaire :
 *   • Arrêté du 24 novembre 2020 modifié (méthode Crelative & Cabs)
 *   • Objectifs : −40 % en 2030, −50 % en 2040, −60 % en 2050 vs. année
 *     de référence (2010-2019 au choix).
 *   • OU respect d'un seuil absolu (Cabs) exprimé en kWh EF/m²/an,
 *     spécifique à chaque catégorie d'activité et zone climatique.
 *   • Déclaration annuelle sur OPERAT (ADEME) avant le 30 septembre.
 *
 * Ce module fournit :
 *   • le catalogue des Cabs par activité + zone (valeurs 2030 principales,
 *     réévaluées tous les 10 ans par arrêté)
 *   • le calcul de trajectoire (baseline → 2030/2040/2050)
 *   • l'évaluation du statut d'alignement à date
 *   • le simulateur "et si" (application d'un gain % → recalcul)
 */

export type DeetActivite =
  | "BUREAUX"
  | "ENSEIGNEMENT"
  | "HOSPITALIER"
  | "HOTELLERIE_RESTAURATION"
  | "COMMERCE"
  | "LOGISTIQUE_INDUSTRIE"
  | "SPORT_LOISIRS"
  | "CULTURE"
  | "AUTRE_TERTIAIRE";

export type DeetMethode = "RELATIVE" | "ABSOLUE";
export type ZoneClimatique = "H1" | "H2" | "H3";

export const ACTIVITE_LABEL: Record<DeetActivite, string> = {
  BUREAUX: "Bureaux",
  ENSEIGNEMENT: "Enseignement",
  HOSPITALIER: "Hospitalier / santé",
  HOTELLERIE_RESTAURATION: "Hôtellerie / restauration",
  COMMERCE: "Commerce",
  LOGISTIQUE_INDUSTRIE: "Logistique / industrie",
  SPORT_LOISIRS: "Sport / loisirs",
  CULTURE: "Culture",
  AUTRE_TERTIAIRE: "Autre tertiaire",
};

/**
 * Cabs 2030 (kWh EF/m²/an) par activité et zone climatique.
 * Valeurs indicatives simplifiées agrégées à partir des arrêtés
 * DEET (2020, 2022, 2024). Pour un dossier réglementaire précis,
 * se référer à l'annexe de l'arrêté en vigueur.
 */
const CABS_2030: Record<DeetActivite, Record<ZoneClimatique, number>> = {
  BUREAUX: { H1: 137, H2: 130, H3: 118 },
  ENSEIGNEMENT: { H1: 100, H2: 95, H3: 88 },
  HOSPITALIER: { H1: 265, H2: 255, H3: 245 },
  HOTELLERIE_RESTAURATION: { H1: 250, H2: 240, H3: 220 },
  COMMERCE: { H1: 145, H2: 138, H3: 128 },
  LOGISTIQUE_INDUSTRIE: { H1: 105, H2: 100, H3: 92 },
  SPORT_LOISIRS: { H1: 155, H2: 148, H3: 138 },
  CULTURE: { H1: 130, H2: 124, H3: 115 },
  AUTRE_TERTIAIRE: { H1: 140, H2: 133, H3: 122 },
};

/** Récupère le Cabs 2030 (kWh EF/m²/an) pour une activité + zone donnée. */
export function cabs2030(activite: DeetActivite, zone: ZoneClimatique): number {
  return CABS_2030[activite]?.[zone] ?? CABS_2030.AUTRE_TERTIAIRE[zone];
}

/**
 * Cabs 2040 = Cabs 2030 × 0.833 (réduction supplémentaire de −16.7 %)
 * Cabs 2050 = Cabs 2030 × 0.667 (réduction supplémentaire de −33.3 %)
 * Approximation cohérente avec la trajectoire réglementaire.
 */
export function cabs2040(activite: DeetActivite, zone: ZoneClimatique): number {
  return cabs2030(activite, zone) * 0.833;
}
export function cabs2050(activite: DeetActivite, zone: ZoneClimatique): number {
  return cabs2030(activite, zone) * 0.667;
}

// ─── Trajectoire ───────────────────────────────────────────────

export interface TrajectoirePoint {
  annee: number;
  /** Consommation objectif (kWhEF/m²/an) à cette échéance. */
  objectif: number;
  /** Consommation actuelle projetée (kWhEF/m²/an) — linéaire depuis dernière conso. */
  actuel: number;
}

export interface TrajectoireResultat {
  methode: DeetMethode;
  anneeReference: number;
  consoReference: number;
  consoActuelle: number | null;
  anneeActuelle: number | null;
  /** Objectifs finaux (kWh EF/m²/an). */
  objectif2030: number;
  objectif2040: number;
  objectif2050: number;
  /** Écart actuel en % vs. l'objectif intermédiaire attendu à l'année en cours. */
  ecartAlignmentPct: number | null;
  statut: "ALIGNE" | "EN_ECART" | "EN_AVANCE" | "INDETERMINE";
  /** Points annuels (baseline → 2050) pour la courbe. */
  points: TrajectoirePoint[];
  /** Baisse totale visée à 2030 (%). */
  baissePct2030: number;
  baissePct2040: number;
  baissePct2050: number;
  /** Cabs de référence si méthode ABSOLUE (informatif dans les 2 cas). */
  cabsRef: { 2030: number; 2040: number; 2050: number };
}

export interface TrajectoireInputs {
  methode: DeetMethode;
  activite: DeetActivite;
  zone: ZoneClimatique;
  anneeReference: number;
  consoReferenceKwhEfM2: number;
  consoActuelleKwhEfM2?: number | null;
  anneeActuelle?: number | null;
}

/**
 * Calcule la trajectoire DEET complète pour un projet.
 * En méthode RELATIVE : baseline × 0.60 / 0.50 / 0.40.
 * En méthode ABSOLUE  : Cabs 2030 / 2040 / 2050 selon activité + zone.
 */
export function calculerTrajectoire(inputs: TrajectoireInputs): TrajectoireResultat {
  const {
    methode,
    activite,
    zone,
    anneeReference,
    consoReferenceKwhEfM2,
    consoActuelleKwhEfM2,
    anneeActuelle,
  } = inputs;

  const cabsRef = {
    2030: cabs2030(activite, zone),
    2040: cabs2040(activite, zone),
    2050: cabs2050(activite, zone),
  } as const;

  let obj2030: number, obj2040: number, obj2050: number;
  if (methode === "RELATIVE") {
    obj2030 = consoReferenceKwhEfM2 * 0.6;
    obj2040 = consoReferenceKwhEfM2 * 0.5;
    obj2050 = consoReferenceKwhEfM2 * 0.4;
  } else {
    obj2030 = cabsRef[2030];
    obj2040 = cabsRef[2040];
    obj2050 = cabsRef[2050];
  }

  // Points annuels — interpolation linéaire par palier
  const points: TrajectoirePoint[] = [];
  const consoRef = consoReferenceKwhEfM2;
  const yearNow = new Date().getFullYear();

  for (let y = anneeReference; y <= 2050; y++) {
    let objectif: number;
    if (y <= 2030) {
      const t = (y - anneeReference) / Math.max(1, 2030 - anneeReference);
      objectif = consoRef + (obj2030 - consoRef) * t;
    } else if (y <= 2040) {
      const t = (y - 2030) / 10;
      objectif = obj2030 + (obj2040 - obj2030) * t;
    } else {
      const t = (y - 2040) / 10;
      objectif = obj2040 + (obj2050 - obj2040) * t;
    }
    // Projection actuelle : linéaire de baseline à conso actuelle si connue,
    // puis extrapolée à plat au-delà.
    let actuel: number;
    if (consoActuelleKwhEfM2 != null && anneeActuelle != null && anneeActuelle > anneeReference) {
      if (y <= anneeReference) actuel = consoRef;
      else if (y <= anneeActuelle) {
        const t = (y - anneeReference) / (anneeActuelle - anneeReference);
        actuel = consoRef + (consoActuelleKwhEfM2 - consoRef) * t;
      } else {
        actuel = consoActuelleKwhEfM2;
      }
    } else {
      actuel = consoRef;
    }
    points.push({ annee: y, objectif, actuel });
  }

  // Statut d'alignement à l'année courante
  let statut: TrajectoireResultat["statut"] = "INDETERMINE";
  let ecartAlignmentPct: number | null = null;
  if (consoActuelleKwhEfM2 != null && anneeActuelle != null) {
    const cible = points.find((p) => p.annee === yearNow)?.objectif ?? obj2030;
    ecartAlignmentPct = ((consoActuelleKwhEfM2 - cible) / cible) * 100;
    if (ecartAlignmentPct <= -5) statut = "EN_AVANCE";
    else if (ecartAlignmentPct <= 5) statut = "ALIGNE";
    else statut = "EN_ECART";
  }

  return {
    methode,
    anneeReference,
    consoReference: consoRef,
    consoActuelle: consoActuelleKwhEfM2 ?? null,
    anneeActuelle: anneeActuelle ?? null,
    objectif2030: obj2030,
    objectif2040: obj2040,
    objectif2050: obj2050,
    ecartAlignmentPct,
    statut,
    points,
    baissePct2030: ((consoRef - obj2030) / consoRef) * 100,
    baissePct2040: ((consoRef - obj2040) / consoRef) * 100,
    baissePct2050: ((consoRef - obj2050) / consoRef) * 100,
    cabsRef,
  };
}

// ─── Simulateur "et si" ────────────────────────────────────────

export interface Geste {
  nom: string;
  /** Gain en % sur la conso actuelle (0-100). */
  gainPct: number;
  /** Année de mise en service. */
  anneeMiseEnService: number;
}

/**
 * Applique une liste de gestes cumulatifs à la conso actuelle et calcule
 * la nouvelle trajectoire. Les gestes se cumulent (1 - g1) × (1 - g2) × …
 * appliqués à partir de leur année de mise en service respective.
 */
export function simulerGestes(
  base: TrajectoireResultat,
  gestes: Geste[],
): TrajectoirePoint[] {
  const departPoints = base.points;
  if (gestes.length === 0) return departPoints;

  // Ordre chronologique
  const sorted = [...gestes].sort((a, b) => a.anneeMiseEnService - b.anneeMiseEnService);

  return departPoints.map((p) => {
    let facteur = 1;
    for (const g of sorted) {
      if (p.annee >= g.anneeMiseEnService) facteur *= 1 - g.gainPct / 100;
    }
    return {
      annee: p.annee,
      objectif: p.objectif,
      actuel: p.actuel * facteur,
    };
  });
}

// ─── Prochaine déclaration OPERAT ──────────────────────────────

/** Date limite de la prochaine déclaration OPERAT (30 septembre chaque année). */
export function prochaineDeclarationOperat(now: Date = new Date()): Date {
  const y = now.getFullYear();
  const cette = new Date(y, 8, 30); // 30 septembre
  return now <= cette ? cette : new Date(y + 1, 8, 30);
}
