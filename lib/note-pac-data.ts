/**
 * Constructeur partagé du payload NotePacData — utilisé par les routes API
 * PDF (`note-dimensionnement-pac`) et Word (`note-dimensionnement-pac-word`).
 *
 * Recharge la dernière calibration du projet, refetch la météo ERA5 (cache
 * DB), simule les scénarios PAC, calcule le volume/prime CEE si demandé,
 * et retourne le NotePacData prêt à alimenter les générateurs PDF ou docx.
 */

import { prisma } from "./db";
import {
  fetchMeteoHoraireERA5,
  calculerDegreHeures,
  PROFIL_ECOLE_DEFAULT,
  type ProfilOccupation,
} from "./thermal/meteo-era5";
import {
  dimensionnerPAC,
  MARGES_DEFAUT,
  type MargesDimensionnement,
  type ScenarioPACInput,
  type RegimePAC,
  type TypeAppoint,
} from "./thermal/methodes/pac-dimensionnement";
import {
  ficheParCategorie,
  type CategorieCibleNote,
  type NotePacData,
  type VecteurExistant,
} from "./pdf-note-dimensionnement-pac";

export interface BuildNotePacInput {
  projetId: string;
  calibrationId?: string | null;
  categorie: CategorieCibleNote;
  scenarioRetenu: ScenarioPACInput;
  autresScenarios?: ScenarioPACInput[];
  marges?: MargesDimensionnement;
  site?: {
    generateurExistantMarque: string;
    generateurExistantModele: string;
    generateurExistantNb: number;
    generateurExistantPuissanceKw: number;
    generateurExistantVecteur: VecteurExistant;
    surfaceChauffee: number;
    zoneClimatique: string;
    usage: string;
    fournisseurEnergie: string;
    compteurRef: string;
  };
  cee?: {
    forfaitKwhcParM2: number;
    facteurCorrectifSecteur: number;
    facteurR: number;
    bonificationCoupDePouce: number;
    primeEurMWhc: number;
    dateLimiteEngagement?: string;
    dureeVieAnnees?: number;
  } | null;
  auteur?: string;
}

export type BuildNotePacResult =
  | { ok: true; data: NotePacData }
  | { ok: false; status: number; error: string };

const VERDICT = (
  ecart: number,
): NotePacData["scenariosCalibration"][number]["verdict"] => {
  const abs = Math.abs(ecart);
  if (abs < 5) return "bon";
  if (abs < 10) return "borderline";
  return ecart < 0 ? "sousdim" : "surdim";
};

export async function buildNotePacData(
  input: BuildNotePacInput,
): Promise<BuildNotePacResult> {
  const projet = await prisma.projet.findFirst({
    where: { id: input.projetId, deletedAt: null },
    include: { client: true },
  });
  if (!projet) return { ok: false, status: 404, error: "Projet introuvable" };

  const calibration = input.calibrationId
    ? await prisma.calibration.findFirst({
        where: { id: input.calibrationId, projetId: input.projetId },
      })
    : await prisma.calibration.findFirst({
        where: { projetId: input.projetId },
        orderBy: { createdAt: "desc" },
      });
  if (!calibration) {
    return {
      ok: false,
      status: 422,
      error: "Aucune calibration disponible pour ce projet",
    };
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

  const releves = await prisma.consoRelevee.findMany({
    where: {
      projetId: input.projetId,
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
    return {
      mois: label.charAt(0).toUpperCase() + label.slice(1),
      kwh: Number(r.kwh),
      jours,
    };
  });
  const totalKwhReleve = consosMensuelles.reduce((s, c) => s + c.kwh, 0);

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
    input.scenarioRetenu,
    ...(input.autresScenarios ?? []),
  ];

  const dimensionnement = dimensionnerPAC(
    {
      meteo,
      dhResult,
      puissanceCalee: Number(calibration.pCaleeDh),
      deltaTBase,
      rendementExistant: Number(calibration.rendement),
      marges: input.marges ?? MARGES_DEFAUT,
    },
    scenariosPAC,
  );

  const scenarioResRetenu = dimensionnement.scenarios[0];

  const site = input.site ?? {
    generateurExistantMarque: "—",
    generateurExistantModele: "—",
    generateurExistantNb: 1,
    generateurExistantPuissanceKw: dimensionnement.puissanceRecommandeeMax || 100,
    generateurExistantVecteur: "GAZ_NATUREL" as VecteurExistant,
    surfaceChauffee: 1000,
    zoneClimatique: "H1",
    usage: projet.categorieCible ?? "TERTIAIRE",
    fournisseurEnergie: "—",
    compteurRef: "—",
  };

  let ceeData: NotePacData["cee"] | undefined;
  if (input.cee) {
    const forfaitCorrige = input.cee.forfaitKwhcParM2 * input.cee.facteurCorrectifSecteur;
    const volumeKwhc = forfaitCorrige * site.surfaceChauffee * input.cee.facteurR;
    const volumeBonifi = volumeKwhc * input.cee.bonificationCoupDePouce;
    const primeEuros = (volumeBonifi / 1000) * input.cee.primeEurMWhc;
    const fiche = ficheParCategorie(input.categorie);
    ceeData = {
      ficheCode: fiche.code,
      ficheLibelle: fiche.libelle,
      forfaitKwhcParM2: forfaitCorrige,
      facteurCorrectifSecteur: input.cee.facteurCorrectifSecteur,
      facteurR: input.cee.facteurR,
      bonificationCoupDePouce: input.cee.bonificationCoupDePouce,
      volumeKwhc,
      volumeBonifiKwhc: volumeBonifi,
      primeEurMWhc: input.cee.primeEurMWhc,
      primeEuros,
      dateLimiteEngagement: input.cee.dateLimiteEngagement ?? "31 décembre 2030",
      dureeVieAnnees: input.cee.dureeVieAnnees ?? 22,
    };
  }

  const vecteurReleve = (releves[0]?.vecteur ??
    site.generateurExistantVecteur) as VecteurExistant;

  const data: NotePacData = {
    reference: `KW-PAC-${projet.id.slice(-8).toUpperCase()}`,
    categorieCible: input.categorie,
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
      calibration.pCaleeRegression != null ? Number(calibration.pCaleeRegression) : null,
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
    auteur: input.auteur ?? "Bureau d'étude Kilowater",
    dateEmission: new Date().toISOString(),
  };

  return { ok: true, data };
}
