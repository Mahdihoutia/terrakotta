import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  calculerDeperditions,
  calculerBesoinsChauffage,
  calculerDpe,
  calculerApportsSolaires,
  estimerPontsForfaitaire,
  parseZone,
  getZoneData,
  type Vecteur,
} from "@/lib/thermal";
import type { Orientation } from "@/lib/thermal";
import {
  generateRapportProjetPdf,
  type RapportProjetData,
} from "@/lib/pdf-rapport-projet";
import { snapshotCalcul, MOTEUR_THERMIQUE_VERSION } from "@/lib/calcul-snapshot";

const VECTEUR_MAP: Record<string, Vecteur> = {
  ELEC: "elec",
  GAZ_NATUREL: "gaz_naturel",
  FIOUL: "fioul",
  BOIS: "bois",
  PROPANE: "propane",
  RESEAU_CHALEUR: "reseau_chaleur",
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

type ParoiCat = "MUR_EXT" | "TOITURE" | "PLANCHER_BAS" | "VITRAGE" | "PORTE";

export async function GET(_req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;

  const projet = await prisma.projet.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      titre: true,
      description: true,
      typeTravaux: true,
      adresseChantier: true,
      createdAt: true,
      consoFactureChauffage: true,
      client: { select: { nom: true, prenom: true } },
    },
  });
  if (!projet) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const [batiments, systemes] = await Promise.all([
    prisma.batiment.findMany({
      where: { projetId: id, deletedAt: null },
      select: {
        id: true,
        nom: true,
        zoneClimatique: true,
        zones: {
          select: {
            id: true,
            surface: true,
            hauteurSousPlafond: true,
            consigneChauffageOcc: true,
            qVmcM3hM2: true,
            efficaciteDoubleFlux: true,
            parois: {
              select: {
                surface: true,
                orientation: true,
                paroi: { select: { nom: true, type: true, uCache: true } },
              },
            },
          },
        },
      },
    }),
    prisma.systeme.findMany({
      where: { projetId: id, deletedAt: null },
      select: { type: true, vecteur: true, nom: true, rendement: true, partCouverture: true, cop: true },
    }),
  ]);

  // Aggrégation parois projet (somme sur tous bâtiments)
  const buckets = {
    MUR_EXT: { s: 0, ua: 0 },
    TOITURE: { s: 0, ua: 0 },
    PLANCHER_BAS: { s: 0, ua: 0 },
    VITRAGE: { s: 0, ua: 0 },
    PORTE: { s: 0, ua: 0 },
  };
  // Surface vitrée par orientation (pour apports solaires)
  const vitresParOrient: Record<Orientation, number> = {
    S: 0, SE: 0, SO: 0, E: 0, O: 0, NE: 0, NO: 0, N: 0,
  };
  function normalizeOrient(raw: string | null | undefined): Orientation | null {
    if (!raw) return null;
    const o = raw.toUpperCase().replace(/[ÉÈ]/g, "E").trim();
    const map: Record<string, Orientation> = {
      "S": "S", "SUD": "S",
      "SE": "SE", "SUD-EST": "SE", "SUD EST": "SE",
      "SO": "SO", "SW": "SO", "SUD-OUEST": "SO", "SUD OUEST": "SO",
      "E": "E", "EST": "E",
      "O": "O", "W": "O", "OUEST": "O",
      "NE": "NE", "NORD-EST": "NE", "NORD EST": "NE",
      "NO": "NO", "NW": "NO", "NORD-OUEST": "NO", "NORD OUEST": "NO",
      "N": "N", "NORD": "N",
    };
    return map[o] ?? null;
  }
  let surfaceTotale = 0;
  let volumeTotale = 0;
  let qVmcGlobal = 0;
  let effDFGlobal = 0;
  let consigneGlobale = 0;
  let nbZones = 0;
  let nbParois = 0;
  let zoneClimat = "H1a — Nord";

  for (const b of batiments) {
    if (b.zoneClimatique) zoneClimat = b.zoneClimatique;
    for (const z of b.zones) {
      const sZ = Number(z.surface);
      const hZ = Number(z.hauteurSousPlafond);
      surfaceTotale += sZ;
      volumeTotale += sZ * hZ;
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
        // Surface vitrée par orientation pour apports solaires
        if (t === "VITRAGE") {
          const o = normalizeOrient(zp.orientation);
          if (o) vitresParOrient[o] += s;
        }
      }
    }
  }

  const wU = (b: { s: number; ua: number }) => (b.s > 0 ? b.ua / b.s : 0);
  const surfaceMurs = buckets.MUR_EXT.s + buckets.PORTE.s;
  const uMurs = (buckets.MUR_EXT.s + buckets.PORTE.s) > 0
    ? (buckets.MUR_EXT.ua + buckets.PORTE.ua) / (buckets.MUR_EXT.s + buckets.PORTE.s)
    : 0;

  const surfaceToiture = buckets.TOITURE.s;
  const uToiture = wU(buckets.TOITURE);
  const surfacePlancher = buckets.PLANCHER_BAS.s;
  const uPlancher = wU(buckets.PLANCHER_BAS);
  const surfaceVitree = buckets.VITRAGE.s;
  const uVitree = wU(buckets.VITRAGE);

  const renouvellementAir = volumeTotale > 0 ? qVmcGlobal / volumeTotale : 0.5;
  const efficaciteDoubleFlux = nbZones > 0 ? effDFGlobal / nbZones : 0;
  const consigneInt = nbZones > 0 ? consigneGlobale / nbZones : 19;

  const zd = getZoneData(zoneClimat);
  const tBase = zd?.tBase ?? -7;
  const deltaT = consigneInt - tBase;

  const hPT = 0.05 * (surfaceMurs + surfaceToiture + surfacePlancher);
  const dep = calculerDeperditions({
    surfaceMurs, surfaceToiture, surfacePlancher, surfaceVitree,
    uMurs, uToiture, uPlancher, uVitree,
    hPontsThermiques: hPT,
    volumeChauffe: volumeTotale,
    renouvellementAir, efficaciteDoubleFlux, deltaT,
  });

  let besoinChauffage = 0;
  if (surfaceTotale > 0 && (surfaceMurs + surfaceToiture + surfacePlancher + surfaceVitree) > 0) {
    const b = calculerBesoinsChauffage({
      zone: zoneClimat,
      surfaceHabitable: surfaceTotale,
      volumeChauffe: volumeTotale,
      ubat: dep.ubatMoyen,
      surfaceDeperditiveTotale: dep.surfaceDeperditiveTotale,
      renouvellementAir,
      apportsSolairesGratuits: 0,
      apportsInternes: 5 * surfaceTotale,
      rendementInstallation: 0.85,
    });
    besoinChauffage = b.besoinNet;
  }

  // DPE
  const sysChauf = systemes.filter((s) => s.type === "CHAUFFAGE");
  const sysECS = systemes.filter((s) => s.type === "ECS");
  const sysClim = systemes.filter((s) => s.type === "CLIMATISATION");

  function moy(arr: typeof systemes): { eff: number; vecteur: Vecteur } {
    if (arr.length === 0) return { eff: 0.85, vecteur: "gaz_naturel" };
    let p = 0, pe = 0, dom: Vecteur = VECTEUR_MAP[arr[0].vecteur] ?? "gaz_naturel", domP = 0;
    for (const s of arr) {
      const part = Number(s.partCouverture);
      const e = s.cop != null ? Number(s.cop) : Number(s.rendement);
      p += part; pe += part * e;
      if (part > domP) { domP = part; dom = VECTEUR_MAP[s.vecteur] ?? dom; }
    }
    return { eff: p > 0 ? pe / p : 0.85, vecteur: dom };
  }

  const cha = moy(sysChauf);
  const ecs = moy(sysECS);
  const chauffage_kwh = cha.eff > 0 ? besoinChauffage / cha.eff : 0;
  const ecs_kwh = ecs.eff > 0 ? (surfaceTotale * 17.78) / ecs.eff : 0;
  const aux_kwh = surfaceTotale * 5;
  const ecl_kwh = surfaceTotale * 1.4;
  const refr_kwh = sysClim.length > 0 ? surfaceTotale * 12 : 0;

  const dpe = surfaceTotale > 0 && sysChauf.length > 0
    ? calculerDpe(
        {
          chauffage_kwh, chauffage_vecteur: cha.vecteur,
          ecs_kwh, ecs_vecteur: ecs.vecteur,
          refroidissement_kwh: refr_kwh, eclairage_kwh: ecl_kwh, auxiliaires_kwh: aux_kwh,
        },
        surfaceTotale,
      )
    : null;

  // Apports solaires (méthode F·g·H_g) — facteur g et ombre forfaitaires
  const zoneCourt = parseZone(zoneClimat);
  const surfaceVitreeTotale = surfaceVitree;
  const apportsRes = surfaceVitreeTotale > 0
    ? calculerApportsSolaires({
        surfacesParOrientation: vitresParOrient,
        facteurSolaireG: 0.5, // double vitrage standard
        facteurOmbre: 0.85,    // protection légère
        zone: zoneCourt,
      })
    : null;

  // Ponts thermiques — estimation forfaitaire si pas de saisie détaillée
  // Heuristique : si une paroi MUR_EXT a U < 0.4, on suppose ITE ; sinon Aucune
  const isolation = uMurs > 0 && uMurs < 0.4 ? "ITE" : uMurs < 0.8 ? "ITI" : "Aucune";
  const hParoisOpaques = surfaceMurs * uMurs + surfaceToiture * uToiture + surfacePlancher * uPlancher;
  const hPontsForfait = estimerPontsForfaitaire(hParoisOpaques, isolation);

  const reference = `KW-${projet.id.slice(-6).toUpperCase()}-${new Date().toISOString().slice(0, 10)}`;

  const data: RapportProjetData = {
    projet: {
      id: projet.id,
      titre: projet.titre,
      reference,
      description: projet.description,
      typeTravaux: projet.typeTravaux,
      adresseChantier: projet.adresseChantier,
      dateAudit: new Date().toISOString(),
      client: { nom: projet.client.nom, prenom: projet.client.prenom },
    },
    surface: surfaceTotale,
    volume: volumeTotale,
    dpe: dpe
      ? {
          cep: dpe.cep_kwh_m2,
          ges: dpe.ges_kg_m2,
          classe_dpe: dpe.classe_dpe,
          classe_ges: dpe.classe_ges,
          classe_finale: dpe.classe_finale,
          detail: dpe.detail,
        }
      : undefined,
    bilan: {
      gv: dep.hTotal,
      ubat: dep.ubatMoyen,
      pertesTBase: dep.pertesT_base,
      besoinChauffage,
      pctMurs: dep.pctMurs,
      pctToiture: dep.pctToiture,
      pctPlancher: dep.pctPlancher,
      pctVitree: dep.pctVitree,
      pctPontsThermiques: dep.pctPontsThermiques,
      pctVentilation: dep.pctVentilation,
      pctInfiltrations: dep.pctInfiltrations,
      surfaceMurs, surfaceToiture, surfacePlancher, surfaceVitree,
      uMurs, uToiture, uPlancher, uVitree,
    },
    batiments: batiments.map((b) => ({
      nom: b.nom,
      zoneClimatique: b.zoneClimatique,
      surface: b.zones.reduce((s, z) => s + Number(z.surface), 0),
      nbZones: b.zones.length,
      nbParois: b.zones.reduce((s, z) => s + z.parois.length, 0),
    })),
    systemes: systemes.map((s) => ({
      type: s.type,
      vecteur: s.vecteur,
      nom: s.nom,
      rendement: s.cop != null ? Number(s.cop) : Number(s.rendement),
      partCouverture: Number(s.partCouverture),
    })),
    apportsSolaires: apportsRes
      ? {
          apportAnnuel: apportsRes.apportAnnuel,
          apportSaisonChauffe: apportsRes.apportSaisonChauffe,
          apportSaisonChaude: apportsRes.apportSaisonChaude,
          detailParOrientation: Object.entries(apportsRes.detailParOrientation)
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([orientation, apport]) => ({ orientation, apport })),
          risqueSurchauffe: apportsRes.risqueSurchauffe,
          surfaceVitreeTotale,
        }
      : undefined,
    pontsThermiques: {
      isolation,
      hTotal: hPontsForfait,
      methode: "FORFAIT",
    },
    calibration: projet.consoFactureChauffage && chauffage_kwh > 0
      ? (() => {
          const consoFacture = Number(projet.consoFactureChauffage);
          const factor = consoFacture / chauffage_kwh;
          if (factor < 0.5 || factor > 2.0) return undefined;
          return { factor, consoFacture, consoCalculee: chauffage_kwh };
        })()
      : undefined,
  };

  try {
    const pdfBytes = generateRapportProjetPdf(data);

    // Snapshot immuable du calcul global (audit trail / rejouabilité)
    await snapshotCalcul({
      projetId: id,
      type: "BILAN_GLOBAL",
      inputs: {
        zoneClimatique: zoneClimat,
        surfaceTotale, volumeTotale,
        renouvellementAir, efficaciteDoubleFlux, consigneInt, deltaT,
        parois: { surfaceMurs, surfaceToiture, surfacePlancher, surfaceVitree, uMurs, uToiture, uPlancher, uVitree, hPT },
        systemes: systemes.map((s) => ({
          type: s.type, vecteur: s.vecteur, nom: s.nom,
          rendement: Number(s.rendement), partCouverture: Number(s.partCouverture),
          cop: s.cop != null ? Number(s.cop) : null,
        })),
      },
      outputs: {
        deperditions: dep,
        besoinChauffageNet: besoinChauffage,
        dpe,
        reference,
      },
      moteurVersion: MOTEUR_THERMIQUE_VERSION,
      notes: `Rapport PDF généré (${reference})`,
    }).catch((err) => {
      // Snapshot ne doit pas bloquer la génération PDF — log seulement
      console.error("[rapport-pdf] snapshot failed:", err);
    });

    return new Response(pdfBytes as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-audit-${reference}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[rapport-pdf] generation error", err);
    return NextResponse.json(
      { error: "ServerError", message: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
