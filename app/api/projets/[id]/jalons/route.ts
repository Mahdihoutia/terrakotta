import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createJalonSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first = Object.values(flat.fieldErrors)[0]?.[0];
    return NextResponse.json(
      { error: first ?? "Données invalides", details: flat },
      { status: 400 }
    );
  }

  // Vérifier que le projet existe
  const projet = await prisma.projet.findUnique({
    where: { id },
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
