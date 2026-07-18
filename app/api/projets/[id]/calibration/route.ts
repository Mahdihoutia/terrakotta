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
import { calibrer, type ReleveMensuel } from "@/lib/thermal/calibration";

const runSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  periodeDebut: z.string(),
  periodeFin: z.string(),
  /** Vecteur des relevés à utiliser (GAZ_NATUREL par défaut). */
  vecteur: z
    .enum(["ELEC", "GAZ_NATUREL", "FIOUL", "BOIS", "PROPANE", "RESEAU_CHALEUR"])
    .default("GAZ_NATUREL"),
  rendement: z.number().positive().max(1.2).default(0.925),
  tArret: z.number().default(14.5),
  tBase: z.number().default(-7),
  profil: z
    .object({
      tiOccupe: z.number(),
      tiPrechauffe: z.number(),
      tiSoiree: z.number(),
      tiNuit: z.number(),
      tiWeekend: z.number(),
      tiVacances: z.number(),
      hPrechauffe: z.number().int().min(0).max(23),
      hOccupeDebut: z.number().int().min(0).max(23),
      hOccupeFin: z.number().int().min(0).max(23),
      hSoireeDebut: z.number().int().min(0).max(23),
      hNuitDebut: z.number().int().min(0).max(23),
      vacances: z
        .array(z.object({ debut: z.string(), fin: z.string() }))
        .default([]),
    })
    .optional(),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

interface ReleveDbShape {
  id: string;
  vecteur: string;
  periodeDebut: Date;
  periodeFin: Date;
  kwh: { toString(): string };
}

/** Agrège relevés en points mensuels YYYY-MM (répartition prorata jours si chevauchement mensuel). */
function agregerParMois(releves: ReleveDbShape[]): ReleveMensuel[] {
  const buckets = new Map<string, number>();
  for (const r of releves) {
    const kwh = Number(r.kwh);
    const start = new Date(r.periodeDebut);
    const end = new Date(r.periodeFin);
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) continue;

    // Répartit prorata au ms sur chaque mois traversé
    let cursor = new Date(start);
    while (cursor < end) {
      const y = cursor.getUTCFullYear();
      const m = cursor.getUTCMonth();
      const nextMonth = new Date(Date.UTC(y, m + 1, 1));
      const sliceEnd = nextMonth < end ? nextMonth : end;
      const slicedMs = sliceEnd.getTime() - cursor.getTime();
      const share = (slicedMs / totalMs) * kwh;
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + share);
      cursor = nextMonth;
    }
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, kwh]) => ({ mois, kwh }));
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
    select: { id: true, titre: true },
  });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  const periodeDebut = new Date(p.periodeDebut);
  const periodeFin = new Date(p.periodeFin);
  if (!(periodeDebut < periodeFin)) {
    return NextResponse.json({ error: "Période invalide" }, { status: 422 });
  }

  const releves = await prisma.consoRelevee.findMany({
    where: {
      projetId: id,
      vecteur: p.vecteur,
      deletedAt: null,
      periodeDebut: { gte: periodeDebut, lt: periodeFin },
    },
    orderBy: { periodeDebut: "asc" },
  });
  if (releves.length === 0) {
    return NextResponse.json(
      { error: "Aucun relevé sur la période et vecteur demandés" },
      { status: 422 },
    );
  }

  const profil: ProfilOccupation = p.profil
    ? {
        ...p.profil,
        vacances: p.profil.vacances.map((v) => ({
          debut: new Date(v.debut),
          fin: new Date(v.fin),
        })),
      }
    : PROFIL_ECOLE_DEFAULT;

  try {
    const meteo = await fetchMeteoHoraireERA5(
      p.latitude,
      p.longitude,
      periodeDebut,
      periodeFin,
    );
    const dhResult = calculerDegreHeures(meteo, { profil, tArret: p.tArret });

    const relevesMensuels = agregerParMois(releves);
    const deltaTBase = profil.tiOccupe - p.tBase;

    const resultat = calibrer({
      meteo,
      dhResult,
      releves: relevesMensuels,
      rendement: p.rendement,
      deltaTBase,
    });

    const saved = await prisma.calibration.create({
      data: {
        projetId: id,
        periodeDebut,
        periodeFin,
        latitude: p.latitude,
        longitude: p.longitude,
        rendement: p.rendement,
        tArretChauffage: p.tArret,
        tBase: p.tBase,
        sommeDh: dhResult.sommeDh,
        energieRelevee: resultat.energieRelevee,
        pCaleeDh: resultat.meilleur.pmax,
        pCaleeRegression: resultat.regression.pCaleeKw || null,
        ecartMethodes: resultat.ecartMethodes || null,
        r2: resultat.regression.r2 || null,
        rmse: resultat.regression.rmse || null,
        cvRmse: resultat.regression.cvRmse || null,
        nmbe: resultat.regression.nmbe || null,
        conformeAshrae: resultat.conformeAshrae,
        payloadJson: JSON.parse(
          JSON.stringify({
            profil: {
              ...profil,
              vacances: profil.vacances.map((v) => ({
                debut: v.debut.toISOString(),
                fin: v.fin.toISOString(),
              })),
            },
            deltaTBase,
            meteoSource: meteo.source,
            heuresActives: dhResult.heuresActives,
            mensuel: dhResult.mensuel,
            scenarios: resultat.scenarios.slice(0, 100),
            meilleur: resultat.meilleur,
            regression: {
              pente: resultat.regression.pente,
              intercept: resultat.regression.intercept,
              r2: resultat.regression.r2,
              rmse: resultat.regression.rmse,
              cvRmse: resultat.regression.cvRmse,
              nmbe: resultat.regression.nmbe,
              points: resultat.regression.points,
              pCaleeKw: resultat.regression.pCaleeKw,
            },
            relevesMensuels,
            nbReleves: releves.length,
          }),
        ),
      },
    });

    return NextResponse.json(
      {
        id: saved.id,
        energieRelevee: resultat.energieRelevee,
        sommeDh: dhResult.sommeDh,
        heuresActives: dhResult.heuresActives,
        pCaleeDh: resultat.meilleur.pmax,
        pCaleeRegression: resultat.regression.pCaleeKw,
        ecartMethodes: resultat.ecartMethodes,
        r2: resultat.regression.r2,
        rmse: resultat.regression.rmse,
        cvRmse: resultat.regression.cvRmse,
        nmbe: resultat.regression.nmbe,
        conformeAshrae: resultat.conformeAshrae,
        meilleur: resultat.meilleur,
        scenarios: resultat.scenarios,
        regressionPoints: resultat.regression.points,
        mensuel: dhResult.mensuel,
        meteoSource: meteo.source,
        deltaTBase,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur calibration";
    console.error("[/api/projets/:id/calibration POST] error:", err);
    return NextResponse.json({ error: "CalibrationError", message }, { status: 500 });
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const list = await prisma.calibration.findMany({
    where: { projetId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(
    list.map((c) => ({
      id: c.id,
      periodeDebut: c.periodeDebut.toISOString(),
      periodeFin: c.periodeFin.toISOString(),
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
      rendement: Number(c.rendement),
      tArretChauffage: Number(c.tArretChauffage),
      tBase: Number(c.tBase),
      sommeDh: Number(c.sommeDh),
      energieRelevee: Number(c.energieRelevee),
      pCaleeDh: Number(c.pCaleeDh),
      pCaleeRegression: c.pCaleeRegression != null ? Number(c.pCaleeRegression) : null,
      ecartMethodes: c.ecartMethodes != null ? Number(c.ecartMethodes) : null,
      r2: c.r2 != null ? Number(c.r2) : null,
      rmse: c.rmse != null ? Number(c.rmse) : null,
      cvRmse: c.cvRmse != null ? Number(c.cvRmse) : null,
      nmbe: c.nmbe != null ? Number(c.nmbe) : null,
      conformeAshrae: c.conformeAshrae,
      createdAt: c.createdAt.toISOString(),
    })),
  );
}
