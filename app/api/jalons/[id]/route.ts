import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateJalonSchema = z.object({
  titre: z.string().min(1).optional(),
  echeance: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Date d'échéance invalide",
    })
    .optional(),
  fait: z.boolean().optional(),
});

/** PATCH /api/jalons/[id] — Mettre à jour un jalon (toggle fait, renommer, etc.) */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateJalonSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first = Object.values(flat.fieldErrors)[0]?.[0];
    return NextResponse.json(
      { error: first ?? "Données invalides", details: flat },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.titre !== undefined) data.titre = parsed.data.titre.trim();
  if (parsed.data.echeance !== undefined) data.echeance = new Date(parsed.data.echeance);
  if (parsed.data.fait !== undefined) data.fait = parsed.data.fait;

  try {
    const jalon = await prisma.jalon.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      id: jalon.id,
      titre: jalon.titre,
      echeance: jalon.echeance.toISOString(),
      fait: jalon.fait,
    });
  } catch (err) {
    console.error("[PATCH /api/jalons/[id]] prisma error", err);
    return NextResponse.json({ error: "Jalon introuvable" }, { status: 404 });
  }
}

/** DELETE /api/jalons/[id] — Supprimer un jalon */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await prisma.jalon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Jalon introuvable" }, { status: 404 });
  }
}
