import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  titre: z.string().min(1, "Titre requis"),
  date: z.string().min(1, "Date requise"),
  heureDebut: z.string().min(1, "Heure de début requise"),
  heureFin: z.string().min(1, "Heure de fin requise"),
  type: z.enum(["VISITE", "RDV_CLIENT", "REUNION", "AUTRE"]),
  lieu: z.string().optional().nullable(),
  commentaire: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mois = searchParams.get("mois"); // format: "2026-04"

    const where: Record<string, unknown> = {};
    if (mois) {
      const [year, month] = mois.split("-").map(Number);
      where.date = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const evenements = await prisma.evenement.findMany({
      where,
      include: {
        client: { select: { id: true, nom: true, prenom: true, type: true } },
        lead: { select: { id: true, nom: true, prenom: true, type: true } },
      },
      orderBy: [{ date: "asc" }, { heureDebut: "asc" }],
    });

    return NextResponse.json(evenements);
  } catch (error) {
    console.error("GET /api/evenements error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { date, clientId, leadId, ...rest } = parsed.data;

    const evenement = await prisma.evenement.create({
      data: {
        ...rest,
        date: new Date(date),
        clientId: clientId || null,
        leadId: leadId || null,
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true, type: true } },
        lead: { select: { id: true, nom: true, prenom: true, type: true } },
      },
    });

    return NextResponse.json(evenement, { status: 201 });
  } catch (error) {
    console.error("POST /api/evenements error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
