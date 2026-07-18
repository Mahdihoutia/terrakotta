import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  fetchMeteoHoraireERA5,
  calculerDegreHeures,
  PROFIL_ECOLE_DEFAULT,
  type ProfilOccupation,
} from "@/lib/thermal/meteo-era5";
import {
  dimensionnerPAC,
  type ScenarioPACInput,
  type RegimePAC,
  type TypeAppoint,
  MARGES_DEFAUT,
} from "@/lib/thermal/methodes/pac-dimensionnement";
import {
  generateNoteDimensionnementPacPdf,
  ficheParCategorie,
  type NotePacData,
  type CategorieCibleNote,
  type VecteurExistant,
} from "@/lib/pdf-note-dimensionnement-pac";

const scenarioSchema = z.object({
  nom: z.string().min(1),
  regime: z.enum(["BT", "MT", "HT"]),
  unites: z.array(z.number().positive()).min(1).max(5),
  typeAppoint: z.enum(["GAZ", "ELEC", "AUCUN"]),
  tBivalenceForcee: z.number().nullable().default(null),
  rendementGaz: z.number().positive().max(1.2).default(0.925),
});

const bodySchema = z.object({
  calibrationId: z.string().nullable().optional(),
  categorie: z.enum(["TERTIAIRE", "RESIDENTIEL_COLLECTIF"]).default("TERTIAIRE"),
  scenarioRetenu: scenarioSchema,
  autresScenarios: z.array(scenarioSchema).default([]),
  marges: z
    .object({
      relance: z.number().min(0).max(0.5),
      distribution: z.number().min(0).max(0.3),
    })
    .optional(),
  site: z
    .object({
      generateurExistantMarque: z.string(),
      generateurExistantModele: z.string(),
      generateurExistantNb: z.number().int().min(1).max(10),
      generateurExistantPuissanceKw: z.number().positive(),
      generateurExistantVecteur: z.enum([
        "GAZ_NATUREL",
        "FIOUL",
        "PROPANE",
        "ELEC",
        "BOIS",
        "RESEAU_CHALEUR",
      ]),
      surfaceChauffee: z.number().positive(),
      zoneClimatique: z.string(),
      usage: z.string(),
      fournisseurEnergie: z.string().default("—"),
      compteurRef: z.string().default("—"),
    })
    .optional(),
  cee: z
    .object({
      forfaitKwhcParM2: z.number().nonnegative(),
      facteurCorrectifSecteur: z.number().min(0).max(2).default(0.8),
      facteurR: z.number().min(0).max(1).default(1),
      bonificationCoupDePouce: z.number().default(1),
      primeEurMWhc: z.number().nonnegative().default(6.9),
      dateLimiteEngagement: z.string().default("31 décembre 2030"),
      dureeVieAnnees: z.number().int().default(22),
    })
    .nullable()
    .optional(),
  auteur: z.string().default("Bureau d'étude Kilowater"),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

const VERDICT = (
  ecart: number,
): NotePacData["scenariosCalibration"][number]["verdict"] => {
  const abs = Math.abs(ecart);
  if (abs < 5) return "bon";
  if (abs < 10) return "borderline";
  return ecart < 0 ? "sousdim" : "surdim";
};

export async function POST(req: Request, ctx: Ctx) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const p = parsed.data;

  const projet = await prisma.projet.findFirst({
    where: { id, deletedAt: null },
    include: { client: true },
  });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  const calibration = p.calibrationId
    ? await prisma.calibration.findFirst({ where: { id: p.calibrationId, projetId: id } })
    : await prisma.calibration.findFirst({
        where: { projetId: id },
        orderBy: { createdAt: "desc" },
      });
  if (!calibration) {
    return NextResponse.json(
      { error: "Aucune calibration disponible pour ce projet" },
      { status: 422 },
    );
  }

  const payload = calibration.payloadJson as {
    profil?: ProfilOccupation & { vacances?: Array<{ debut: string; fin: string }> };
    deltaTBase?: number;
    scenarios?: Array<{
      pmax: number;
      eUtileCalc: number;
      eGazCalc: number;
      ecartPct: number;
    }>;
  };
  const profilRaw = payload.profil ?? PROFIL_ECOLE_DEFAULT;
  const profil: ProfilOccupation = {
    tiOccupe: profilRaw.tiOccupe,
    tiPrechauffe: profilRaw.tiPrechauffe,
    tiSoiree: profilRaw.tiSoiree,
    tiNuit: profilRaw.tiNuit,
    tiWeekend: profilRaw.tiWeekend,
    tiVacances: profilRaw.tiVacances,
    hPrechauffe: profilRaw.hPrechauffe,
    hOccupeDebut: profilRaw.hOccupeDebut,
    hOccupeFin: profilRaw.hOccupeFin,
    hSoireeDebut: profilRaw.hSoireeDebut,
    hNuitDebut: profilRaw.hNuitDebut,
    vacances: (profilRaw.vacances ?? []).map((v) => ({
      debut: new Date(v.debut),
      fin: new Date(v.fin),
    })),
  };
  const deltaTBase =
    payload.deltaTBase ?? profil.tiOccupe - Number(calibration.tBase);

  // Relevés utilisés pour le tableau consos
  const releves = await prisma.consoRelevee.findMany({
    where: {
      projetId: id,
      deletedAt: null,
      periodeDebut: { gte: calibration.periodeDebut, lt: calibration.periodeFin },
    },
    orderBy: { periodeDebut: "asc" },
  });

  const consosMensuelles = releves.map((r) => {
    const debut = r.periodeDebut;
    const fin = r.periodeFin;
    const jours = Math.round((fin.getTime() - debut.getTime()) / 86400000);
    const label = debut.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return { mois: label.charAt(0).toUpperCase() + label.slice(1), kwh: Number(r.kwh), jours };
  });
  const totalKwhReleve = consosMensuelles.reduce((s, c) => s + c.kwh, 0);

  try {
    const meteo = await fetchMeteoHoraireERA5(
      Number(calibration.latitude),
      Number(calibration.longitude),
      calibration.periodeDebut,
      calibration.periodeFin,
    );
    const dhResult = calculerDegreHeures(meteo, {
      profil,
      tArret: Number(calibration.tArretChauffage),
    });

    const scenariosPAC: ScenarioPACInput[] = [
      p.scenarioRetenu as ScenarioPACInput,
      ...(p.autresScenarios as ScenarioPACInput[]),
    ];

    const dimensionnement = dimensionnerPAC(
      {
        meteo,
        dhResult,
        puissanceCalee: Number(calibration.pCaleeDh),
        deltaTBase,
        rendementExistant: Number(calibration.rendement),
        marges: p.marges ?? MARGES_DEFAUT,
      },
      scenariosPAC,
    );

    const scenarioResRetenu = dimensionnement.scenarios[0];

    // Site — depuis input ou fallbacks
    const site = p.site ?? {
      generateurExistantMarque: "—",
      generateurExistantModele: "—",
      generateurExistantNb: 1,
      generateurExistantPuissanceKw:
        dimensionnement.puissanceRecommandeeMax || 100,
      generateurExistantVecteur: "GAZ_NATUREL" as const,
      surfaceChauffee: 1000,
      zoneClimatique: "H1",
      usage: projet.categorieCible ?? "TERTIAIRE",
      fournisseurEnergie: "—",
      compteurRef: "—",
    };

    // CEE — calcul volume/prime si config passée
    let ceeData: NotePacData["cee"] | undefined;
    if (p.cee) {
      const forfaitCorrige = p.cee.forfaitKwhcParM2 * p.cee.facteurCorrectifSecteur;
      const volumeKwhc = forfaitCorrige * site.surfaceChauffee * p.cee.facteurR;
      const volumeBonifi = volumeKwhc * p.cee.bonificationCoupDePouce;
      const primeEuros = (volumeBonifi / 1000) * p.cee.primeEurMWhc;
      const fiche = ficheParCategorie(p.categorie);
      ceeData = {
        ficheCode: fiche.code,
        ficheLibelle: fiche.libelle,
        forfaitKwhcParM2: forfaitCorrige,
        facteurCorrectifSecteur: p.cee.facteurCorrectifSecteur,
        facteurR: p.cee.facteurR,
        bonificationCoupDePouce: p.cee.bonificationCoupDePouce,
        volumeKwhc,
        volumeBonifiKwhc: volumeBonifi,
        primeEurMWhc: p.cee.primeEurMWhc,
        primeEuros,
        dateLimiteEngagement: p.cee.dateLimiteEngagement,
        dureeVieAnnees: p.cee.dureeVieAnnees,
      };
    }

    // Vecteur des relevés (depuis premier relevé si dispo)
    const vecteurReleve = (releves[0]?.vecteur ?? site.generateurExistantVecteur) as VecteurExistant;

    // Construction payload PDF
    const noteData: NotePacData = {
      reference: `KW-PAC-${projet.id.slice(-8).toUpperCase()}`,
      categorieCible: p.categorie as CategorieCibleNote,
      siteNom: projet.titre,
      adresse: projet.adresseChantier ?? "—",
      ville: projet.client?.ville ?? "—",
      codePostal: projet.client?.codePostal ?? "—",
      usage: site.usage,
      clientTitulaire:
        [projet.client?.nom, projet.client?.prenom].filter(Boolean).join(" ") || "—",
      surfaceChauffee: site.surfaceChauffee,
      zoneClimatique: site.zoneClimatique,
      tBase: Number(calibration.tBase),
      generateurExistantMarque: site.generateurExistantMarque,
      generateurExistantModele: site.generateurExistantModele,
      generateurExistantNb: site.generateurExistantNb,
      generateurExistantPuissanceKw: site.generateurExistantPuissanceKw,
      generateurExistantVecteur: site.generateurExistantVecteur,
      rendementExistant: Number(calibration.rendement),
      fournisseurEnergie: site.fournisseurEnergie,
      compteurRef: site.compteurRef,
      periodeDebut: calibration.periodeDebut.toISOString(),
      periodeFin: calibration.periodeFin.toISOString(),
      latitude: Number(calibration.latitude),
      longitude: Number(calibration.longitude),
      sommeDh: Number(calibration.sommeDh),
      nbHeuresMeteo: meteo.tExt.length,
      consosMensuelles,
      totalKwhReleve,
      vecteurReleve,
      tiOccupe: profil.tiOccupe,
      tiReduit: profil.tiNuit,
      tArret: Number(calibration.tArretChauffage),
      deltaTBase,
      scenariosCalibration: (payload.scenarios ?? [])
        .filter((s) => s.pmax >= dimensionnement.puissanceCalee * 0.5)
        .slice(0, 12)
        .map((s) => ({
          pmax: s.pmax,
          eUtile: s.eUtileCalc,
          eCombust: s.eGazCalc,
          ecartPct: s.ecartPct,
          verdict: VERDICT(s.ecartPct),
        })),
      pCaleeDh: Number(calibration.pCaleeDh),
      pCaleeRegression:
        calibration.pCaleeRegression != null
          ? Number(calibration.pCaleeRegression)
          : null,
      ecartMethodes:
        calibration.ecartMethodes != null ? Number(calibration.ecartMethodes) : null,
      r2: calibration.r2 != null ? Number(calibration.r2) : null,
      rmse: calibration.rmse != null ? Number(calibration.rmse) : null,
      cvRmse: calibration.cvRmse != null ? Number(calibration.cvRmse) : null,
      nmbe: calibration.nmbe != null ? Number(calibration.nmbe) : null,
      conformeAshrae: calibration.conformeAshrae,
      puissanceRecoMin: dimensionnement.puissanceRecommandeeMin,
      puissanceRecoMax: dimensionnement.puissanceRecommandeeMax,
      fourchetteCommerciale: dimensionnement.fourchetteCommerciale,
      margeRelance: dimensionnement.marges.relance,
      margeDistribution: dimensionnement.marges.distribution,
      scenarioRetenu: {
        nom: scenarioResRetenu.scenario.nom,
        regime: scenarioResRetenu.scenario.regime as RegimePAC,
        unites: scenarioResRetenu.scenario.unites,
        typeAppoint: scenarioResRetenu.scenario.typeAppoint as TypeAppoint,
        puissanceInstallee: scenarioResRetenu.puissanceInstallee,
        temperatureBivalence: scenarioResRetenu.temperatureBivalence,
        tauxCouverturePAC: scenarioResRetenu.tauxCouverturePAC,
        scop: scenarioResRetenu.scop,
        consoElecPAC: scenarioResRetenu.consoElecPAC,
        consoAppointGaz: scenarioResRetenu.consoAppointGaz,
        consoAppointElec: scenarioResRetenu.consoAppointElec,
        emissionsCO2AvantKg: scenarioResRetenu.emissionsCO2AvantKg,
        emissionsCO2ApresKg: scenarioResRetenu.emissionsCO2ApresKg,
        reductionCO2Pct: scenarioResRetenu.reductionCO2Pct,
      },
      cee: ceeData,
      auteur: p.auteur,
      dateEmission: new Date().toISOString(),
    };

    const pdfBytes = generateNoteDimensionnementPacPdf(noteData);
    const filename = `note-dimensionnement-pac-${noteData.reference}.pdf`;
    return new Response(pdfBytes as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur génération PDF";
    console.error("[/api/projets/:id/note-dimensionnement-pac POST] error:", err);
    return NextResponse.json({ error: "PdfError", message }, { status: 500 });
  }
}
