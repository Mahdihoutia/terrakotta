import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";

const createSchema = z.object({
  titre: z.string().min(1, "Titre requis"),
  date: z.string().min(1, "Date requise"),
  heureDebut: z.string().min(1, "Heure de début requise"),
  heureFin: z.string().min(1, "Heure de fin requise"),
  type: z.enum(["VISITE", "VISITE_TECHNIQUE", "RECEPTION_CHANTIER", "AUDIT_ENERGETIQUE", "REUNION_CHANTIER", "RDV_CLIENT", "REUNION", "AUTRE"]),
  lieu: z.string().optional().nullable(),
  commentaire: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mois = searchParams.get("mois"); // format: "2026-04"

    const where: Record<string, unknown> = { deletedAt: null };
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
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ValidationError", issues: parsed.error.issues },
        { status: 422 }
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
