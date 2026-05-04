/**
 * Construit la BaselineState d'un projet depuis Prisma.
 * Réutilisé par : tab Scénarios (simulation variantes), tab Calcul, rapport PDF.
 */

import { prisma } from "./db";
import { getZoneData, parseZone, type Vecteur } from "./thermal";
import type { BaselineState } from "./calcul-variante";

const VECTEUR_MAP: Record<string, Vecteur> = {
  ELEC: "elec",
  GAZ_NATUREL: "gaz_naturel",
  FIOUL: "fioul",
  BOIS: "bois",
  PROPANE: "propane",
  RESEAU_CHALEUR: "reseau_chaleur",
};

type ParoiCat = "MUR_EXT" | "TOITURE" | "PLANCHER_BAS" | "VITRAGE" | "PORTE";

/**
 * Lit le projet en BDD et calcule sa baseline énergétique
 * (parois agrégées + ventilation + systèmes principaux).
 *
 * Retourne null si le projet n'a pas assez de données pour simuler
 * (pas de bâtiments ou pas de parois affectées).
 */
export async function buildProjetBaseline(projetId: string): Promise<{
  baseline: BaselineState;
  hasEnvelope: boolean;
  hasSystems: boolean;
} | null> {
  const [batiments, systemes] = await Promise.all([
    prisma.batiment.findMany({
      where: { projetId, deletedAt: null },
      select: {
        zoneClimatique: true,
        zones: {
          select: {
            surface: true,
            hauteurSousPlafond: true,
            consigneChauffageOcc: true,
            qVmcM3hM2: true,
            efficaciteDoubleFlux: true,
            parois: {
              select: {
                surface: true,
                paroi: { select: { type: true, uCache: true } },
              },
            },
          },
        },
      },
    }),
    prisma.systeme.findMany({
      where: { projetId, deletedAt: null },
      select: { type: true, vecteur: true, rendement: true, partCouverture: true, cop: true },
    }),
  ]);

  if (batiments.length === 0) return null;

  // Aggrégation parois (somme sur tous bâtiments du projet)
  const buckets: Record<ParoiCat, { s: number; ua: number }> = {
    MUR_EXT: { s: 0, ua: 0 },
    TOITURE: { s: 0, ua: 0 },
    PLANCHER_BAS: { s: 0, ua: 0 },
    VITRAGE: { s: 0, ua: 0 },
    PORTE: { s: 0, ua: 0 },
  };
  let surfaceHabitable = 0;
  let volumeChauffe = 0;
  let qVmcGlobal = 0;
  let effDFGlobal = 0;
  let consigneGlobale = 0;
  let nbZones = 0;
  let nbParois = 0;
  let zoneClim = "H1a — Nord";

  for (const b of batiments) {
    if (b.zoneClimatique) zoneClim = b.zoneClimatique;
    for (const z of b.zones) {
      const sZ = Number(z.surface);
      const hZ = Number(z.hauteurSousPlafond);
      surfaceHabitable += sZ;
      volumeChauffe += sZ * hZ;
      qVmcGlobal += Number(z.qVmcM3hM2) * sZ;
      effDFGlobal += Number(z.efficaciteDoubleFlux);
      consigneGlobale += Number(z.consigneChauffageOcc);
      nbZones += 1;
      for (const zp of z.parois) {
        nbParois += 1;
        const s = Number(zp.surface);
        const u = zp.paroi.uCache != null ? Number(zp.paroi.uCache) : 0;
        if (s <= 0 || u <= 0) continue;
        const t = zp.paroi.type as ParoiCat;
        if (t in buckets) {
          buckets[t].s += s;
          buckets[t].ua += u * s;
        }
      }
    }
  }

  const wU = (b: { s: number; ua: number }) => (b.s > 0 ? b.ua / b.s : 0);
  const surfaceMurs = buckets.MUR_EXT.s + buckets.PORTE.s;
  const uMurs = (buckets.MUR_EXT.s + buckets.PORTE.s) > 0
    ? (buckets.MUR_EXT.ua + buckets.PORTE.ua) / (buckets.MUR_EXT.s + buckets.PORTE.s)
    : 0;

  const renouvellementAir = volumeChauffe > 0 ? qVmcGlobal / volumeChauffe : 0.5;
  const efficaciteDoubleFlux = nbZones > 0 ? effDFGlobal / nbZones : 0;
  const consigneInt = nbZones > 0 ? consigneGlobale / nbZones : 19;

  const zd = getZoneData(zoneClim);
  const tBase = zd?.tBase ?? -7;

  // Système chauffage / ECS dominants (pondéré par partCouverture)
  function moy(arr: typeof systemes): { eff: number; vecteur: Vecteur } {
    if (arr.length === 0) return { eff: 0.85, vecteur: "gaz_naturel" };
    let p = 0, pe = 0;
    let dom: Vecteur = VECTEUR_MAP[arr[0].vecteur] ?? "gaz_naturel";
    let domP = 0;
    for (const s of arr) {
      const part = Number(s.partCouverture);
      const e = s.cop != null ? Number(s.cop) : Number(s.rendement);
      p += part;
      pe += part * e;
      if (part > domP) {
        domP = part;
        dom = VECTEUR_MAP[s.vecteur] ?? dom;
      }
    }
    return { eff: p > 0 ? pe / p : 0.85, vecteur: dom };
  }

  const sysChauf = systemes.filter((s) => s.type === "CHAUFFAGE");
  const sysECS = systemes.filter((s) => s.type === "ECS");
  const sysClim = systemes.filter((s) => s.type === "CLIMATISATION");

  const cha = moy(sysChauf);
  const ecsRes = moy(sysECS);

  const baseline: BaselineState = {
    zoneClimatique: parseZone(zoneClim),
    surfaceHabitable,
    volumeChauffe,
    surfaceMurs,
    surfaceToiture: buckets.TOITURE.s,
    surfacePlancher: buckets.PLANCHER_BAS.s,
    surfaceVitree: buckets.VITRAGE.s,
    uMurs,
    uToiture: wU(buckets.TOITURE),
    uPlancher: wU(buckets.PLANCHER_BAS),
    uVitree: wU(buckets.VITRAGE),
    renouvellementAir,
    efficaciteDoubleFlux,
    consigneInt,
    tBase,
    chauffageEff: cha.eff,
    chauffageVecteur: cha.vecteur,
    ecsEff: ecsRes.eff,
    ecsVecteur: ecsRes.vecteur,
    partSolaireECS: 0,
    hasClim: sysClim.length > 0,
  };

  const surfaceOpaqueTotale = surfaceMurs + buckets.TOITURE.s + buckets.PLANCHER_BAS.s + buckets.VITRAGE.s;
  return {
    baseline,
    hasEnvelope: nbParois > 0 && surfaceOpaqueTotale > 0,
    hasSystems: sysChauf.length > 0,
  };
}
