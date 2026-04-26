import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  DESTRUCTIVE_ROLES,
  MUTATION_ROLES,
  ensureRole,
} from "@/lib/auth-helpers";

const updateSchema = z.object({
  titre: z.string().min(1).optional(),
  date: z.string().optional(),
  heureDebut: z.string().optional(),
  heureFin: z.string().optional(),
  type: z.enum(["VISITE", "VISITE_TECHNIQUE", "RECEPTION_CHANTIER", "AUDIT_ENERGETIQUE", "REUNION_CHANTIER", "RDV_CLIENT", "REUNION", "AUTRE"]).optional(),
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
    const evenement = await prisma.evenement.findFirst({
      where: { id, deletedAt: null },
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
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  try {
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ValidationError", issues: parsed.error.issues },
        { status: 422 }
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
  const guard = await ensureRole(DESTRUCTIVE_ROLES);
  if (guard) return guard;

  try {
    const { id } = await params;
    await prisma.evenement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/evenements/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
