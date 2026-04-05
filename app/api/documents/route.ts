import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createDocumentSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  reference: z.string().min(1, "La référence est requise"),
  type: z.enum(["RAPPORT_VISITE", "NOTE_DIMENSIONNEMENT", "DEVIS", "AUDIT"]),
  statut: z.enum(["BROUILLON", "EN_COURS", "TERMINE", "ENVOYE"]).optional(),
  clientNom: z.string().nullable().optional(),
  donnees: z.string().nullable().optional(),
});

// ─── GET /api/documents ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const statut = searchParams.get("statut");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (statut) where.statut = statut;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      documents.map((d) => ({
        id: d.id,
        titre: d.titre,
        reference: d.reference,
        type: d.type,
        statut: d.statut,
        clientNom: d.clientNom,
        donnees: d.donnees,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("[GET /api/documents]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/documents ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    // Check unique reference
    const existing = await prisma.document.findUnique({ where: { reference: data.reference } });
    if (existing) {
      return NextResponse.json({ error: "Un document avec cette référence existe déjà" }, { status: 409 });
    }

    const doc = await prisma.document.create({
      data: {
        titre: data.titre,
        reference: data.reference,
        type: data.type,
        statut: data.statut ?? "BROUILLON",
        clientNom: data.clientNom ?? null,
        donnees: data.donnees ?? null,
      },
    });

    return NextResponse.json({
      id: doc.id,
      titre: doc.titre,
      reference: doc.reference,
      type: doc.type,
      statut: doc.statut,
      clientNom: doc.clientNom,
      donnees: doc.donnees,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/documents]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
