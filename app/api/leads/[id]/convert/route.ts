import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST /api/leads/[id]/convert — Convertir un lead en contact */
export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    // Créer le contact à partir du lead
    const client = await prisma.client.create({
      data: {
        nom: lead.nom,
        prenom: lead.prenom,
        email: lead.email,
        telephone: lead.telephone,
        raisonSociale: lead.raisonSociale,
        siret: lead.siret,
        type: lead.type,
        source: lead.source,
        statut: lead.statut,
        budgetEstime: lead.budgetEstime,
        notes: lead.notes,
      },
    });

    // Supprimer le lead après conversion
    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      clientId: client.id,
      message: `Lead "${lead.nom}" converti en contact`,
    });
  } catch (error) {
    console.error("[API /api/leads/[id]/convert]", error);
    return NextResponse.json(
      { error: "Erreur lors de la conversion", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
