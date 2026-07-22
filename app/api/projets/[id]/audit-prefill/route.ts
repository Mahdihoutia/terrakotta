import { NextResponse } from "next/server";
import { buildProjetAuditPrefill } from "@/lib/projet-to-audit-mapping";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projets/[id]/audit-prefill
 *
 * Retourne le payload de pré-remplissage de l'Audit énergétique depuis les
 * données du projet (identité, bâti, systèmes, DPE/GES, déperditions, DEET,
 * consommations calibrées). Consommé par l'onglet Livrables avant navigation
 * vers l'éditeur Audit du module Documents.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const res = await buildProjetAuditPrefill(id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }
  return NextResponse.json(res.payload);
}
