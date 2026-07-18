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

const scenarioSchema = z.object({
  nom: z.string().min(1),
  regime: z.enum(["BT", "MT", "HT"]) as z.ZodType<RegimePAC>,
  unites: z.array(z.number().positive()).min(1).max(5),
  typeAppoint: z.enum(["GAZ", "ELEC", "AUCUN"]) as z.ZodType<TypeAppoint>,
  tBivalenceForcee: z.number().nullable().default(null),
  rendementGaz: z.number().positive().max(1.2).default(0.925),
});

const runSchema = z.object({
  /** Si absent : prend la dernière calibration du projet. */
  calibrationId: z.string().nullable().optional(),
  scenarios: z.array(scenarioSchema).min(1).max(6),
  marges: z
    .object({
      relance: z.number().min(0).max(0.5),
      distribution: z.number().min(0).max(0.3),
    })
    .optional(),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

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
  const parsed = runSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const p = parsed.data;

  const projet = await prisma.projet.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
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
      { error: "Aucune calibration disponible — lance d'abord une calibration ERA5" },
      { status: 422 },
    );
  }

  const payload = calibration.payloadJson as {
    profil?: ProfilOccupation & {
      vacances?: Array<{ debut: string; fin: string }>;
    };
    deltaTBase?: number;
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
  const deltaTBase = payload.deltaTBase ?? profil.tiOccupe - Number(calibration.tBase);

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

    const scenarios: ScenarioPACInput[] = p.scenarios;

    const resultat = dimensionnerPAC(
      {
        meteo,
        dhResult,
        puissanceCalee: Number(calibration.pCaleeDh),
        deltaTBase,
        rendementExistant: Number(calibration.rendement),
        marges: p.marges ?? MARGES_DEFAUT,
      },
      scenarios,
    );

    return NextResponse.json({
      calibrationId: calibration.id,
      periodeDebut: calibration.periodeDebut.toISOString(),
      periodeFin: calibration.periodeFin.toISOString(),
      puissanceCalee: resultat.puissanceCalee,
      puissanceRecommandeeMin: resultat.puissanceRecommandeeMin,
      puissanceRecommandeeMax: resultat.puissanceRecommandeeMax,
      fourchetteCommerciale: resultat.fourchetteCommerciale,
      marges: resultat.marges,
      consoGazAvantPeriode: resultat.consoGazAvantPeriode,
      emissionsAvantPeriode: resultat.emissionsAvantPeriode,
      scenarios: resultat.scenarios.map((s) => ({
        nom: s.scenario.nom,
        regime: s.scenario.regime,
        unites: s.scenario.unites,
        typeAppoint: s.scenario.typeAppoint,
        tBivalenceForcee: s.scenario.tBivalenceForcee,
        puissanceInstallee: s.puissanceInstallee,
        energieBesoin: s.energieBesoin,
        energiePAC: s.energiePAC,
        energieAppoint: s.energieAppoint,
        tauxCouverturePAC: s.tauxCouverturePAC,
        scop: s.scop,
        consoElecPAC: s.consoElecPAC,
        consoAppointGaz: s.consoAppointGaz,
        consoAppointElec: s.consoAppointElec,
        temperatureBivalence: s.temperatureBivalence,
        emissionsCO2AvantKg: s.emissionsCO2AvantKg,
        emissionsCO2ApresKg: s.emissionsCO2ApresKg,
        reductionCO2Pct: s.reductionCO2Pct,
        histoTemperature: s.histoTemperature,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur dimensionnement PAC";
    console.error("[/api/projets/:id/dimensionnement-pac POST] error:", err);
    return NextResponse.json({ error: "PacError", message }, { status: 500 });
  }
}
