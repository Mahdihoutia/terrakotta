/**
 * Seed initial pour la bibliothèque de matériaux.
 * Valeurs issues de la Base Carbone ADEME, INIES et DTU. Les valeurs ACV
 * sont des ordres de grandeur (kg CO₂e / m³, phases A1-A3) — à affiner par
 * FDES précise lors de l'usage en projet.
 *
 * Conventions :
 *  - λ en W/m·K, ρ en kg/m³, c en J/kg·K
 *  - Lames d'air : `resistanceFixe` (m²·K/W), λ et ρ symboliques
 *  - Vitrages : conductivité équivalente de la composition (utilisée pour
 *    estimer R = e / λ ; à compléter par valeur U directe en projet)
 */

import type { MateriauCategorie } from "@prisma/client";

export interface MateriauSeed {
  nom: string;
  categorie: MateriauCategorie;
  marque?: string | null;
  reference?: string | null;
  conductivite: number;
  masseVolumique: number;
  capaciteThermique: number;
  resistanceVapeur?: number | null;
  resistanceFixe?: number | null;
  carboneACV?: number | null;
  carboneFinDeVie?: number | null;
  origineFdes?: string | null;
  source?: string | null;
  notes?: string | null;
}

export const MATERIAUX_SEED: MateriauSeed[] = [
  // ─── STRUCTURE ────────────────────────────────────────────────────────
  { nom: "Béton banché",                categorie: "STRUCTURE", conductivite: 1.75, masseVolumique: 2300, capaciteThermique: 900,  carboneACV: 290, source: "DTU 23.1 / Base Carbone ADEME" },
  { nom: "Béton banché armé",           categorie: "STRUCTURE", conductivite: 2.30, masseVolumique: 2400, capaciteThermique: 1000, carboneACV: 380, source: "Base Carbone ADEME" },
  { nom: "Béton cellulaire 600",        categorie: "STRUCTURE", conductivite: 0.16, masseVolumique: 600,  capaciteThermique: 1000, carboneACV: 240, source: "FDES Ytong" },
  { nom: "Parpaing creux 20 cm",        categorie: "STRUCTURE", conductivite: 0.95, masseVolumique: 1100, capaciteThermique: 1000, carboneACV: 180, source: "DTU 20.1" },
  { nom: "Brique creuse 20 cm",         categorie: "STRUCTURE", conductivite: 0.45, masseVolumique: 900,  capaciteThermique: 1000, carboneACV: 200, source: "Base Carbone" },
  { nom: "Brique pleine",               categorie: "STRUCTURE", conductivite: 0.84, masseVolumique: 1900, capaciteThermique: 1000, carboneACV: 220, source: "DTU 20.1" },
  { nom: "Brique monomur 30 cm",        categorie: "STRUCTURE", conductivite: 0.13, masseVolumique: 700,  capaciteThermique: 1000, carboneACV: 210, source: "FDES" },
  { nom: "Pierre calcaire",             categorie: "STRUCTURE", conductivite: 1.40, masseVolumique: 2400, capaciteThermique: 900,  carboneACV: 60,  source: "Base Carbone" },
  { nom: "Pierre granit",               categorie: "STRUCTURE", conductivite: 2.80, masseVolumique: 2700, capaciteThermique: 900,  carboneACV: 80,  source: "Base Carbone" },
  { nom: "Bois massif résineux",        categorie: "STRUCTURE", conductivite: 0.13, masseVolumique: 450,  capaciteThermique: 1600, carboneACV: -650, source: "FDES bois" , notes: "Stockage carbone biogénique" },
  { nom: "Bois massif feuillu",         categorie: "STRUCTURE", conductivite: 0.18, masseVolumique: 700,  capaciteThermique: 1700, carboneACV: -900, source: "FDES bois" },
  { nom: "OSB 3 (15 mm)",               categorie: "STRUCTURE", conductivite: 0.13, masseVolumique: 600,  capaciteThermique: 1700, carboneACV: -400, source: "FDES Kronospan" },
  { nom: "Carreaux de plâtre",          categorie: "STRUCTURE", conductivite: 0.41, masseVolumique: 1000, capaciteThermique: 1000, carboneACV: 110, source: "Base Carbone" },
  { nom: "Plaque BA13",                 categorie: "STRUCTURE", conductivite: 0.25, masseVolumique: 825,  capaciteThermique: 1000, carboneACV: 95,  source: "FDES Placoplatre" },
  { nom: "CLT épicéa",                  categorie: "STRUCTURE", conductivite: 0.13, masseVolumique: 470,  capaciteThermique: 1600, carboneACV: -700, source: "FDES KLH" },

  // ─── ISOLANTS ─────────────────────────────────────────────────────────
  { nom: "Laine de verre λ32",          categorie: "ISOLANT", conductivite: 0.032, masseVolumique: 18,  capaciteThermique: 1030, carboneACV: 25,  source: "FDES Isover" },
  { nom: "Laine de verre λ35",          categorie: "ISOLANT", conductivite: 0.035, masseVolumique: 14,  capaciteThermique: 1030, carboneACV: 22,  source: "FDES Isover" },
  { nom: "Laine de verre λ40",          categorie: "ISOLANT", conductivite: 0.040, masseVolumique: 12,  capaciteThermique: 1030, carboneACV: 18,  source: "FDES" },
  { nom: "Laine de roche λ35",          categorie: "ISOLANT", conductivite: 0.035, masseVolumique: 80,  capaciteThermique: 850,  carboneACV: 85,  source: "FDES Rockwool" },
  { nom: "Laine de roche λ40",          categorie: "ISOLANT", conductivite: 0.040, masseVolumique: 40,  capaciteThermique: 850,  carboneACV: 75,  source: "FDES Rockwool" },
  { nom: "Polystyrène expansé PSE",     categorie: "ISOLANT", conductivite: 0.038, masseVolumique: 18,  capaciteThermique: 1450, carboneACV: 85,  source: "FDES" },
  { nom: "PSE graphité",                categorie: "ISOLANT", conductivite: 0.031, masseVolumique: 18,  capaciteThermique: 1450, carboneACV: 95,  source: "FDES" },
  { nom: "Polystyrène extrudé XPS",     categorie: "ISOLANT", conductivite: 0.029, masseVolumique: 35,  capaciteThermique: 1500, carboneACV: 220, source: "FDES" },
  { nom: "Polyuréthane PUR",            categorie: "ISOLANT", conductivite: 0.024, masseVolumique: 32,  capaciteThermique: 1400, carboneACV: 150, source: "FDES" },
  { nom: "Mousse phénolique",           categorie: "ISOLANT", conductivite: 0.022, masseVolumique: 35,  capaciteThermique: 1400, carboneACV: 100, source: "FDES Kingspan" },
  { nom: "Fibre de bois souple",        categorie: "ISOLANT", conductivite: 0.038, masseVolumique: 50,  capaciteThermique: 2100, carboneACV: -20, source: "FDES Steico", notes: "Stockage CO2 biogénique" },
  { nom: "Fibre de bois dense",         categorie: "ISOLANT", conductivite: 0.045, masseVolumique: 160, capaciteThermique: 2100, carboneACV: -50, source: "FDES Steico" },
  { nom: "Ouate de cellulose",          categorie: "ISOLANT", conductivite: 0.039, masseVolumique: 55,  capaciteThermique: 1800, carboneACV: -15, source: "FDES Soprema" },
  { nom: "Chanvre",                     categorie: "ISOLANT", conductivite: 0.044, masseVolumique: 85,  capaciteThermique: 1700, carboneACV: -20, source: "FDES Biofib" },
  { nom: "Liège expansé",               categorie: "ISOLANT", conductivite: 0.042, masseVolumique: 120, capaciteThermique: 1700, carboneACV: -30, source: "FDES Amorim" },
  { nom: "Laine de mouton",             categorie: "ISOLANT", conductivite: 0.040, masseVolumique: 20,  capaciteThermique: 1700, carboneACV: 8,   source: "FDES" },
  { nom: "Laine de coton recyclé",      categorie: "ISOLANT", conductivite: 0.040, masseVolumique: 25,  capaciteThermique: 1600, carboneACV: 10,  source: "FDES Métisse" },
  { nom: "Aérogel",                     categorie: "ISOLANT", conductivite: 0.014, masseVolumique: 120, capaciteThermique: 1000, carboneACV: 300, source: "Constructeur" },
  { nom: "Vermiculite",                 categorie: "ISOLANT", conductivite: 0.080, masseVolumique: 100, capaciteThermique: 840,  carboneACV: 80,  source: "Base Carbone" },
  { nom: "Perlite expansée",            categorie: "ISOLANT", conductivite: 0.050, masseVolumique: 90,  capaciteThermique: 900,  carboneACV: 70,  source: "Base Carbone" },
  { nom: "Polyisocyanurate PIR",        categorie: "ISOLANT", conductivite: 0.022, masseVolumique: 32,  capaciteThermique: 1400, carboneACV: 160, source: "FDES Kingspan" },
  { nom: "Verre cellulaire",            categorie: "ISOLANT", conductivite: 0.045, masseVolumique: 120, capaciteThermique: 900,  carboneACV: 230, source: "FDES Foamglas" },
  { nom: "Paille compressée",           categorie: "ISOLANT", conductivite: 0.052, masseVolumique: 110, capaciteThermique: 1500, carboneACV: -60, source: "Étude RFCP" },

  // ─── FINITION ─────────────────────────────────────────────────────────
  { nom: "Enduit ciment extérieur",     categorie: "FINITION", conductivite: 1.15, masseVolumique: 1900, capaciteThermique: 1000, carboneACV: 240, source: "DTU 26.1" },
  { nom: "Enduit chaux",                categorie: "FINITION", conductivite: 0.70, masseVolumique: 1600, capaciteThermique: 1000, carboneACV: 130, source: "DTU 26.1" },
  { nom: "Enduit terre crue",           categorie: "FINITION", conductivite: 0.85, masseVolumique: 1700, capaciteThermique: 1000, carboneACV: 5,   source: "Étude CRAterre" },
  { nom: "Crépi acrylique",             categorie: "FINITION", conductivite: 0.70, masseVolumique: 1500, capaciteThermique: 1000, carboneACV: 150, source: "FDES" },
  { nom: "Bardage bois",                categorie: "FINITION", conductivite: 0.13, masseVolumique: 500,  capaciteThermique: 1600, carboneACV: -550, source: "FDES" },
  { nom: "Bardage métallique",          categorie: "FINITION", conductivite: 50,   masseVolumique: 7800, capaciteThermique: 460,  carboneACV: 1800, source: "Base Carbone" },
  { nom: "Bardage fibre-ciment",        categorie: "FINITION", conductivite: 0.40, masseVolumique: 1700, capaciteThermique: 1000, carboneACV: 320, source: "FDES Eternit" },
  { nom: "Carrelage céramique",         categorie: "FINITION", conductivite: 1.30, masseVolumique: 2000, capaciteThermique: 840,  carboneACV: 200, source: "FDES" },
  { nom: "Parquet bois massif",         categorie: "FINITION", conductivite: 0.18, masseVolumique: 700,  capaciteThermique: 1700, carboneACV: -700, source: "FDES" },
  { nom: "Parquet stratifié",           categorie: "FINITION", conductivite: 0.17, masseVolumique: 800,  capaciteThermique: 1500, carboneACV: 80,  source: "FDES" },

  // ─── VITRAGES ─────────────────────────────────────────────────────────
  { nom: "Simple vitrage 4 mm",                       categorie: "VITRAGE", conductivite: 1.0,  masseVolumique: 2500, capaciteThermique: 750, resistanceFixe: 0.004, carboneACV: 95,  source: "U direct = 5.7" },
  { nom: "Double vitrage 4/12/4 air",                 categorie: "VITRAGE", conductivite: 1.0,  masseVolumique: 1500, capaciteThermique: 750, resistanceFixe: 0.36,  carboneACV: 130, source: "U direct = 2.8" },
  { nom: "Double vitrage 4/16/4 argon ITR",           categorie: "VITRAGE", conductivite: 1.0,  masseVolumique: 1500, capaciteThermique: 750, resistanceFixe: 0.71,  carboneACV: 145, source: "U direct = 1.4" },
  { nom: "Double vitrage 4/16/4 contrôle solaire",    categorie: "VITRAGE", conductivite: 1.0,  masseVolumique: 1500, capaciteThermique: 750, resistanceFixe: 0.91,  carboneACV: 160, source: "U direct = 1.1" },
  { nom: "Triple vitrage 4/12/4/12/4 argon",          categorie: "VITRAGE", conductivite: 1.0,  masseVolumique: 1500, capaciteThermique: 750, resistanceFixe: 1.43,  carboneACV: 220, source: "U direct = 0.7" },

  // ─── LAMES D'AIR ──────────────────────────────────────────────────────
  { nom: "Lame d'air non ventilée 1 cm",       categorie: "LAME_AIR", conductivite: 1, masseVolumique: 1.2, capaciteThermique: 1000, resistanceFixe: 0.15, source: "EN ISO 6946 Tab.B.1" },
  { nom: "Lame d'air non ventilée 2 cm",       categorie: "LAME_AIR", conductivite: 1, masseVolumique: 1.2, capaciteThermique: 1000, resistanceFixe: 0.17, source: "EN ISO 6946" },
  { nom: "Lame d'air non ventilée 5 cm",       categorie: "LAME_AIR", conductivite: 1, masseVolumique: 1.2, capaciteThermique: 1000, resistanceFixe: 0.18, source: "EN ISO 6946" },
  { nom: "Lame d'air faiblement ventilée 5 cm",categorie: "LAME_AIR", conductivite: 1, masseVolumique: 1.2, capaciteThermique: 1000, resistanceFixe: 0.09, source: "EN ISO 6946" },

  // ─── MEMBRANES ────────────────────────────────────────────────────────
  { nom: "Pare-vapeur PE 0.2 mm",       categorie: "MEMBRANE", conductivite: 0.33, masseVolumique: 920,  capaciteThermique: 2200, carboneACV: 50, source: "FDES" },
  { nom: "Pare-pluie HPV",              categorie: "MEMBRANE", conductivite: 0.22, masseVolumique: 800,  capaciteThermique: 1700, carboneACV: 70, source: "FDES" },
  { nom: "Frein-vapeur hygrovariable",  categorie: "MEMBRANE", conductivite: 0.22, masseVolumique: 850,  capaciteThermique: 1700, carboneACV: 90, source: "FDES Pro Clima" },
  { nom: "Membrane EPDM toiture",       categorie: "MEMBRANE", conductivite: 0.25, masseVolumique: 1150, capaciteThermique: 1000, carboneACV: 250, source: "FDES" },
];
