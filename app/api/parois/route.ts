import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  createParoiSchema,
  PAROI_TYPES,
  RSI_RSE_DEFAULTS,
} from "@/lib/validations/paroi";
import { calculerParoi, type CoucheCalc } from "@/lib/thermal/paroi-calc";

interface CoucheRow {
  id: string;
  ordre: number;
  epaisseur: unknown;
  materiauId: string;
  materiau: {
    id: string;
    nom: string;
    categorie: string;
    conductivite: unknown;
    masseVolumique: unknown;
    capaciteThermique: unknown;
    resistanceFixe: unknown;
    carboneACV: unknown;
  };
}

interface ParoiRow {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  uCache: unknown;
  rCache: unknown;
  masseSurfaciqueCache: unknown;
  dephasageCache: unknown;
  carboneCache: unknown;
  rsi: unknown;
  rse: unknown;
  createdAt: Date;
  updatedAt: Date;
  couches?: CoucheRow[];
}

function n(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export function serializeParoi(p: ParoiRow) {
  return {
    id: p.id,
    nom: p.nom,
    type: p.type,
    description: p.description,
    uCache: n(p.uCache),
    rCache: n(p.rCache),
    masseSurfaciqueCache: n(p.masseSurfaciqueCache),
    dephasageCache: n(p.dephasageCache),
    carboneCache: n(p.carboneCache),
    rsi: n(p.rsi) ?? 0.13,
    rse: n(p.rse) ?? 0.04,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    couches: p.couches?.map((c) => ({
      id: c.id,
      ordre: c.ordre,
      epaisseur: n(c.epaisseur) ?? 0,
      materiauId: c.materiauId,
      materiau: {
        id: c.materiau.id,
        nom: c.materiau.nom,
        categorie: c.materiau.categorie,
        conductivite: n(c.materiau.conductivite) ?? 0,
        masseVolumique: n(c.materiau.masseVolumique) ?? 0,
        capaciteThermique: n(c.materiau.capaciteThermique) ?? 0,
        resistanceFixe: n(c.materiau.resistanceFixe),
        carboneACV: n(c.materiau.carboneACV),
      },
    })),
  };
}

/** Recalcule les indicateurs cache d'une paroi à partir de ses couches. */
export async function recalcParoiCache(paroiId: string): Promise<void> {
  const paroi = await prisma.paroi.findUnique({
    where: { id: paroiId },
    include: {
      couches: {
        orderBy: { ordre: "asc" },
        include: { materiau: true },
      },
    },
  });
  if (!paroi) return;

  const couchesCalc: CoucheCalc[] = paroi.couches.map((c) => ({
    materiauId: c.materiauId,
    nom: c.materiau.nom,
    categorie: c.materiau.categorie,
    epaisseur: Number(c.epaisseur),
    conductivite: Number(c.materiau.conductivite),
    masseVolumique: Number(c.materiau.masseVolumique),
    capaciteThermique: Number(c.materiau.capaciteThermique),
    resistanceFixe:
      c.materiau.resistanceFixe != null
        ? Number(c.materiau.resistanceFixe)
        : null,
    carboneACV:
      c.materiau.carboneACV != null ? Number(c.materiau.carboneACV) : null,
  }));

  const m = calculerParoi(
    couchesCalc,
    Number(paroi.rsi),
    Number(paroi.rse),
  );

  await prisma.paroi.update({
    where: { id: paroiId },
    data: {
      uCache: m.uValue,
      rCache: m.rTotal,
      masseSurfaciqueCache: m.masseSurfacique,
      dephasageCache: m.dephasage,
      carboneCache: m.carboneACVm2,
    },
  });
}

/** GET /api/parois — Liste filtrable par type. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { deletedAt: null };
  if (type && type !== "TOUTES" && (PAROI_TYPES as readonly string[]).includes(type)) {
    where.type = type;
  }

  try {
    const list = await prisma.paroi.findMany({
      where,
      orderBy: [{ type: "asc" }, { nom: "asc" }],
      include: {
        couches: {
          orderBy: { ordre: "asc" },
          include: { materiau: true },
        },
      },
    });
    return NextResponse.json(list.map(serializeParoi));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const isMissingTable =
      message.includes("parois") ||
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("P2021");
    if (isMissingTable) {
      return NextResponse.json(
        {
          error: "MigrationPending",
          message:
            "La table parois n'existe pas encore. Exécute la migration SQL (prisma/migrations/_manual/2026_04_28_add_bibliotheque_materiaux.sql).",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "ServerError", message },
      { status: 500 },
    );
  }
}

/** POST /api/parois — Crée la paroi + ses couches en transaction. */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = createParoiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const defaults = RSI_RSE_DEFAULTS[d.type];
  const rsi = d.rsi ?? defaults.rsi;
  const rse = d.rse ?? defaults.rse;

  const created = await prisma.paroi.create({
    data: {
      nom: d.nom,
      type: d.type,
      description: d.description,
      rsi,
      rse,
      couches: {
        create: d.couches.map((c) => ({
          ordre: c.ordre,
          epaisseur: c.epaisseur,
          materiauId: c.materiauId,
        })),
      },
    },
  });

  await recalcParoiCache(created.id);

  const reload = await prisma.paroi.findUnique({
    where: { id: created.id },
    include: {
      couches: {
        orderBy: { ordre: "asc" },
        include: { materiau: true },
      },
    },
  });
  return NextResponse.json(serializeParoi(reload!), { status: 201 });
}
