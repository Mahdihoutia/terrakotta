import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MUTATION_ROLES, ensureRole } from "@/lib/auth-helpers";
import { generateFactureNumero } from "@/lib/numerotation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ECHEANCE_DAYS = 30;

/**
 * POST /api/devis/[id]/convert-to-facture
 * Convertit un devis ACCEPTÉ en facture (BROUILLON, échéance now+30j).
 * Clone les lignes et lie via devisOrigineId. Une seule facture par devis.
 */
export async function POST(_request: Request, context: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await context.params;

  const devis = await prisma.devis.findFirst({
    where: { id, deletedAt: null },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      factureGeneree: { select: { id: true, numero: true } },
    },
  });

  if (!devis) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  if (devis.statut !== "ACCEPTE") {
    return NextResponse.json(
      { error: "Seul un devis accepté peut être converti en facture." },
      { status: 422 }
    );
  }

  if (devis.factureGeneree) {
    return NextResponse.json(
      {
        error: "Ce devis a déjà été converti en facture.",
        facture: devis.factureGeneree,
      },
      { status: 409 }
    );
  }

  const numero = await generateFactureNumero();
  const dateEcheance = new Date();
  dateEcheance.setDate(dateEcheance.getDate() + ECHEANCE_DAYS);

  const facture = await prisma.$transaction(async (tx) => {
    const created = await tx.facture.create({
      data: {
        numero,
        objet: devis.objet,
        statut: "BROUILLON",
        montantHT: devis.montantHT,
        tauxTVA: devis.tauxTVA,
        dateEcheance,
        clientId: devis.clientId,
        projetId: devis.projetId,
        devisOrigineId: devis.id,
      },
    });

    if (devis.lignes.length > 0) {
      await tx.ligneFacture.createMany({
        data: devis.lignes.map((l, index) => ({
          factureId: created.id,
          designation: l.designation,
          unite: l.unite,
          quantite: l.quantite,
          prixUnitHT: l.prixUnitHT,
          tauxTVA: l.tauxTVA,
          ordre: l.ordre ?? index,
        })),
      });
    }

    return created;
  });

  return NextResponse.json(
    { id: facture.id, numero: facture.numero },
    { status: 201 }
  );
}
