import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateAideSchema = z.object({
  type: z.enum(["MAPRIMERENOVATION", "CEE", "ECO_PTZ", "AIDE_LOCALE", "COUP_DE_POUCE", "AUTRE"]).optional(),
  nom: z.string().min(1).optional(),
  montant: z.number().nullable().optional(),
  numeroDossier: z.string().nullable().optional(),
  statut: z.enum(["EN_ATTENTE", "DEPOSE", "EN_INSTRUCTION", "ACCORDE", "REFUSE", "VERSE"]).optional(),
  dateDepot: z.string().nullable().optional(),
  dateAccord: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function serializeAide(a: {
  id: string;
  projetId: string;
  type: string;
  nom: string;
  montant: unknown;
  numeroDossier: string | null;
  statut: string;
  dateDepot: Date | null;
  dateAccord: Date | null;
  notes: string | null;
  createdAt: Date;
  projet: {
    id: string;
    titre: string;
    client: { id: string; nom: string; prenom: string | null };
  };
}) {
  return {
    id: a.id,
    projetId: a.projetId,
    type: a.type,
    nom: a.nom,
    montant: a.montant ? Number(a.montant) : null,
    numeroDossier: a.numeroDossier,
    statut: a.statut,
    dateDepot: a.dateDepot?.toISOString() ?? null,
    dateAccord: a.dateAccord?.toISOString() ?? null,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    projet: {
      id: a.projet.id,
      titre: a.projet.titre,
      client: a.projet.client,
    },
  };
}

const includeProjet = {
  projet: {
    select: {
      id: true,
      titre: true,
      client: { select: { id: true, nom: true, prenom: true } },
    },
  },
};

// ─── GET /api/aides/[id] ──────────────────────────────────────
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const aide = await prisma.aide.findUnique({
      where: { id },
      include: includeProjet,
    });

    if (!aide) {
      return NextResponse.json({ error: "Aide non trouvée" }, { status: 404 });
    }

    return NextResponse.json(serializeAide(aide));
  } catch (err) {
    console.error("[GET /api/aides/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PATCH /api/aides/[id] ────────────────────────────────────
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateAideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.aide.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Aide non trouvée" }, { status: 404 });
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.montant !== undefined) updateData.montant = data.montant;
    if (data.numeroDossier !== undefined) updateData.numeroDossier = data.numeroDossier;
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.dateDepot !== undefined) updateData.dateDepot = data.dateDepot ? new Date(data.dateDepot) : null;
    if (data.dateAccord !== undefined) updateData.dateAccord = data.dateAccord ? new Date(data.dateAccord) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const aide = await prisma.aide.update({
      where: { id },
      data: updateData,
      include: includeProjet,
    });

    return NextResponse.json(serializeAide(aide));
  } catch (err) {
    console.error("[PATCH /api/aides/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/aides/[id] ───────────────────────────────────
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;

    const existing = await prisma.aide.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Aide non trouvée" }, { status: 404 });
    }

    await prisma.aide.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/aides/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
