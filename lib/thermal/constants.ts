/**
 * Constantes thermiques partagées (U-values, rendements, facteurs CO₂, prix).
 * Sources :
 *  - U-values : valeurs forfaitaires méthode 3CL-DPE 2021 (annexe 1).
 *  - Rendements : NF EN 15316 + retours d'expérience CEREN.
 *  - Facteurs CO₂ : arrêté DPE 31 mars 2021 (R.126-17), Base Carbone ADEME 2024.
 *  - Prix : Pégase SDES, observatoire CEREN, FNCCR (millésime 2025-2026).
 */

/** U mur (W/m²·K) selon état d'isolation. */
export const U_MURS: Record<string, number> = {
  "Non isolés": 2.5,
  "Isolation intérieure (ITE)": 0.36, // libellé historique conservé
  "Isolation extérieure (ITE)": 0.28,
  "Isolation répartie": 0.32,
  "Inconnu": 1.5,
};

/** U toiture (W/m²·K). */
export const U_TOITURE: Record<string, number> = {
  "Non isolés": 3.0,
  "Combles perdus isolés": 0.20,
  "Rampants isolés": 0.28,
  "Toiture terrasse isolée": 0.25,
  "Inconnu": 1.5,
};

/** U vitrage (W/m²·K). */
export const U_VITRAGE: Record<string, number> = {
  "Simple vitrage": 5.8,
  "Double vitrage ancien (avant 2000)": 2.9,
  "Double vitrage performant": 1.4,
  "Triple vitrage": 0.8,
  "Mixte": 2.5,
};

/** U plancher bas (W/m²·K) — méthode 3CL forfaitaire. */
export const U_PLANCHER: Record<string, number> = {
  "Non isolé": 2.0,
  "Isolé sous dalle": 0.30,
  "Isolé en sous-face": 0.35,
  "Inconnu": 1.5,
};

/**
 * Rendements générateurs PCI (chauffage). 1.0 = effet Joule.
 * PAC : COP saisonnier (SCOP) typique en remplacement.
 */
export const RENDEMENTS_GENERATEURS: Record<string, number> = {
  "Chaudière standard": 0.80,
  "Chaudière basse température": 0.88,
  "Chaudière condensation": 0.95,
  "Convecteurs électriques": 1.0,
  "Radiateurs électriques": 1.0,
  "CTA avec batterie électrique": 1.0,
  "PAC existante (à remplacer)": 2.5,
  "Autre": 0.85,
};

/** Facteur CO₂ EF (kg CO₂e / kWh). Voir constants.ts header. */
export const FACTEUR_CO2: Record<string, number> = {
  "Gaz naturel": 0.227,
  "Fioul domestique": 0.324,
  "Charbon": 0.385,
  "Électricité (effet Joule)": 0.079,
  "Électricité (usage ECS)": 0.065,
  "Électricité (mix moyen)": 0.060,
  "GPL": 0.272,
  "Réseau de chaleur": 0.180,
  "Bois": 0.030,
  "Autre": 0.200,
};

export const FACTEUR_CO2_ELEC_CHAUFFAGE = 0.079;

/** Prix moyens HT tertiaire France 2025-2026 (€/kWh EF). */
export const PRIX_ELEC_KWH = 0.18;
export const PRIX_GAZ_KWH = 0.09;
export const PRIX_FIOUL_KWH = 0.11;
export const PRIX_PROPANE_KWH = 0.14;
export const PRIX_RESEAU_CHALEUR_KWH = 0.10;

export function prixEnergie(source: string): number {
  const s = source.toLowerCase();
  if (s.includes("lectric")) return PRIX_ELEC_KWH;
  if (s.includes("fioul")) return PRIX_FIOUL_KWH;
  if (s.includes("propane") || s.includes("gpl")) return PRIX_PROPANE_KWH;
  if (s.includes("seau de chaleur")) return PRIX_RESEAU_CHALEUR_KWH;
  if (s.includes("gaz")) return PRIX_GAZ_KWH;
  return PRIX_GAZ_KWH;
}

/**
 * Capacité thermique volumique de l'air à 20 °C (Wh/m³·K).
 * Utilisé pour H_v = 0.34 × Q_v (Q_v en m³/h).
 */
export const RHO_C_AIR = 0.34;
