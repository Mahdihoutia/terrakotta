import { NextResponse } from "next/server";
import {
  buildProjetNotePrefill,
  FICHES_DISPONIBLES,
  type FicheId,
} from "@/lib/projet-to-note-mapping";

interface Ctx {
  params: Promise<{ id: string }>;
}

const FICHE_IDS = new Set(FICHES_DISPONIBLES.map((f) => f.id));

/**
 * GET /api/projets/[id]/note-prefill?fiche=BAT-TH-142
 *
 * Retourne le payload de pré-remplissage de la Note de dimensionnement
 * depuis les données du projet (identité, bâti, systèmes, calibration),
 * pour l'équipement/fiche demandé. Si `fiche` est absent, la fiche par
 * défaut est déduite de la catégorie du projet (PAC air/eau).
 */
export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const ficheParam = url.searchParams.get("fiche");
  const fiche =
    ficheParam && FICHE_IDS.has(ficheParam as FicheId)
      ? (ficheParam as FicheId)
      : undefined;

  const res = await buildProjetNotePrefill(id, fiche);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }
  return NextResponse.json(res.payload);
}
