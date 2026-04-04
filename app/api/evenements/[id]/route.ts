import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  titre: z.string().min(1).optional(),
  date: z.string().optional(),
  heureDebut: z.string().optional(),
  heureFin: z.string().optional(),
  type: z.enum(["VISITE", "RDV_CLIENT", "REUNION", "AUTRE"]).optional(),
  lieu: z.string().optional().nullable(),
  commentaire: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, nom: true, prenom: true, type: true } },
        lead: { select: { id: true, nom: true, prenom: true, type: true } },
      },
    });

    if (!evenement) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    return NextResponse.json(evenement);
  } catch (error) {
    console.error("GET /api/evenements/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { date, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (date) data.date = new Date(date);

    const evenement = await prisma.evenement.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, nom: true, prenom: true, type: true } },
        lead: { select: { id: true, nom: true, prenom: true, type: true } },
      },
    });

    return NextResponse.json(evenement);
  } catch (error) {
    console.error("PATCH /api/evenements/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.evenement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/evenements/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
