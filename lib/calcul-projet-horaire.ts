/**
 * Simulation horaire 8760 h à l'échelle d'un PROJET (haute-fidélité).
 *
 * Réutilise le moteur 5R1C par zone (simulerZone) — déjà employé par le bilan
 * bâtiment — pour chaque zone de chaque bâtiment du projet, puis agrège les
 * besoins et les convertit en Cep/DPE via le MÊME modèle de consommation que
 * l'onglet Calcul/Scénarios (computeIndicatorsFromState), en injectant le
 * besoin de chauffage/refroidissement issu de la simulation.
 *
 * Différence vs la méthode DJU forfaitaire : météo horaire réelle, apports
 * internes issus des champs de zone (densité d'occupation, W/personne,
 * W/m² équipements & éclairage), consignes occupé/réduit, scénario
 * d'occupation 7×24 et apports solaires par orientation de vitrage.
 */

import { prisma } from "./db";
import { buildZoneInputFromDb } from "./api-helpers/batiment";
import { simulerZone } from "./thermal/zone-calc";
import { computeIndicatorsFromState } from "./calcul-variante";
import { buildProjetBaseline } from "./calcul-projet";
import type { ClasseDpe, DpeResult } from "./thermal";

export interface ProjetHoraireZone {
  nom: string;
  usage: string;
  surface: number;
  besoinChauffageKWhM2: number;
  besoinClimKWhM2: number;
}

export interface ProjetHoraireResult {
  nbZones: number;
  surfaceTotale: number;
  besoinChauffageMWh: number;
  besoinClimMWh: number;
  besoinChauffageM2: number; // kWh/m²·an
  besoinClimM2: number;
  apportsSolairesMWh: number;
  apportsInternesMWh: number;
  pertesEnveloppeMWh: number;
  pertesVentilationMWh: number;
  puissanceCreteChauffageKW: number;
  parZone: ProjetHoraireZone[];
  /** Cep/DPE si systèmes saisis — via computeIndicatorsFromState (besoin injecté). */
  cep: number | null;
  ges: number | null;
  consoFinaleM2: number | null;
  classeDpe: ClasseDpe | null;
  classeGes: ClasseDpe | null;
  classeFinale: ClasseDpe | null;
  dpeResult: DpeResult | null;
  calibrationApplied: boolean;
}

/**
 * Lance la simulation horaire projet. Retourne null si le projet n'a aucune
 * zone exploitable.
 */
export async function simulerProjetHoraire(
  projetId: string,
): Promise<ProjetHoraireResult | null> {
  const batiments = await prisma.batiment.findMany({
    where: { projetId, deletedAt: null },
    select: {
      id: true,
      zoneClimatique: true,
      zones: {
        where: { deletedAt: null },
        select: { id: true, nom: true, usage: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (batiments.length === 0) return null;

  let surfaceTotale = 0;
  let besoinChauffageMWh = 0;
  let besoinClimMWh = 0;
  let apportsSolairesMWh = 0;
  let apportsInternesMWh = 0;
  let pertesEnveloppeMWh = 0;
  let pertesVentilationMWh = 0;
  let puissanceCreteChauffageKW = 0;
  const parZone: ProjetHoraireZone[] = [];

  for (const b of batiments) {
    for (const z of b.zones) {
      const input = await buildZoneInputFromDb(z.id, b.zoneClimatique);
      if (!input || input.surface <= 0) continue;
      const r = simulerZone(input);
      surfaceTotale += input.surface;
      besoinChauffageMWh += r.besoinChauffageMWh;
      besoinClimMWh += r.besoinClimMWh;
      apportsSolairesMWh += r.apportsSolairesMWh;
      apportsInternesMWh += r.apportsInternesMWh;
      pertesEnveloppeMWh += r.pertesEnveloppeMWh;
      pertesVentilationMWh += r.pertesVentilationMWh;
      puissanceCreteChauffageKW += r.puissanceCreteChauffage;
      parZone.push({
        nom: z.nom,
        usage: z.usage,
        surface: input.surface,
        besoinChauffageKWhM2:
          input.surface > 0 ? (r.besoinChauffageMWh * 1000) / input.surface : 0,
        besoinClimKWhM2:
          input.surface > 0 ? (r.besoinClimMWh * 1000) / input.surface : 0,
      });
    }
  }

  if (parZone.length === 0 || surfaceTotale <= 0) return null;

  const besoinChauffageM2 = (besoinChauffageMWh * 1000) / surfaceTotale;
  const besoinClimM2 = (besoinClimMWh * 1000) / surfaceTotale;

  // Cep/DPE : on réutilise le modèle de conso projet (systèmes, ECS, auxiliaires,
  // éclairage, PV, calibration) en injectant le besoin issu de la simulation.
  let cep: number | null = null;
  let ges: number | null = null;
  let consoFinaleM2: number | null = null;
  let classeDpe: ClasseDpe | null = null;
  let classeGes: ClasseDpe | null = null;
  let classeFinale: ClasseDpe | null = null;
  let dpeResult: DpeResult | null = null;
  let calibrationApplied = false;

  const base = await buildProjetBaseline(projetId);
  if (base && base.hasEnvelope && base.hasSystems) {
    const ind = computeIndicatorsFromState({
      ...base.baseline,
      besoinChauffageOverrideKwh: besoinChauffageMWh * 1000,
      // Le besoin de refroidissement n'est une CONSO que s'il existe un système
      // de clim. Sans clim, la surchauffe simulée reste un indicateur de confort
      // (besoinClimMWh ci-dessus), pas une consommation Cep.
      besoinClimOverrideKwh: base.baseline.hasClim ? besoinClimMWh * 1000 : 0,
    });
    cep = ind.cep;
    ges = ind.ges;
    consoFinaleM2 = ind.consoFinaleM2;
    classeDpe = ind.dpe;
    classeGes = ind.ges_class;
    classeFinale = ind.dpeResult.classe_finale;
    dpeResult = ind.dpeResult;
    calibrationApplied =
      !!base.baseline.calibrationFactor || !!base.baseline.calibrationFactorECS;
  }

  return {
    nbZones: parZone.length,
    surfaceTotale,
    besoinChauffageMWh,
    besoinClimMWh,
    besoinChauffageM2,
    besoinClimM2,
    apportsSolairesMWh,
    apportsInternesMWh,
    pertesEnveloppeMWh,
    pertesVentilationMWh,
    puissanceCreteChauffageKW,
    parZone,
    cep,
    ges,
    consoFinaleM2,
    classeDpe,
    classeGes,
    classeFinale,
    dpeResult,
    calibrationApplied,
  };
}
