/**
 * Météo horaire synthétique 8760 h pour une zone climatique française.
 *
 * Approche pragmatique : à partir des DJU mensuels et T°_base par zone,
 * on reconstruit Tmin/Tmax saisonniers puis on applique un profil journalier
 * sinusoïdal (Tmin à 6h, Tmax à 15h). Pour le rayonnement global horizontal
 * on utilise une enveloppe gaussienne centrée midi modulée par les ratios
 * mensuels existants. Précision ±10 % sur le bilan annuel — suffisant pour
 * un dimensionnement non réglementaire.
 *
 * Pour une étude RT/RE, utiliser les fichiers TRY Météo France officiels.
 */

import { ZONE_CLIMATIQUE_DATA, parseZone } from "./zones";
import { HG_MENSUEL_VERTICAL } from "./apports-solaires";

export interface MeteoHoraire {
  /** 8760 valeurs — température extérieure (°C). */
  tExt: number[];
  /** 8760 valeurs — irradiation globale horizontale (W/m²). */
  iSolaireH: number[];
}

const HEURES_PAR_MOIS = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744];

/** Tmin et Tmax mensuels typés (climat français tempéré, base H1a). */
const TMIN_TMAX_MOIS_REF: Array<{ tMin: number; tMax: number }> = [
  { tMin: -1, tMax: 5 },   // Jan
  { tMin: -1, tMax: 6 },   // Fev
  { tMin: 2,  tMax: 11 },  // Mar
  { tMin: 5,  tMax: 14 },  // Avr
  { tMin: 9,  tMax: 18 },  // Mai
  { tMin: 12, tMax: 22 },  // Jun
  { tMin: 14, tMax: 25 },  // Jul
  { tMin: 14, tMax: 25 },  // Aou
  { tMin: 11, tMax: 21 },  // Sep
  { tMin: 7,  tMax: 15 },  // Oct
  { tMin: 3,  tMax: 9 },   // Nov
  { tMin: 0,  tMax: 6 },   // Dec
];

/** Décalage par zone climatique (°C) — ajustement par rapport à H1a. */
const DECALAGE_ZONE: Record<string, number> = {
  H1a: 0,
  H1b: -0.5,
  H1c: -1.0,
  H2a: 1.0,
  H2b: 1.5,
  H2c: 2.0,
  H2d: 0.5,
  H3:  4.0,
};

/** Heures de jour moyennes par mois (latitude ~46°N). */
const HEURES_JOUR_MOIS = [9, 10, 12, 14, 15, 16, 15, 14, 12, 11, 9, 8];

/**
 * Convertit le rayonnement global horizontal (kWh/m²/mois) à partir d'une
 * approximation : H_horizontal ≈ 1.4 × H_vertical_sud (rapport empirique).
 */
function rayonnementMensuelHorizontalKWh(zone: string): number[] {
  const hgSud = HG_MENSUEL_VERTICAL.S;
  const mois = ["JAN", "FEV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOU", "SEP", "OCT", "NOV", "DEC"] as const;
  // Modulation grossière entre zones (Méditerranée = +30 %).
  const facteurZone = zone === "H3" ? 1.30 : zone.startsWith("H1") ? 0.85 : 1.0;
  return mois.map((m) => hgSud[m] * 1.4 * facteurZone);
}

/**
 * Renvoie les 8760 valeurs horaires de T_ext et I_global_horizontal pour
 * une zone climatique donnée (ex: "H1c").
 */
export function getMeteoHoraire(zoneLabel: string | undefined | null): MeteoHoraire {
  const zone = parseZone(zoneLabel);
  const decalage = DECALAGE_ZONE[zone] ?? 0;

  const tExt: number[] = new Array(8760);
  const iSolaireH: number[] = new Array(8760);

  const rayonnementKWh = rayonnementMensuelHorizontalKWh(zone);

  let h = 0;
  for (let m = 0; m < 12; m += 1) {
    const ref = TMIN_TMAX_MOIS_REF[m];
    const tMin = ref.tMin + decalage;
    const tMax = ref.tMax + decalage;
    const tMoy = (tMin + tMax) / 2;
    const amplitude = (tMax - tMin) / 2;

    // Conversion kWh/mois → W/m² moyen sur les heures de jour.
    const heuresJour = HEURES_JOUR_MOIS[m];
    const joursMois = HEURES_PAR_MOIS[m] / 24;
    // E_jour_kWh = kWh_mois / nb_jours
    const eJourKWh = rayonnementKWh[m] / joursMois;
    // Pic gaussien à midi : aire d'une gaussienne d'écart-type sigma ≈ heuresJour/4
    // ∫ exp(-(t-12)²/(2σ²)) dt ≈ σ √(2π). Donc P_pic = E_jour_kWh × 1000 / (σ √(2π))
    const sigma = heuresJour / 4;
    const aire = sigma * Math.sqrt(2 * Math.PI);
    const pPic = (eJourKWh * 1000) / aire;

    for (let i = 0; i < HEURES_PAR_MOIS[m]; i += 1) {
      const heureDuJour = h % 24;
      // Profil T_ext : sinusoïde, min à 6h, max à 15h.
      // T(h) = Tmoy − A × cos(2π × (h − 15) / 24) — décale le max sur 15h.
      tExt[h] = tMoy - amplitude * Math.cos((2 * Math.PI * (heureDuJour - 15)) / 24);

      // Rayonnement : gaussienne centrée 12h, σ ≈ heuresJour/4.
      const dt = heureDuJour - 12;
      const w = pPic * Math.exp(-(dt * dt) / (2 * sigma * sigma));
      iSolaireH[h] = w > 0 ? w : 0;

      h += 1;
    }
  }

  return { tExt, iSolaireH };
}

/** Mapping heure de l'année → mois (0..11). */
export function moisDeLHeure(h: number): number {
  let cum = 0;
  for (let m = 0; m < 12; m += 1) {
    cum += HEURES_PAR_MOIS[m];
    if (h < cum) return m;
  }
  return 11;
}

/** Mapping heure de l'année → jour de la semaine (0..6, lundi=0).
 * Approximation : on suppose que le 1er janvier est un lundi (suffisant pour
 * un bilan annuel avec scénario hebdo répétitif).
 */
export function jourSemaineDeLHeure(h: number): number {
  const jourAnnee = Math.floor(h / 24);
  return jourAnnee % 7;
}

export { HEURES_PAR_MOIS };
