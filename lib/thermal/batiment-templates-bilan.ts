/**
 * Catalogue de templates "démarrage rapide" pour le bilan thermique.
 *
 * Chaque template décrit un bâtiment-type complet :
 *  - les parois standards à créer (avec leurs couches référencées par nom de
 *    matériau dans MATERIAUX_SEED),
 *  - le bâtiment lui-même,
 *  - ses zones avec consignes / apports / scénario,
 *  - la liste des parois affectées à chaque zone (avec surface + orientation).
 *
 * Utilisé par POST /api/admin/apply-batiment-template, qui crée tout en
 * transaction et garantit que les matériaux et scénarios sont seedés.
 */

import type { OccupationCode } from "@/lib/validations/scenario";

/** Une couche de paroi : matériau référencé par nom + épaisseur en mm. */
export interface TemplateCouche {
  /** Nom EXACT (sensible à la casse) tel que dans MATERIAUX_SEED. */
  materiauNom: string;
  /** Épaisseur en millimètres (sera convertie en mètres pour la BD). */
  epaisseurMm: number;
}

export interface TemplateParoi {
  nom: string;
  type:
    | "MUR_EXT"
    | "MUR_INT"
    | "TOITURE"
    | "PLANCHER_BAS"
    | "PLANCHER_INTER"
    | "VITRAGE"
    | "PORTE";
  description?: string;
  couches: TemplateCouche[];
}

export type TemplateOrientation =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SO"
  | "O"
  | "NO";

export interface TemplateZoneParoi {
  /** Référence à TemplateParoi.nom dans le même template. */
  paroiNom: string;
  surface: number;
  orientation?: TemplateOrientation | null;
}

export interface TemplateZone {
  nom: string;
  usage:
    | "BUREAUX"
    | "OPEN_SPACE"
    | "CIRCULATION"
    | "ARCHIVES"
    | "SALLE_REUNION"
    | "SALLE_SERVEUR"
    | "COMMERCE"
    | "RESTAURATION"
    | "LOGEMENT"
    | "HALL_ACCUEIL"
    | "TECHNIQUE"
    | "AUTRE";
  surface: number;
  hauteurSousPlafond: number;
  /** Nom EXACT (sensible à la casse) tel que dans SCENARIOS_SEED. */
  scenarioNom: string;
  consignes?: {
    chauffageOcc?: number;
    chauffageRed?: number;
    climOcc?: number;
    climRed?: number;
  };
  apports?: {
    densiteOccupation?: number;
    apportsParPersonne?: number;
    apportsEquipements?: number;
    apportsEclairage?: number;
  };
  ventilation?: {
    qVmcM3hM2?: number;
    efficaciteDoubleFlux?: number;
  };
  parois: TemplateZoneParoi[];
}

export interface BatimentTemplateBilan {
  id: string;
  nom: string;
  description: string;
  /** m² agrégé (somme des zones) pour affichage carte. */
  surfaceTotale: number;
  zoneClimatique: string;
  /** Catégorie pour le filtre / l'icône. */
  categorie: "RESIDENTIEL" | "TERTIAIRE" | "COLLECTIF";
  paroisToCreate: TemplateParoi[];
  batiment: {
    nom: string;
    description?: string;
    zoneClimatique: string;
    altitude?: number;
    orientation?: string;
  };
  zones: TemplateZone[];
}

// ─── Helpers de lecture ───────────────────────────────────────────

export function getTemplateById(
  id: string,
): BatimentTemplateBilan | undefined {
  return BATIMENT_TEMPLATES_BILAN.find((t) => t.id === id);
}

// ─── Catalogue ────────────────────────────────────────────────────

/** Type d'aide pour s'assurer que les usages restent stricts. */
type _CheckOcc = OccupationCode; // eslint-disable-line @typescript-eslint/no-unused-vars

export const BATIMENT_TEMPLATES_BILAN: BatimentTemplateBilan[] = [
  // ─── 1. Maison individuelle T5 — H1c ─────────────────────────────
  {
    id: "maison-t5-h1c",
    nom: "Maison individuelle T5 — H1c",
    description:
      "Maison rénovée 1980 — RDC + étage, ~120 m², isolation extérieure laine de roche, double vitrage argon.",
    surfaceTotale: 120,
    zoneClimatique: "H1c — Est",
    categorie: "RESIDENTIEL",
    paroisToCreate: [
      {
        nom: "Mur extérieur ITE laine de roche 140 mm",
        type: "MUR_EXT",
        description: "Parpaing 20 cm + ITE laine de roche 140 mm + enduit",
        couches: [
          { materiauNom: "Enduit ciment extérieur", epaisseurMm: 15 },
          { materiauNom: "Laine de roche λ35", epaisseurMm: 140 },
          { materiauNom: "Parpaing creux 20 cm", epaisseurMm: 200 },
          { materiauNom: "Plaque BA13", epaisseurMm: 13 },
        ],
      },
      {
        nom: "Toiture combles laine de verre 300 mm",
        type: "TOITURE",
        description: "Combles perdus laine de verre 300 mm",
        couches: [
          { materiauNom: "Laine de verre λ35", epaisseurMm: 300 },
          { materiauNom: "Plaque BA13", epaisseurMm: 13 },
        ],
      },
      {
        nom: "Plancher bas terre-plein PSE 100 mm",
        type: "PLANCHER_BAS",
        description: "Dalle béton sur PSE 100 mm",
        couches: [
          { materiauNom: "Carrelage céramique", epaisseurMm: 10 },
          { materiauNom: "Béton banché", epaisseurMm: 150 },
          { materiauNom: "Polystyrène expansé PSE", epaisseurMm: 100 },
        ],
      },
      {
        nom: "Double vitrage standard",
        type: "VITRAGE",
        description: "Double vitrage 4/16/4 argon ITR",
        couches: [
          { materiauNom: "Double vitrage 4/16/4 argon ITR", epaisseurMm: 24 },
        ],
      },
    ],
    batiment: {
      nom: "Maison T5 — exemple",
      description: "Maison individuelle de démonstration générée depuis template.",
      zoneClimatique: "H1c — Est",
      altitude: 250,
    },
    zones: [
      {
        nom: "Logement principal",
        usage: "LOGEMENT",
        surface: 120,
        hauteurSousPlafond: 2.5,
        scenarioNom: "Logement standard",
        consignes: {
          chauffageOcc: 20,
          chauffageRed: 17,
          climOcc: 26,
          climRed: 28,
        },
        apports: {
          densiteOccupation: 30, // m²/personne
          apportsParPersonne: 80,
          apportsEquipements: 4,
          apportsEclairage: 3,
        },
        ventilation: { qVmcM3hM2: 1.2, efficaciteDoubleFlux: 0 },
        parois: [
          { paroiNom: "Mur extérieur ITE laine de roche 140 mm", surface: 60, orientation: "S" },
          { paroiNom: "Mur extérieur ITE laine de roche 140 mm", surface: 60, orientation: "N" },
          { paroiNom: "Mur extérieur ITE laine de roche 140 mm", surface: 45, orientation: "E" },
          { paroiNom: "Mur extérieur ITE laine de roche 140 mm", surface: 45, orientation: "O" },
          { paroiNom: "Toiture combles laine de verre 300 mm", surface: 80 },
          { paroiNom: "Plancher bas terre-plein PSE 100 mm", surface: 60 },
          { paroiNom: "Double vitrage standard", surface: 8, orientation: "S" },
          { paroiNom: "Double vitrage standard", surface: 4, orientation: "N" },
          { paroiNom: "Double vitrage standard", surface: 5, orientation: "E" },
          { paroiNom: "Double vitrage standard", surface: 5, orientation: "O" },
        ],
      },
    ],
  },

  // ─── 2. Bureau tertiaire 1200 m² — H2b ───────────────────────────
  {
    id: "bureau-1200m2-h2b",
    nom: "Bureau tertiaire 1200 m² — H2b",
    description:
      "Plateau de bureaux 1200 m² R+2 — open space + salles de réunion + circulation, façade rideau double vitrage.",
    surfaceTotale: 1200,
    zoneClimatique: "H2b — Ouest",
    categorie: "TERTIAIRE",
    paroisToCreate: [
      {
        nom: "Façade tertiaire panneau composite",
        type: "MUR_EXT",
        description: "Béton 20 cm + ITE PSE 120 mm + bardage métallique",
        couches: [
          { materiauNom: "Bardage métallique", epaisseurMm: 5 },
          { materiauNom: "Polystyrène expansé PSE", epaisseurMm: 120 },
          { materiauNom: "Béton banché", epaisseurMm: 200 },
          { materiauNom: "Plaque BA13", epaisseurMm: 13 },
        ],
      },
      {
        nom: "Toiture terrasse PUR 140 mm",
        type: "TOITURE",
        description: "Dalle béton + isolation polyuréthane 140 mm + étanchéité",
        couches: [
          { materiauNom: "Polyuréthane PUR", epaisseurMm: 140 },
          { materiauNom: "Béton banché", epaisseurMm: 180 },
          { materiauNom: "Plaque BA13", epaisseurMm: 13 },
        ],
      },
      {
        nom: "Plancher bas dalle PSE 80 mm",
        type: "PLANCHER_BAS",
        description: "Dalle béton sur PSE 80 mm",
        couches: [
          { materiauNom: "Parquet stratifié", epaisseurMm: 10 },
          { materiauNom: "Béton banché", epaisseurMm: 200 },
          { materiauNom: "Polystyrène expansé PSE", epaisseurMm: 80 },
        ],
      },
      {
        nom: "Façade rideau double vitrage contrôle solaire",
        type: "VITRAGE",
        description: "Double vitrage 4/16/4 contrôle solaire",
        couches: [
          {
            materiauNom: "Double vitrage 4/16/4 contrôle solaire",
            epaisseurMm: 24,
          },
        ],
      },
    ],
    batiment: {
      nom: "Bureau 1200 m² — exemple",
      description: "Plateau tertiaire de démonstration généré depuis template.",
      zoneClimatique: "H2b — Ouest",
      altitude: 80,
    },
    zones: [
      {
        nom: "Open space",
        usage: "OPEN_SPACE",
        surface: 800,
        hauteurSousPlafond: 2.7,
        scenarioNom: "Bureaux 8h-18h, 5j/7",
        consignes: {
          chauffageOcc: 21,
          chauffageRed: 17,
          climOcc: 25,
          climRed: 28,
        },
        apports: {
          densiteOccupation: 12,
          apportsParPersonne: 80,
          apportsEquipements: 18,
          apportsEclairage: 10,
        },
        ventilation: { qVmcM3hM2: 3.5, efficaciteDoubleFlux: 0.75 },
        parois: [
          { paroiNom: "Façade tertiaire panneau composite", surface: 120, orientation: "S" },
          { paroiNom: "Façade tertiaire panneau composite", surface: 120, orientation: "N" },
          { paroiNom: "Façade rideau double vitrage contrôle solaire", surface: 80, orientation: "S" },
          { paroiNom: "Façade rideau double vitrage contrôle solaire", surface: 60, orientation: "N" },
          { paroiNom: "Façade rideau double vitrage contrôle solaire", surface: 40, orientation: "E" },
          { paroiNom: "Façade rideau double vitrage contrôle solaire", surface: 40, orientation: "O" },
          { paroiNom: "Toiture terrasse PUR 140 mm", surface: 400 },
          { paroiNom: "Plancher bas dalle PSE 80 mm", surface: 400 },
        ],
      },
      {
        nom: "Salles de réunion",
        usage: "SALLE_REUNION",
        surface: 200,
        hauteurSousPlafond: 2.7,
        scenarioNom: "Bureaux 8h-18h, 5j/7",
        consignes: {
          chauffageOcc: 21,
          chauffageRed: 17,
          climOcc: 25,
          climRed: 28,
        },
        apports: {
          densiteOccupation: 4,
          apportsParPersonne: 90,
          apportsEquipements: 8,
          apportsEclairage: 12,
        },
        ventilation: { qVmcM3hM2: 5, efficaciteDoubleFlux: 0.75 },
        parois: [
          { paroiNom: "Façade tertiaire panneau composite", surface: 50, orientation: "E" },
          { paroiNom: "Façade rideau double vitrage contrôle solaire", surface: 25, orientation: "E" },
          { paroiNom: "Toiture terrasse PUR 140 mm", surface: 100 },
          { paroiNom: "Plancher bas dalle PSE 80 mm", surface: 100 },
        ],
      },
      {
        nom: "Circulation et hall",
        usage: "CIRCULATION",
        surface: 200,
        hauteurSousPlafond: 2.7,
        scenarioNom: "Bureaux étendus 7h-20h, 5j/7",
        consignes: {
          chauffageOcc: 19,
          chauffageRed: 16,
          climOcc: 27,
          climRed: 28,
        },
        apports: {
          densiteOccupation: 30,
          apportsParPersonne: 80,
          apportsEquipements: 4,
          apportsEclairage: 6,
        },
        ventilation: { qVmcM3hM2: 2, efficaciteDoubleFlux: 0.7 },
        parois: [
          { paroiNom: "Façade tertiaire panneau composite", surface: 60, orientation: "O" },
          { paroiNom: "Façade rideau double vitrage contrôle solaire", surface: 25, orientation: "O" },
          { paroiNom: "Toiture terrasse PUR 140 mm", surface: 100 },
          { paroiNom: "Plancher bas dalle PSE 80 mm", surface: 100 },
        ],
      },
    ],
  },

  // ─── 3. Logement collectif R+4 — H1a ─────────────────────────────
  {
    id: "logement-collectif-r4-h1a",
    nom: "Logement collectif R+4 — H1a",
    description:
      "Immeuble R+4, ~600 m² hors-œuvre net, façade béton + ITE laine de roche 160 mm, double vitrage argon.",
    surfaceTotale: 600,
    zoneClimatique: "H1a — Nord",
    categorie: "COLLECTIF",
    paroisToCreate: [
      {
        nom: "Mur extérieur béton ITE laine de roche 160 mm",
        type: "MUR_EXT",
        description: "Béton 18 cm + ITE laine de roche 160 mm",
        couches: [
          { materiauNom: "Enduit ciment extérieur", epaisseurMm: 15 },
          { materiauNom: "Laine de roche λ35", epaisseurMm: 160 },
          { materiauNom: "Béton banché", epaisseurMm: 180 },
          { materiauNom: "Plaque BA13", epaisseurMm: 13 },
        ],
      },
      {
        nom: "Toiture terrasse végétalisée laine de verre 240 mm",
        type: "TOITURE",
        description: "Dalle béton + isolation laine de verre 240 mm + complexe végétalisé",
        couches: [
          { materiauNom: "Laine de verre λ35", epaisseurMm: 240 },
          { materiauNom: "Béton banché", epaisseurMm: 200 },
          { materiauNom: "Plaque BA13", epaisseurMm: 13 },
        ],
      },
      {
        nom: "Plancher bas sur cave PSE 120 mm",
        type: "PLANCHER_BAS",
        description: "Dalle béton sur PSE 120 mm en sous-face cave",
        couches: [
          { materiauNom: "Parquet stratifié", epaisseurMm: 10 },
          { materiauNom: "Béton banché", epaisseurMm: 200 },
          { materiauNom: "Polystyrène expansé PSE", epaisseurMm: 120 },
        ],
      },
      {
        nom: "Vitrage logement double argon",
        type: "VITRAGE",
        description: "Double vitrage 4/16/4 argon ITR",
        couches: [
          { materiauNom: "Double vitrage 4/16/4 argon ITR", epaisseurMm: 24 },
        ],
      },
    ],
    batiment: {
      nom: "Logement collectif R+4 — exemple",
      description: "Immeuble de démonstration généré depuis template.",
      zoneClimatique: "H1a — Nord",
      altitude: 50,
    },
    zones: [
      {
        nom: "Logements R+1 à R+4",
        usage: "LOGEMENT",
        surface: 480,
        hauteurSousPlafond: 2.5,
        scenarioNom: "Logement standard",
        consignes: {
          chauffageOcc: 20,
          chauffageRed: 17,
          climOcc: 26,
          climRed: 28,
        },
        apports: {
          densiteOccupation: 30,
          apportsParPersonne: 80,
          apportsEquipements: 4,
          apportsEclairage: 3,
        },
        ventilation: { qVmcM3hM2: 1.5, efficaciteDoubleFlux: 0 },
        parois: [
          { paroiNom: "Mur extérieur béton ITE laine de roche 160 mm", surface: 200, orientation: "S" },
          { paroiNom: "Mur extérieur béton ITE laine de roche 160 mm", surface: 200, orientation: "N" },
          { paroiNom: "Mur extérieur béton ITE laine de roche 160 mm", surface: 90, orientation: "E" },
          { paroiNom: "Mur extérieur béton ITE laine de roche 160 mm", surface: 90, orientation: "O" },
          { paroiNom: "Toiture terrasse végétalisée laine de verre 240 mm", surface: 120 },
          { paroiNom: "Plancher bas sur cave PSE 120 mm", surface: 120 },
          { paroiNom: "Vitrage logement double argon", surface: 30, orientation: "S" },
          { paroiNom: "Vitrage logement double argon", surface: 25, orientation: "N" },
          { paroiNom: "Vitrage logement double argon", surface: 12, orientation: "E" },
          { paroiNom: "Vitrage logement double argon", surface: 12, orientation: "O" },
        ],
      },
      {
        nom: "Hall et circulations",
        usage: "CIRCULATION",
        surface: 120,
        hauteurSousPlafond: 2.5,
        scenarioNom: "Occupation continue 24h/24",
        consignes: {
          chauffageOcc: 17,
          chauffageRed: 15,
          climOcc: 28,
          climRed: 30,
        },
        apports: {
          densiteOccupation: 50,
          apportsParPersonne: 80,
          apportsEquipements: 1,
          apportsEclairage: 4,
        },
        ventilation: { qVmcM3hM2: 0.5, efficaciteDoubleFlux: 0 },
        parois: [
          { paroiNom: "Mur extérieur béton ITE laine de roche 160 mm", surface: 60, orientation: "E" },
          { paroiNom: "Vitrage logement double argon", surface: 8, orientation: "E" },
          { paroiNom: "Toiture terrasse végétalisée laine de verre 240 mm", surface: 30 },
          { paroiNom: "Plancher bas sur cave PSE 120 mm", surface: 30 },
        ],
      },
    ],
  },
];
