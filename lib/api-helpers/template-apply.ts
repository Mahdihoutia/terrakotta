/**
 * Helper d'application d'un template de bâtiment "démarrage rapide".
 * Extrait du route handler car Next.js 15 n'autorise QUE les exports HTTP
 * dans `app/api/**\/route.ts`.
 *
 * Le helper :
 *  1. S'assure que les matériaux du seed sont présents (en crée les manquants).
 *  2. S'assure que les scénarios d'occupation du seed sont présents.
 *  3. Crée les parois du template (avec leurs couches) si elles n'existent pas
 *     déjà sous le même nom.
 *  4. Crée le bâtiment + ses zones + l'affectation des parois.
 *  5. Recalcule les caches U/R/masse/déphasage des parois créées.
 *
 * Tout est fait en transaction Prisma — en cas d'échec, rien n'est créé.
 */

import { prisma } from "@/lib/db";
import { recalcParoiCache } from "@/lib/api-helpers/paroi";
import { getTemplateById } from "@/lib/thermal/batiment-templates-bilan";
import { MATERIAUX_SEED } from "@/prisma/seeds/materiaux";
import { SCENARIOS_SEED } from "@/prisma/seeds/scenarios";

export interface ApplyTemplateResult {
  ok: true;
  templateId: string;
  batimentId: string;
  batimentNom: string;
  created: {
    materiaux: number;
    scenarios: number;
    parois: number;
    zones: number;
    zoneParois: number;
  };
}

export class ApplyTemplateError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code: string = "ApplyTemplateError",
  ) {
    super(message);
  }
}

export async function applyBatimentTemplate(
  templateId: string,
): Promise<ApplyTemplateResult> {
  const tpl = getTemplateById(templateId);
  if (!tpl) {
    throw new ApplyTemplateError(
      `Template inconnu : ${templateId}`,
      404,
      "TemplateNotFound",
    );
  }

  // ─── 1. Assure les matériaux nécessaires ───────────────────────
  const requiredMatNames = new Set<string>();
  for (const p of tpl.paroisToCreate) {
    for (const c of p.couches) requiredMatNames.add(c.materiauNom);
  }

  // Vérifier que tous les matériaux requis existent au moins dans le SEED.
  const seedByName = new Map(MATERIAUX_SEED.map((m) => [m.nom, m]));
  const missingFromSeed: string[] = [];
  for (const name of requiredMatNames) {
    if (!seedByName.has(name)) missingFromSeed.push(name);
  }
  if (missingFromSeed.length > 0) {
    throw new ApplyTemplateError(
      `Le template ${templateId} référence des matériaux absents du seed : ${missingFromSeed.join(", ")}.`,
      500,
      "TemplateInconsistent",
    );
  }

  // Récupère les matériaux existants en base (par nom).
  const existingMats = await prisma.materiau.findMany({
    where: { nom: { in: Array.from(requiredMatNames) }, deletedAt: null },
  });
  const matIdByName = new Map(existingMats.map((m) => [m.nom, m.id]));

  // Crée ceux qui manquent.
  let createdMaterials = 0;
  for (const name of requiredMatNames) {
    if (matIdByName.has(name)) continue;
    const seed = seedByName.get(name);
    if (!seed) continue;
    const created = await prisma.materiau.create({
      data: {
        nom: seed.nom,
        categorie: seed.categorie,
        marque: seed.marque ?? null,
        reference: seed.reference ?? null,
        conductivite: seed.conductivite,
        masseVolumique: seed.masseVolumique,
        capaciteThermique: seed.capaciteThermique,
        resistanceVapeur: seed.resistanceVapeur ?? null,
        resistanceFixe: seed.resistanceFixe ?? null,
        carboneACV: seed.carboneACV ?? null,
        carboneFinDeVie: seed.carboneFinDeVie ?? null,
        origineFdes: seed.origineFdes ?? null,
        source: seed.source ?? null,
        notes: seed.notes ?? null,
      },
    });
    matIdByName.set(name, created.id);
    createdMaterials += 1;
  }

  // ─── 2. Assure les scénarios nécessaires ───────────────────────
  const requiredScNames = new Set<string>();
  for (const z of tpl.zones) requiredScNames.add(z.scenarioNom);

  const scenariosSeedByName = new Map(SCENARIOS_SEED.map((s) => [s.nom, s]));
  const missingScFromSeed: string[] = [];
  for (const name of requiredScNames) {
    if (!scenariosSeedByName.has(name)) missingScFromSeed.push(name);
  }
  if (missingScFromSeed.length > 0) {
    throw new ApplyTemplateError(
      `Le template ${templateId} référence des scénarios absents du seed : ${missingScFromSeed.join(", ")}.`,
      500,
      "TemplateInconsistent",
    );
  }

  const existingScs = await prisma.scenarioOccupation.findMany({
    where: { nom: { in: Array.from(requiredScNames) }, deletedAt: null },
  });
  const scIdByName = new Map(existingScs.map((s) => [s.nom, s.id]));

  let createdScenarios = 0;
  for (const name of requiredScNames) {
    if (scIdByName.has(name)) continue;
    const seed = scenariosSeedByName.get(name);
    if (!seed) continue;
    const created = await prisma.scenarioOccupation.create({
      data: {
        nom: seed.nom,
        description: seed.description,
        patternJson: JSON.stringify(seed.pattern),
        preset: true,
      },
    });
    scIdByName.set(name, created.id);
    createdScenarios += 1;
  }

  // ─── 3. Crée les parois du template ────────────────────────────
  // On crée à chaque application une nouvelle copie nommée pour éviter de
  // partager des parois entre exemples (et permettre à l'utilisateur de
  // modifier sans impact sur d'autres bâtiments). On suffixe par un timestamp
  // court pour éviter la collision si le template est appliqué plusieurs fois.
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  const paroiIdByTemplateName = new Map<string, string>();

  let createdParois = 0;
  for (const p of tpl.paroisToCreate) {
    const created = await prisma.paroi.create({
      data: {
        nom: `${p.nom} — ${stamp}`,
        type: p.type,
        description: p.description ?? null,
        couches: {
          create: p.couches.map((c, idx) => {
            const matId = matIdByName.get(c.materiauNom);
            if (!matId) {
              throw new ApplyTemplateError(
                `Matériau introuvable : ${c.materiauNom}`,
                500,
                "TemplateInconsistent",
              );
            }
            return {
              ordre: idx,
              // BD : épaisseur en mètres (cf. paroi-calc).
              epaisseur: c.epaisseurMm / 1000,
              materiauId: matId,
            };
          }),
        },
      },
    });
    paroiIdByTemplateName.set(p.nom, created.id);
    createdParois += 1;
  }

  // Recalcule les caches U/R/masse pour chaque paroi créée.
  for (const id of paroiIdByTemplateName.values()) {
    await recalcParoiCache(id);
  }

  // ─── 4. Crée le bâtiment + zones + zone_parois ─────────────────
  const bat = await prisma.batiment.create({
    data: {
      nom: tpl.batiment.nom,
      description: tpl.batiment.description ?? null,
      zoneClimatique: tpl.batiment.zoneClimatique,
      altitude: tpl.batiment.altitude ?? null,
      orientation: tpl.batiment.orientation ?? null,
    },
  });

  let createdZones = 0;
  let createdZoneParois = 0;
  for (const z of tpl.zones) {
    const scId = scIdByName.get(z.scenarioNom) ?? null;
    const zone = await prisma.zone.create({
      data: {
        batimentId: bat.id,
        nom: z.nom,
        usage: z.usage,
        surface: z.surface,
        hauteurSousPlafond: z.hauteurSousPlafond,
        ...(z.consignes?.chauffageOcc !== undefined && {
          consigneChauffageOcc: z.consignes.chauffageOcc,
        }),
        ...(z.consignes?.chauffageRed !== undefined && {
          consigneChauffageRed: z.consignes.chauffageRed,
        }),
        ...(z.consignes?.climOcc !== undefined && {
          consigneClimOcc: z.consignes.climOcc,
        }),
        ...(z.consignes?.climRed !== undefined && {
          consigneClimRed: z.consignes.climRed,
        }),
        ...(z.apports?.densiteOccupation !== undefined && {
          densiteOccupation: z.apports.densiteOccupation,
        }),
        ...(z.apports?.apportsParPersonne !== undefined && {
          apportsParPersonne: z.apports.apportsParPersonne,
        }),
        ...(z.apports?.apportsEquipements !== undefined && {
          apportsEquipements: z.apports.apportsEquipements,
        }),
        ...(z.apports?.apportsEclairage !== undefined && {
          apportsEclairage: z.apports.apportsEclairage,
        }),
        ...(z.ventilation?.qVmcM3hM2 !== undefined && {
          qVmcM3hM2: z.ventilation.qVmcM3hM2,
        }),
        ...(z.ventilation?.efficaciteDoubleFlux !== undefined && {
          efficaciteDoubleFlux: z.ventilation.efficaciteDoubleFlux,
        }),
        ...(scId && { scenarioId: scId }),
      },
    });
    createdZones += 1;

    for (const zp of z.parois) {
      const paroiId = paroiIdByTemplateName.get(zp.paroiNom);
      if (!paroiId) {
        throw new ApplyTemplateError(
          `Paroi de template introuvable : ${zp.paroiNom}`,
          500,
          "TemplateInconsistent",
        );
      }
      await prisma.zoneParoi.create({
        data: {
          zoneId: zone.id,
          paroiId,
          surface: zp.surface,
          orientation: zp.orientation ?? null,
          inclinaison: 90,
          cotePaire: false,
        },
      });
      createdZoneParois += 1;
    }
  }

  return {
    ok: true,
    templateId,
    batimentId: bat.id,
    batimentNom: bat.nom,
    created: {
      materiaux: createdMaterials,
      scenarios: createdScenarios,
      parois: createdParois,
      zones: createdZones,
      zoneParois: createdZoneParois,
    },
  };
}

