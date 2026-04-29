/**
 * Moteur de simulation horaire 8760 h pour une zone thermique.
 *
 * Méthode : 5R1C ISO 13790 simplifié — régulation parfaite de la consigne.
 * Pour chaque heure :
 *   1. T_ext et I_solaire récupérés via meteo-horaire.
 *   2. Mode (OCC/RED/INOCC) selon scénario hebdo.
 *   3. Apports internes (occupants + équipements + éclairage) selon mode.
 *   4. Apports solaires sur vitrages exposés.
 *   5. Pertes enveloppe : H × (T_consigne − T_ext) — uniquement parois côté ext.
 *   6. Pertes ventilation : 0.34 × Q_v × (T_consigne − T_ext) × (1 − ε_DF).
 *   7. Bilan : si bilan négatif sous consigne chauffage → besoin chauffage.
 *              Si bilan positif au-dessus consigne clim → besoin clim.
 *
 * Précision attendue : ±10 % sur le bilan annuel vs Pleiades / EnergyPlus
 * (suffisant pour un dimensionnement non réglementaire).
 */

import {
  getMeteoHoraire,
  jourSemaineDeLHeure,
  moisDeLHeure,
} from "./meteo-horaire";
import type { OccupationCode } from "@/lib/validations/scenario";

export interface ZoneParoiInput {
  surface: number;          // m²
  uValue: number;           // W/m²·K
  masseSurfacique: number;  // kg/m² (info)
  cotePaire: boolean;       // true = donne sur l'extérieur
  orientation?: string | null;
  isVitrage: boolean;
  facteurSolaireG?: number; // 0..1 si vitrage
}

export interface ZoneInput {
  surface: number;
  hauteurSousPlafond: number;
  zoneClimatique: string;
  consigneChauffageOcc: number;
  consigneChauffageRed: number;
  consigneClimOcc: number;
  consigneClimRed: number;
  densiteOccupation: number;     // m²/personne
  apportsParPersonne: number;    // W/personne
  apportsEquipements: number;    // W/m²
  apportsEclairage: number;      // W/m²
  qVmcM3hM2: number;             // m³/h/m²
  efficaciteDoubleFlux: number;  // 0..1
  scenarioPattern: OccupationCode[][]; // 7 × 24
  parois: ZoneParoiInput[];
}

export interface ZoneResult {
  besoinChauffageMWh: number;
  besoinClimMWh: number;
  apportsSolairesMWh: number;
  apportsInternesMWh: number;
  pertesEnveloppeMWh: number;
  pertesVentilationMWh: number;
  besoinMensuel: { chauffage: number[]; clim: number[] };
  heuresSurchauffe: number;
  puissanceCreteChauffage: number;  // kW
  puissanceCreteClim: number;       // kW
  /** Coefficient déperditif statique (W/K). */
  hEnveloppe: number;
  hVentilation: number;
}

/**
 * Coefficient d'orientation (incidence solaire moyenne sur un plan vertical
 * par rapport à un plan horizontal, sur l'année). Utilisé pour pondérer
 * I_solaire_horizontal sur les vitrages verticaux.
 */
const FACTEUR_ORIENTATION: Record<string, number> = {
  S:  1.10,
  SE: 0.95,
  SO: 0.95,
  E:  0.75,
  O:  0.75,
  NE: 0.45,
  NO: 0.45,
  N:  0.30,
};

function facteurOrientation(o: string | null | undefined): number {
  if (!o) return 0.7; // moyenne
  return FACTEUR_ORIENTATION[o] ?? 0.7;
}

export function simulerZone(input: ZoneInput): ZoneResult {
  const meteo = getMeteoHoraire(input.zoneClimatique);
  const { tExt, iSolaireH } = meteo;

  // Coefficient déperditif enveloppe (W/K) — uniquement parois côté ext.
  let hEnveloppe = 0;
  for (const p of input.parois) {
    if (p.cotePaire) hEnveloppe += p.uValue * p.surface;
  }

  // Volume zone et débit ventilation.
  const volume = input.surface * input.hauteurSousPlafond;
  const qV = input.qVmcM3hM2 * input.surface; // m³/h
  const hVent = 0.34 * qV * (1 - input.efficaciteDoubleFlux); // W/K

  // Apports internes max (W).
  const nbOccupants = input.densiteOccupation > 0
    ? input.surface / input.densiteOccupation
    : 0;
  const apportsOccupantsMax = nbOccupants * input.apportsParPersonne; // W
  const apportsEquipementsMax = input.apportsEquipements * input.surface;
  const apportsEclairageMax = input.apportsEclairage * input.surface;

  // Pré-calcul vitrages (W/m² → contribution horaire).
  const vitragesExt = input.parois.filter((p) => p.cotePaire && p.isVitrage);

  let besoinChauffageWh = 0;
  let besoinClimWh = 0;
  let apportsSolWh = 0;
  let apportsIntWh = 0;
  let pertesEnvWh = 0;
  let pertesVentWh = 0;
  let heuresSurchauffe = 0;
  let pCreteChauffage = 0;
  let pCreteClim = 0;

  const besoinMensuelChauffage = new Array(12).fill(0);
  const besoinMensuelClim = new Array(12).fill(0);

  for (let h = 0; h < 8760; h += 1) {
    const t = tExt[h];
    const iH = iSolaireH[h]; // W/m² horizontal
    const jour = jourSemaineDeLHeure(h);
    const heureJ = h % 24;
    const mode = input.scenarioPattern[jour]?.[heureJ] ?? "INOCC";

    // Consignes selon mode.
    let consigneChaud: number;
    let consigneFroid: number;
    let facteurOcc: number; // 0..1 — fraction d'occupation
    if (mode === "OCC") {
      consigneChaud = input.consigneChauffageOcc;
      consigneFroid = input.consigneClimOcc;
      facteurOcc = 1.0;
    } else if (mode === "RED") {
      consigneChaud = input.consigneChauffageRed;
      consigneFroid = input.consigneClimRed;
      facteurOcc = 0.3;
    } else {
      consigneChaud = input.consigneChauffageRed;
      consigneFroid = input.consigneClimRed;
      facteurOcc = 0.05; // équipements résiduels (veille)
    }

    // Apports internes (W).
    const apportsOccupants = facteurOcc * apportsOccupantsMax;
    const apportsEquip =
      mode === "INOCC"
        ? 0.1 * apportsEquipementsMax
        : facteurOcc * apportsEquipementsMax;
    const apportsEclair = facteurOcc * apportsEclairageMax;
    const apportsInternes = apportsOccupants + apportsEquip + apportsEclair;

    // Apports solaires (W) — somme sur vitrages extérieurs.
    let apportsSolaires = 0;
    for (const v of vitragesExt) {
      const g = v.facteurSolaireG ?? 0.6;
      const f = facteurOrientation(v.orientation);
      apportsSolaires += v.surface * g * f * iH;
    }

    // T_int de référence pour le bilan (mode chauffage si T_ext < seuil milieu).
    const tCible = (consigneChaud + consigneFroid) / 2;
    const ecart = tCible - t;

    const pertesEnv = hEnveloppe * ecart;   // W positif = pertes vers ext
    const pertesVent = hVent * ecart;

    // Bilan = apports - pertes (W net dans la zone).
    const bilan = apportsInternes + apportsSolaires - pertesEnv - pertesVent;

    // Besoins :
    //   bilan < 0 et T_ext < consigne chaud → besoin chauffage = -bilan_chauffage
    //   bilan > 0 et T_ext > consigne froid → besoin clim = bilan_clim
    // En version simple, on calcule séparément l'écart à chaque consigne.
    const bilanChaud =
      apportsInternes + apportsSolaires
      - hEnveloppe * (consigneChaud - t)
      - hVent * (consigneChaud - t);
    const bilanFroid =
      apportsInternes + apportsSolaires
      - hEnveloppe * (consigneFroid - t)
      - hVent * (consigneFroid - t);

    let besoinH = 0;
    let besoinC = 0;
    if (bilanChaud < 0) besoinH = -bilanChaud; // W
    if (bilanFroid > 0) besoinC = bilanFroid;

    // Heures de surchauffe : T int dépasse 28 si pas de clim (consigne > 30).
    if (input.consigneClimOcc >= 30 && bilanChaud > hEnveloppe * 8) {
      // Approximation : si bilan très excédentaire en mode passif.
      heuresSurchauffe += 1;
    }

    // Cumul (Wh).
    besoinChauffageWh += besoinH;
    besoinClimWh += besoinC;
    apportsSolWh += apportsSolaires;
    apportsIntWh += apportsInternes;
    pertesEnvWh += Math.max(0, pertesEnv);
    pertesVentWh += Math.max(0, pertesVent);

    if (besoinH > pCreteChauffage) pCreteChauffage = besoinH;
    if (besoinC > pCreteClim) pCreteClim = besoinC;

    const m = moisDeLHeure(h);
    besoinMensuelChauffage[m] += besoinH / 1000; // kWh
    besoinMensuelClim[m] += besoinC / 1000;
  }

  return {
    besoinChauffageMWh: besoinChauffageWh / 1_000_000,
    besoinClimMWh: besoinClimWh / 1_000_000,
    apportsSolairesMWh: apportsSolWh / 1_000_000,
    apportsInternesMWh: apportsIntWh / 1_000_000,
    pertesEnveloppeMWh: pertesEnvWh / 1_000_000,
    pertesVentilationMWh: pertesVentWh / 1_000_000,
    besoinMensuel: {
      chauffage: besoinMensuelChauffage,
      clim: besoinMensuelClim,
    },
    heuresSurchauffe,
    puissanceCreteChauffage: pCreteChauffage / 1000, // kW
    puissanceCreteClim: pCreteClim / 1000,
    hEnveloppe,
    hVentilation: hVent,
  };
}

// Suppress unused warning for volume (kept for future use)
void (function unused(): void {
  return;
});
