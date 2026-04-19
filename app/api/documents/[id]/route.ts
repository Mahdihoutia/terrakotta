import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateDocumentSchema = z.object({
  titre: z.string().min(1).optional(),
  reference: z.string().min(1).optional(),
  statut: z.enum(["BROUILLON", "EN_COURS", "TERMINE", "ENVOYE"]).optional(),
  clientNom: z.string().nullable().optional(),
  donnees: z.string().nullable().optional(),
});

function serialize(d: {
  id: string;
  titre: string;
  reference: string;
  type: string;
  statut: string;
  clientNom: string | null;
  donnees: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: d.id,
    titre: d.titre,
    reference: d.reference,
    type: d.type,
    statut: d.statut,
    clientNom: d.clientNom,
    donnees: d.donnees,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

// ─── GET /api/documents/[id] ──────────────────────────────────
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }
    return NextResponse.json(serialize(doc));
  } catch (err) {
    console.error("[GET /api/documents/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PATCH /api/documents/[id] ────────────────────────────────
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.titre !== undefined) updateData.titre = data.titre;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.clientNom !== undefined) updateData.clientNom = data.clientNom;
    if (data.donnees !== undefined) updateData.donnees = data.donnees;

    const doc = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(serialize(doc));
  } catch (err) {
    console.error("[PATCH /api/documents/[id]]", err);
    // Conflit de référence unique
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Cette référence est déjà utilisée par un autre document." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/documents/[id] ───────────────────────────────
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }
    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/documents/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
