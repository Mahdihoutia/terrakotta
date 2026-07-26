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
 *
 * Pour les VARIANTES (Scénarios), les gestes d'enveloppe sont appliqués par
 * zone/paroi (applyGestesToZoneInputs) puis re-simulés ; les gestes systèmes
 * restent gérés par l'état agrégé (applyGestesToBaseline).
 */

import { prisma } from "./db";
import { buildZoneInputFromDb } from "./api-helpers/batiment";
import { simulerZone, type ZoneInput } from "./thermal/zone-calc";
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

/** Zone chargée depuis la BDD, prête à simuler (avec ses métadonnées). */
export interface ZoneInputMeta {
  nom: string;
  usage: string;
  input: ZoneInput;
}

export interface AggSim {
  surfaceTotale: number;
  besoinChauffageKWh: number;
  besoinClimKWh: number;
  besoinChauffageM2: number;
  besoinClimM2: number;
  apportsSolairesMWh: number;
  apportsInternesMWh: number;
  pertesEnveloppeMWh: number;
  pertesVentilationMWh: number;
  puissanceCreteChauffageKW: number;
  parZone: ProjetHoraireZone[];
}

export interface ProjetHoraireResult extends AggSim {
  nbZones: number;
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

/* ─── Gestes d'enveloppe → cibles U par type de paroi (miroir U_TARGETS) ─── */
const GESTE_U_TARGET: Record<string, { paroiTypes: string[]; u: number }> = {
  ISOLATION_MURS_ITE: { paroiTypes: ["MUR_EXT", "PORTE"], u: 0.2 },
  ISOLATION_MURS_ITI: { paroiTypes: ["MUR_EXT", "PORTE"], u: 0.3 },
  ISOLATION_COMBLES: { paroiTypes: ["TOITURE"], u: 0.15 },
  ISOLATION_PLANCHER_BAS: { paroiTypes: ["PLANCHER_BAS"], u: 0.2 },
  ISOLATION_TOITURE_TERRASSE: { paroiTypes: ["TOITURE"], u: 0.18 },
  MENUISERIES: { paroiTypes: ["VITRAGE"], u: 1.3 },
};
const GESTE_VMC_DF: Record<string, number> = { VMC_DOUBLE_FLUX: 0.85 };

/** Charge toutes les zones exploitables d'un projet, prêtes à simuler. */
export async function loadProjetZoneInputs(
  projetId: string,
): Promise<ZoneInputMeta[]> {
  const batiments = await prisma.batiment.findMany({
    where: { projetId, deletedAt: null },
    select: {
      zoneClimatique: true,
      zones: {
        where: { deletedAt: null },
        select: { id: true, nom: true, usage: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const out: ZoneInputMeta[] = [];
  for (const b of batiments) {
    for (const z of b.zones) {
      const input = await buildZoneInputFromDb(z.id, b.zoneClimatique);
      if (!input || input.surface <= 0) continue;
      out.push({ nom: z.nom, usage: z.usage, input });
    }
  }
  return out;
}

/**
 * Applique des gestes d'enveloppe (isolation, menuiseries, VMC double flux) à
 * une copie des zones — pour simuler une variante. Les gestes systèmes (PAC,
 * ECS…) n'affectent pas la simulation et sont traités par l'état agrégé.
 * Le dernier geste sur un même type de paroi gagne (cohérent avec l'agrégé).
 */
export function applyGestesToZoneInputs(
  zones: ZoneInputMeta[],
  gestes: Array<{ code: string }>,
): ZoneInputMeta[] {
  // Copie profonde des parois (les U vont être modifiés).
  const copy: ZoneInputMeta[] = zones.map((z) => ({
    ...z,
    input: { ...z.input, parois: z.input.parois.map((p) => ({ ...p })) },
  }));

  for (const g of gestes) {
    const uTarget = GESTE_U_TARGET[g.code];
    if (uTarget) {
      for (const z of copy) {
        for (const p of z.input.parois) {
          if (p.paroiType && uTarget.paroiTypes.includes(p.paroiType)) {
            p.uValue = uTarget.u;
          }
        }
      }
    }
    const dfTarget = GESTE_VMC_DF[g.code];
    if (dfTarget != null) {
      for (const z of copy) z.input.efficaciteDoubleFlux = dfTarget;
    }
  }
  return copy;
}

/** Simule un ensemble de zones et agrège les résultats. */
export function simulerZonesAgg(zones: ZoneInputMeta[]): AggSim {
  let surfaceTotale = 0;
  let besoinChauffageMWh = 0;
  let besoinClimMWh = 0;
  let apportsSolairesMWh = 0;
  let apportsInternesMWh = 0;
  let pertesEnveloppeMWh = 0;
  let pertesVentilationMWh = 0;
  let puissanceCreteChauffageKW = 0;
  const parZone: ProjetHoraireZone[] = [];

  for (const z of zones) {
    const r = simulerZone(z.input);
    const s = z.input.surface;
    surfaceTotale += s;
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
      surface: s,
      besoinChauffageKWhM2: s > 0 ? (r.besoinChauffageMWh * 1000) / s : 0,
      besoinClimKWhM2: s > 0 ? (r.besoinClimMWh * 1000) / s : 0,
    });
  }

  return {
    surfaceTotale,
    besoinChauffageKWh: besoinChauffageMWh * 1000,
    besoinClimKWh: besoinClimMWh * 1000,
    besoinChauffageM2: surfaceTotale > 0 ? (besoinChauffageMWh * 1000) / surfaceTotale : 0,
    besoinClimM2: surfaceTotale > 0 ? (besoinClimMWh * 1000) / surfaceTotale : 0,
    apportsSolairesMWh,
    apportsInternesMWh,
    pertesEnveloppeMWh,
    pertesVentilationMWh,
    puissanceCreteChauffageKW,
    parZone,
  };
}

/**
 * Lance la simulation horaire projet (baseline) + conversion Cep/DPE.
 * Retourne null si le projet n'a aucune zone exploitable.
 */
export async function simulerProjetHoraire(
  projetId: string,
): Promise<ProjetHoraireResult | null> {
  const zones = await loadProjetZoneInputs(projetId);
  if (zones.length === 0) return null;
  const sim = simulerZonesAgg(zones);
  if (sim.surfaceTotale <= 0) return null;

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
      besoinChauffageOverrideKwh: sim.besoinChauffageKWh,
      besoinClimOverrideKwh: base.baseline.hasClim ? sim.besoinClimKWh : 0,
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
    ...sim,
    nbZones: zones.length,
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
