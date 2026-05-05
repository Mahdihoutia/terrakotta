/**
 * Construit la BaselineState d'un projet depuis Prisma.
 * Réutilisé par : tab Scénarios (simulation variantes), tab Calcul, rapport PDF.
 */

import { prisma } from "./db";
import {
  getZoneData,
  parseZone,
  calculerPontsThermiques,
  PSI_LIBRARY,
  type Vecteur,
  type TypeLiaison,
  type TypeIsolation,
} from "./thermal";
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
  /** Calibration facture chauffage. */
  calibrationApplied: { factor: number; consoFacture: number; consoCalculee: number } | null;
  /** Calibration facture ECS. */
  calibrationECSApplied: { factor: number; consoFacture: number; consoCalculee: number } | null;
} | null> {
  const projet = await prisma.projet.findFirst({
    where: { id: projetId, deletedAt: null },
    select: {
      nbOccupants: true,
      inertie: true,
      intermittenceChauffage: true,
      permeabiliteAir: true,
      consoFactureChauffage: true,
      consoFactureECS: true,
    },
  });
  if (!projet) return null;

  const [batiments, systemes] = await Promise.all([
    prisma.batiment.findMany({
      where: { projetId, deletedAt: null },
      select: {
        zoneClimatique: true,
        pontsThermiques: {
          where: { deletedAt: null },
          select: { typo: true, isolation: true, longueur: true, psiOverride: true },
        },
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
      select: {
        type: true, vecteur: true, rendement: true, partCouverture: true, cop: true,
        puissanceKwc: true, tauxAutoconso: true,
      },
    }),
  ]);

  // Production PV annuelle (kWh/kWc selon zone climatique — Météo France/PVGIS)
  const PRODUCTIBLE_KWH_KWC: Record<string, number> = {
    H1a: 1050, H1b: 1080, H1c: 1100,
    H2a: 1100, H2b: 1180, H2c: 1300, H2d: 1200,
    H3:  1450,
  };

  if (batiments.length === 0) return { baseline: emptyBaseline(), hasEnvelope: false, hasSystems: false, calibrationApplied: null, calibrationECSApplied: null };

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
  let nbPonts = 0;
  let hPontsTotal = 0;

  for (const b of batiments) {
    if (b.zoneClimatique) zoneClim = b.zoneClimatique;
    // Ponts thermiques saisis : ψ override > biblio Th-U selon typo+isolation
    for (const pt of b.pontsThermiques) {
      const longueur = Number(pt.longueur);
      const psiSaisi = pt.psiOverride != null ? Number(pt.psiOverride) : null;
      const psiBiblio =
        PSI_LIBRARY[pt.typo as TypeLiaison]?.[pt.isolation as TypeIsolation] ?? 0;
      const psi = psiSaisi != null ? psiSaisi : psiBiblio;
      hPontsTotal += psi * longueur;
      nbPonts += 1;
    }
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
  const sysPV = systemes.filter((s) => s.type === "PHOTOVOLTAIQUE");

  const cha = moy(sysChauf);
  const ecsRes = moy(sysECS);

  // PV : production annuelle × taux autoconso
  let pvAutoconsoKwh = 0;
  const zoneCourt = parseZone(zoneClim);
  const productible = PRODUCTIBLE_KWH_KWC[zoneCourt] ?? 1100;
  for (const pv of sysPV) {
    const kWc = pv.puissanceKwc != null ? Number(pv.puissanceKwc) : 0;
    const tauxAuto = pv.tauxAutoconso != null ? Number(pv.tauxAutoconso) : 0.4;
    if (kWc > 0) {
      pvAutoconsoKwh += kWc * productible * tauxAuto;
    }
  }

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
    intermittenceChauffage: projet.intermittenceChauffage ?? false,
    inertie: projet.inertie ?? "MOYENNE",
    nbOccupants: projet.nbOccupants ?? null,
    permeabiliteAir: projet.permeabiliteAir != null ? Number(projet.permeabiliteAir) : null,
    hPontsThermiquesSaisis: nbPonts > 0 ? hPontsTotal : null,
    chauffageEff: cha.eff,
    chauffageVecteur: cha.vecteur,
    ecsEff: ecsRes.eff,
    ecsVecteur: ecsRes.vecteur,
    partSolaireECS: 0,
    hasClim: sysClim.length > 0,
    pvAutoconsoKwh: pvAutoconsoKwh > 0 ? pvAutoconsoKwh : undefined,
  };

  const surfaceOpaqueTotale = surfaceMurs + buckets.TOITURE.s + buckets.PLANCHER_BAS.s + buckets.VITRAGE.s;
  const hasEnvelope = nbParois > 0 && surfaceOpaqueTotale > 0;
  const hasSystems = sysChauf.length > 0;

  // Calibration multi-énergies (chauffage + ECS séparés)
  let calibrationApplied: { factor: number; consoFacture: number; consoCalculee: number } | null = null;
  let calibrationECSApplied: { factor: number; consoFacture: number; consoCalculee: number } | null = null;

  if (hasEnvelope && hasSystems && (projet.consoFactureChauffage || projet.consoFactureECS)) {
    const tmpInd = await import("./calcul-variante").then((m) =>
      m.computeIndicatorsFromState(baseline),
    );
    const auxM2 = (tmpInd.consoFinaleM2 - tmpInd.cef);
    void auxM2; // unused, placeholder for clarity

    // Conso chauffage calculée brut (avant calibration) :
    //   chauffage_kwh = besoinChauffageNet / chauffageEff
    // tmpInd.besoinChauffage est en kWh/m²·an net.
    const consoCalculeeChauf = baseline.chauffageEff > 0
      ? (tmpInd.besoinChauffage * baseline.surfaceHabitable) / baseline.chauffageEff
      : 0;

    // Conso ECS calculée brut :
    const consoCalculeeECS = baseline.ecsEff > 0
      ? (tmpInd.besoinECS * baseline.surfaceHabitable) / baseline.ecsEff
      : 0;

    if (projet.consoFactureChauffage) {
      const consoFacture = Number(projet.consoFactureChauffage);
      if (consoFacture > 0 && consoCalculeeChauf > 0) {
        const factor = consoFacture / consoCalculeeChauf;
        if (factor >= 0.5 && factor <= 2.0) {
          baseline.calibrationFactor = factor;
          calibrationApplied = { factor, consoFacture, consoCalculee: consoCalculeeChauf };
        }
      }
    }
    if (projet.consoFactureECS) {
      const consoFacture = Number(projet.consoFactureECS);
      if (consoFacture > 0 && consoCalculeeECS > 0) {
        const factor = consoFacture / consoCalculeeECS;
        if (factor >= 0.5 && factor <= 2.0) {
          baseline.calibrationFactorECS = factor;
          calibrationECSApplied = { factor, consoFacture, consoCalculee: consoCalculeeECS };
        }
      }
    }
  }

  return {
    baseline,
    hasEnvelope,
    hasSystems,
    calibrationApplied,
    calibrationECSApplied,
  };
}

function emptyBaseline(): BaselineState {
  return {
    zoneClimatique: "H1a",
    surfaceHabitable: 0, volumeChauffe: 0,
    surfaceMurs: 0, surfaceToiture: 0, surfacePlancher: 0, surfaceVitree: 0,
    uMurs: 0, uToiture: 0, uPlancher: 0, uVitree: 0,
    renouvellementAir: 0.5, efficaciteDoubleFlux: 0,
    consigneInt: 19, tBase: -7,
    intermittenceChauffage: false, inertie: "MOYENNE", nbOccupants: null,
    permeabiliteAir: null,
    chauffageEff: 0.85, chauffageVecteur: "gaz_naturel",
    ecsEff: 1.0, ecsVecteur: "elec",
    partSolaireECS: 0, hasClim: false,
  };
}
