import { NextResponse } from "next/server";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import { generateRapportProjetDocx } from "@/lib/word-rapport-projet";
import { buildRapportProjetContext } from "@/lib/rapport-projet-data";
import { snapshotCalcul, MOTEUR_THERMIQUE_VERSION } from "@/lib/calcul-snapshot";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const varianteId = url.searchParams.get("varianteId");

  const built = await buildRapportProjetContext(id, varianteId);
  if (!built) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
  const { data, varianteNom, reference } = built;

  try {
    const docxBytes = await generateRapportProjetDocx(data);

    await snapshotCalcul({
      projetId: id,
      varianteId: varianteId ?? undefined,
      type: "BILAN_GLOBAL",
      inputs: {
        reference,
        varianteNom,
        format: "docx",
        surface: data.surface,
        volume: data.volume,
        bilan: data.bilan,
      },
      outputs: {
        besoinChauffageNet: data.bilan.besoinChauffage,
        dpe: data.dpe ?? null,
        aides: data.aides ?? null,
      },
      moteurVersion: MOTEUR_THERMIQUE_VERSION,
      notes: `Rapport Word généré (${reference})${varianteNom ? ` — variante ${varianteNom}` : ""}`,
    }).catch((err) => {
      console.error("[rapport-word] snapshot failed:", err);
    });

    return new Response(docxBytes as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="rapport-audit-${reference}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[rapport-word] generation error", err);
    return NextResponse.json(
      { error: "ServerError", message: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
