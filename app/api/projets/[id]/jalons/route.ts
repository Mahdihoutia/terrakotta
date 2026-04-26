import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const createJalonSchema = z.object({
  titre: z.string().min(1, "Le titre du jalon est requis"),
  echeance: z
    .string()
    .min(1, "L'échéance est requise")
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Date d'échéance invalide",
    }),
  fait: z.boolean().optional().default(false),
});

/** POST /api/projets/[id]/jalons — Créer un jalon pour un projet */
export async function POST(request: Request, context: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createJalonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  // Vérifier que le projet existe (et n'est pas en corbeille)
  const projet = await prisma.projet.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!projet) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  try {
    const jalon = await prisma.jalon.create({
      data: {
        projetId: id,
        titre: parsed.data.titre.trim(),
        echeance: new Date(parsed.data.echeance),
        fait: parsed.data.fait ?? false,
      },
    });

    return NextResponse.json(
      {
        id: jalon.id,
        titre: jalon.titre,
        echeance: jalon.echeance.toISOString(),
        fait: jalon.fait,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/projets/[id]/jalons] prisma error", err);
    return NextResponse.json(
      { error: "Impossible de créer le jalon" },
      { status: 500 }
    );
  }
}
