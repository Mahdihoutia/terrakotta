import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  createParoiSchema,
  PAROI_TYPES,
  RSI_RSE_DEFAULTS,
} from "@/lib/validations/paroi";
import { serializeParoi, recalcParoiCache } from "@/lib/api-helpers/paroi";

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
      message.includes("P2021") ||
      message.includes("does not exist in the current database");
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
    console.error("[/api/parois GET] error:", err);
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
